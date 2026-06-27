"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  VENDORFLOW OS — FILE 4                                                 ║
║  Python Backend: Alpha Score Engine + Profit Oracle                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Target:   Local dev in Cursor / CLI / cron job / serverless function   ║
║  Tables:   Event_Leads (grading) · Event_History (financials)           ║
║  API:      Airtable REST API (pyairtable)                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

SETUP:
    pip install pyairtable python-dotenv

    Create a .env file:
        AIRTABLE_PAT=pat1234567890
        AIRTABLE_BASE_ID=app1234567890

    Run:
        python file4_vendorflow_engine.py                 # runs all engines
        python file4_vendorflow_engine.py --mode deadlines   # 90/60/30-day deadline alerts
        python file4_vendorflow_engine.py --mode zip_priority  # S-Tier for ZIP 11730/11784
        python file4_vendorflow_engine.py --mode grading   # just S-Tier Filter
        python file4_vendorflow_engine.py --mode profits  # just Profit Oracle
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Any, Optional

from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()


# ═══════════════════════════════════════════════════════════════════════
# §1  SHARED FIELD CONTRACT
#     These names MUST match File 3 (JavaScript) exactly.
# ═══════════════════════════════════════════════════════════════════════

class Tables:
    LEADS   = "Event_Leads"
    HISTORY = "Event_History"


class LeadFields:
    """Field names for the Event_Leads table.
    Shared contract with File 3 — change here, change there."""

    EVENT_NAME           = "Event Name"
    APPLICATION_DEADLINE = "Application Deadline"
    STATUS               = "Status"
    ALERT_LEVEL          = "Alert Level"
    NEEDS_ACTION         = "Needs Action"
    FAMILY_DENSITY       = "Family Density"
    ALPHA_SCORE          = "Alpha Score"
    EVENT_GRADE          = "Event Grade"
    ZIP                  = "ZIP"
    S_TIER_PRIORITY      = "S-Tier Priority"


class HistoryFields:
    """Field names for the Event_History table.
    Shared contract with File 3 — change here, change there."""

    EVENT_NAME   = "Event Name"
    ACTUAL_SALES = "Actual Sales"
    BOOTH_FEE    = "Booth Fee"
    MILES        = "Miles"
    NET_TAKE_HOME = "Net Take-Home"
    PROFITABLE   = "Profitable"


# ═══════════════════════════════════════════════════════════════════════
# §2  CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

# IRS standard mileage rate (2024–2025). Update annually.
MILEAGE_RATE: float = 0.67

# Deadline alert tiers (90/60/30-day thresholds)
DEADLINE_TIERS = {
    "URGENT":   {"days": 30, "label": "🔴 URGENT"},
    "WARNING":  {"days": 60, "label": "🟡 WARNING"},
    "HEADS_UP": {"days": 90, "label": "🟢 HEADS UP"},
}

# ZIP codes that trigger S-Tier Priority
S_TIER_ZIP_CODES = frozenset({"11730", "11784"})

# S-Tier grading thresholds
GRADING = {
    # Family Density breakpoints (percentage points)
    "density_s": 40,   # >= 40% → S-eligible
    "density_a": 25,   # >= 25% → A-eligible
    "density_b": 15,   # >= 15% → B-eligible
    #                     < 15% → C

    # Alpha Score modifiers
    "alpha_boost":   75,   # >= 75 → promote one tier
    "alpha_penalty": 30,   # <  30 → demote one tier
}


# ═══════════════════════════════════════════════════════════════════════
# §3  SAFETY UTILITIES
# ═══════════════════════════════════════════════════════════════════════

def safe_num(val: Any, default: float = 0.0) -> float:
    """Extract a numeric value from any input. Never raises."""
    if val is None:
        return default
    try:
        n = float(val)
        return n if n == n else default  # NaN check: NaN != NaN
    except (TypeError, ValueError):
        return default


def clamp(val: float, lo: float, hi: float) -> float:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, val))


def fmt_dollar(amount: float) -> str:
    """Format a number as a dollar string."""
    sign = "-" if amount < 0 else ""
    return f"{sign}${abs(amount):,.2f}"


def get_field(record: dict, field_name: str) -> Any:
    """Safely get a field value from an Airtable record dict."""
    return record.get("fields", {}).get(field_name)


