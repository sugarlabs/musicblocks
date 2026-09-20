#!/usr/bin/env python3
"""Keep one issue up to date with a dashboard of open pull requests, grouped by who acts next.

Usage:
    pr-dashboard.py --source-repo OWNER/NAME --issue-repo OWNER/NAME [--codeowners PATH] [--dry-run]

Reads open PRs from --source-repo and writes the rendered dashboard into the
body of the open issue titled ISSUE_TITLE on --issue-repo, creating it on the
first run. Uses the `gh` CLI for all GitHub calls, so the only credential
needed is GH_TOKEN with permission to write issues there.

Sections:

  Ready to merge      approved by a code owner, CI green, no conflicts
  In review           waiting on a reviewer; also shown per CODEOWNERS area
  On hold             carries a HOLD_LABELS label (e.g. string freeze)
  With authors        changes requested, CI failing, merge conflict, or a
                      reviewer's comment newer than the author's last push
                      or comment
  Stale               blocked, and the author has been silent STALE_DAYS+

Areas come from the checked-out .github/CODEOWNERS. A comment line
`# Area: Name` starts a section; every rule below it belongs to that area until
the next marker. A changed file's area is the area of the last rule matching it,
so adding a new area or moving a path needs no change here. Rules above the
first marker, and files no rule matches, count as "Other".
"""

import argparse
import json
import pathlib
import re
import subprocess
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone

STALE_DAYS = 90
TITLE_MAX = 72
AREA_MARKER = "# Area:"  # comment line in CODEOWNERS that names the area of the rules below it
HOLD_LABELS = ["String Freeze", "Code Freeze"]      # approved but deliberately not merged yet; shown in their own section
MAX_ROWS = 120  # per table; keeps the issue body under GitHub's 65 KB limit

QUERY = """
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: 50, after: $cursor, states: OPEN, orderBy: {field: CREATED_AT, direction: ASC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title url isDraft createdAt reviewDecision mergeable
        author { login __typename }
        labels(first: 20) { nodes { name } }
        files(first: 100) { totalCount nodes { path } }
        reviewThreads(first: 50) { nodes { comments(last: 1) { nodes { author { login __typename } createdAt } } } }
        reviewRequests(first: 10) { nodes { requestedReviewer { ... on User { login } ... on Team { name } } } }
        latestReviews(first: 20) { nodes { author { login __typename } state submittedAt } }
        comments(last: 10) { nodes { author { login __typename } createdAt } }
        commits(last: 1) { nodes { commit { committedDate statusCheckRollup { state } } } }
      }
    }
  }
}
"""

NOW = datetime.now(timezone.utc)


def gh(*args, stdin=None, attempts=3):
    """Run a gh command. Read-only `gh api` calls are retried, since GitHub
    occasionally answers 5xx; writes are not, to avoid double-creating."""
    for i in range(attempts if args[0] == "api" else 1):
        r = subprocess.run(["gh", *args], input=stdin, capture_output=True, text=True)
        if r.returncode == 0:
            return r.stdout
        time.sleep(10 * (i + 1))
    sys.exit(f"gh {' '.join(args[:2])} failed: {r.stderr.strip()}")


def fetch_prs(repo, attempts=5, wait=20):
    """Fetch all open PRs. After a push to the default branch GitHub resets every
    PR's `mergeable` to UNKNOWN and recomputes lazily; asking again triggers the
    recompute, so re-fetch a few times until it settles. Otherwise a run landing
    right after a merge would report zero conflicts."""
    owner, name = repo.split("/")
    for attempt in range(attempts):
        prs, cursor = [], None
        while True:
            variables = {"owner": owner, "name": name, "cursor": cursor}
            out = gh("api", "graphql", "--input", "-",
                     stdin=json.dumps({"query": QUERY, "variables": variables}))
            data = json.loads(out)["data"]["repository"]["pullRequests"]
            prs.extend(data["nodes"])
            if not data["pageInfo"]["hasNextPage"]:
                break
            cursor = data["pageInfo"]["endCursor"]
        if not any(pr["mergeable"] == "UNKNOWN" for pr in prs) or attempt == attempts - 1:
            return prs
        time.sleep(wait)


