#!/usr/bin/env python3
"""Unit tests for issue-context.py."""

# Copyright (c) 2026 Sugar Labs
#
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or (at your
# option) any later version.

import importlib.util
import io
import json
import pathlib
import unittest
from unittest import mock


SCRIPT = pathlib.Path(__file__).with_name("issue-context.py")
SPEC = importlib.util.spec_from_file_location("issue_context", SCRIPT)
issue_context = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(issue_context)


def page(nodes, has_next=False, cursor=None):
    return json.dumps(
        {
            "data": {
                "repository": {
                    "issues": {
                        "nodes": nodes,
                        "pageInfo": {"hasNextPage": has_next, "endCursor": cursor},
                    }
                }
            }
        }
    )


def pull_request(number, state="OPEN", **extra):
    value = {
        "number": number,
        "title": f"Pull request {number}",
        "url": f"https://github.com/sugarlabs/musicblocks/pull/{number}",
        "state": state,
        "isDraft": False,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-02T00:00:00Z",
        "author": {"login": f"contributor{number}", "__typename": "User"},
    }
    value.update(extra)
    return value


def issue(number, title=None, comments=None, prs=None, prs_has_next=False, **extra):
    value = {
        "number": number,
        "title": title or f"Issue {number}",
        "url": f"https://github.com/sugarlabs/musicblocks/issues/{number}",
        "state": "OPEN",
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-03T00:00:00Z",
        "author": {"login": f"user{number}", "__typename": "User"},
        "labels": {"nodes": [{"name": "zeta"}, {"name": "alpha"}]},
        "milestone": {"title": "Port Ready"},
        "assignees": {"nodes": [{"login": "zara"}, {"login": "amy"}]},
        "participants": {"totalCount": 2},
        "comments": {"nodes": comments or []},
        "closedByPullRequestsReferences": {
            "nodes": prs or [],
            "pageInfo": {"hasNextPage": prs_has_next},
        },
    }
    value.update(extra)
    return value


class IssueContextTests(unittest.TestCase):
    def test_fetch_issues_paginates_and_uses_open_state(self):
        responses = [page([issue(2)], True, "cursor-1"), page([issue(1)], False)]
        calls = []

        def runner(*args, **kwargs):
            calls.append(json.loads(kwargs["stdin"]))
            return responses.pop(0)

        result = issue_context.fetch_issues("sugarlabs/musicblocks", gh_runner=runner)
        self.assertEqual([node["number"] for node in result], [2, 1])
        self.assertEqual(calls[0]["variables"], {
            "owner": "sugarlabs",
            "name": "musicblocks",
            "cursor": None,
            "states": ["OPEN"],
        })
        self.assertIn("orderBy: {field: CREATED_AT, direction: ASC}", calls[0]["query"])
        self.assertNotIn("orderBy: {field: NUMBER", calls[0]["query"])
        self.assertEqual(calls[1]["variables"]["cursor"], "cursor-1")

    def test_fetch_issues_uses_closed_and_all_states(self):
        for state, expected in (("closed", ["CLOSED"]), ("all", None)):
            calls = []

            def runner(*args, **kwargs):
                calls.append(json.loads(kwargs["stdin"]))
                return page([])

            self.assertEqual(
                issue_context.fetch_issues("sugarlabs/musicblocks", state, runner), []
            )
            self.assertEqual(calls[0]["variables"]["states"], expected)

    def test_missing_cursor_with_next_page_fails_cleanly(self):
        with self.assertRaises(issue_context.GitHubAPIError):
            issue_context.fetch_issues(
                "sugarlabs/musicblocks",
                gh_runner=lambda *args, **kwargs: page([], True, None),
            )

    def test_linked_pr_detection_and_neutral_rendering(self):
        raw = issue(7, prs=[pull_request(42, title="Improve behavior")])
        report = issue_context.render_markdown(
            [issue_context.normalize_issue(raw)], "sugarlabs/musicblocks"
        )
        self.assertIn("Existing open PR detected.", report)
        self.assertIn("Alternative implementations remain welcome.", report)
        self.assertIn("PR #42", report)
        self.assertIn("formal issue/PR links", report)

    def test_closed_linked_pr_is_ignored(self):
        normalized = issue_context.normalize_issue(issue(7, prs=[pull_request(42, "CLOSED")]))
        self.assertEqual(normalized.linked_prs, ())
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertIn("No linked open PR detected", report)
        self.assertNotIn("Existing open PR detected", report)

    def test_multiple_linked_prs_are_sorted_deterministically(self):
        normalized = issue_context.normalize_issue(
            issue(7, prs=[pull_request(30), pull_request(2), pull_request(11)])
        )
        self.assertEqual([pr.number for pr in normalized.linked_prs], [2, 11, 30])
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertLess(report.index("PR #2"), report.index("PR #11"))
        self.assertLess(report.index("PR #11"), report.index("PR #30"))

    def test_linked_pr_truncation_is_disclosed(self):
        prs = [pull_request(number) for number in range(1, 22)]
        normalized = issue_context.normalize_issue(issue(7, prs=prs, prs_has_next=True))
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertEqual(len(normalized.linked_prs), 20)
        self.assertTrue(normalized.linked_prs_truncated)
        self.assertIn("only the first 20 linked PRs", report)

    def test_no_linked_pr_and_recent_activity(self):
        comments = [
            {
                "author": {"login": "later"},
                "createdAt": "2026-01-03T00:00:00Z",
                "body": " Latest comment ",
                "url": "https://example/comment/2",
            },
            {
                "author": {"login": "first"},
                "createdAt": "2026-01-02T00:00:00Z",
                "body": "First comment",
                "url": "https://example/comment/1",
            },
        ]
        normalized = issue_context.normalize_issue(issue(8, comments=comments))
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertIn("No linked open PR detected in the available GitHub relationships.", report)
        self.assertIn("Recent issue discussion detected.", report)
        self.assertIn("Latest comment", report)
        self.assertLess(report.index("@first"), report.index("@later"))

    def test_comment_truncation_and_markdown_escaping(self):
        comment = {
            "author": {"login": "writer"},
            "createdAt": "2026-01-02T00:00:00Z",
            "body": "[link](https://example.test) `code` " + "x" * 220,
            "url": "https://example/comment/1",
        }
        normalized = issue_context.normalize_issue(
            issue(8, title="[heading] *emphasis*", comments=[comment])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertEqual(len(normalized.comments[0].body), issue_context.MAX_COMMENT_CHARS)
        self.assertTrue(normalized.comments[0].body.endswith("…"))
        self.assertIn("\\[heading\\] \\*emphasis\\*", report)
        self.assertIn("\\[link\\]\\(https://example.test\\)", report)
        self.assertIn("\\`code\\`", report)

    def test_empty_issue_results_render_cleanly(self):
        report = issue_context.render_markdown([], "sugarlabs/musicblocks")
        self.assertIn("No issues matched the requested state.", report)

    def test_missing_and_null_fields_are_safe(self):
        normalized = issue_context.normalize_issue(
            {
                "number": 3,
                "title": None,
                "labels": None,
                "assignees": None,
                "comments": None,
                "closedByPullRequestsReferences": None,
            }
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertIn("Untitled issue", report)
        self.assertIn("Author: Unknown", report)
        self.assertIn("Labels: None", report)
        self.assertIn("Milestone: None", report)
        self.assertIn("relationship data was unavailable or malformed", report)

    def test_malformed_nested_relationship_data_is_unavailable(self):
        normalized = issue_context.normalize_issue(
            issue(3, closedByPullRequestsReferences={"nodes": "not-a-list"})
        )
        self.assertFalse(normalized.linked_prs_available)
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertIn("relationship data was unavailable or malformed", report)
        self.assertNotIn("No linked open PR detected", report)

    def test_malformed_response_fails_cleanly(self):
        with self.assertRaises(issue_context.GitHubAPIError):
            issue_context.fetch_issues(
                "sugarlabs/musicblocks", gh_runner=lambda *args, **kwargs: "[]"
            )
        with self.assertRaises(issue_context.GitHubAPIError):
            issue_context.fetch_issues(
                "sugarlabs/musicblocks",
                gh_runner=lambda *args, **kwargs: json.dumps(
                    {"errors": [{"message": "rate limited"}]}
                ),
            )

    def test_gh_permanent_failure_is_not_retried_and_is_raised(self):
        completed = mock.Mock(returncode=1, stderr="authentication required", stdout="")
        sleeper = mock.Mock()
        with mock.patch.object(issue_context.subprocess, "run", return_value=completed) as run:
            with self.assertRaises(issue_context.GitHubAPIError) as raised:
                issue_context.run_gh("api", "graphql", attempts=2, sleep=sleeper)
        self.assertIn("authentication required", str(raised.exception))
        self.assertEqual(run.call_count, 1)
        self.assertEqual(sleeper.call_count, 0)

    def test_gh_retries_and_succeeds(self):
        failed = mock.Mock(returncode=1, stderr="temporary outage", stdout="")
        succeeded = mock.Mock(returncode=0, stderr="", stdout="{}")
        sleeper = mock.Mock()
        with mock.patch.object(issue_context.subprocess, "run", side_effect=[failed, succeeded]) as run:
            result = issue_context.run_gh("api", "graphql", attempts=2, sleep=sleeper)
        self.assertEqual(result, "{}")
        self.assertEqual(run.call_count, 2)
        self.assertEqual(sleeper.call_count, 1)
        self.assertEqual(run.call_args.kwargs["timeout"], issue_context.GH_TIMEOUT_SECONDS)

    def test_gh_os_error_fails_cleanly(self):
        with mock.patch.object(issue_context.subprocess, "run", side_effect=OSError("no gh")):
            with self.assertRaises(issue_context.GitHubAPIError) as raised:
                issue_context.run_gh("api", "graphql")
        self.assertIn("could not run gh", str(raised.exception))

    def test_invalid_timestamps_and_timezone_offsets_render_stably(self):
        comment = {
            "author": {"login": "writer"},
            "createdAt": "2026-01-03T05:30:00+05:30",
            "body": "Timezone comment",
            "url": "https://example/comment/1",
        }
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment], updatedAt="not-a-timestamp")
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertIn("Last updated: not-a-timestamp", report)
        self.assertIn("2026-01-03 00:00 UTC", report)

    def test_deterministic_issue_ordering_and_assignee_clarification(self):
        first = issue_context.normalize_issue(issue(10, title="B"))
        second = issue_context.normalize_issue(issue(2, title="A"))
        report_a = issue_context.render_markdown([first, second], "sugarlabs/musicblocks")
        report_b = issue_context.render_markdown([second, first], "sugarlabs/musicblocks")
        self.assertEqual(report_a, report_b)
        self.assertLess(report_a.index("# #2"), report_a.index("# #10"))
        self.assertIn("- Labels: alpha, zeta", report_a)
        self.assertIn("- Assignees: amy, zara", report_a)
        self.assertIn("do not restrict contribution", report_a)

    def test_cli_returns_nonzero_and_writes_error_to_stderr(self):
        stderr = io.StringIO()
        with mock.patch.object(
            issue_context,
            "fetch_issues",
            side_effect=issue_context.GitHubAPIError("rate limited"),
        ), mock.patch.object(issue_context.sys, "stderr", stderr):
            status = issue_context.main(["--repo", "sugarlabs/musicblocks"])
        self.assertEqual(status, 1)
        self.assertIn("issue-context: rate limited", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
