/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  VENDORFLOW OS — FILE 3                                                 ║
 * ║  Airtable Automation Script: Deadline Engine                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Target:   Airtable Automations → "Run a script" action                 ║
 * ║  Table:    Event_Leads                                                  ║
 * ║  Trigger:  Scheduled daily (recommended 8 AM) OR "When record matches   ║
 * ║            conditions" on Application Deadline field                     ║
 * ║  Purpose:  3-tier deadline alerts + Needs Action flag                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 *  SETUP IN AIRTABLE AUTOMATIONS:
 *  ──────────────────────────────────────────────────────────────────────
 *  1. Create a new Automation.
 *  2. Trigger: "At a scheduled time" → Every day, 8:00 AM.
 *  3. Action:  "Run a script" → paste this entire file.
 *  4. Input Variables (configure in the left panel):
 *
 *       Name            Type      Value
 *       ─────────────   ──────    ─────────────────────────────
 *       recordId        text      (from trigger: Record ID)
 *
 *     For scheduled (batch) mode: leave recordId blank or omit it.
 *     For single-record mode:     map recordId to the trigger record.
 *
 *  FIELD NAMES — These are the contract between File 3 and File 4.
 *  Both files reference these exact strings. Change here = change there.
 *  ──────────────────────────────────────────────────────────────────────
 *
 *  Event_Leads table:
 *    "Event Name"            — Single line text
 *    "Application Deadline"  — Date
 *    "Status"                — Single select
 *    "Alert Level"           — Single select: "🔴 URGENT", "🟡 WARNING", "🟢 HEADS UP"
 *    "Needs Action"          — Checkbox
 *    "Family Density"        — Number (percent, e.g. 45 = 45%)
 *    "Alpha Score"           — Number (0–100)
 *    "Event Grade"           — Single select: "S", "A", "B", "C"
 *
 *  Event_History table:
 *    "Event Name"            — Single line text (or linked record)
 *    "Actual Sales"          — Currency
 *    "Booth Fee"             — Currency
 *    "Miles"                 — Number
 *    "Net Take-Home"         — Number
 *    "Profitable"            — Checkbox
 */


// ═══════════════════════════════════════════════════════════════════════
// §1  SHARED FIELD CONTRACT
//     These names MUST match File 4 (Python) exactly.
// ═══════════════════════════════════════════════════════════════════════

const FIELDS = {
    // ── Event_Leads ─────────────────────────────────────────────────
    eventName:           "Event Name",
    applicationDeadline: "Application Deadline",
    status:              "Status",
    alertLevel:          "Alert Level",
    needsAction:         "Needs Action",
    familyDensity:       "Family Density",
    alphaScore:          "Alpha Score",
    eventGrade:          "Event Grade",

    // ── Event_History ───────────────────────────────────────────────
    actualSales:  "Actual Sales",
    boothFee:     "Booth Fee",
    miles:        "Miles",
    netTakeHome:  "Net Take-Home",
    profitable:   "Profitable",
};

const TABLE_LEADS   = "Event_Leads";
const TABLE_HISTORY = "Event_History";

// Alert tier definitions
const TIERS = {
    URGENT:   { days: 30, label: "🔴 URGENT"   },
    WARNING:  { days: 60, label: "🟡 WARNING"  },
    HEADS_UP: { days: 90, label: "🟢 HEADS UP" },
};


// ═══════════════════════════════════════════════════════════════════════
// §2  SAFETY UTILITIES
// ═══════════════════════════════════════════════════════════════════════

/** Null-safe date parser. Returns null on any bad input. */
function safeDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Calendar days from today to target date.
 * Positive = future, Negative = past, 0 = today.
 */
function daysUntil(target) {
    const MS_PER_DAY = 86_400_000;
    const now = new Date();
    const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const future = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    return Math.round((future - today) / MS_PER_DAY);
}


// ═══════════════════════════════════════════════════════════════════════
// §3  DEADLINE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Classify a single deadline into an alert tier.
 *
 * @param   {*}  deadlineRaw — raw cell value from "Application Deadline"
 * @returns {{ label: string|null, flag: boolean, daysLeft: number|null, expired: boolean }}
 *
 * Rules:
 *   null/invalid date  → no alert, no flag
 *   days < 0           → expired, clear alert, unflag
 *   days <= 30         → 🔴 URGENT   + Needs Action
 *   days <= 60         → 🟡 WARNING  + Needs Action
 *   days <= 90         → 🟢 HEADS UP + Needs Action
 *   days >  90         → no alert, no flag (too early)
 */
function classifyDeadline(deadlineRaw) {
    const deadline = safeDate(deadlineRaw);

    if (!deadline) {
        return { label: null, flag: false, daysLeft: null, expired: false };
    }

    const remaining = daysUntil(deadline);

    if (remaining < 0) {
        return { label: null, flag: false, daysLeft: remaining, expired: true };
    }

    if (remaining <= TIERS.URGENT.days) {
        return { label: TIERS.URGENT.label, flag: true, daysLeft: remaining, expired: false };
    }
    if (remaining <= TIERS.WARNING.days) {
        return { label: TIERS.WARNING.label, flag: true, daysLeft: remaining, expired: false };
    }
    if (remaining <= TIERS.HEADS_UP.days) {
        return { label: TIERS.HEADS_UP.label, flag: true, daysLeft: remaining, expired: false };
    }

    // More than 90 days out — no alert yet
    return { label: null, flag: false, daysLeft: remaining, expired: false };
}