def safe_date(val: Any) -> Optional[date]:
    """Parse a date from Airtable (ISO string or date object). Returns None on invalid input."""
    if val is None:
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    try:
        if isinstance(val, str):
            return datetime.fromisoformat(val.replace("Z", "+00:00")).date()
    except (ValueError, TypeError):
        pass
    return None


def days_until(target: date) -> int:
    """Calendar days from today to target. Positive = future, negative = past, 0 = today."""
    today = date.today()
    return (target - today).days


# ═══════════════════════════════════════════════════════════════════════
# §4  DEADLINE ENGINE — 90/60/30-DAY ALERTS
# ═══════════════════════════════════════════════════════════════════════

@dataclass
class DeadlineResult:
    """Output of deadline classification for a single event."""
    label: Optional[str]
    needs_action: bool
    days_left: Optional[int]
    expired: bool


def classify_deadline(deadline_raw: Any) -> DeadlineResult:
    """
    Classify a deadline into an alert tier (90/60/30-day rules).

    Rules:
      null/invalid date  → no alert, no flag
      days < 0           → expired, clear alert, unflag
      days <= 30         → URGENT + Needs Action
      days <= 60         → WARNING + Needs Action
      days <= 90         → HEADS UP + Needs Action
      days > 90          → no alert, no flag
    """
    d = safe_date(deadline_raw)
    if d is None:
        return DeadlineResult(label=None, needs_action=False, days_left=None, expired=False)

    remaining = days_until(d)

    if remaining < 0:
        return DeadlineResult(label=None, needs_action=False, days_left=remaining, expired=True)

    tiers = DEADLINE_TIERS
    if remaining <= tiers["URGENT"]["days"]:
        return DeadlineResult(
            label=tiers["URGENT"]["label"],
            needs_action=True,
            days_left=remaining,
            expired=False,
        )
    if remaining <= tiers["WARNING"]["days"]:
        return DeadlineResult(
            label=tiers["WARNING"]["label"],
            needs_action=True,
            days_left=remaining,
            expired=False,
        )
    if remaining <= tiers["HEADS_UP"]["days"]:
        return DeadlineResult(
            label=tiers["HEADS_UP"]["label"],
            needs_action=True,
            days_left=remaining,
            expired=False,
        )

    return DeadlineResult(label=None, needs_action=False, days_left=remaining, expired=False)


# ═══════════════════════════════════════════════════════════════════════
# §5  ALPHA SCORE ENGINE — S-TIER FILTER
# ═══════════════════════════════════════════════════════════════════════

