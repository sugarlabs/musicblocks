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
import re
import unittest
from datetime import datetime, timezone
from unittest import mock


SCRIPT = pathlib.Path(__file__).with_name("issue-context.py")
SPEC = importlib.util.spec_from_file_location("issue_context", SCRIPT)
issue_context = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(issue_context)


TEST_NOW = datetime(2026, 1, 31, tzinfo=timezone.utc)


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


def comment(author="commenter", created_at="2026-01-30T00:00:00Z", body="Comment", author_type="User", url=None):
    return {
        "author": {"login": author, "__typename": author_type},
        "createdAt": created_at,
        "body": body,
        "url": url or f"https://example/comments/{author}",
    }


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


def pr_page(nodes, has_next=False, cursor=None):
    return json.dumps(
        {
            "data": {
                "repository": {
                    "pullRequests": {
                        "nodes": nodes,
                        "pageInfo": {"hasNextPage": has_next, "endCursor": cursor},
                    }
                }
            }
        }
    )


def scanned_pr(number, body="", title=None, **extra):
    return pull_request(number, title=title or f"Pull request {number}", body=body, **extra)


def scan_of(*nodes):
    return issue_context.TextReferenceScan(
        references=issue_context.build_text_reference_index(nodes),
        scanned_count=len(nodes),
    )