def read_codeowners(path):
    """Return (rules, areas). rules = [(regex, [owners], pattern, area)] in file
    order; areas = names in display order. Both empty if the file is missing."""
    try:
        text = pathlib.Path(path).read_text()
    except OSError:
        return [], []
    rules, area = [], "Other"
    for line in text.splitlines():
        if line.startswith(AREA_MARKER):
            area = line[len(AREA_MARKER):].strip() or "Other"
            continue
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        pattern, *owners = line.split()
        rules.append((codeowners_regex(pattern), [o.lstrip("@") for o in owners], pattern, area))
    return rules, area_order(rules)


def area_order(rules):
    """Areas in file order, except catch-all areas last. An area is a catch-all
    when every one of its rules is overridden by a later rule of another area
    (the `*` and `/js/` fallbacks)."""
    areas = list(dict.fromkeys(a for *_, a in rules))

    def catch_all(area):
        mine = [(i, rx) for i, (rx, _, _, a) in enumerate(rules) if a == area]
        return all(any(rx.search(pat.lstrip("/")) and a2 != area
                       for rx2, _, pat, a2 in rules[i + 1:]) for i, rx in mine)

    return sorted(areas, key=lambda a: (catch_all(a), a == "Other")) + ["Other"] * ("Other" not in areas)


def codeowners_regex(pattern):
    anchored = pattern.startswith("/")
    p = pattern.lstrip("/")
    dir_only = p.endswith("/")
    p = p.rstrip("/")
    out = ""
    i = 0
    while i < len(p):
        c = p[i]
        if p.startswith("**", i):
            out += ".*"
            i += 2
            if i < len(p) and p[i] == "/":
                i += 1
            continue
        out += "[^/]*" if c == "*" else "[^/]" if c == "?" else re.escape(c)
        i += 1
    prefix = "^" if anchored else "^(?:.*/)?"
    suffix = "(?:/.*)?$" if dir_only or "." not in p.rsplit("/", 1)[-1] else "$"
    return re.compile(prefix + out + suffix)


def owners_by_area(rules):
    out = defaultdict(set)
    for _, owners, _, area in rules:
        out[area].update(owners)
    return out


def match(path, rules):
    """(owners, area) of the last CODEOWNERS rule matching path."""
    owners, area = [], "Other"
    for rx, o, _, a in rules:
        if rx.search(path):
            owners, area = o, a
    return owners, area


def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def days(dt):
    return (NOW - dt).days


