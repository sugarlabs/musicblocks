#!/usr/bin/env python3
"""Render read-only context for GitHub issues.

The report helps contributors review existing discussion, formally linked pull
requests, and open pull requests that mention an issue before starting work.
It never decides who may work on an issue, and it intentionally does not
assign, lock, label, close, or otherwise modify GitHub resources.

Usage:
    issue-context.py --repo OWNER/NAME [--state open|closed|all]
                     [--issue N] [--format markdown|json]
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
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional, Set, Tuple


MAX_COMMENTS = 5
MAX_LINKED_PRS = 20
MAX_TEXT_REFERENCE_PRS = 20
MAX_PR_SCAN_PAGES = 20
PR_SCAN_PAGE_SIZE = 50
MAX_COMMENT_CHARS = 200
GH_TIMEOUT_SECONDS = 30
RECENT_COMMENT_DAYS = 30

# Intent is deliberately limited to direct, first-person statements. A match
# is only a hint for contributors to review the linked comment; it is never an
# ownership or assignment signal.
INTENT_PATTERNS = (
    re.compile(
        r"\b(?:i am|i'm)\s+(?:working on|taking|tackling|implementing|fixing)\s+"
        r"(?:this|it|the issue|issue\b|#\d+)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:i will|i'll|i plan to|i would like to)\s+"
        r"(?:work on|take|tackle|implement|fix)\s+"
        r"(?:this|it|the issue|issue\b|#\d+)\b",
        re.IGNORECASE,
    ),
)

# Text references an open PR may use in its title or description. The issue
# number must end at a non-digit so that #12 never matches #123.
TEXT_REFERENCE_PATTERN = re.compile(
    r"\b(?:fix(?:es|ed)?|close[sd]?|resolve[sd]?|related\s+to|partially\s+address(?:es|ed)?)"
    r"\s*:?\s+#(\d+)(?!\d)",
    re.IGNORECASE,
)

# PR templates often carry example references such as "Fixes #123" inside HTML
# comments, and quoted or fenced text usually repeats someone else's words.
# An unterminated comment hides the rest of the text when GitHub renders it.
HTML_COMMENT_PATTERN = re.compile(r"<!--.*?(?:-->|\Z)", re.DOTALL)
CODE_FENCE_PATTERN = re.compile(r"^ {0,3}```")
QUOTE_LINE_PATTERN = re.compile(r"^ {0,3}>")


ISSUE_FIELDS = f"""
        number title url state createdAt updatedAt
        author {{ login __typename }}
        labels(first: 20) {{ nodes {{ name }} }}
        milestone {{ title }}
        assignees(first: 20) {{ nodes {{ login }} }}
        participants {{ totalCount }}
        comments(last: {MAX_COMMENTS}) {{
          nodes {{ author {{ login __typename }} createdAt body url }}
        }}
        closedByPullRequestsReferences(
          first: {MAX_LINKED_PRS}, includeClosedPrs: true, userLinkedOnly: false
        ) {{
          pageInfo {{ hasNextPage }}
          nodes {{
            number title url state merged isDraft createdAt updatedAt
            author {{ login __typename }}
          }}
        }}