FORBIDDEN_TERMS = (
    "taken",
    "unavailable to",
    "reserved",
    "owned",
    "assigned-to-you",
    "assigned to you",
    "nobody is working",
    "recommended",
    "best issue",
    "stale",
    "abandoned",
    "failed",
)


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
        self.assertIn("No formally linked open PR found", report)
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
            comment("later", "2026-01-30T00:00:00Z", " Latest comment ", url="https://example/comment/2"),
            comment("first", "2026-01-29T00:00:00Z", "First comment", url="https://example/comment/1"),
        ]
        normalized = issue_context.normalize_issue(issue(8, comments=comments))
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn("No formally linked open PR found.", report)
        self.assertIn("Recent issue discussion detected.", report)
        self.assertIn("Latest comment", report)
        self.assertLess(report.index("@first"), report.index("@later"))

    def test_recent_human_comments_helper(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[
                    comment("human", "2026-01-30T00:00:00Z"),
                    comment("bot", "2026-01-30T00:00:00Z", author_type="Bot"),
                    comment("old", "2025-12-01T00:00:00Z"),
                ],
            )
        )
        recent = issue_context.recent_human_comments(normalized.comments, TEST_NOW)
        self.assertEqual([entry.author for entry in recent], ["human"])
        self.assertTrue(issue_context.is_recent_comment(recent[0], TEST_NOW))

    def test_bot_only_comments_do_not_trigger_human_discussion(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("automation", body="I am working on this", author_type="Bot")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn("No formally linked open PR found", report)
        self.assertNotIn("Recent issue discussion detected", report)
        self.assertNotIn("may indicate contributor intent", report)

    def test_explicit_recent_intent_comment_is_rendered_as_a_hint(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("dev", body="I am working on this issue.", url="https://example/comments/intent")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertTrue(issue_context.may_indicate_contributor_intent(normalized.comments[0]))
        self.assertIn("A recent comment may indicate contributor intent.", report)
        self.assertIn("- [comment by @dev](https://example/comments/intent)", report)
        self.assertIn("may indicate contributor intent", report)
        self.assertIn("I am working on this issue.", report)
        self.assertIn("Alternative implementations remain welcome.", report)

    def test_long_comment_intent_is_detected_before_excerpt_truncation(self):
        body = "x" * issue_context.MAX_COMMENT_CHARS + " I would like to work on this issue."
        normalized = issue_context.normalize_issue(issue(8, comments=[comment("dev", body=body)]))
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertTrue(normalized.comments[0].body.endswith("…"))
        self.assertTrue(issue_context.may_indicate_contributor_intent(normalized.comments[0]))
        self.assertIn("may indicate contributor intent", report)

    def test_negative_intent_phrase_does_not_trigger_hint(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("dev", body="I am not working on this.")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertFalse(issue_context.may_indicate_contributor_intent(normalized.comments[0]))
        self.assertNotIn("may indicate contributor intent", report)
        self.assertIn("Recent issue discussion detected", report)

    def test_old_intent_comment_does_not_trigger_recent_hint(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("dev", "2025-12-01T00:00:00Z", "I am working on this.")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertTrue(issue_context.may_indicate_contributor_intent(normalized.comments[0]))
        self.assertNotIn("may indicate contributor intent", report)
        self.assertNotIn("Recent issue discussion detected", report)

    def test_invalid_comment_timestamp_does_not_trigger_recent_guidance(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("dev", "not-a-timestamp", "I am working on this.")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertFalse(issue_context.is_recent_comment(normalized.comments[0], TEST_NOW))
        self.assertNotIn("may indicate contributor intent", report)
        self.assertNotIn("Recent issue discussion detected", report)

    def test_timezone_aware_comments_sort_by_utc_instant(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[
                    comment("utc", "2026-01-30T00:30:00Z"),
                    comment("offset", "2026-01-30T01:00:00+02:00"),
                ],
            )
        )
        self.assertEqual([entry.author for entry in normalized.comments], ["offset", "utc"])

    def test_optional_nested_fields_do_not_crash(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                labels={"nodes": [None, {"name": None}]},
                assignees={"nodes": [None, {"login": None}]},
                comments={
                    "nodes": [
                        {"author": None, "createdAt": None, "body": None, "url": None},
                        {"author": "malformed", "createdAt": "bad", "body": "text", "url": None},
                    ]
                },
                prs=[pull_request(42, author=None, title=None, updatedAt=None)],
            )
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn("Labels: None", report)
        self.assertIn("Assignees: None", report)
        self.assertIn("PR #42 — Untitled pull request", report)
        self.assertIn("author Unknown", report)
        self.assertEqual(issue_context._format_timestamp(42), "Unknown")

    def test_assignee_without_pr_is_metadata_only_context(self):
        normalized = issue_context.normalize_issue(issue(8, comments=[]))
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn("No formally linked open PR found", report)
        self.assertIn("Assignees recorded — GitHub metadata only; it does not restrict contribution: @amy, @zara", report)
        self.assertIn("does not restrict contribution", report)

    def test_multiple_existing_work_signals_render_in_priority_order(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[comment("dev", body="I will fix this issue.")],
                prs=[pull_request(42)],
            )
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertLess(report.index("Existing open PR detected"), report.index("Assignees recorded"))
        self.assertLess(report.index("Assignees recorded"), report.index("may indicate contributor intent"))
        self.assertLess(report.index("may indicate contributor intent"), report.index("Recent issue discussion detected"))

    def test_no_pr_disclaimer_remains_for_issue_without_signals(self):
        raw = issue(8, comments=[], assignees={"nodes": []})
        normalized = issue_context.normalize_issue(raw)
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn(
            "No formally linked open PR found. PRs that mention this issue only in text may not appear.",
            report,
        )

    def test_comment_truncation_and_markdown_escaping(self):
        comment = {
            "author": {"login": "writer"},
            "createdAt": "2026-01-02T00:00:00Z",
            "body": "[link](https://example.test?a=1&b=2) `code` <tag> & value " + "x" * 220,
            "url": "https://example/comment/1",
        }
        normalized = issue_context.normalize_issue(
            issue(8, title="[heading] *emphasis* <tag> & value", comments=[comment])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertEqual(len(normalized.comments[0].body), issue_context.MAX_COMMENT_CHARS)
        self.assertTrue(normalized.comments[0].body.endswith("…"))
        self.assertIn("\\[heading\\] \\*emphasis\\*", report)
        self.assertIn("\\[link\\]\\(https://example.test?a=1&amp;b=2\\)", report)
        self.assertIn("\\`code\\`", report)
        self.assertIn("&lt;tag&gt; &amp; value", report)
        self.assertEqual(
            issue_context._link("A & <B>", "https://example.test/pull/1?a=1&b=2"),
            "[A &amp; &lt;B&gt;](https://example.test/pull/1?a=1&b=2)",
        )

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
        self.assertIn("Linked PR data was unavailable, so no conclusion can be drawn.", report)

    def test_malformed_nested_relationship_data_is_unavailable(self):
        normalized = issue_context.normalize_issue(
            issue(3, closedByPullRequestsReferences={"nodes": "not-a-list"})
        )
        self.assertFalse(normalized.linked_prs_available)
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks")
        self.assertIn("Linked PR data was unavailable, so no conclusion can be drawn.", report)
        self.assertNotIn("No formally linked open PR found", report)

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
        report_a = issue_context.render_markdown([first, second], "sugarlabs/musicblocks", TEST_NOW)
        report_b = issue_context.render_markdown([second, first], "sugarlabs/musicblocks", TEST_NOW)
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


    # Contract: formal and text-reference PR categories

    def test_formal_and_text_reference_prs_render_in_separate_sections(self):
        normalized = issue_context.normalize_issue(issue(8, prs=[pull_request(42)]))
        scan = scan_of(
            scanned_pr(42, body="Fixes #8"),
            scanned_pr(50, body="Related to #8"),
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW, scan)
        formal = report.index("#### Open pull requests")
        text = report.index("#### PRs referencing this issue in title or description")
        self.assertLess(formal, text)
        self.assertEqual(report.count("PR #42"), 1)
        self.assertLess(formal, report.index("PR #42"))
        self.assertLess(report.index("PR #42"), text)
        self.assertEqual(report.count("PR #50"), 1)
        self.assertGreater(report.index("PR #50"), text)
        self.assertEqual(report.count("Existing open PR detected."), 1)

    def test_text_reference_only_pr_triggers_neutral_existing_work_notice(self):
        normalized = issue_context.normalize_issue(issue(8))
        report = issue_context.render_markdown(
            [normalized], "sugarlabs/musicblocks", TEST_NOW, scan_of(scanned_pr(50, title="Closes #8"))
        )
        self.assertIn(
            "Existing open PR detected. Review the linked PR and issue discussion before starting. "
            "Alternative implementations remain welcome.",
            report,
        )
        self.assertIn("No formally linked open PR found.", report)
        self.assertIn("PR #50", report)

    def test_all_contract_keywords_match_case_insensitively(self):
        for phrase in (
            "Fixes #8", "fix #8", "CLOSES #8", "close #8", "Resolves #8", "resolve #8",
            "related to #8", "RELATED TO #8", "Partially addresses #8", "partially ADDRESSED #8",
            "Fixes: #8",
        ):
            with self.subTest(phrase=phrase):
                self.assertEqual(issue_context.referenced_issue_numbers(f"Body. {phrase}."), {8})

    def test_text_reference_requires_exact_issue_number_boundary(self):
        self.assertEqual(issue_context.referenced_issue_numbers("Fixes #123"), {123})
        scan = scan_of(scanned_pr(50, body="Fixes #123"))
        normalized = issue_context.normalize_issue(issue(12))
        self.assertEqual(issue_context.text_reference_prs(scan, normalized), ())
        self.assertEqual(issue_context.referenced_issue_numbers("Fixes #12."), {12})

    def test_plain_mentions_without_keyword_do_not_match(self):
        for text in ("See #8", "#8", "prefix#8", "unfixes #8", None, 42):
            with self.subTest(text=text):
                self.assertEqual(issue_context.referenced_issue_numbers(text), set())

    def test_reference_inside_html_comment_is_ignored(self):
        for body in (
            '<!-- Reference the specific issue using #issue_number (e.g., "Fixes #123"). -->',
            "<!--\nFixes #8\n-->",
            "Intro <!-- Fixes #8 --> text",
            "<!-- unterminated comment\nFixes #8",
        ):
            with self.subTest(body=body):
                self.assertEqual(issue_context.referenced_issue_numbers(body), set())

    def test_reference_inside_fenced_code_block_is_ignored(self):
        for body in (
            "```\nFixes #8\n```",
            "```text\nCloses #8\n```\n",
            "   ```\nResolves #8\n   ```",
            "Intro\n```\nFixes #8",
        ):
            with self.subTest(body=body):
                self.assertEqual(issue_context.referenced_issue_numbers(body), set())

    def test_reference_inside_quoted_line_is_ignored(self):
        for body in ("> Fixes #8", "  > Related to #8", ">> Partially addresses #8", "Reply\n> Closes #8"):
            with self.subTest(body=body):
                self.assertEqual(issue_context.referenced_issue_numbers(body), set())

    def test_real_references_outside_ignored_contexts_still_match(self):
        for body in (
            "Fixes #8",
            "Summary\n\nRelated to #8\n",
            "Partially addressed #8",
            "```\ncode\n```\nFixes #8",
            "<!-- template -->\nCloses #8",
            "a > b, so this resolves #8",
        ):
            with self.subTest(body=body):
                self.assertEqual(issue_context.referenced_issue_numbers(body), {8})
        self.assertEqual(issue_context.referenced_issue_numbers("<!-- x -->Fixes #123"), {123})

    def test_mixed_real_and_ignored_references_detect_only_real_ones(self):
        body = (
            '<!-- e.g., "Fixes #123" -->\n'
            "Fixes #8\n"
            "> Closes #9\n"
            "```\nResolves #10\n```\n"
            "Related to #11\n"
            "Partially addresses #12"
        )
        self.assertEqual(issue_context.referenced_issue_numbers(body), {8, 11, 12})
        index = issue_context.build_text_reference_index([scanned_pr(50, body=body)])
        self.assertEqual(sorted(index), [8, 11, 12])
        normalized = issue_context.normalize_issue(issue(123))
        self.assertEqual(issue_context.text_reference_prs(scan_of(scanned_pr(50, body=body)), normalized), ())

    def test_multiple_references_in_one_pr_are_all_indexed(self):
        index = issue_context.build_text_reference_index(
            [scanned_pr(50, title="Fixes #8", body="Related to #9 and closes #10")]
        )
        self.assertEqual(sorted(index), [8, 9, 10])

    def test_text_reference_scan_paginates_with_cursor(self):
        responses = [
            pr_page([scanned_pr(50, body="Fixes #8")], True, "cursor-1"),
            pr_page([scanned_pr(51, body="Related to #8")], False),
        ]
        calls = []

        def runner(*args, **kwargs):
            calls.append(json.loads(kwargs["stdin"]))
            return responses.pop(0)

        scan = issue_context.scan_text_references("sugarlabs/musicblocks", gh_runner=runner)
        self.assertTrue(scan.complete)
        self.assertEqual(scan.scanned_count, 2)
        self.assertEqual([pr.number for pr in scan.references[8]], [50, 51])
        self.assertIsNone(calls[0]["variables"]["cursor"])
        self.assertEqual(calls[1]["variables"]["cursor"], "cursor-1")
        self.assertIn("states: OPEN", calls[0]["query"])
        self.assertIn("body", calls[0]["query"])

    def test_text_reference_prs_are_deduplicated_by_number(self):
        index = issue_context.build_text_reference_index(
            [
                scanned_pr(50, title="Fixes #8", body="Fixes #8, related to #8"),
                scanned_pr(50, body="Fixes #8"),
                scanned_pr(49, body="Fixes #8"),
            ]
        )
        self.assertEqual([pr.number for pr in index[8]], [49, 50])

    def test_text_reference_scan_ignores_non_open_and_malformed_nodes(self):
        index = issue_context.build_text_reference_index(
            [
                scanned_pr(50, body="Fixes #8", state="CLOSED"),
                scanned_pr(None, body="Fixes #8"),
                "not-a-node",
                scanned_pr(51, body=None, title=None),
            ]
        )
        self.assertEqual(index, {})

    def test_text_reference_scan_truncation_is_disclosed(self):
        def runner(*args, **kwargs):
            return pr_page([scanned_pr(50, body="Fixes #8")], True, "next")

        scan = issue_context.scan_text_references("sugarlabs/musicblocks", gh_runner=runner, max_pages=2)
        self.assertTrue(scan.truncated)
        self.assertFalse(scan.complete)
        report = issue_context.render_markdown(
            [issue_context.normalize_issue(issue(9))], "sugarlabs/musicblocks", TEST_NOW, scan
        )
        self.assertIn("only the first 1 open PRs were scanned", report)
        self.assertIn("The open PR scan was incomplete", report)
        self.assertNotIn("No other open PR references this issue", report)

    def test_text_reference_scan_failure_is_disclosed_without_conclusion(self):
        responses = [pr_page([scanned_pr(50, body="Fixes #8")], True, "next"), "not json"]
        scan = issue_context.scan_text_references(
            "sugarlabs/musicblocks", gh_runner=lambda *args, **kwargs: responses.pop(0)
        )
        self.assertIn("malformed JSON", scan.error)
        self.assertFalse(scan.complete)
        self.assertEqual([pr.number for pr in scan.references[8]], [50])
        report = issue_context.render_markdown(
            [issue_context.normalize_issue(issue(8)), issue_context.normalize_issue(issue(9))],
            "sugarlabs/musicblocks",
            TEST_NOW,
            scan,
        )
        self.assertIn("the open PR scan did not complete", report)
        self.assertIn("so no conclusion can be drawn", report)
        self.assertNotIn("No other open PR references this issue", report)
        self.assertIn("PR #50", report)

    def test_complete_scan_without_references_is_neutral(self):
        report = issue_context.render_markdown(
            [issue_context.normalize_issue(issue(8))], "sugarlabs/musicblocks", TEST_NOW, scan_of()
        )
        self.assertIn("all 0 open PRs returned by GitHub were scanned", report)
        self.assertIn("No other open PR references this issue in its title or description.", report)
        self.assertNotIn("Existing open PR detected", report)

    def test_missing_scan_is_reported_as_not_scanned(self):
        report = issue_context.render_markdown(
            [issue_context.normalize_issue(issue(8))], "sugarlabs/musicblocks", TEST_NOW
        )
        self.assertIn("Open PR titles and descriptions were not scanned.", report)
        self.assertIn("were not scanned for this report", report)

    # Contract: previous linked attempts

    def test_closed_unmerged_linked_pr_is_listed_as_previous(self):
        normalized = issue_context.normalize_issue(
            issue(8, prs=[pull_request(42, "CLOSED", merged=False), pull_request(43)])
        )
        self.assertEqual([pr.number for pr in normalized.previous_prs], [42])
        self.assertEqual([pr.number for pr in normalized.linked_prs], [43])
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        previous = report.index("#### Previous linked PRs — closed, not merged")
        self.assertGreater(report.index("PR #42"), previous)
        self.assertLess(report.index("PR #43"), previous)

    def test_merged_linked_prs_are_excluded(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                prs=[
                    pull_request(42, "MERGED", merged=True),
                    pull_request(43, "CLOSED", merged=True),
                ],
            )
        )
        self.assertEqual(normalized.previous_prs, ())
        self.assertEqual(normalized.unknown_merge_count, 0)
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertNotIn("Previous linked PRs", report)
        self.assertNotIn("PR #42", report)
        self.assertNotIn("PR #43", report)

    def test_malformed_merge_metadata_is_not_listed_as_previous(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                prs=[
                    pull_request(42, "CLOSED", merged=None),
                    pull_request(43, "CLOSED", merged="no"),
                    pull_request(44, None),
                ],
            )
        )
        self.assertEqual(normalized.previous_prs, ())
        self.assertEqual(normalized.unknown_merge_count, 3)
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn("3 closed linked PR(s) had missing merge information and are not listed.", report)
        self.assertNotIn("PR #42", report)

    def test_formal_query_includes_closed_prs_and_merge_state(self):
        self.assertIn("includeClosedPrs: true", issue_context.QUERY)
        self.assertIn("merged", issue_context.QUERY)
        self.assertIn("includeClosedPrs: true", issue_context.ISSUE_QUERY)

    # Contract: recent human discussion and intent

    def test_app_comments_do_not_count_as_human_discussion(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("helper", body="I will work on this", author_type="App")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertNotIn("Recent issue discussion detected", report)
        self.assertNotIn("may indicate contributor intent", report)

    def test_old_plain_comment_does_not_trigger_recent_discussion(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("dev", "2025-12-31T23:59:59Z", "Some thoughts")])
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertNotIn("Recent issue discussion detected", report)
        self.assertIn("Some thoughts", report)

    def test_recency_window_boundaries(self):
        exact = issue_context.normalize_issue(issue(8, comments=[comment("a", "2026-01-01T00:00:00Z")]))
        future = issue_context.normalize_issue(issue(8, comments=[comment("b", "2026-02-01T00:00:00Z")]))
        self.assertTrue(issue_context.is_recent_comment(exact.comments[0], TEST_NOW))
        self.assertFalse(issue_context.is_recent_comment(future.comments[0], TEST_NOW))

    def test_contract_intent_phrases_are_detected_case_insensitively(self):
        for body in (
            "I am working on this",
            "I'm working on this",
            "I will work on this",
            "I'll work on this",
            "I would like to work on this",
            "I plan to work on this",
            "I'M WORKING ON THIS",
        ):
            with self.subTest(body=body):
                normalized = issue_context.normalize_issue(issue(8, comments=[comment("dev", body=body)]))
                self.assertTrue(issue_context.may_indicate_contributor_intent(normalized.comments[0]))

    def test_questions_and_third_party_statements_are_not_intent(self):
        for body in ("Is anyone working on this?", "They will work on this", "I'm not working on it", ""):
            with self.subTest(body=body):
                normalized = issue_context.normalize_issue(issue(8, comments=[comment("dev", body=body)]))
                self.assertFalse(issue_context.may_indicate_contributor_intent(normalized.comments[0]))

    def test_intent_notice_is_rendered_once_with_evidence_links(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[
                    comment("one", "2026-01-29T00:00:00Z", "I'll work on this", url="https://example/c/1"),
                    comment("two", "2026-01-30T00:00:00Z", "I plan to work on this", url="https://example/c/2"),
                ],
            )
        )
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertEqual(report.count("A recent comment may indicate contributor intent."), 1)
        self.assertIn("- [comment by @one](https://example/c/1) (2026-01-29 00:00 UTC)", report)
        self.assertIn("- [comment by @two](https://example/c/2) (2026-01-30 00:00 UTC)", report)

    # Contract: data as of, escaping, neutral wording

    def test_single_data_as_of_timestamp_is_deterministic(self):
        issues = [
            issue_context.normalize_issue(issue(1, comments=[comment("dev")])),
            issue_context.normalize_issue(issue(2)),
        ]
        offset_now = datetime.fromisoformat("2026-01-31T05:30:00+05:30")
        report_a = issue_context.render_markdown(issues, "sugarlabs/musicblocks", TEST_NOW, scan_of())
        report_b = issue_context.render_markdown(issues, "sugarlabs/musicblocks", offset_now, scan_of())
        self.assertEqual(report_a, report_b)
        self.assertEqual(report_a.count("Data as of"), 1)
        self.assertIn("Data as of: 2026-01-31 00:00 UTC", report_a)
        self.assertLess(report_a.index("Data as of"), report_a.index("## #1"))

    def test_naive_now_is_treated_as_utc(self):
        report = issue_context.render_markdown([], "sugarlabs/musicblocks", datetime(2026, 1, 31, 12, 0))
        self.assertIn("Data as of: 2026-01-31 12:00 UTC", report)

    def test_empty_report_still_has_data_as_of_and_limitations(self):
        report = issue_context.render_markdown([], "sugarlabs/musicblocks", TEST_NOW)
        self.assertIn("Data as of: 2026-01-31 00:00 UTC", report)
        self.assertIn("## Detection limitations", report)
        self.assertIn("No issues matched the requested state.", report)

    def test_text_reference_pr_fields_are_escaped(self):
        scan = scan_of(scanned_pr(50, title="Fix <b> & more #8", body="Fixes #8", author={"login": "a<b>"}))
        report = issue_context.render_markdown(
            [issue_context.normalize_issue(issue(8))], "sugarlabs/musicblocks & <x>", TEST_NOW, scan
        )
        self.assertIn("PR #50 — Fix &lt;b&gt; &amp; more #8", report)
        self.assertIn("author a&lt;b&gt;", report)
        self.assertIn("# Issue context for sugarlabs/musicblocks &amp; &lt;x&gt;", report)
        self.assertNotIn("<b>", report)

    def test_scan_error_text_is_escaped(self):
        scan = issue_context.TextReferenceScan(error="bad <html> & stuff")
        report = issue_context.render_markdown([], "sugarlabs/musicblocks", TEST_NOW, scan)
        self.assertIn("bad &lt;html&gt; &amp; stuff", report)

    def test_detection_limitations_follow_the_issue_payload(self):
        normalized = issue_context.normalize_issue(
            issue(8, comments=[comment("dev", body="I am working on this")], prs=[pull_request(42)])
        )
        report = issue_context.render_markdown(
            [normalized], "sugarlabs/musicblocks", TEST_NOW, scan_of(scanned_pr(50, body="Fixes #8"))
        )
        order = [
            "Data as of:",
            "## #8 — Issue 8",
            "### Existing work",
            "#### Open pull requests",
            "PR #42",
            "#### PRs referencing this issue in title or description",
            "PR #50",
            "### Recent discussion",
            "## Detection limitations",
            "- Finding no PR in this report is not evidence",
        ]
        positions = [report.index(marker) for marker in order]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(report.count("## Detection limitations"), 1)
        self.assertTrue(report.endswith("working on an issue.\n"))

        empty = issue_context.render_markdown([], "sugarlabs/musicblocks", TEST_NOW)
        self.assertLess(
            empty.index("No issues matched the requested state."),
            empty.index("## Detection limitations"),
        )

    def test_limitations_cover_every_detection_scope(self):
        report = issue_context.render_markdown([], "sugarlabs/musicblocks", TEST_NOW, scan_of())
        for expected in (
            "formal issue/PR links",
            "up to 20 per issue",
            "`Related to`",
            "`Partially addresses`",
            "last 5 comments per issue",
            "last 30 days",
            "Bot and App comments are excluded",
            "first-person phrase heuristic",
            "do not restrict contribution",
            "not evidence about whether others are working",
        ):
            self.assertIn(expected, report)

    def test_markdown_text_reference_limitation_matches_detection_behavior(self):
        report = issue_context.render_markdown([], "sugarlabs/musicblocks", TEST_NOW, scan_of())
        self.assertIn(
            "- Text references: open PR titles and descriptions are matched for `Fixes`, `Fix`, "
            "`Closes`, `Close`, `Resolves`, `Resolve`, `Related to`, `Partially addresses`, and "
            "`Partially addressed` followed by `#N`. References inside HTML comments, fenced code "
            "blocks, or quoted lines are ignored, and references in commits, review comments, or "
            "other repositories are not checked.",
            report,
        )
        for ignored in ("<!-- Fixes #8 -->", "```\nFixes #8\n```", "> Fixes #8"):
            self.assertEqual(issue_context.referenced_issue_numbers(ignored), set())
        self.assertEqual(issue_context.referenced_issue_numbers("Partially addressed #8"), {8})

    def test_truncated_formal_links_without_open_pr_are_not_reported_as_absent(self):
        prs = [pull_request(number, "CLOSED", merged=False) for number in range(1, 21)]
        normalized = issue_context.normalize_issue(issue(8, prs=prs, prs_has_next=True))
        self.assertEqual(normalized.linked_prs, ())
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW, scan_of())
        self.assertIn(
            "No open PR found among the first 20 formally linked PRs GitHub returned. "
            "PRs that mention this issue only in text may not appear.",
            report,
        )
        self.assertNotIn("No formally linked open PR found.", report)
        self.assertIn("GitHub returned only the first 20 linked PRs; additional linked PRs may exist.", report)

    def test_report_never_uses_gatekeeping_language(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[comment("dev", body="I am working on this")],
                prs=[pull_request(42), pull_request(43, "CLOSED", merged=False), pull_request(44, "CLOSED")],
                prs_has_next=True,
            )
        )
        scan = issue_context.TextReferenceScan(
            references=issue_context.build_text_reference_index([scanned_pr(50, body="Fixes #8")]),
            scanned_count=1,
            truncated=True,
        )
        empty = issue_context.normalize_issue(issue(9, comments=[], closedByPullRequestsReferences=None))
        report = issue_context.render_markdown([normalized, empty], "sugarlabs/musicblocks", TEST_NOW, scan)
        lowered = report.lower()
        for term in FORBIDDEN_TERMS:
            self.assertNotIn(term, lowered)

    # Contract: single-issue mode and CLI

    def test_fetch_issue_uses_single_issue_query(self):
        calls = []

        def runner(*args, **kwargs):
            calls.append(json.loads(kwargs["stdin"]))
            return json.dumps({"data": {"repository": {"issue": issue(9121)}}})

        result = issue_context.fetch_issue("sugarlabs/musicblocks", 9121, gh_runner=runner)
        self.assertEqual([node["number"] for node in result], [9121])
        self.assertEqual(
            calls[0]["variables"], {"owner": "sugarlabs", "name": "musicblocks", "number": 9121}
        )
        self.assertIn("issue(number: $number)", calls[0]["query"])

    def test_fetch_issue_missing_or_malformed_fails_cleanly(self):
        for payload in (
            {"data": {"repository": {"issue": None}}},
            {"data": {"repository": {"issue": "bad"}}},
            {"data": None},
            {"errors": [{"message": "Could not resolve to an Issue with the number of 1."}]},
        ):
            with self.subTest(payload=payload):
                with self.assertRaises(issue_context.GitHubAPIError):
                    issue_context.fetch_issue(
                        "sugarlabs/musicblocks", 1, gh_runner=lambda *a, p=payload, **k: json.dumps(p)
                    )
        for bad in (0, -1, True, "1"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                issue_context.fetch_issue("sugarlabs/musicblocks", bad, gh_runner=mock.Mock())

    def test_unresolvable_issue_is_not_retried(self):
        completed = mock.Mock(returncode=1, stderr="GraphQL: Could not resolve to an Issue", stdout="")
        with mock.patch.object(issue_context.subprocess, "run", return_value=completed) as run:
            with self.assertRaises(issue_context.GitHubAPIError):
                issue_context.run_gh("api", "graphql", attempts=3, sleep=mock.Mock())
        self.assertEqual(run.call_count, 1)

    def _cli(self, argv, responses):
        calls = []

        def runner(*args, **kwargs):
            calls.append(json.loads(kwargs["stdin"]))
            return responses.pop(0)

        stdout = io.StringIO()
        with mock.patch.object(issue_context, "run_gh", runner), mock.patch.object(
            issue_context.sys, "stdout", stdout
        ):
            status = issue_context.main(argv, now=TEST_NOW)
        return status, stdout.getvalue(), calls

    def test_cli_single_issue_mode_renders_one_issue(self):
        status, report, calls = self._cli(
            ["--repo", "sugarlabs/musicblocks", "--issue", "9121", "--format", "markdown"],
            [
                json.dumps({"data": {"repository": {"issue": issue(9121)}}}),
                pr_page([scanned_pr(50, body="Related to #9121"), scanned_pr(51, body="Fixes #91210")]),
            ],
        )
        self.assertEqual(status, 0)
        self.assertEqual(report.count("## #"), 1)
        self.assertIn("## #9121", report)
        self.assertIn("PR #50", report)
        self.assertNotIn("PR #51", report)
        self.assertEqual(report.count("Data as of: 2026-01-31 00:00 UTC"), 1)
        self.assertEqual(calls[0]["variables"]["number"], 9121)
        self.assertIn("pullRequests", calls[1]["query"])

    def test_cli_repository_mode_still_renders_all_issues(self):
        status, report, calls = self._cli(
            ["--repo", "sugarlabs/musicblocks"],
            [page([issue(2), issue(1)]), pr_page([scanned_pr(50, body="Fixes #2")])],
        )
        self.assertEqual(status, 0)
        self.assertLess(report.index("## #1"), report.index("## #2"))
        self.assertEqual(calls[0]["variables"]["states"], ["OPEN"])
        self.assertEqual(report.count("PR #50"), 1)

    def test_cli_scan_failure_still_renders_report(self):
        status, report, _ = self._cli(["--repo", "sugarlabs/musicblocks"], [page([issue(1)]), "{}"])
        self.assertEqual(status, 0)
        self.assertIn("the open PR scan did not complete", report)

    def test_cli_rejects_invalid_issue_number(self):
        stderr = io.StringIO()
        for value in ("0", "-3", "abc"):
            with self.subTest(value=value), mock.patch.object(issue_context.sys, "stderr", stderr):
                with self.assertRaises(SystemExit) as raised:
                    issue_context.main(["--repo", "sugarlabs/musicblocks", "--issue", value])
                self.assertEqual(raised.exception.code, 2)


    # Contract: structured JSON output

    def _json(self, issues, scan=None, now=TEST_NOW, repo="sugarlabs/musicblocks"):
        output = issue_context.render_json(issues, repo, now, scan)
        return output, json.loads(output)

    def _rich_issue(self):
        return issue_context.normalize_issue(
            issue(
                8,
                title="Fix <b> & more",
                comments=[
                    comment("dev", "2026-01-29T00:00:00Z", "I'll work on this", url="https://example/c/dev"),
                    comment("helper", "2026-01-30T00:00:00Z", "Looks good", author_type="Bot"),
                    comment("old", "2025-12-01T00:00:00Z", "I am working on this"),
                    comment("reviewer", "2026-01-30T05:30:00+05:30", "Some thoughts", url="https://example/c/rev"),
                ],
                prs=[
                    pull_request(43),
                    pull_request(42, isDraft=True),
                    pull_request(41, "CLOSED", merged=False),
                    pull_request(40, "MERGED", merged=True),
                ],
            )
        )

    def test_json_top_level_envelope_and_issue_contract_keys(self):
        _, document = self._json([self._rich_issue()], scan_of())
        self.assertEqual(
            list(document), ["schema_version", "repository", "data_as_of", "issues"]
        )
        self.assertEqual(document["schema_version"], 1)
        self.assertEqual(document["repository"], "sugarlabs/musicblocks")
        self.assertEqual(len(document["issues"]), 1)
        self.assertEqual(
            list(document["issues"][0]),
            [
                "issue",
                "data_as_of",
                "coverage",
                "formal_open_prs",
                "text_reference_prs",
                "previous_closed_unmerged_prs",
                "recent_human_discussion",
                "contributor_intent",
                "assignees",
                "limitations",
            ],
        )

    def test_json_issue_metadata_is_explicit(self):
        _, document = self._json([self._rich_issue()], scan_of())
        entry = document["issues"][0]["issue"]
        self.assertEqual(
            entry,
            {
                "number": 8,
                "title": "Fix <b> & more",
                "url": "https://github.com/sugarlabs/musicblocks/issues/8",
                "state": "open",
                "author": "user8",
                "labels": ["alpha", "zeta"],
                "milestone": "Port Ready",
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-03T00:00:00Z",
                "participant_count": 2,
            },
        )

    def test_json_single_utc_data_as_of_is_shared(self):
        offset_now = datetime.fromisoformat("2026-01-31T05:30:00+05:30")
        issues = [issue_context.normalize_issue(issue(1)), issue_context.normalize_issue(issue(2))]
        output_a, document = self._json(issues, scan_of())
        output_b, _ = self._json(issues, scan_of(), now=offset_now)
        self.assertEqual(output_a, output_b)
        self.assertEqual(document["data_as_of"], "2026-01-31T00:00:00Z")
        self.assertEqual(
            {entry["data_as_of"] for entry in document["issues"]}, {"2026-01-31T00:00:00Z"}
        )
        naive = issue_context.render_json([], "sugarlabs/musicblocks", datetime(2026, 1, 31, 12))
        self.assertEqual(json.loads(naive)["data_as_of"], "2026-01-31T12:00:00Z")

    def test_json_formal_text_and_previous_prs_are_separate(self):
        scan = scan_of(
            scanned_pr(43, body="Fixes #8"),
            scanned_pr(51, body="Related to #8"),
            scanned_pr(50, title="Closes #8"),
        )
        _, document = self._json([self._rich_issue()], scan)
        entry = document["issues"][0]
        self.assertEqual([pr["number"] for pr in entry["formal_open_prs"]], [42, 43])
        self.assertEqual([pr["number"] for pr in entry["text_reference_prs"]], [50, 51])
        self.assertEqual([pr["number"] for pr in entry["previous_closed_unmerged_prs"]], [41])
        all_numbers = [
            pr["number"]
            for key in ("formal_open_prs", "text_reference_prs", "previous_closed_unmerged_prs")
            for pr in entry[key]
        ]
        self.assertEqual(len(all_numbers), len(set(all_numbers)))
        self.assertNotIn(40, all_numbers)

    def test_json_pr_objects_are_explicit(self):
        _, document = self._json([self._rich_issue()], scan_of())
        entry = document["issues"][0]
        self.assertEqual(
            entry["formal_open_prs"][0],
            {
                "number": 42,
                "title": "Pull request 42",
                "url": "https://github.com/sugarlabs/musicblocks/pull/42",
                "state": "open",
                "is_draft": True,
                "author": "contributor42",
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-02T00:00:00Z",
            },
        )
        self.assertEqual(entry["previous_closed_unmerged_prs"][0]["state"], "closed")

    def test_json_recent_human_discussion_and_intent(self):
        _, document = self._json([self._rich_issue()], scan_of())
        entry = document["issues"][0]
        self.assertEqual(
            entry["recent_human_discussion"],
            [
                {
                    "author": "dev",
                    "url": "https://example/c/dev",
                    "created_at": "2026-01-29T00:00:00Z",
                    "excerpt": "I'll work on this",
                },
                {
                    "author": "reviewer",
                    "url": "https://example/c/rev",
                    "created_at": "2026-01-30T00:00:00Z",
                    "excerpt": "Some thoughts",
                },
            ],
        )
        self.assertEqual(
            entry["contributor_intent"],
            [{"author": "dev", "url": "https://example/c/dev", "created_at": "2026-01-29T00:00:00Z"}],
        )

    def test_json_bot_only_and_old_comments_produce_no_signals(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[
                    comment("bot", body="I am working on this", author_type="Bot"),
                    comment("app", body="I will fix this", author_type="App"),
                    comment("old", "2025-12-01T00:00:00Z", "I am working on this"),
                ],
            )
        )
        _, document = self._json([normalized], scan_of())
        self.assertEqual(document["issues"][0]["recent_human_discussion"], [])
        self.assertEqual(document["issues"][0]["contributor_intent"], [])

    def test_json_intent_uses_full_body_but_excerpt_stays_bounded(self):
        body = "x" * issue_context.MAX_COMMENT_CHARS + " I would like to work on this issue."
        normalized = issue_context.normalize_issue(issue(8, comments=[comment("dev", body=body)]))
        _, document = self._json([normalized], scan_of())
        entry = document["issues"][0]
        self.assertEqual(len(entry["contributor_intent"]), 1)
        excerpt = entry["recent_human_discussion"][0]["excerpt"]
        self.assertEqual(len(excerpt), issue_context.MAX_COMMENT_CHARS)
        self.assertTrue(excerpt.endswith("…"))

    def test_json_assignees_are_metadata_objects(self):
        _, document = self._json([self._rich_issue()], scan_of())
        entry = document["issues"][0]
        self.assertEqual(entry["assignees"], [{"login": "amy"}, {"login": "zara"}])
        codes = [item["code"] for item in entry["limitations"]]
        self.assertIn("assignees_metadata_only", codes)

    def test_json_complete_coverage_and_standard_limitations(self):
        _, document = self._json([self._rich_issue()], scan_of(scanned_pr(50, body="Fixes #99")))
        entry = document["issues"][0]
        self.assertEqual(
            entry["coverage"],
            {
                "formal_links": "complete",
                "text_references": "complete",
                "open_prs_scanned": 1,
                "merge_state_unknown_count": 0,
            },
        )
        self.assertEqual(
            [item["code"] for item in entry["limitations"]],
            [
                "formal_links_scope",
                "text_references_scope",
                "comments_bounded",
                "recent_human_window",
                "intent_heuristic",
                "assignees_metadata_only",
                "absence_not_evidence",
            ],
        )
        for item in entry["limitations"]:
            self.assertEqual(set(item), {"code", "message"})
            self.assertTrue(item["message"])

    def test_json_unavailable_formal_data_is_explicit(self):
        normalized = issue_context.normalize_issue(issue(8, closedByPullRequestsReferences=None))
        _, document = self._json([normalized], scan_of())
        entry = document["issues"][0]
        self.assertEqual(entry["coverage"]["formal_links"], "unavailable")
        self.assertEqual(entry["formal_open_prs"], [])
        messages = {item["code"]: item["message"] for item in entry["limitations"]}
        self.assertEqual(
            messages["formal_links_unavailable"],
            "Linked PR data was unavailable, so no conclusion can be drawn.",
        )

    def test_json_truncation_and_unknown_merge_state_are_explicit(self):
        prs = [pull_request(number) for number in range(1, 21)] + [pull_request(30, "CLOSED")]
        normalized = issue_context.normalize_issue(issue(8, prs=prs, prs_has_next=True))
        scan = issue_context.TextReferenceScan(scanned_count=1000, truncated=True)
        _, document = self._json([normalized], scan)
        entry = document["issues"][0]
        self.assertEqual(entry["coverage"]["formal_links"], "truncated")
        self.assertEqual(entry["coverage"]["text_references"], "truncated")
        self.assertEqual(entry["coverage"]["open_prs_scanned"], 1000)
        self.assertEqual(entry["coverage"]["merge_state_unknown_count"], 1)
        codes = [item["code"] for item in entry["limitations"]]
        for code in ("formal_links_truncated", "merge_state_unknown", "text_references_truncated"):
            self.assertIn(code, codes)

    def test_json_scan_failure_and_missing_scan_are_explicit(self):
        normalized = issue_context.normalize_issue(issue(8))
        _, failed = self._json([normalized], issue_context.TextReferenceScan(error="gh api graphql failed: secret"))
        entry = failed["issues"][0]
        self.assertEqual(entry["coverage"]["text_references"], "unavailable")
        self.assertIn("text_references_unavailable", [item["code"] for item in entry["limitations"]])
        self.assertNotIn("secret", json.dumps(failed))

        _, missing = self._json([normalized])
        entry = missing["issues"][0]
        self.assertEqual(entry["coverage"]["text_references"], "not_checked")
        self.assertEqual(entry["coverage"]["open_prs_scanned"], 0)
        self.assertIn("text_references_not_checked", [item["code"] for item in entry["limitations"]])

    def test_json_text_reference_cap_is_explicit(self):
        nodes = [scanned_pr(number, body="Fixes #8") for number in range(100, 125)]
        _, document = self._json([issue_context.normalize_issue(issue(8))], scan_of(*nodes))
        entry = document["issues"][0]
        self.assertEqual(len(entry["text_reference_prs"]), issue_context.MAX_TEXT_REFERENCE_PRS)
        self.assertEqual(entry["text_reference_prs"][0]["number"], 100)
        messages = {item["code"]: item["message"] for item in entry["limitations"]}
        self.assertEqual(messages["text_references_capped"], "Showing the first 20 of 25 referencing PRs.")

    def test_json_malformed_values_become_null_not_invented(self):
        normalized = issue_context.normalize_issue(
            {
                "number": 3,
                "title": None,
                "url": None,
                "updatedAt": "not-a-timestamp",
                "milestone": None,
                "participants": None,
                "comments": {"nodes": [dict(comment("dev", body="I am working on this"), url=None)]},
                "closedByPullRequestsReferences": {
                    "nodes": [pull_request(42, author=None, updatedAt=None, url=None)],
                    "pageInfo": {"hasNextPage": False},
                },
            }
        )
        _, document = self._json([normalized], scan_of())
        entry = document["issues"][0]
        self.assertIsNone(entry["issue"]["url"])
        self.assertIsNone(entry["issue"]["milestone"])
        self.assertIsNone(entry["issue"]["updated_at"])
        self.assertIsNone(entry["issue"]["participant_count"])
        self.assertEqual(entry["issue"]["title"], "Untitled issue")
        self.assertIsNone(entry["formal_open_prs"][0]["url"])
        self.assertIsNone(entry["formal_open_prs"][0]["updated_at"])
        self.assertEqual(entry["formal_open_prs"][0]["author"], "Unknown")
        self.assertIsNone(entry["contributor_intent"][0]["url"])

    def test_json_timestamps_are_normalized_to_utc(self):
        normalized = issue_context.normalize_issue(
            issue(8, updatedAt="2026-01-03T05:30:00+05:30", comments=[comment("dev", "2026-01-30T01:00:00+02:00")])
        )
        _, document = self._json([normalized], scan_of())
        entry = document["issues"][0]
        self.assertEqual(entry["issue"]["updated_at"], "2026-01-03T00:00:00Z")
        self.assertEqual(entry["recent_human_discussion"][0]["created_at"], "2026-01-29T23:00:00Z")

    def test_json_is_deterministic_and_sorted(self):
        first = issue_context.normalize_issue(issue(10, prs=[pull_request(30), pull_request(2)]))
        second = issue_context.normalize_issue(issue(2))
        scan = scan_of(scanned_pr(60, body="Fixes #10"), scanned_pr(55, body="Fixes #10"))
        output_a, document = self._json([first, second], scan)
        output_b, _ = self._json([second, first], scan)
        self.assertEqual(output_a, output_b)
        self.assertEqual([entry["issue"]["number"] for entry in document["issues"]], [2, 10])
        entry = document["issues"][1]
        self.assertEqual([pr["number"] for pr in entry["formal_open_prs"]], [2, 30])
        self.assertEqual([pr["number"] for pr in entry["text_reference_prs"]], [55, 60])

    def test_json_contains_no_markdown_presentation_strings(self):
        normalized = issue_context.normalize_issue(
            issue(8, title="[heading] *emphasis* `code` | pipe", comments=[comment("dev", body="*bold* [x](y)")])
        )
        output, document = self._json([normalized], scan_of())
        entry = document["issues"][0]
        self.assertEqual(entry["issue"]["title"], "[heading] *emphasis* `code` | pipe")
        self.assertEqual(entry["recent_human_discussion"][0]["excerpt"], "*bold* [x](y)")
        for item in entry["limitations"]:
            for marker in ("`", "**", "](", "\\[", "&amp;", "&lt;"):
                self.assertNotIn(marker, item["message"])
        self.assertNotIn("&amp;", output)

    def test_json_escapes_html_sensitive_characters_without_changing_values(self):
        repo = "sugarlabs/musicblocks & <x>"
        output, document = self._json([self._rich_issue()], scan_of(), repo=repo)
        for character in ("<", ">", "&"):
            self.assertNotIn(character, output)
        self.assertIn("\\u003cb\\u003e \\u0026 more", output)
        self.assertEqual(document["repository"], repo)
        self.assertEqual(document["issues"][0]["issue"]["title"], "Fix <b> & more")

    def test_json_never_uses_gatekeeping_language(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[comment("dev", body="I am working on this")],
                prs=[pull_request(42), pull_request(43, "CLOSED", merged=False), pull_request(44, "CLOSED")],
                prs_has_next=True,
            )
        )
        empty = issue_context.normalize_issue(issue(9, comments=[], closedByPullRequestsReferences=None))
        for scan in (
            None,
            issue_context.TextReferenceScan(scanned_count=5, truncated=True),
            issue_context.TextReferenceScan(error="boom"),
        ):
            _, document = self._json([normalized, empty], scan)
            text = json.dumps(document).lower()
            for term in FORBIDDEN_TERMS:
                self.assertNotIn(term, text)

    def test_json_empty_result_is_valid(self):
        output, document = self._json([])
        self.assertEqual(document["issues"], [])
        self.assertEqual(document["data_as_of"], "2026-01-31T00:00:00Z")
        self.assertTrue(output.endswith("\n"))

    def test_cli_json_single_issue_mode(self):
        status, output, calls = self._cli(
            ["--repo", "sugarlabs/musicblocks", "--issue", "9121", "--format", "json"],
            [
                json.dumps({"data": {"repository": {"issue": issue(9121, prs=[pull_request(42)])}}}),
                pr_page([scanned_pr(50, body="Related to #9121"), scanned_pr(42, body="Fixes #9121")]),
            ],
        )
        self.assertEqual(status, 0)
        document = json.loads(output)
        self.assertEqual(document["data_as_of"], "2026-01-31T00:00:00Z")
        self.assertEqual(len(document["issues"]), 1)
        entry = document["issues"][0]
        self.assertEqual(entry["issue"]["number"], 9121)
        self.assertEqual([pr["number"] for pr in entry["formal_open_prs"]], [42])
        self.assertEqual([pr["number"] for pr in entry["text_reference_prs"]], [50])
        self.assertEqual(entry["coverage"]["open_prs_scanned"], 2)
        self.assertEqual(calls[0]["variables"]["number"], 9121)

    def test_cli_json_repository_mode_and_markdown_default(self):
        responses = [page([issue(2), issue(1)]), pr_page([])]
        status, output, _ = self._cli(["--repo", "sugarlabs/musicblocks", "--format", "json"], list(responses))
        self.assertEqual(status, 0)
        self.assertEqual([entry["issue"]["number"] for entry in json.loads(output)["issues"]], [1, 2])
        status, markdown, _ = self._cli(["--repo", "sugarlabs/musicblocks"], list(responses))
        self.assertEqual(status, 0)
        self.assertTrue(markdown.startswith("# Issue context for sugarlabs/musicblocks"))

    def test_cli_json_error_goes_to_stderr_with_nonzero_status(self):
        stderr = io.StringIO()
        stdout = io.StringIO()
        with mock.patch.object(
            issue_context, "fetch_issue", side_effect=issue_context.GitHubAPIError("not found")
        ), mock.patch.object(issue_context.sys, "stderr", stderr), mock.patch.object(
            issue_context.sys, "stdout", stdout
        ):
            status = issue_context.main(["--repo", "sugarlabs/musicblocks", "--issue", "1", "--format", "json"])
        self.assertEqual(status, 1)
        self.assertEqual(stdout.getvalue(), "")
        self.assertIn("issue-context: not found", stderr.getvalue())

    def test_markdown_output_is_unchanged_by_json_support(self):
        normalized = self._rich_issue()
        scan = scan_of(scanned_pr(50, body="Fixes #8"))
        markdown = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW, scan)
        self.assertTrue(markdown.startswith("# Issue context for sugarlabs/musicblocks\n\nData as of: 2026-01-31 00:00 UTC"))
        self.assertNotIn('"schema_version"', markdown)
        self.assertIn("#### PRs referencing this issue in title or description", markdown)

    # Contract: /context issue comment

    def _tool_comment(self, created_at="2026-01-30T12:00:00Z"):
        return comment(
            "github-actions",
            created_at=created_at,
            body=issue_context.CONTEXT_COMMENT_MARKER + "\n# Issue context for sugarlabs/musicblocks",
            author_type="Bot",
            url="https://example/comments/tool",
        )

    def test_context_requests_and_tool_comment_are_left_out_of_discussion(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                comments=[
                    comment("amy", created_at="2026-01-29T00:00:00Z", body="Looks reproducible."),
                    comment("newcomer", created_at="2026-01-30T00:00:00Z", body="/context"),
                    comment("other", created_at="2026-01-30T06:00:00Z", body="  /context\r\n"),
                    self._tool_comment(),
                    comment("ci", created_at="2026-01-30T13:00:00Z", body="Build passed", author_type="Bot"),
                    comment("zed", created_at="2026-01-30T14:00:00Z", body="/context please, is this still open?"),
                ],
            )
        )
        self.assertEqual([c.author for c in normalized.comments], ["amy", "ci", "zed"])
        report = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW)
        self.assertNotIn("newcomer", report)
        self.assertNotIn("comments/tool", report)
        recent = issue_context.issue_to_json(normalized, TEST_NOW)["recent_human_discussion"]
        self.assertEqual([entry["author"] for entry in recent], ["amy", "zed"])

    def test_only_bot_comments_with_the_marker_are_treated_as_the_tool_comment(self):
        marker = issue_context.CONTEXT_COMMENT_MARKER
        human_quote = comment("amy", body=marker + " quoted by a person")
        other_bot = comment("helper", body="Unrelated " + marker, author_type="Bot")
        self.assertFalse(issue_context.is_context_tool_comment(human_quote))
        self.assertFalse(issue_context.is_context_tool_comment(other_bot))
        self.assertTrue(issue_context.is_context_tool_comment(self._tool_comment()))

    def test_context_requests_do_not_displace_human_comments(self):
        humans = [
            comment(f"person{i}", created_at=f"2026-01-2{i}T00:00:00Z", body=f"Note {i}", url=f"https://example/{i}")
            for i in range(5)
        ]
        requests = [
            comment(f"asker{i}", created_at=f"2026-01-30T0{i}:00:00Z", body="/context") for i in range(3)
        ]
        normalized = issue_context.normalize_issue(
            issue(8, comments=humans + requests + [self._tool_comment()])
        )
        self.assertEqual([c.author for c in normalized.comments], [f"person{i}" for i in range(5)])
        self.assertIn(f"comments(last: {issue_context.COMMENT_FETCH_WINDOW})", issue_context.ISSUE_FIELDS)
        self.assertGreater(issue_context.COMMENT_FETCH_WINDOW, issue_context.MAX_COMMENTS)

    def test_comment_window_still_keeps_only_the_last_human_comments(self):
        many = [
            comment(f"p{i:02d}", created_at=f"2026-01-{i + 1:02d}T00:00:00Z", url=f"https://example/{i}")
            for i in range(12)
        ]
        normalized = issue_context.normalize_issue(issue(8, comments=many))
        self.assertEqual(
            [c.author for c in normalized.comments], [f"p{i:02d}" for i in range(7, 12)]
        )

    def test_github_comment_never_mentions_users_or_teams(self):
        normalized = issue_context.normalize_issue(
            issue(
                8,
                title="Crash reported by @reporter",
                comments=[
                    comment("amy", body="I'm working on this, cc @bob and @sugarlabs/maintainers (mail a@b.org)"),
                ],
                prs=[pull_request(20)],
            )
        )
        rendered = issue_context.render_github_comment(
            [normalized], "sugarlabs/musicblocks", TEST_NOW, scan_of()
        )
        self.assertIsNone(re.search(r"@[A-Za-z0-9]", rendered))
        for name in ("reporter", "bob", "sugarlabs/maintainers", "amy", "zara"):
            with self.subTest(name=name):
                self.assertIn("@⁠" + name, rendered)
        self.assertIn("PR #20", rendered)
        self.assertIn("https://github.com/sugarlabs/musicblocks/pull/20", rendered)

    def test_github_comment_wraps_the_unchanged_markdown_report(self):
        normalized = self._rich_issue()
        scan = scan_of(scanned_pr(50, body="Fixes #8"))
        markdown = issue_context.render_markdown([normalized], "sugarlabs/musicblocks", TEST_NOW, scan)
        rendered = issue_context.render_github_comment([normalized], "sugarlabs/musicblocks", TEST_NOW, scan)
        self.assertTrue(rendered.startswith(issue_context.CONTEXT_COMMENT_MARKER + "\n# Issue context"))
        self.assertIn(markdown, rendered.replace("@⁠", "@"))
        self.assertTrue(rendered.endswith(issue_context.CONTEXT_COMMENT_FOOTER + "\n"))
        self.assertIn("Data as of: 2026-01-31 00:00 UTC", rendered)
        self.assertLess(rendered.index("## Detection limitations"), rendered.index(issue_context.CONTEXT_COMMENT_FOOTER))
        self.assertLess(len(rendered), 65536)
        lowered = rendered.lower()
        for term in FORBIDDEN_TERMS:
            with self.subTest(term=term):
                self.assertNotIn(term, lowered)

    def test_github_comment_is_recognized_by_its_own_filter(self):
        rendered = issue_context.render_github_comment(
            [issue_context.normalize_issue(issue(8))], "sugarlabs/musicblocks", TEST_NOW
        )
        posted = comment("github-actions", body=rendered, author_type="Bot")
        self.assertTrue(issue_context.is_context_tool_comment(posted))

    def test_cli_github_comment_renders_one_issue(self):
        status, rendered, calls = self._cli(
            ["--repo", "sugarlabs/musicblocks", "--issue", "9121", "--format", "github-comment"],
            [
                json.dumps({"data": {"repository": {"issue": issue(9121)}}}),
                pr_page([scanned_pr(50, body="Related to #9121")]),
            ],
        )
        self.assertEqual(status, 0)
        self.assertTrue(rendered.startswith(issue_context.CONTEXT_COMMENT_MARKER))
        self.assertEqual(rendered.count("## #"), 1)
        self.assertIn("PR #50", rendered)
        self.assertEqual(calls[0]["variables"]["number"], 9121)

    def test_cli_github_comment_requires_issue(self):
        stderr = io.StringIO()
        with mock.patch.object(issue_context.sys, "stderr", stderr), mock.patch.object(
            issue_context, "fetch_issues"
        ) as fetch:
            with self.assertRaises(SystemExit) as raised:
                issue_context.main(["--repo", "sugarlabs/musicblocks", "--format", "github-comment"])
        self.assertEqual(raised.exception.code, 2)
        self.assertIn("--format github-comment requires --issue", stderr.getvalue())
        fetch.assert_not_called()