def evaluate(pr, rules, order):
    author = (pr["author"] or {}).get("login", "ghost")
    commit = pr["commits"]["nodes"][0]["commit"] if pr["commits"]["nodes"] else None
    ci = (commit.get("statusCheckRollup") or {}).get("state") if commit else None
    conflict = pr["mergeable"] == "CONFLICTING"
    reviews = [r for r in pr["latestReviews"]["nodes"] if r["author"] and r["author"]["login"] != author]
    requested = []
    for rq in pr["reviewRequests"]["nodes"]:
        who = rq["requestedReviewer"] or {}
        login = who.get("login") or who.get("name")
        if login:
            requested.append(login)

    area_owners = defaultdict(set)
    for f in pr["files"]["nodes"]:
        owners, area = match(f["path"], rules)
        area_owners[area].update(owners)
    areas = sorted(area_owners, key=order.index) or ["Other"]

    labels = [l["name"] for l in pr["labels"]["nodes"]]
    hold = [l for l in labels if l in HOLD_LABELS]

    # Newest human activity from the author vs. from anyone else (bots excluded by account type).
    def human(node):
        a = node.get("author") or {}
        return a.get("login") and a.get("__typename") != "Bot"
    author_times = [ts(commit["committedDate"])] if commit else []
    other_times = []
    for r in pr["latestReviews"]["nodes"]:
        if human(r):
            (author_times if r["author"]["login"] == author else other_times).append((ts(r["submittedAt"]), r["author"]["login"]))
    inline = [t["comments"]["nodes"][-1] for t in pr.get("reviewThreads", {}).get("nodes", []) if t["comments"]["nodes"]]
    for c in pr["comments"]["nodes"] + inline:
        if human(c):
            (author_times if c["author"]["login"] == author else other_times).append((ts(c["createdAt"]), c["author"]["login"]))
    author_times = [t if isinstance(t, datetime) else t[0] for t in author_times]
    last_author_activity = max(author_times, default=ts(pr["createdAt"]))
    last_other = max(other_times, default=None)

    changes_by = [r["author"]["login"] for r in reviews if r["state"] == "CHANGES_REQUESTED"]
    approved_by = [r["author"]["login"] for r in reviews if r["state"] == "APPROVED"]

    reviewers = []
    big = pr["files"].get("totalCount", 0) > len(pr["files"]["nodes"])
    blockers = []
    if conflict:
        blockers.append("<kbd>merge conflict</kbd>")
    if ci in ("FAILURE", "ERROR"):
        blockers.append("<kbd>CI failing</kbd>")
    if changes_by:
        blockers.append("<kbd>changes requested</kbd> " + users(changes_by))
    if not blockers and last_other and last_other[0] > last_author_activity:
        blockers.append("<kbd>reply to</kbd> " + last_other[1])

    kinds = []
    if conflict: kinds.append("merge conflict")
    if ci in ("FAILURE", "ERROR"): kinds.append("CI failing")
    if changes_by: kinds.append("changes requested")
    if not kinds and last_other and last_other[0] > last_author_activity: kinds.append("unanswered question")

    if hold:
        route, waiting = "hold", " ".join(f"<kbd>{l}</kbd>" for l in hold) + (" · " + " ".join(blockers) if blockers else "")
    elif blockers:
        route, waiting = "author", " ".join(blockers)
    elif pr["reviewDecision"] == "APPROVED":
        route, waiting = "ready", "<kbd>approved</kbd> " + users(approved_by)
    else:
        route = "review"
        if requested:
            waiting, reviewers = users(requested), requested
        elif reviews:
            reviewers = sorted({r["author"]["login"] for r in reviews})
            waiting = users(reviewers) + " <kbd>re-review</kbd>"
        else:
            waiting, reviewers = "<kbd>unassigned</kbd>", []

    if big:
        waiting += f" <kbd>{pr['files']['totalCount']} files</kbd>"

    return {
        "number": pr["number"], "title": " ".join(pr["title"].split()), "url": pr["url"], "author": author,
        "route": route, "waiting": waiting, "areas": areas,
        "bot": (pr["author"] or {}).get("__typename") == "Bot", "reviewers": reviewers, "hold": hold, "area_owners": area_owners, "requested": requested,
        "age": days(ts(pr["createdAt"])), "idle": days(last_author_activity), "kinds": kinds,
        "unassigned": route == "review" and not requested and not reviews,
        "stale": route == "author" and days(last_author_activity) >= STALE_DAYS,
    }


def users(logins):
    return ", ".join(logins)


def mentions(logins):
    return ", ".join(f"@{u}" for u in logins)


EMPTY = "_Nothing here._\n"


def section(entries, open_=False, **kw):
    """A collapsible table, or a one-line empty state."""
    if not entries:
        return EMPTY
    return details("Show list", table(entries, **kw), open_=open_)


def table(entries, last_col="Age", last_key="age", mid_col="Waiting for", author=False):
    if not entries:
        return EMPTY
    cols = ["Pull request"] + (["Author"] if author else []) + [mid_col, last_col]
    head = "| " + " | ".join(cols) + " |\n|" + "---|" * (len(cols) - 1) + "---:|"
    rows = []
    ordered = sorted(entries, key=lambda e: -e[last_key])
    for e in ordered[:MAX_ROWS]:
        title = e["title"].replace("|", "\\|")
        if len(title) > TITLE_MAX:
            title = title[:TITLE_MAX - 1].rstrip() + "…"
        n = e[last_key]
        age = f"**{n}d**" if n >= 60 else f"{n}d"
        who = f" {e['author']} |" if author else ""
        rows.append(f"| [#{e['number']}]({e['url']}) {title} |{who} {e['waiting']} | {age} |")
    if len(ordered) > MAX_ROWS:
        rows.append(f"\n_and {len(ordered) - MAX_ROWS} more._")
    return "\n".join([head, *rows])