class Grade(str, Enum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"

# Ordered for promotion/demotion math
_GRADE_LADDER: list[Grade] = [Grade.C, Grade.B, Grade.A, Grade.S]


@dataclass
class GradeResult:
    """Output of the grading algorithm for a single event."""
    grade: Grade
    family_density: float
    alpha_score: float
    base_grade: Grade
    promoted: bool
    demoted: bool

    @property
    def modified(self) -> bool:
        return self.promoted or self.demoted


def grade_event(family_density_raw: Any, alpha_score_raw: Any) -> GradeResult:
    """
    Grade a single event using the S-Tier Filter algorithm.

    Primary axis:  Family Density  (the hard gate)
      >= 40%  →  S-eligible
      >= 25%  →  A-eligible
      >= 15%  →  B-eligible
      <  15%  →  C

    Secondary axis:  Alpha Score  (the modifier)
      >= 75   →  promote one tier (A→S, B→A, C→B)  — capped at S
      <  30   →  demote one tier  (S→A, A→B, B→C)  — floored at C

    All inputs are null-safe.
    """
    density = clamp(safe_num(family_density_raw), 0, 100)
    alpha   = clamp(safe_num(alpha_score_raw),    0, 100)
    g       = GRADING

    # Step 1: Base grade from Family Density
    if   density >= g["density_s"]: base = Grade.S
    elif density >= g["density_a"]: base = Grade.A
    elif density >= g["density_b"]: base = Grade.B
    else:                           base = Grade.C

    # Step 2: Alpha modifier
    idx = _GRADE_LADDER.index(base)
    promoted = False
    demoted  = False

    if alpha >= g["alpha_boost"] and idx < len(_GRADE_LADDER) - 1:
        idx += 1
        promoted = True
    elif alpha < g["alpha_penalty"] and idx > 0:
        idx -= 1
        demoted = True

    return GradeResult(
        grade=_GRADE_LADDER[idx],
        family_density=density,
        alpha_score=alpha,
        base_grade=base,
        promoted=promoted,
        demoted=demoted,
    )


# ═══════════════════════════════════════════════════════════════════════
# §6  PROFIT ORACLE
# ═══════════════════════════════════════════════════════════════════════

@dataclass
class ProfitResult:
    """Output of the profit calculation for a single event."""
    net_take_home: float
    mileage_cost: float
    total_expenses: float
    is_profitable: bool


def calculate_profit(
    actual_sales_raw: Any,
    booth_fee_raw: Any,
    miles_raw: Any,
) -> ProfitResult:
    """
    Calculate Net Take-Home for a single event.

    Formula:  Net = Actual Sales - Booth Fee - (Miles × 0.67)

    All inputs are null-safe.
    """
    sales = safe_num(actual_sales_raw)
    fee   = safe_num(booth_fee_raw)
    miles = safe_num(miles_raw)

    mileage_cost   = round(miles * MILEAGE_RATE, 2)
    total_expenses = round(fee + mileage_cost, 2)
    net            = round(sales - total_expenses, 2)

    return ProfitResult(
        net_take_home=net,
        mileage_cost=mileage_cost,
        total_expenses=total_expenses,
        is_profitable=net > 0,
    )


# ═══════════════════════════════════════════════════════════════════════
# §7  AIRTABLE API CONNECTOR
# ═══════════════════════════════════════════════════════════════════════

def connect() -> tuple:
    """
    Connect to Airtable and return (leads_table, history_table).
    Reads credentials from environment variables.
    """
    pat     = os.environ.get("AIRTABLE_PAT")
    base_id = os.environ.get("AIRTABLE_BASE_ID")

    if not pat or not base_id:
        print("❌ Missing environment variables.")
        print("   Set AIRTABLE_PAT and AIRTABLE_BASE_ID in your .env file.")
        sys.exit(1)

    api = Api(pat)
    leads_table   = api.table(base_id, Tables.LEADS)
    history_table = api.table(base_id, Tables.HISTORY)

    return leads_table, history_table


# ═══════════════════════════════════════════════════════════════════════
# §8  ENGINE RUNNERS
# ═══════════════════════════════════════════════════════════════════════

def run_deadline_engine(leads_table) -> dict:
    """
    Fetch all Event_Leads, compute 90/60/30-day deadline alerts, batch-update changed records.
    Returns summary stats.
    """
    print("\n⏰ Deadline Engine (90/60/30-day alerts)")
    print("─" * 50)

    records = leads_table.all()
    updates = []
    summary = {"urgent": 0, "warning": 0, "heads_up": 0, "expired": 0, "clear": 0}
    tiers = DEADLINE_TIERS

    for rec in records:
        name = get_field(rec, LeadFields.EVENT_NAME) or "(unnamed)"
        alert = classify_deadline(get_field(rec, LeadFields.APPLICATION_DEADLINE))

        if alert.expired:
            summary["expired"] += 1
        elif alert.label == tiers["URGENT"]["label"]:
            summary["urgent"] += 1
        elif alert.label == tiers["WARNING"]["label"]:
            summary["warning"] += 1
        elif alert.label == tiers["HEADS_UP"]["label"]:
            summary["heads_up"] += 1
        else:
            summary["clear"] += 1

        current_label = get_field(rec, LeadFields.ALERT_LEVEL)
        current_val = current_label if isinstance(current_label, str) else None
        current_flag = bool(get_field(rec, LeadFields.NEEDS_ACTION))

        label_changed = (alert.label or None) != (current_val or None)
        flag_changed = alert.needs_action != current_flag

        if label_changed or flag_changed:
            fields = {}
            if label_changed:
                fields[LeadFields.ALERT_LEVEL] = alert.label
            if flag_changed:
                fields[LeadFields.NEEDS_ACTION] = alert.needs_action
            updates.append({"id": rec["id"], "fields": fields})

    if updates:
        leads_table.batch_update(updates)

    print(f"   Scanned:  {len(records)} leads")
    print(f"   Updated:  {len(updates)} records")
    print()
    print(f"   {tiers['URGENT']['label']} (≤30d):   {summary['urgent']}")
    print(f"   {tiers['WARNING']['label']} (≤60d):  {summary['warning']}")
    print(f"   {tiers['HEADS_UP']['label']} (≤90d): {summary['heads_up']}")
    print(f"   ⏰ Expired:          {summary['expired']}")
    print(f"   ✅ No alert (>90d):  {summary['clear']}")

    return {
        "processed": len(records),
        "updated": len(updates),
        "summary": summary,
    }


def run_zip_priority_engine(leads_table) -> dict:
    """
    Mark events in ZIP 11730 or 11784 as S-Tier Priority.
    Handles both numeric and string ZIP values.
    """
    print("\n📍 ZIP S-Tier Priority Engine")
    print("─" * 50)

    records = leads_table.all()
    updates = []
    s_tier_count = 0

    for rec in records:
        zip_raw = get_field(rec, LeadFields.ZIP)
        zip_str = str(zip_raw).strip() if zip_raw is not None else ""
        is_s_tier = zip_str in S_TIER_ZIP_CODES

        if is_s_tier:
            s_tier_count += 1

        current = bool(get_field(rec, LeadFields.S_TIER_PRIORITY))
        if is_s_tier != current:
            updates.append({
                "id": rec["id"],
                "fields": {LeadFields.S_TIER_PRIORITY: is_s_tier},
            })

    if updates:
        leads_table.batch_update(updates)

    print(f"   Scanned:  {len(records)} leads")
    print(f"   S-Tier (ZIP 11730/11784): {s_tier_count}")
    print(f"   Updated:  {len(updates)} records")

    return {
        "processed": len(records),
        "updated": len(updates),
        "s_tier_count": s_tier_count,
    }


def run_grading_engine(leads_table) -> dict:
    """
    Fetch all Event_Leads, compute grades, batch-update changed records.
    Returns summary stats.
    """
    print("\n🎯 S-Tier Filter Engine")
    print("─" * 50)

    records = leads_table.all()
    updates = []
    distribution = {"S": 0, "A": 0, "B": 0, "C": 0}
    promoted_list = []
    demoted_list  = []

    for rec in records:
        name    = get_field(rec, LeadFields.EVENT_NAME) or "(unnamed)"
        density = get_field(rec, LeadFields.FAMILY_DENSITY)
        alpha   = get_field(rec, LeadFields.ALPHA_SCORE)
        result  = grade_event(density, alpha)

        distribution[result.grade.value] += 1

        # Check if grade changed
        current_grade = get_field(rec, LeadFields.EVENT_GRADE)
        # Airtable single-select comes back as a string in pyairtable
        current_val = current_grade if isinstance(current_grade, str) else None

        if result.grade.value != current_val:
            updates.append({
                "id": rec["id"],
                "fields": {
                    LeadFields.EVENT_GRADE: result.grade.value,
                },
            })

        if result.promoted:
            promoted_list.append(f"  ⬆️  {name}: {result.base_grade.value}→{result.grade.value} "
                                 f"(density {result.family_density:.0f}%, alpha {result.alpha_score:.0f})")
        if result.demoted:
            demoted_list.append(f"  ⬇️  {name}: {result.base_grade.value}→{result.grade.value} "
                                f"(density {result.family_density:.0f}%, alpha {result.alpha_score:.0f})")

    # Batch update via pyairtable
    if updates:
        leads_table.batch_update(updates)

    # Report
    print(f"   Scanned:  {len(records)} leads")
    print(f"   Updated:  {len(updates)} records")
    print()
    for grade_key in ["S", "A", "B", "C"]:
        count = distribution[grade_key]
        bar = "█" * count + "░" * max(0, 10 - count)
        print(f"   {grade_key}: {count:>3}  {bar}")
    print()

    if promoted_list:
        print("   Alpha-Boosted:")
        for line in promoted_list:
            print(line)
    if demoted_list:
        print("   Alpha-Penalized:")
        for line in demoted_list:
            print(line)

    duds = [r for r in records
            if grade_event(get_field(r, LeadFields.FAMILY_DENSITY),
                           get_field(r, LeadFields.ALPHA_SCORE)).grade == Grade.C]
    if duds:
        names = ", ".join(get_field(r, LeadFields.EVENT_NAME) or "?" for r in duds)
        print(f"\n   🚫 C-Tier (consider skipping): {names}")

    return {
        "processed": len(records),
        "updated": len(updates),
        "distribution": distribution,
    }


def run_profit_engine(history_table) -> dict:
    """
    Fetch all Event_History, compute financials, batch-update changed records.
    Returns summary stats.
    """
    print("\n💰 Profit Oracle Engine")
    print("─" * 50)

    records = history_table.all()
    updates = []

    total_net      = 0.0
    total_sales    = 0.0
    total_expenses = 0.0
    profitable_count = 0
    report_lines   = []

    for rec in records:
        name   = get_field(rec, HistoryFields.EVENT_NAME) or "(unnamed)"
        result = calculate_profit(
            get_field(rec, HistoryFields.ACTUAL_SALES),
            get_field(rec, HistoryFields.BOOTH_FEE),
            get_field(rec, HistoryFields.MILES),
        )

        total_net      += result.net_take_home
        total_sales    += safe_num(get_field(rec, HistoryFields.ACTUAL_SALES))
        total_expenses += result.total_expenses
        if result.is_profitable:
            profitable_count += 1

        report_lines.append((name, result))

        # Check if values changed
        current_net  = safe_num(get_field(rec, HistoryFields.NET_TAKE_HOME))
        current_flag = bool(get_field(rec, HistoryFields.PROFITABLE))

        net_changed  = abs(current_net - result.net_take_home) > 0.005
        flag_changed = current_flag != result.is_profitable

        if net_changed or flag_changed:
            updates.append({
                "id": rec["id"],
                "fields": {
                    HistoryFields.NET_TAKE_HOME: result.net_take_home,
                    HistoryFields.PROFITABLE:    result.is_profitable,
                },
            })

    # Batch update
    if updates:
        history_table.batch_update(updates)

    # Report
    print(f"   Scanned:  {len(records)} events")
    print(f"   Updated:  {len(updates)} records")
    print()
    print(f"   Total Sales:       {fmt_dollar(total_sales)}")
    print(f"   Total Expenses:    {fmt_dollar(total_expenses)}")
    print(f"   Net Take-Home:     {fmt_dollar(total_net)}")
    print(f"   Profitable Events: {profitable_count} / {len(records)}")

    # Top 5 earners
    sorted_events = sorted(report_lines, key=lambda x: x[1].net_take_home, reverse=True)
    if sorted_events:
        print("\n   Top 5 Earners:")
        for i, (name, res) in enumerate(sorted_events[:5], 1):
            tag = "✅" if res.is_profitable else "🔻"
            print(f"   {i}. {tag} {name}: {fmt_dollar(res.net_take_home)}")

    # Flag losers
    losers = [(n, r) for n, r in report_lines if not r.is_profitable]
    if losers:
        names = ", ".join(f"{n} ({fmt_dollar(r.net_take_home)})" for n, r in losers)
        print(f"\n   ⚠️  Money Losers: {names}")

    return {
        "processed": len(records),
        "updated": len(updates),
        "total_net": round(total_net, 2),
        "profitable_count": profitable_count,
    }


# ═══════════════════════════════════════════════════════════════════════
# §9  MAIN
# ═══════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="VendorFlow OS — Alpha Score Engine & Profit Oracle"
    )
    parser.add_argument(
        "--mode",
        choices=["deadlines", "zip_priority", "grading", "profits", "all"],
        default="all",
        help="Which engine to run (default: all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print results without writing to Airtable (not yet implemented — reserved)",
    )
    args = parser.parse_args()

    print("╔═══════════════════════════════════════════════╗")
    print("║         🏪 VendorFlow OS — File 4            ║")
    print(f"║         Mode: {args.mode:<10s}                    ║")
    print(f"║         {datetime.now().strftime('%Y-%m-%d %H:%M:%S'):<30s}     ║")
    print("╚═══════════════════════════════════════════════╝")

    leads_table, history_table = connect()

    results = {}

    if args.mode in ("deadlines", "all"):
        results["deadlines"] = run_deadline_engine(leads_table)

    if args.mode in ("zip_priority", "all"):
        results["zip_priority"] = run_zip_priority_engine(leads_table)

    if args.mode in ("grading", "all"):
        results["grading"] = run_grading_engine(leads_table)

    if args.mode in ("profits", "all"):
        results["profits"] = run_profit_engine(history_table)

    print("\n" + "═" * 50)
    print("✅ VendorFlow OS processing complete.")

    return results


if __name__ == "__main__":
    main()