WORKFLOW = SCRIPT.parent.parent / "workflows" / "contributor-issue-context-command.yml"


class ContextCommandWorkflowTests(unittest.TestCase):
    """Static checks on the /context workflow; its security relies on these lines."""

    @classmethod
    def setUpClass(cls):
        cls.text = WORKFLOW.read_text(encoding="utf-8")

    def test_triggers_only_on_new_issue_comments(self):
        trigger = self.text.split("\non:\n", 1)[1].split("\npermissions:", 1)[0]
        self.assertEqual(trigger.split(), ["issue_comment:", "types:", "[created]"])

    def test_permissions_are_least_privilege(self):
        permissions = self.text.split("\npermissions:\n", 1)[1].split("\njobs:", 1)[0]
        self.assertEqual(
            permissions.split(), ["contents:", "read", "issues:", "write", "pull-requests:", "read"]
        )
        self.assertEqual(self.text.count("permissions:"), 1)

    def test_job_ignores_pull_requests_closed_issues_and_bots(self):
        condition = self.text.split("        if: >-\n", 1)[1].split("        runs-on:", 1)[0]
        self.assertIn("!github.event.issue.pull_request", condition)
        self.assertIn("github.event.issue.state == 'open'", condition)
        self.assertIn("github.event.comment.user.type != 'Bot'", condition)
        self.assertIn(f"body.trim() !== '{issue_context.CONTEXT_COMMAND}'", self.text)

    def test_untrusted_event_text_is_never_expanded_into_steps(self):
        allowed = {
            "github.event.issue.number",
            "github.repository",
            "secrets.GITHUB_TOKEN",
            "steps.existing.outputs.comment_id",
            "steps.existing.outputs.duplicate_ids",
        }
        expressions = {match.strip() for match in re.findall(r"\$\{\{(.*?)\}\}", self.text)}
        self.assertTrue(expressions)
        self.assertLessEqual(expressions, allowed)

    def test_runs_trusted_default_branch_code_without_persisted_credentials(self):
        self.assertIn("persist-credentials: false", self.text)
        self.assertNotIn("ref:", self.text)
        self.assertNotIn("pull_request_target", self.text)
        self.assertIn(
            '--repo "$REPOSITORY" --issue "$ISSUE_NUMBER" --format github-comment', self.text
        )

    def test_only_edits_its_own_marked_comment(self):
        marker = issue_context.CONTEXT_COMMENT_MARKER
        self.assertEqual(self.text.count(f"const MARKER = '{marker}';"), 2)
        self.assertIn("c.user.type === 'Bot' && c.user.login === 'github-actions[bot]'", self.text)
        self.assertIn(".startsWith(MARKER)", self.text)

    def test_failure_never_posts_an_error_comment(self):
        failure = self.text.split("- name: Report failure on the request", 1)[1]
        self.assertNotIn("createComment", failure)
        self.assertNotIn("updateComment", failure)
        self.assertEqual(self.text.count("createComment({"), 1)


if __name__ == "__main__":
    unittest.main()