KIND_ORDER = ["merge conflict", "CI failing", "changes requested", "unanswered question"]
KIND_ACTION = {
    "merge conflict": "Fix merge conflict",
    "CI failing": "Fix CI",
    "changes requested": "Address requested changes",
    "unanswered question": "Reply to reviewer",
}


def subsections(entries, key, order, open_=False, label=None, show_empty=False, totals=None, **kw):
    """Group entries and render each group as one toggle line.
    key(e) may return one group or a list of groups (the entry then appears under each).
    totals(e) -> list of groups to count for a '(n total)' suffix; used when only the
    first of several blockers decides placement."""
    groups = defaultdict(list)
    for e in entries:
        ks = key(e)
        for k in (ks if isinstance(ks, list) else [ks]):
            groups[k].append(e)
    if not groups and not show_empty:
        return EMPTY
    if len(groups) == 1 and not show_empty:
        return section(entries, open_=open_, **kw)
    total = Counter(k for e in entries for k in totals(e)) if totals else {}
    names = [g for g in order if g in groups or show_empty] + sorted(g for g in groups if g not in order)
    name = label or (lambda g: g[0].upper() + g[1:])
    out = []
    for g in names:
        n = len(groups[g])
        extra = f" <sub>({total[g]} total)</sub>" if totals and total.get(g, 0) > n else ""
        out.append(details(f"<b>{name(g)}</b> · {n}{extra}", table(groups[g], **kw) if groups.get(g) else EMPTY, open_=open_))
    return "\n".join(out)


COLORS = {  # hex for the top badges, math colour name for heading numbers
    "Ready to merge": ("2ea043", "green"), "In review": ("0969da", "blue"), "With authors": ("bf8700", "orange"),
    "On hold": ("8b949e", "gray"), "Stale": ("cf222e", "red"), "Automated": ("6e7781", "gray"),
}


def count_badge(title, n):
    return f'<img alt="{n}" src="https://img.shields.io/badge/{n}-{COLORS[title][0]}?style=flat-square">'


def heading(title, n, blurb):
    return f"## {title} · {n}\n*{blurb}*"


def details(summary, body, open_=False):
    tag = "<details open>" if open_ else "<details>"
    return f"{tag}\n<summary>{summary}</summary>\n\n{body}\n\n</details>\n"