"""

QUERY = f"""
query($owner: String!, $name: String!, $cursor: String, $states: [IssueState!]) {{
  repository(owner: $owner, name: $name) {{
    issues(first: 50, after: $cursor, states: $states,
           orderBy: {{field: CREATED_AT, direction: ASC}}) {{
      pageInfo {{ hasNextPage endCursor }}
      nodes {{{ISSUE_FIELDS}      }}
    }}
  }}
}}
"""

ISSUE_QUERY = f"""
query($owner: String!, $name: String!, $number: Int!) {{
  repository(owner: $owner, name: $name) {{
    issue(number: $number) {{{ISSUE_FIELDS}    }}
  }}
}}
"""

PULL_REQUEST_SCAN_QUERY = f"""
query($owner: String!, $name: String!, $cursor: String) {{
  repository(owner: $owner, name: $name) {{
    pullRequests(first: {PR_SCAN_PAGE_SIZE}, after: $cursor, states: OPEN,
                 orderBy: {{field: CREATED_AT, direction: ASC}}) {{
      pageInfo {{ hasNextPage endCursor }}
      nodes {{
        number title body url state isDraft createdAt updatedAt
        author {{ login __typename }}
      }}
    }}
  }}
}}
"""


class GitHubAPIError(RuntimeError):
    """Raised when GitHub data cannot be fetched or validated."""


@dataclass(frozen=True)
class Comment:
    author: str
    author_type: str
    created_at: str
    body: str
    url: str
    intent_text: str


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
    merged: Optional[bool] = None


@dataclass(frozen=True)
class TextReferenceScan:
    """Open PRs whose title or description references an issue number.

    ``complete`` is False when the scan stopped at MAX_PR_SCAN_PAGES or failed,
    in which case a missing reference must not be reported as a conclusion.
    """

    references: Dict[int, Tuple[LinkedPullRequest, ...]] = field(default_factory=dict)
    scanned_count: int = 0
    truncated: bool = False
    error: str = ""

    @property
    def complete(self) -> bool:
        return not self.truncated and not self.error


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
    previous_prs: Tuple[LinkedPullRequest, ...] = ()
    unknown_merge_count: int = 0


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
        "could not resolve to",
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


def _page_from_response(
    value: Dict[str, Any], connection_name: str = "issues"
) -> Tuple[List[Dict[str, Any]], bool, Optional[str]]:
    kind = "issue" if connection_name == "issues" else "pull request"
    try:
        connection = value["data"]["repository"][connection_name]
        nodes = connection["nodes"]
        page_info = connection["pageInfo"]
    except (KeyError, TypeError) as exc:
        raise GitHubAPIError(f"GitHub response is missing repository {kind} data") from exc
    if not isinstance(nodes, list) or not isinstance(page_info, dict):
        raise GitHubAPIError(f"GitHub response contains malformed {kind} pagination data")
    if not isinstance(page_info.get("hasNextPage"), bool):
        raise GitHubAPIError("GitHub response contains invalid pagination state")
    if page_info["hasNextPage"] and not page_info.get("endCursor"):
        raise GitHubAPIError("GitHub response has a next page but no cursor")
    if any(not isinstance(node, dict) for node in nodes):
        raise GitHubAPIError(f"GitHub response contains a malformed {kind}")
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


def fetch_issue(
    repo: str,
    number: int,
    gh_runner: Callable[..., str] = run_gh,
) -> List[Dict[str, Any]]:
    """Fetch one issue by number with the same bounded context as fetch_issues."""
    owner, name = _repository_parts(repo)
    if isinstance(number, bool) or not isinstance(number, int) or number < 1:
        raise ValueError("--issue must be a positive issue number")
    variables = {"owner": owner, "name": name, "number": number}
    payload = json.dumps({"query": ISSUE_QUERY, "variables": variables}, sort_keys=True)
    value = _parse_json(gh_runner("api", "graphql", "--input", "-", stdin=payload))
    try:
        node = value["data"]["repository"]["issue"]
    except (KeyError, TypeError) as exc:
        raise GitHubAPIError("GitHub response is missing repository issue data") from exc
    if node is None:
        raise GitHubAPIError(f"issue #{number} was not found in {repo}")
    if not isinstance(node, dict):
        raise GitHubAPIError("GitHub response contains a malformed issue")
    return [node]


def _referencing_text(text: str) -> str:
    """Drop HTML comments, fenced code blocks, and quoted lines from Markdown."""
    kept = []
    in_fence = False
    for line in HTML_COMMENT_PATTERN.sub(" ", text).splitlines():
        if CODE_FENCE_PATTERN.match(line):
            in_fence = not in_fence
            continue
        if in_fence or QUOTE_LINE_PATTERN.match(line):
            continue
        kept.append(line)
    return "\n".join(kept)


def referenced_issue_numbers(text: Any) -> Set[int]:
    """Return issue numbers referenced with a supported keyword in text.

    References inside HTML comments, fenced code blocks, or quoted lines are
    ignored because they are not the PR author's own statement.
    """
    if not isinstance(text, str):
        return set()
    return {int(match.group(1)) for match in TEXT_REFERENCE_PATTERN.finditer(_referencing_text(text))}


def build_text_reference_index(nodes: Iterable[Any]) -> Dict[int, Tuple[LinkedPullRequest, ...]]:
    """Map issue numbers to open PRs that reference them, deduplicated by PR number."""
    by_pr: Dict[int, Tuple[LinkedPullRequest, Set[int]]] = {}
    for node in nodes:
        if not isinstance(node, dict) or _text(node.get("state")).upper() != "OPEN":
            continue
        pr = _linked_pr_from_raw(node)
        if pr.number < 1:
            continue
        numbers = referenced_issue_numbers(node.get("title")) | referenced_issue_numbers(node.get("body"))
        if pr.number in by_pr:
            numbers |= by_pr[pr.number][1]
        by_pr[pr.number] = (pr, numbers)

    index: Dict[int, List[LinkedPullRequest]] = {}
    for pr_number in sorted(by_pr):
        pr, numbers = by_pr[pr_number]
        for issue_number in numbers:
            index.setdefault(issue_number, []).append(pr)
    return {number: tuple(prs) for number, prs in index.items()}


def scan_text_references(
    repo: str,
    gh_runner: Callable[..., str] = run_gh,
    max_pages: int = MAX_PR_SCAN_PAGES,
) -> TextReferenceScan:
    """Scan open PR titles and descriptions for issue references.

    Failures are recorded on the result instead of raised, so the rest of the
    report still renders with the limitation stated.
    """
    owner, name = _repository_parts(repo)
    nodes: List[Dict[str, Any]] = []
    cursor: Optional[str] = None
    truncated = False
    error = ""
    try:
        for page_number in range(max(1, max_pages)):
            variables = {"owner": owner, "name": name, "cursor": cursor}
            payload = json.dumps({"query": PULL_REQUEST_SCAN_QUERY, "variables": variables}, sort_keys=True)
            output = gh_runner("api", "graphql", "--input", "-", stdin=payload)
            page_nodes, has_next, cursor = _page_from_response(_parse_json(output), "pullRequests")
            nodes.extend(page_nodes)
            if not has_next:
                break
            if page_number + 1 >= max(1, max_pages):
                truncated = True
    except GitHubAPIError as exc:
        error = str(exc)
    return TextReferenceScan(
        references=build_text_reference_index(nodes),
        scanned_count=len({_parse_number(node.get("number")) for node in nodes}),
        truncated=truncated,
        error=error,
    )


def text_reference_prs(scan: TextReferenceScan, issue: "IssueContext") -> Tuple[LinkedPullRequest, ...]:
    """Open PRs referencing the issue in text that are not already formally linked."""
    formal = {pr.number for pr in issue.linked_prs}
    return tuple(pr for pr in scan.references.get(issue.number, ()) if pr.number not in formal)


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
    parsed = _parse_timestamp(value)
    return (0, parsed.isoformat()) if parsed is not None else (1, value or "")


def _parse_timestamp(value: str) -> Optional[datetime]:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def is_recent_comment(comment: Comment, now: datetime) -> bool:
    """Whether a comment is at most RECENT_COMMENT_DAYS old.

    Future and malformed timestamps are not treated as recent, avoiding an
    unsupported claim of current activity.
    """
    created_at = _parse_timestamp(comment.created_at)
    if created_at is None:
        return False
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    age = now.astimezone(timezone.utc) - created_at
    return timedelta(0) <= age <= timedelta(days=RECENT_COMMENT_DAYS)


def recent_human_comments(comments: Iterable[Comment], now: datetime) -> Tuple[Comment, ...]:
    """Return recent comments from GitHub User accounts in stable order."""
    return tuple(
        comment
        for comment in comments
        if comment.author_type == "User" and is_recent_comment(comment, now)
    )


def may_indicate_contributor_intent(comment: Comment) -> bool:
    """Return whether a direct first-person phrase may express work intent."""
    return any(pattern.search(comment.intent_text or comment.body) for pattern in INTENT_PATTERNS)


def _format_timestamp(value: str) -> str:
    if not isinstance(value, str) or not value:
        return "Unknown"
    parsed = _parse_timestamp(value)
    return parsed.strftime("%Y-%m-%d %H:%M UTC") if parsed is not None else value


def _comment_from_raw(raw: Dict[str, Any]) -> Comment:
    intent_text = " ".join(_text(raw.get("body")).split())
    body = intent_text
    if len(body) > MAX_COMMENT_CHARS:
        body = body[: MAX_COMMENT_CHARS - 1].rstrip() + "…"
    author = raw.get("author")
    return Comment(
        author=_login(author),
        author_type=_text(author.get("__typename"), "Unknown") if isinstance(author, dict) else "Unknown",
        created_at=_text(raw.get("createdAt")),
        body=body,
        url=_text(raw.get("url")),
        intent_text=intent_text,
    )


def _linked_pr_from_raw(raw: Dict[str, Any]) -> LinkedPullRequest:
    return LinkedPullRequest(
        number=_parse_number(raw.get("number")),
        title=_text(raw.get("title"), "Untitled pull request"),
        url=_text(raw.get("url")),
        state=_text(raw.get("state"), "UNKNOWN"),
        is_draft=raw.get("isDraft") is True,
        merged=raw.get("merged") if isinstance(raw.get("merged"), bool) else None,
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
    open_prs: List[LinkedPullRequest] = []
    previous_prs: List[LinkedPullRequest] = []
    unknown_merge_count = 0
    for node in linked_nodes or ():
        pr = _linked_pr_from_raw(node)
        state = pr.state.upper()
        if state == "OPEN":
            open_prs.append(pr)
        elif state == "MERGED" or pr.merged is True:
            continue
        elif state == "CLOSED" and pr.merged is False:
            previous_prs.append(pr)
        else:
            unknown_merge_count += 1

    def pr_order(pr: LinkedPullRequest) -> Tuple[int, str, str]:
        return (pr.number, pr.title, pr.url)

    linked_prs = tuple(sorted(open_prs, key=pr_order)[:MAX_LINKED_PRS])

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
        previous_prs=tuple(sorted(previous_prs, key=pr_order)[:MAX_LINKED_PRS]),
        unknown_merge_count=unknown_merge_count,
    )


def _escape(value: str) -> str:
    escaped = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    escaped = escaped.replace("\\", "\\\\").replace("\n", " ")
    for character in ("`", "*", "_", "[", "]", "(", ")", "|"):
        escaped = escaped.replace(character, "\\" + character)
    return escaped


def _link(label: str, url: str) -> str:
    return f"[{_escape(label)}]({url})" if url else _escape(label)


def _pr_line(pr: LinkedPullRequest) -> str:
    draft = ", draft" if pr.is_draft else ""
    return (
        f"- {_link(f'PR #{pr.number} — {pr.title}', pr.url)} "
        f"({_escape(pr.state.lower())}{draft}; updated {_escape(_format_timestamp(pr.updated_at))}; "
        f"author {_escape(pr.author)})"
    )


def _limitations(scan: Optional[TextReferenceScan]) -> List[str]:
    if scan is None:
        text_scope = "- Text references: open PR titles and descriptions were not scanned for this report."
    elif scan.error:
        text_scope = (
            "- Text references: the open PR scan did not complete "
            f"({_escape(scan.error)}), so no conclusion can be drawn from missing text references."
        )
    elif scan.truncated:
        text_scope = (
            f"- Text references: only the first {scan.scanned_count} open PRs were scanned; "
            "PRs beyond that limit were not checked."
        )
    else:
        text_scope = f"- Text references: all {scan.scanned_count} open PRs returned by GitHub were scanned."
    return [
        "## Detection limitations",
        "",
        f"- Formal links: open and closed PRs come from GitHub's formal issue/PR links, "
        f"up to {MAX_LINKED_PRS} per issue.",
        "- Text references: open PR titles and descriptions are matched for `Fixes`, `Fix`, "
        "`Closes`, `Close`, `Resolves`, `Resolve`, `Related to`, `Partially addresses`, and "
        "`Partially addressed` followed by `#N`. References inside HTML comments, fenced code "
        "blocks, or quoted lines are ignored, and references in commits, review comments, or "
        "other repositories are not checked.",
        text_scope,
        f"- Discussion: only the last {MAX_COMMENTS} comments per issue are retrieved. Comments by "
        f"GitHub User accounts from the last {RECENT_COMMENT_DAYS} days count as recent human "
        "discussion; Bot and App comments are excluded.",
        "- Intent: a conservative first-person phrase heuristic that can miss or misread intent. "
        "It is a neutral signal only.",
        "- Assignees are GitHub metadata only; they do not restrict contribution.",
        "- Finding no PR in this report is not evidence about whether others are working on an issue.",
        "",
    ]


def render_markdown(
    issues: Iterable[IssueContext],
    repo: str,
    now: Optional[datetime] = None,
    text_scan: Optional[TextReferenceScan] = None,
) -> str:
    """Render a stable Markdown report with one UTC data-as-of timestamp.

    ``now`` is used both for the data-as-of line and the recency window, so a
    fixed value produces byte-identical output.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    ordered = sorted(issues, key=lambda issue: (issue.number, issue.title, issue.url))
    lines = [
        f"# Issue context for {_escape(repo)}",
        "",
        f"Data as of: {now.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]
    lines.extend(_limitations(text_scan))
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

        text_prs = text_reference_prs(text_scan, issue) if text_scan is not None else ()
        lines.extend(["", "### Existing work"])
        if issue.linked_prs or text_prs:
            lines.append(
                "Existing open PR detected. Review the linked PR and issue discussion before starting. "
                "Alternative implementations remain welcome."
            )

        lines.extend(["", "#### Open pull requests"])
        if not issue.linked_prs_available:
            lines.append("Linked PR data was unavailable, so no conclusion can be drawn.")
        elif issue.linked_prs:
            lines.extend(_pr_line(pr) for pr in issue.linked_prs)
        elif issue.linked_prs_truncated:
            lines.append(
                f"No open PR found among the first {MAX_LINKED_PRS} formally linked PRs GitHub "
                "returned. PRs that mention this issue only in text may not appear."
            )
        else:
            lines.append(
                "No formally linked open PR found. PRs that mention this issue only in text may not appear."
            )
        if issue.linked_prs_available and issue.linked_prs_truncated:
            lines.append(
                f"- GitHub returned only the first {MAX_LINKED_PRS} linked PRs; additional linked PRs may exist."
            )

        lines.extend(["", "#### PRs referencing this issue in title or description"])
        if text_scan is None:
            lines.append("Open PR titles and descriptions were not scanned.")
        else:
            lines.extend(_pr_line(pr) for pr in text_prs[:MAX_TEXT_REFERENCE_PRS])
            if len(text_prs) > MAX_TEXT_REFERENCE_PRS:
                lines.append(
                    f"- Showing the first {MAX_TEXT_REFERENCE_PRS} of {len(text_prs)} referencing PRs."
                )
            if not text_scan.complete:
                lines.append(
                    "The open PR scan was incomplete, so other PRs referencing this issue may exist."
                )
            elif not text_prs:
                lines.append(
                    "No other open PR references this issue in its title or description."
                )

        if issue.previous_prs or issue.unknown_merge_count:
            lines.extend(["", "#### Previous linked PRs — closed, not merged"])
            lines.extend(_pr_line(pr) for pr in issue.previous_prs)
            if issue.unknown_merge_count:
                lines.append(
                    f"- {issue.unknown_merge_count} closed linked PR(s) had missing merge information "
                    "and are not listed."
                )

        lines.append("")
        if issue.assignees:
            lines.append(
                "Assignees recorded — GitHub metadata only; it does not restrict contribution: "
                + ", ".join(f"@{_escape(assignee)}" for assignee in issue.assignees)
            )

        recent_comments = recent_human_comments(issue.comments, now)
        intent_comments = tuple(
            comment for comment in recent_comments if may_indicate_contributor_intent(comment)
        )
        if intent_comments:
            lines.append(
                "A recent comment may indicate contributor intent. Review the comment and discussion "
                "before starting. Alternative implementations remain welcome."
            )
            for comment in intent_comments:
                comment_link = _link(f"comment by @{comment.author}", comment.url)
                lines.append(f"- {comment_link} ({_format_timestamp(comment.created_at)})")
        if recent_comments:
            lines.append("Recent issue discussion detected. Review the comments before starting.")

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


JSON_SCHEMA_VERSION = 1


def _iso_timestamp(value: Any) -> Optional[str]:
    """Return a UTC ISO 8601 timestamp, or None when the value is not a valid time."""
    parsed = _parse_timestamp(value) if isinstance(value, str) else None
    return parsed.strftime("%Y-%m-%dT%H:%M:%SZ") if parsed is not None else None


def _pr_json(pr: LinkedPullRequest) -> Dict[str, Any]:
    return {
        "number": pr.number,
        "title": pr.title,
        "url": pr.url or None,
        "state": pr.state.lower(),
        "is_draft": pr.is_draft,
        "author": pr.author,
        "created_at": _iso_timestamp(pr.created_at),
        "updated_at": _iso_timestamp(pr.updated_at),
    }


def _comment_json(comment: Comment) -> Dict[str, Any]:
    return {
        "author": comment.author,
        "url": comment.url or None,
        "created_at": _iso_timestamp(comment.created_at),
    }


def _limitation(code: str, message: str) -> Dict[str, str]:
    return {"code": code, "message": message}


def _json_limitations(issue: IssueContext, scan: Optional[TextReferenceScan], text_prs_total: int) -> List[Dict[str, str]]:
    items = [
        _limitation(
            "formal_links_scope",
            f"Formal PRs come from GitHub's formal issue/PR links, up to {MAX_LINKED_PRS} per issue.",
        )
    ]
    if not issue.linked_prs_available:
        items.append(
            _limitation("formal_links_unavailable", "Linked PR data was unavailable, so no conclusion can be drawn.")
        )
    elif issue.linked_prs_truncated:
        items.append(
            _limitation(
                "formal_links_truncated",
                f"GitHub returned only the first {MAX_LINKED_PRS} linked PRs; additional linked PRs may exist.",
            )
        )
    if issue.unknown_merge_count:
        items.append(
            _limitation(
                "merge_state_unknown",
                f"{issue.unknown_merge_count} closed linked PR(s) had missing merge information and are not listed.",
            )
        )
    items.append(
        _limitation(
            "text_references_scope",
            "Open PR titles and descriptions are matched for Fixes, Fix, Closes, Close, Resolves, Resolve, "
            "Related to, Partially addresses, and Partially addressed followed by #N. References in HTML "
            "comments, code blocks, quoted lines, commits, review comments, or other repositories are not checked.",
        )
    )
    if scan is None:
        items.append(
            _limitation("text_references_not_checked", "Open PR titles and descriptions were not scanned.")
        )
    elif scan.error:
        items.append(
            _limitation(
                "text_references_unavailable",
                "The open PR scan did not complete, so other PRs referencing this issue may exist.",
            )
        )
    elif scan.truncated:
        items.append(
            _limitation(
                "text_references_truncated",
                f"Only the first {scan.scanned_count} open PRs were scanned; PRs beyond that limit were not checked.",
            )
        )
    if text_prs_total > MAX_TEXT_REFERENCE_PRS:
        items.append(
            _limitation(
                "text_references_capped",
                f"Showing the first {MAX_TEXT_REFERENCE_PRS} of {text_prs_total} referencing PRs.",
            )
        )
    items.extend(
        [
            _limitation(
                "comments_bounded",
                f"Only the last {MAX_COMMENTS} comments per issue are retrieved.",
            ),
            _limitation(
                "recent_human_window",
                f"Comments by GitHub User accounts from the last {RECENT_COMMENT_DAYS} days count as recent "
                "human discussion; Bot and App comments are excluded.",
            ),
            _limitation(
                "intent_heuristic",
                "Contributor intent is a conservative first-person phrase heuristic that can miss or misread "
                "intent. It is a neutral signal only.",
            ),
            _limitation(
                "assignees_metadata_only",
                "Assignees are GitHub metadata only; they do not restrict contribution.",
            ),
            _limitation(
                "absence_not_evidence",
                "Finding no PR in this report is not evidence about whether others are working on an issue.",
            ),
        ]
    )
    return items


def _text_reference_status(scan: Optional[TextReferenceScan]) -> str:
    if scan is None:
        return "not_checked"
    if scan.error:
        return "unavailable"
    return "truncated" if scan.truncated else "complete"


def issue_to_json(
    issue: IssueContext,
    now: datetime,
    text_scan: Optional[TextReferenceScan] = None,
) -> Dict[str, Any]:
    """Build the structured contract for one issue from the same data as Markdown."""
    text_prs = text_reference_prs(text_scan, issue) if text_scan is not None else ()
    recent_comments = recent_human_comments(issue.comments, now)
    if not issue.linked_prs_available:
        formal_status = "unavailable"
    else:
        formal_status = "truncated" if issue.linked_prs_truncated else "complete"
    return {
        "issue": {
            "number": issue.number,
            "title": issue.title,
            "url": issue.url or None,
            "state": issue.state.lower(),
            "author": issue.author,
            "labels": list(issue.labels),
            "milestone": issue.milestone or None,
            "created_at": _iso_timestamp(issue.created_at),
            "updated_at": _iso_timestamp(issue.updated_at),
            "participant_count": issue.participant_count,
        },
        "data_as_of": _iso_timestamp(now.isoformat()),
        "coverage": {
            "formal_links": formal_status,
            "text_references": _text_reference_status(text_scan),
            "open_prs_scanned": text_scan.scanned_count if text_scan is not None else 0,
            "merge_state_unknown_count": issue.unknown_merge_count,
        },
        "formal_open_prs": [_pr_json(pr) for pr in issue.linked_prs],
        "text_reference_prs": [_pr_json(pr) for pr in text_prs[:MAX_TEXT_REFERENCE_PRS]],
        "previous_closed_unmerged_prs": [_pr_json(pr) for pr in issue.previous_prs],
        "recent_human_discussion": [
            dict(_comment_json(comment), excerpt=comment.body) for comment in recent_comments
        ],
        "contributor_intent": [
            _comment_json(comment) for comment in recent_comments if may_indicate_contributor_intent(comment)
        ],
        "assignees": [{"login": login} for login in issue.assignees],
        "limitations": _json_limitations(issue, text_scan, len(text_prs)),
    }


def render_json(
    issues: Iterable[IssueContext],
    repo: str,
    now: Optional[datetime] = None,
    text_scan: Optional[TextReferenceScan] = None,
) -> str:
    """Render the structured report as deterministic JSON.

    ``<``, ``>``, and ``&`` are emitted as unicode escapes so the output can be
    embedded in HTML safely; parsed values are unchanged.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    ordered = sorted(issues, key=lambda issue: (issue.number, issue.title, issue.url))
    document = {
        "schema_version": JSON_SCHEMA_VERSION,
        "repository": repo,
        "data_as_of": _iso_timestamp(now.isoformat()),
        "issues": [issue_to_json(issue, now, text_scan) for issue in ordered],
    }
    output = json.dumps(document, indent=2, ensure_ascii=False)
    return output.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e") + "\n"


def _positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("must be a positive integer") from exc
    if number < 1:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return number


def main(argv: Optional[List[str]] = None, now: Optional[datetime] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, help="GitHub repository in OWNER/NAME format")
    parser.add_argument("--state", choices=("open", "closed", "all"), default="open")
    parser.add_argument("--issue", type=_positive_int, help="report on one issue; --state is ignored")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    args = parser.parse_args(argv)
    now = now or datetime.now(timezone.utc)
    try:
        if args.issue is not None:
            raw_issues = fetch_issue(args.repo, args.issue, gh_runner=run_gh)
        else:
            raw_issues = fetch_issues(args.repo, args.state, gh_runner=run_gh)
        issues = [normalize_issue(raw) for raw in raw_issues]
        text_scan = scan_text_references(args.repo, gh_runner=run_gh) if issues else None
        render = render_json if args.format == "json" else render_markdown
        sys.stdout.write(render(issues, args.repo, now, text_scan))
        return 0
    except (GitHubAPIError, ValueError) as exc:
        print(f"issue-context: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
