#!/usr/bin/env python3
"""Create VendorFlow Airtable schema from FIELD_CONTRACT.md."""

import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"


def load_env():
    if not ENV_PATH.exists():
        print("Missing .env.local — add AIRTABLE_PAT and AIRTABLE_BASE_ID via /setup")
        sys.exit(1)
    for line in ENV_PATH.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def api(method: str, url: str, body=None):
    pat = os.environ.get("AIRTABLE_PAT", "")
    if not pat.startswith("pat"):
        print("ERROR: AIRTABLE_PAT must start with 'pat'. Re-save at http://localhost:3002/setup")
        sys.exit(1)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {pat}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"API error {e.code}: {e.read().decode()}")
        sys.exit(1)


def get_tables(base_id: str):
    return api("GET", f"https://api.airtable.com/v0/meta/bases/{base_id}/tables")


def create_table(base_id: str, payload: dict):
    return api("POST", f"https://api.airtable.com/v0/meta/bases/{base_id}/tables", payload)


def add_field(base_id: str, table_id: str, field: dict):
    return api(
        "POST",
        f"https://api.airtable.com/v0/meta/bases/{base_id}/tables/{table_id}/fields",
        field,
    )


LEADS_FIELDS = [
    {"name": "Event Name", "type": "singleLineText"},
    {"name": "Application Deadline", "type": "date", "options": {"dateFormat": {"name": "iso"}}},
    {"name": "Event Date", "type": "date", "options": {"dateFormat": {"name": "iso"}}},
    {"name": "Status", "type": "singleSelect", "options": {"choices": [
        {"name": "Discovered"}, {"name": "Applied"}, {"name": "Pending"}, {"name": "Booked"}, {"name": "Passed"},
    ]}},
    {"name": "Alert Level", "type": "singleSelect", "options": {"choices": [
        {"name": "🔴 URGENT"}, {"name": "🟡 WARNING"}, {"name": "🟢 HEADS UP"},
    ]}},
    {"name": "Needs Action", "type": "checkbox", "options": {"icon": "check", "color": "yellowBright"}},
    {"name": "Family Density", "type": "number", "options": {"precision": 0}},
    {"name": "Alpha Score", "type": "number", "options": {"precision": 0}},
    {"name": "Event Grade", "type": "singleSelect", "options": {"choices": [
        {"name": "S"}, {"name": "A"}, {"name": "B"}, {"name": "C"},
    ]}},
    {"name": "ZIP", "type": "singleLineText"},
    {"name": "S-Tier Priority", "type": "checkbox", "options": {"icon": "star", "color": "yellowBright"}},
    {"name": "Location", "type": "singleLineText"},
    {"name": "Source URL", "type": "url"},
    {"name": "Scraper Source", "type": "singleLineText"},
    {"name": "SQLite Event ID", "type": "singleLineText"},
]

HISTORY_FIELDS = [
    {"name": "Event Name", "type": "singleLineText"},
    {"name": "Actual Sales", "type": "currency", "options": {"precision": 2, "symbol": "$"}},
    {"name": "Booth Fee", "type": "currency", "options": {"precision": 2, "symbol": "$"}},
    {"name": "Miles", "type": "number", "options": {"precision": 1}},
    {"name": "Net Take-Home", "type": "currency", "options": {"precision": 2, "symbol": "$"}},
    {"name": "Profitable", "type": "checkbox", "options": {"icon": "check", "color": "greenBright"}},
]


def ensure_table(base_id: str, existing: dict, name: str, fields: list):
    if name in existing:
        table = existing[name]
        print(f"  Table '{name}' exists — checking fields...")
        have = {f["name"] for f in table.get("fields", [])}
        for field in fields:
            if field["name"] not in have:
                print(f"    Adding field: {field['name']}")
                add_field(base_id, table["id"], field)
        return table["id"]
    print(f"  Creating table '{name}'...")
    result = create_table(base_id, {"name": name, "fields": fields[:1]})
    table_id = result["id"]
    for field in fields[1:]:
        add_field(base_id, table_id, field)
    return table_id


def main():
    load_env()
    base_id = os.environ.get("AIRTABLE_BASE_ID", "")
    if not base_id.startswith("app"):
        print("ERROR: AIRTABLE_BASE_ID must start with 'app'. Re-save at http://localhost:3002/setup")
        sys.exit(1)

    print(f"Setting up base {base_id}...")
    meta = get_tables(base_id)
    existing = {t["name"]: t for t in meta.get("tables", [])}

    ensure_table(base_id, existing, "Event_Leads", LEADS_FIELDS)
    ensure_table(base_id, existing, "Event_History", HISTORY_FIELDS)

    print("Done. Run: npm run airtable:verify")


if __name__ == "__main__":
    main()