def render(prs, source_repo, rules, order):
    by_area_owners = owners_by_area(rules)
    entries = [evaluate(pr, rules, order) for pr in prs if not pr["isDraft"]]
    drafts = sum(1 for pr in prs if pr["isDraft"])
    stale = [e for e in entries if e["stale"]]
    live = [e for e in entries if not e["stale"]]
    ready = [e for e in live if e["route"] == "ready"]
    review = [e for e in live if e["route"] == "review"]
    authors = [e for e in live if e["route"] == "author"]
    hold = [e for e in live if e["route"] == "hold"]

    bots = [e for e in live if e["bot"]]
    ready = [e for e in ready if not e["bot"]]
    review = [e for e in review if not e["bot"]]
    authors = [e for e in authors if not e["bot"]]
    hold = [e for e in hold if not e["bot"]]

    unassigned = sum(1 for e in review if e["unassigned"])

    def badge(label, n, color):
        text = label.replace(" ", "_").replace("-", "--")
        return f'<img alt="{label}: {n}" src="https://img.shields.io/badge/{text}-{n}-{color}?style=for-the-badge">'

    out = [
        '<p align="center">',
        f'  <strong>{source_repo}</strong> · <a href="https://github.com/{source_repo}/pulls">{len(prs)} open pull requests</a><br>',
        f"  <sub>{NOW.strftime('%Y-%m-%d')}</sub>",
        "</p>",
        '<p align="center">',
        "  " + " ".join([
            badge("ready to merge", len(ready), COLORS["Ready to merge"][0]),
            badge("in review", len(review), COLORS["In review"][0]),
            badge("with authors", len(authors), COLORS["With authors"][0]),
            badge("on hold", len(hold), COLORS["On hold"][0]),
            badge("stale", len(stale), COLORS["Stale"][0]),
        ]),
        "</p>",
        "",
        heading("Ready to merge", len(ready), "Approved by a code owner, CI green, no conflicts. A maintainer can merge."),
        "",
        section(ready, open_=True),
        "",
        heading("In review", len(review), "**Code owners, start here.** These PRs are waiting on you, not on their authors. A PR touching two areas is listed under both. Waiting is how many days you have had each one."),
        "",
    ]
    load = Counter(u for e in review for u in e["reviewers"])
    areas_of = defaultdict(list)
    for area in order:
        for u in by_area_owners.get(area, ()):
            areas_of[u].append(area)
    owner_rows = ["| Code owner | Areas | Requested on |", "|---|---|---:|"]
    for u in sorted(areas_of, key=lambda u: (-load[u], u)):
        owner_rows.append(f"| @{u} | {', '.join(areas_of[u])} | {load[u]} |")
    if unassigned:
        out += [f"**{unassigned}** with no reviewer requested.", ""]
    out += ["\n".join(owner_rows), "",
            subsections(review, lambda e: e["areas"], order, show_empty=True,
                        last_col="Waiting", last_key="idle", mid_col="Requested")]
    unknown = sum(1 for pr in prs if pr["mergeable"] == "UNKNOWN")
    out += [
        "",
        heading("With authors", len(authors), "The author of the PR has to do something before review can continue. A PR with two problems is listed under both."),
        "",
        subsections(authors, lambda e: e["kinds"], KIND_ORDER, label=KIND_ACTION.get, mid_col="Blocked by"),
        "",
        heading("On hold", len(hold), "Reviewed, but merging is paused on purpose — labelled " + ", ".join(f"`{l}`" for l in HOLD_LABELS) + "."),
        "",
        subsections(hold, lambda e: e["hold"][0], HOLD_LABELS, show_empty=True),
        "",
        heading("Stale", len(stale), f"With authors, and the author has not pushed or commented in {STALE_DAYS}+ days. Close, or take it over."),
        "",
        subsections(stale, lambda e: e["kinds"], KIND_ORDER, label=KIND_ACTION.get, last_col="Idle", last_key="idle", mid_col="Blocked by", author=True),
        "",
        heading("Automated", len(bots), "Opened by bots."),
        "",
        section(bots),
        "",
        f"<sub>{len(prs)} open = {len(ready) + len(review) + len(authors) + len(hold) + len(stale)} above + {len(bots)} automated + {drafts} drafts · "
        "Waiting / Idle = days since the author last pushed or commented · Age = days since opened"
        + (f" · **{unknown} PRs: merge state not yet computed by GitHub, conflicts may be missing**" if unknown else "") + "</sub>",
    ]
    return "\n".join(out)


ISSUE_TITLE = "Pull request dashboard"


def find_issue(repo):
    """The open issue this workflow owns: created by the Actions bot, exact title."""
    found = json.loads(gh("api", f"repos/{repo}/issues?state=open&creator=github-actions%5Bbot%5D&per_page=100"))
    numbers = sorted(i["number"] for i in found if i["title"] == ISSUE_TITLE and "pull_request" not in i)
    return numbers[0] if numbers else None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source-repo", required=True)
    p.add_argument("--issue-repo", required=True)
    p.add_argument("--codeowners", default=".github/CODEOWNERS")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()

    rules, order = read_codeowners(a.codeowners)
    body = render(fetch_prs(a.source_repo), a.source_repo, rules, order)
    if a.dry_run:
        print(body)
        return
    number = find_issue(a.issue_repo)
    if number is None:
        url = gh("issue", "create", "--repo", a.issue_repo, "--title", ISSUE_TITLE, "--body-file", "-", stdin=body)
        print(f"Created {url.strip()} ({len(body)} chars)")
    else:
        gh("issue", "edit", str(number), "--repo", a.issue_repo, "--body-file", "-", stdin=body)
        print(f"Updated {a.issue_repo}#{number} ({len(body)} chars)")


if __name__ == "__main__":
    main()