// ═══════════════════════════════════════════════════════════════════════
// §4  RECORD UPDATE BUILDER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compare current record state against computed alert and build
 * a minimal update payload. Returns null if nothing changed.
 *
 * @param   {Record} record   — Airtable record object
 * @param   {object} alert    — output of classifyDeadline()
 * @returns {object|null}     — { id, fields } or null
 */
function buildUpdate(record, alert) {
    const currentLabel = record.getCellValueAsString(FIELDS.alertLevel) || null;
    const currentFlag  = Boolean(record.getCellValue(FIELDS.needsAction));

    const newLabel = alert.label;
    const newFlag  = alert.flag;

    // Normalize for comparison: treat empty string as null
    const labelMatch = (newLabel || null) === (currentLabel || null);
    const flagMatch  = newFlag === currentFlag;

    if (labelMatch && flagMatch) return null; // No changes needed

    const fields = {};

    if (!labelMatch) {
        fields[FIELDS.alertLevel] = newLabel ? { name: newLabel } : null;
    }
    if (!flagMatch) {
        fields[FIELDS.needsAction] = newFlag;
    }

    return { id: record.id, fields };
}


// ═══════════════════════════════════════════════════════════════════════
// §5  SINGLE-RECORD MODE (for record-triggered automations)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process one record by ID. Used when the automation trigger
 * fires on a specific record (e.g., "When record matches conditions").
 */
async function processSingleRecord(recordId) {
    const table = base.getTable(TABLE_LEADS);
    const query = await table.selectRecordsAsync({
        fields: [FIELDS.eventName, FIELDS.applicationDeadline, FIELDS.alertLevel, FIELDS.needsAction],
    });

    const record = query.getRecord(recordId);
    if (!record) {
        console.log(`⚠️ Record ${recordId} not found.`);
        return { processed: 0, updated: 0 };
    }

    const name  = record.getCellValueAsString(FIELDS.eventName) || "(unnamed)";
    const alert = classifyDeadline(record.getCellValue(FIELDS.applicationDeadline));
    const update = buildUpdate(record, alert);

    if (update) {
        await table.updateRecordAsync(update.id, update.fields);
        console.log(`✅ ${name}: ${alert.label || "cleared"} (${alert.daysLeft}d)`);
        return { processed: 1, updated: 1 };
    }

    console.log(`— ${name}: no change needed`);
    return { processed: 1, updated: 0 };
}


// ═══════════════════════════════════════════════════════════════════════
// §6  BATCH MODE (for scheduled automations)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Scan every record in Event_Leads and update all deadline alerts.
 * Respects Airtable's 50-record batch limit.
 */
async function processAllRecords() {
    const table = base.getTable(TABLE_LEADS);
    const query = await table.selectRecordsAsync({
        fields: [FIELDS.eventName, FIELDS.applicationDeadline, FIELDS.alertLevel, FIELDS.needsAction],
    });

    const records = query.records;
    const updates = [];
    const summary = { urgent: 0, warning: 0, headsUp: 0, expired: 0, clear: 0 };

    for (const record of records) {
        const alert  = classifyDeadline(record.getCellValue(FIELDS.applicationDeadline));
        const update = buildUpdate(record, alert);

        if (update) updates.push(update);

        // Tally
        if (alert.expired)                         summary.expired++;
        else if (alert.label === TIERS.URGENT.label)   summary.urgent++;
        else if (alert.label === TIERS.WARNING.label)  summary.warning++;
        else if (alert.label === TIERS.HEADS_UP.label) summary.headsUp++;
        else                                            summary.clear++;
    }

    // Batch write — 50 records per call (Airtable limit)
    const BATCH_SIZE = 50;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        await table.updateRecordsAsync(updates.slice(i, i + BATCH_SIZE));
    }

    // Log report
    console.log(`\n🏪 VendorFlow Deadline Engine — ${new Date().toLocaleString()}`);
    console.log(`   Scanned:  ${records.length} leads`);
    console.log(`   Updated:  ${updates.length} records`);
    console.log(`   ──────────────────────────`);
    console.log(`   🔴 URGENT (≤30d):   ${summary.urgent}`);
    console.log(`   🟡 WARNING (≤60d):  ${summary.warning}`);
    console.log(`   🟢 HEADS UP (≤90d): ${summary.headsUp}`);
    console.log(`   ⏰ Expired:          ${summary.expired}`);
    console.log(`   ✅ No alert (>90d):  ${summary.clear}`);

    return { processed: records.length, updated: updates.length, summary };
}


// ═══════════════════════════════════════════════════════════════════════
// §7  MAIN — Route between single-record and batch mode
// ═══════════════════════════════════════════════════════════════════════

async function main() {
    // Check if a specific recordId was passed from the automation trigger
    let recordId = null;
    try {
        const cfg = input.config();
        if (cfg && cfg.recordId && cfg.recordId.trim() !== "") {
            recordId = cfg.recordId.trim();
        }
    } catch (_) {
        // No input.config() — running in Scripting Extension, use batch mode
    }

    if (recordId) {
        console.log(`⚡ Single-record mode: ${recordId}`);
        await processSingleRecord(recordId);
    } else {
        console.log(`📋 Batch mode: scanning all Event_Leads`);
        await processAllRecords();
    }
}

await main();
