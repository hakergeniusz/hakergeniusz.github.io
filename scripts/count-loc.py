#!/usr/bin/env python3
"""Measure lines of code contributed across a GitHub account.

Uses GitHub's public `stats/code_frequency` endpoint: each weekly entry is
[timestamp, additions, deletions]. GitHub returns HTTP 202 the first time it
computes the stats, so every request is retried a few times.

Usage:
    uv run scripts/count-loc.py                 # anonymous, limited by rate limit
    GITHUB_TOKEN=ghp_xxx uv run scripts/count-loc.py   # 5000 req/h instead of 60

Output: assets/loc-data.json
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

USER = 'hakergeniusz'
API = 'https://api.github.com'
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'loc-data.json'
MAX_REPOS = int(os.environ.get('MAX_REPOS', '24'))
TOKEN = os.environ.get('GITHUB_TOKEN')  # provided by the caller, never stored


def get(url):
    headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'hakergeniusz-website-loc-counter',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    if TOKEN:
        headers['Authorization'] = f'Bearer {TOKEN}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as res:
            body = res.read().decode('utf-8')
            remaining = res.headers.get('X-RateLimit-Remaining')
            return res.status, json.loads(body) if body else None, remaining
    except urllib.error.HTTPError as err:
        body = err.read().decode('utf-8', 'replace')
        return err.code, body[:200], err.headers.get('X-RateLimit-Remaining')


def code_frequency(repo):
    url = f'{API}/repos/{USER}/{repo}/stats/code_frequency'
    for attempt in range(5):
        status, data, remaining = get(url)
        if status == 200 and isinstance(data, list):
            return data, remaining
        if status == 202:  # GitHub is computing the stats; retry shortly.
            time.sleep(3 + attempt * 2)
            continue
        if remaining is not None and int(remaining) < 3:
            return None, remaining
        time.sleep(2)
    return None, remaining


def main():
    status, repos, remaining = get(f'{API}/users/{USER}/repos?per_page=100&sort=updated')
    if status != 200 or not isinstance(repos, list):
        print(f'Could not list repos (HTTP {status}): {repos}', file=sys.stderr)
        sys.exit(1)

    candidates = [r for r in repos if not r.get('fork')]
    candidates.sort(key=lambda r: (r.get('size') or 0), reverse=True)
    candidates = candidates[:MAX_REPOS]

    total_added = 0
    total_deleted = 0
    counted = []
    skipped = []

    for repo in candidates:
        name = repo['name']
        if remaining is not None and int(remaining) < 2 and not TOKEN:
            skipped.append(name)
            continue
        data, remaining = code_frequency(name)
        if data is None:
            skipped.append(name)
            continue
        added = sum(max(0, week[1]) for week in data)
        deleted = sum(max(0, -week[2]) for week in data)
        total_added += added
        total_deleted += deleted
        counted.append({'name': name, 'added': added, 'deleted': deleted})
        print(f'{name:38} +{added:>8,}  -{deleted:>8,}')

    payload = {
        'totalAdded': total_added,
        'totalDeleted': total_deleted,
        'repos': len(counted),
        'totalPublicRepos': len(repos),
        'skipped': skipped,
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
        'method': 'Sum of weekly additions in GitHub stats/code_frequency for the largest non-fork public repos. Includes all contributors to those repos.',
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + '\n')
    print(f'\nTotal added: {total_added:,} lines / deleted: {total_deleted:,} lines')
    print(f'Counted {len(counted)} repos, skipped {len(skipped)}. Wrote {OUT}')


if __name__ == '__main__':
    main()
