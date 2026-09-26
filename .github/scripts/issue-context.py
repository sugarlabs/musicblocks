#!/usr/bin/env python3
"""Render read-only context for open GitHub issues.

The report helps contributors review existing discussion and formally linked
open pull requests before starting work. It intentionally does not assign,
lock, label, close, or otherwise modify GitHub resources.

Usage:
    issue-context.py --repo OWNER/NAME [--state open|closed|all]
                     [--format markdown]
"""

# Copyright (c) 2026 Sugar Labs
#
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or (at your
# option) any later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
# for more details.

import argparse
import json
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple


MAX_COMMENTS = 5
MAX_LINKED_PRS = 20
MAX_COMMENT_CHARS = 200
GH_TIMEOUT_SECONDS = 30


QUERY = """
query($owner: String!, $name: String!, $cursor: String, $states: [IssueState!]) {
  repository(owner: $owner, name: $name) {
    issues(first: 50, after: $cursor, states: $states,
           orderBy: {field: CREATED_AT, direction: ASC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title url state createdAt updatedAt
        author { login __typename }
        labels(first: 20) { nodes { name } }
        milestone { title }
        assignees(first: 20) { nodes { login } }
        participants { totalCount }
        comments(last: 5) {
          nodes { author { login __typename } createdAt body url }
        }
        closedByPullRequestsReferences(
          first: 20, includeClosedPrs: false, userLinkedOnly: false
        ) {
          pageInfo { hasNextPage }
          nodes {
            number title url state isDraft createdAt updatedAt
            author { login __typename }
          }
        }
      }
    }
  }
}
"""


class GitHubAPIError(RuntimeError):
    """Raised when GitHub data cannot be fetched or validated."""


@dataclass(frozen=True)
class Comment:
    author: str
    created_at: str
    body: str
    url: str


@dataclass(frozen=True)
class LinkedPullRequest:
    number: int
    title: str
    url: str
    state: str
    is_draft: bool
    created_at: str
    updated_at: str
    author: str


@dataclass(frozen=True)
class IssueContext:
    number: int
    title: str
    url: str
    state: str
    created_at: str
    updated_at: str
    author: str
    labels: Tuple[str, ...]
    milestone: str
    assignees: Tuple[str, ...]
    participant_count: Optional[int]
    comments: Tuple[Comment, ...]
    linked_prs: Tuple[LinkedPullRequest, ...]
    linked_prs_available: bool
    linked_prs_truncated: bool


def run_gh(
    *args: str,
    stdin: Optional[str] = None,
    attempts: int = 3,
    retry_delay: float = 1.0,
    timeout: float = GH_TIMEOUT_SECONDS,
    sleep: Callable[[float], None] = time.sleep,
) -> str:
    """Run a read-only gh command and raise a useful error on failure."""
    last_error = "unknown error"
    for attempt in range(max(1, attempts)):
        try:
            result = subprocess.run(
                ["gh", *args],
                input=stdin,
                capture_output=True,
                text=True,
                check=False,
                timeout=timeout,
            )
        except OSError as exc:
            raise GitHubAPIError(f"could not run gh: {exc}") from exc
        except subprocess.TimeoutExpired:
            last_error = f"timed out after {timeout:g} seconds"
            retry = True
        else:
            if result.returncode == 0:
                return result.stdout
            last_error = result.stderr.strip() or result.stdout.strip() or "command failed"
            retry = not _is_permanent_gh_error(last_error)
        if retry and attempt + 1 < max(1, attempts):
            sleep(retry_delay * (attempt + 1))
        elif not retry:
            break
    command = "gh " + " ".join(args[:2])
    raise GitHubAPIError(f"{command} failed: {last_error}")


def _is_permanent_gh_error(message: str) -> bool:
    """Return whether retrying a gh failure is unlikely to help."""
    lowered = message.lower()
    markers = (
        "authentication",
        "bad credentials",
        "http 401",
        "http 403",
        "graphql: field",
        "graphql: variable",
        "validation failed",
    )
    return any(marker in lowered for marker in markers)


def _repository_parts(repo: str) -> Tuple[str, str]:
    parts = repo.split("/")
    if len(parts) != 2 or not all(parts):
        raise ValueError("--repo must be in OWNER/NAME format")
    return parts[0], parts[1]


def _parse_json(payload: str) -> Dict[str, Any]:
    try:
        value = json.loads(payload)
    except (TypeError, json.JSONDecodeError) as exc:
        raise GitHubAPIError("gh returned malformed JSON") from exc
    if not isinstance(value, dict):
        raise GitHubAPIError("gh returned a JSON value instead of an object")
    if value.get("errors"):
        messages = []
        for error in value["errors"]:
            if isinstance(error, dict) and error.get("message"):
                messages.append(str(error["message"]))
        raise GitHubAPIError("GitHub GraphQL error: " + ("; ".join(messages) or "unknown error"))
    return value


def _page_from_response(value: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool, Optional[str]]:
    try:
        connection = value["data"]["repository"]["issues"]
        nodes = connection["nodes"]
        page_info = connection["pageInfo"]
    except (KeyError, TypeError) as exc:
        raise GitHubAPIError("GitHub response is missing repository issue data") from exc
    if not isinstance(nodes, list) or not isinstance(page_info, dict):
        raise GitHubAPIError("GitHub response contains malformed issue pagination data")
    if not isinstance(page_info.get("hasNextPage"), bool):
        raise GitHubAPIError("GitHub response contains invalid pagination state")
    if page_info["hasNextPage"] and not page_info.get("endCursor"):
        raise GitHubAPIError("GitHub response has a next page but no cursor")
    if any(not isinstance(node, dict) for node in nodes):
        raise GitHubAPIError("GitHub response contains a malformed issue")
    return nodes, page_info["hasNextPage"], page_info.get("endCursor")


def fetch_issues(
    repo: str,
    state: str = "open",
    gh_runner: Callable[..., str] = run_gh,
) -> List[Dict[str, Any]]:
    """Fetch all issues and their bounded context using GraphQL cursors."""
    owner, name = _repository_parts(repo)
    state_value = {"open": ["OPEN"], "closed": ["CLOSED"], "all": None}.get(state)
    if state not in {"open", "closed", "all"}:
        raise ValueError("state must be open, closed, or all")

    nodes: List[Dict[str, Any]] = []
    cursor: Optional[str] = None
    while True:
        variables = {"owner": owner, "name": name, "cursor": cursor, "states": state_value}
        payload = json.dumps({"query": QUERY, "variables": variables}, sort_keys=True)
        output = gh_runner("api", "graphql", "--input", "-", stdin=payload)
        page_nodes, has_next, cursor = _page_from_response(_parse_json(output))
        nodes.extend(page_nodes)
        if not has_next:
            return nodes


def _text(value: Any, default: str = "") -> str:
    return value if isinstance(value, str) else default


def _login(value: Any, default: str = "Unknown") -> str:
    return _text(value.get("login"), default) if isinstance(value, dict) else default


def _connection_nodes(value: Any) -> List[Dict[str, Any]]:
    if not isinstance(value, dict) or not isinstance(value.get("nodes"), list):
        return []
    return [node for node in value["nodes"] if isinstance(node, dict)]


def _linked_pr_connection(value: Any) -> Tuple[Optional[List[Dict[str, Any]]], bool]:
    """Return formal PR-link nodes and whether GitHub truncated the result.

    None means the nested connection was unavailable or malformed, which must
    not be rendered as proof that no linked pull request exists.
    """
    if not isinstance(value, dict) or not isinstance(value.get("nodes"), list):
        return None, False
    page_info = value.get("pageInfo")
    if not isinstance(page_info, dict) or not isinstance(page_info.get("hasNextPage"), bool):
        return None, False
    if any(not isinstance(node, dict) for node in value["nodes"]):
        return None, False
    return value["nodes"], page_info["hasNextPage"]


def _parse_number(value: Any) -> int:
    return value if isinstance(value, int) and not isinstance(value, bool) else 0


def _sort_key_timestamp(value: str) -> Tuple[int, str]:
    try:
        return (0, datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat())
    except (TypeError, ValueError):
        return (1, value or "")


def _format_timestamp(value: str) -> str:
    if not value:
        return "Unknown"
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except ValueError:
        return value


def _comment_from_raw(raw: Dict[str, Any]) -> Comment:
    body = " ".join(_text(raw.get("body")).split())
    if len(body) > MAX_COMMENT_CHARS:
        body = body[: MAX_COMMENT_CHARS - 1].rstrip() + "…"
    return Comment(
        author=_login(raw.get("author")),
        created_at=_text(raw.get("createdAt")),
        body=body,
        url=_text(raw.get("url")),
    )


def _linked_pr_from_raw(raw: Dict[str, Any]) -> LinkedPullRequest:
    return LinkedPullRequest(
        number=_parse_number(raw.get("number")),
        title=_text(raw.get("title"), "Untitled pull request"),
        url=_text(raw.get("url")),
        state=_text(raw.get("state"), "UNKNOWN"),
        is_draft=raw.get("isDraft") is True,
        created_at=_text(raw.get("createdAt")),
        updated_at=_text(raw.get("updatedAt")),
        author=_login(raw.get("author")),
    )


def normalize_issue(raw: Dict[str, Any]) -> IssueContext:
    """Convert an API node into a null-safe, deterministic value object."""
    labels = sorted(
        {_text(node.get("name")) for node in _connection_nodes(raw.get("labels")) if _text(node.get("name"))}
    )
    assignees = sorted(
        {_text(node.get("login")) for node in _connection_nodes(raw.get("assignees")) if _text(node.get("login"))}
    )
    milestone = raw.get("milestone")
    milestone_name = _text(milestone.get("title")) if isinstance(milestone, dict) else ""

    comments = sorted(
        (_comment_from_raw(node) for node in _connection_nodes(raw.get("comments"))),
        key=lambda comment: (_sort_key_timestamp(comment.created_at), comment.author, comment.url, comment.body),
    )[-MAX_COMMENTS:]
    linked_nodes, linked_prs_truncated = _linked_pr_connection(raw.get("closedByPullRequestsReferences"))
    linked_prs_available = linked_nodes is not None
    linked_prs = ()
    if linked_prs_available:
        linked_prs = tuple(
            sorted(
                (
                    _linked_pr_from_raw(node)
                    for node in linked_nodes
                    if _text(node.get("state")).upper() == "OPEN"
                ),
                key=lambda pr: (pr.number, pr.title, pr.url),
            )[:MAX_LINKED_PRS]
        )

    participants = raw.get("participants")
    participant_count = participants.get("totalCount") if isinstance(participants, dict) else None
    if not isinstance(participant_count, int) or isinstance(participant_count, bool):
        participant_count = None

    return IssueContext(
        number=_parse_number(raw.get("number")),
        title=_text(raw.get("title"), "Untitled issue"),
        url=_text(raw.get("url")),
        state=_text(raw.get("state"), "UNKNOWN"),
        created_at=_text(raw.get("createdAt")),
        updated_at=_text(raw.get("updatedAt")),
        author=_login(raw.get("author")),
        labels=tuple(labels),
        milestone=milestone_name,
        assignees=tuple(assignees),
        participant_count=participant_count,
        comments=tuple(comments),
        linked_prs=linked_prs,
        linked_prs_available=linked_prs_available,
        linked_prs_truncated=linked_prs_truncated,
    )


def _escape(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("\n", " ")
    for character in ("`", "*", "_", "[", "]", "(", ")", "|"):
        escaped = escaped.replace(character, "\\" + character)
    return escaped


def _link(label: str, url: str) -> str:
    return f"[{_escape(label)}]({url})" if url else _escape(label)


def render_markdown(issues: Iterable[IssueContext], repo: str) -> str:
    """Render a stable Markdown report without a generated-at timestamp."""
    ordered = sorted(issues, key=lambda issue: (issue.number, issue.title, issue.url))
    lines = [
        f"# Issue context for {_escape(repo)}",
        "",
        "Relationship scope: GitHub's formal issue/PR links are shown. Text-only references such as `Related to #123` may not be detected.",
        "",
    ]
    if not ordered:
        lines.append("No issues matched the requested state.")
        return "\n".join(lines) + "\n"

    for index, issue in enumerate(ordered):
        lines.extend(
            [
                f"## #{issue.number} — {_escape(issue.title)}",
                _link(f"Issue #{issue.number}", issue.url),
                "",
                f"- State: {_escape(issue.state)}",
                f"- Author: {_escape(issue.author)}",
                f"- Labels: {_escape(', '.join(issue.labels) or 'None')}",
                f"- Milestone: {_escape(issue.milestone or 'None')}",
                f"- Assignees: {_escape(', '.join(issue.assignees) or 'None')}",
                "- Assignees are shown as GitHub metadata only; they do not restrict contribution.",
                f"- Last updated: {_escape(_format_timestamp(issue.updated_at))}",
            ]
        )
        if issue.participant_count is not None:
            lines.append(f"- Participants: {issue.participant_count}")

        lines.extend(["", "### Existing work"])
        if not issue.linked_prs_available:
            lines.append("Linked PR relationship data was unavailable or malformed, so no conclusion about linked PRs can be made.")
        elif issue.linked_prs:
            lines.append("Existing open PR detected. Review the linked PR and issue discussion before starting. Alternative implementations remain welcome.")
            for pr in issue.linked_prs:
                draft = ", draft" if pr.is_draft else ""
                lines.append(
                    f"- {_link(f'PR #{pr.number} — {pr.title}', pr.url)} "
                    f"({pr.state.lower()}{draft}; updated {_format_timestamp(pr.updated_at)}; author {_escape(pr.author)})"
                )
        else:
            lines.append("No linked open PR detected in the available GitHub relationships. This is not a claim that nobody is working.")
            if issue.comments:
                lines.append("Recent issue discussion detected. Review the comments before starting.")
        if issue.linked_prs_available and issue.linked_prs_truncated:
            lines.append("- GitHub returned only the first 20 linked PRs; additional linked PRs may exist.")

        lines.extend(["", "### Recent discussion"])
        if issue.comments:
            for comment in issue.comments:
                target = _link(f"@{comment.author}", comment.url)
                detail = f": {_escape(comment.body)}" if comment.body else ""
                lines.append(f"- {target} ({_format_timestamp(comment.created_at)}){detail}")
        else:
            lines.append("No recent comments returned by GitHub.")
        if index != len(ordered) - 1:
            lines.append("\n---")

    return "\n".join(lines) + "\n"


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, help="GitHub repository in OWNER/NAME format")
    parser.add_argument("--state", choices=("open", "closed", "all"), default="open")
    parser.add_argument("--format", choices=("markdown",), default="markdown")
    args = parser.parse_args(argv)
    try:
        raw_issues = fetch_issues(args.repo, args.state)
        issues = [normalize_issue(raw) for raw in raw_issues]
        sys.stdout.write(render_markdown(issues, args.repo))
        return 0
    except (GitHubAPIError, ValueError) as exc:
        print(f"issue-context: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
