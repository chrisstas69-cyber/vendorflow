#!/usr/bin/env python3
"""Verify Airtable connection and schema."""

import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"

REQUIRED_LEADS = {
    "Event Name", "Application Deadline", "Event Date", "Status", "Alert Level",
    "Needs Action", "Family Density", "Alpha Score", "Event Grade", "ZIP",
    "S-Tier Priority", "Location", "Source URL", "Scraper Source", "SQLite Event ID",
}
REQUIRED_HISTORY = {
    "Event Name", "Actual Sales", "Booth Fee", "Miles", "Net Take-Home", "Profitable",
}


def load_env():
    for line in ENV_PATH.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ[k.strip()] = v.strip()


def get_tables(base_id: str, pat: str):
    req = urllib.request.Request(
        f"https://api.airtable.com/v0/meta/bases/{base_id}/tables",
        headers={"Authorization": f"Bearer {pat}"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def main():
    if not ENV_PATH.exists():
        print("FAIL: no .env.local")
        sys.exit(1)
    load_env()
    pat = os.environ.get("AIRTABLE_PAT", "")
    base_id = os.environ.get("AIRTABLE_BASE_ID", "")
    if not pat.startswith("pat"):
        print("FAIL: AIRTABLE_PAT invalid (must start with pat)")
        sys.exit(1)
    if not base_id.startswith("app"):
        print("FAIL: AIRTABLE_BASE_ID invalid (must start with app)")
        sys.exit(1)

    print("Checking Airtable connection...")
    meta = get_tables(base_id, pat)
    tables = {t["name"]: {f["name"] for f in t["fields"]} for t in meta.get("tables", [])}

    ok = True
    for table, required in [("Event_Leads", REQUIRED_LEADS), ("Event_History", REQUIRED_HISTORY)]:
        if table not in tables:
            print(f"  MISSING table: {table}")
            ok = False
            continue
        missing = required - tables[table]
        if missing:
            print(f"  {table} missing fields: {missing}")
            ok = False
        else:
            print(f"  OK: {table} ({len(required)} fields)")

    if not ok:
        print("\nRun: npm run airtable:setup")
        sys.exit(1)

    engine = ROOT / "airtable" / "file4_vendorflow_engine.py"
    if engine.exists():
        print("\nRunning Python engine dry-run...")
        env = os.environ.copy()
        r = subprocess.run(
            [sys.executable, str(engine), "--mode", "deadlines"],
            cwd=ROOT / "airtable",
            env=env,
            capture_output=True,
            text=True,
        )
        if r.returncode == 0:
            print("  OK: File 4 deadline engine")
        else:
            print(f"  WARN: File 4: {r.stderr or r.stdout}")

    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
