/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                      VENDORFLOW OS v2.0                            ║
 * ║         Master Airtable Scripting Extension for Toy Vendors        ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Author:  VendorFlow Systems                                       ║
 * ║  Target:  Airtable Scripting Extension / Automations                ║
 * ║  Purpose: Deadline alerts, financial engine, dud-risk scoring       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 *  TABLE SCHEMA EXPECTED:
 *  ─────────────────────────────────────────────────────────────────────
 *  Table: "Events"
 *  Fields:
 *    - Event Name           (Single line text)
 *    - Application Deadline  (Date)
 *    - Booth Fee             (Currency)
 *    - Actual Sales          (Currency)
 *    - Miles                 (Number — round-trip mileage)
 *    - Alpha Score           (Number — Income/Family Density ratio)
 *    - Vibe Check            (Number — 1–10 personal rating from prior years)
 *    - Net Take-Home         (Number — computed by this script)
 *    - Deadline Alert Tier   (Single select: "🔴 30-Day", "🟡 60-Day", "🟢 90-Day")
 *    - Event Tier            (Single select: "S-Tier", "A-Tier", "B-Tier", "Dud")
 *    - Last Scored           (Date — timestamp of last algorithm run)
 *
 *  SETUP:
 *    1. Paste this entire script into an Airtable Scripting Extension.
 *    2. Adjust CONFIG below to match your base/table/field names.
 *    3. For automations: create 3 scheduled automations (daily) that
 *       each call the "Run a script" action with this code.
 *       Pass `inputConfig` with { mode: "alerts" | "finance" | "scoring" | "full" }.
 */


// ═══════════════════════════════════════════════════════════════════════
// §1  CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const CONFIG = {
    tableName: "Events",

    fields: {
        eventName:         "Event Name",
        applicationDeadline: "Application Deadline",
        boothFee:          "Booth Fee",
        actualSales:       "Actual Sales",
        miles:             "Miles",
        alphaScore:        "Alpha Score",
        vibeCheck:         "Vibe Check",
        netTakeHome:       "Net Take-Home",
        deadlineAlertTier: "Deadline Alert Tier",
        eventTier:         "Event Tier",
        lastScored:        "Last Scored",
    },

    // IRS standard mileage rate (2024–2025). Update annually.
    mileageRate: 0.67,

    // Dud-Risk Algorithm Weights — tweak to taste
    scoring: {
        alphaWeight: 0.60,   // How much the market data matters
        vibeWeight:  0.40,   // How much your gut matters
        // Tier thresholds (composite score 0–100)
        sThreshold:  80,     // >= 80 → S-Tier
        aThreshold:  60,     // >= 60 → A-Tier
        bThreshold:  40,     // >= 40 → B-Tier
        // Below 40           → Dud
    },

    // Alert windows (days before deadline)
    alerts: {
        tier1: 90,   // 🟢 Early heads-up
        tier2: 60,   // 🟡 Get moving
        tier3: 30,   // 🔴 Urgent
    },
};


// ═══════════════════════════════════════════════════════════════════════
// §2  UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Safely extract a numeric value from a record field.
 * Returns 0 for null, undefined, empty string, or NaN.
 */
function safeNum(value) {
    if (value === null || value === undefined || value === "") return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Safely extract a date value. Returns null if unparseable.
 */
function safeDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate the number of calendar days between now and a target date.
 * Positive = target is in the future. Negative = past.
 */
function daysUntil(targetDate) {
    const now = new Date();
    // Zero out time components for clean day math
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetMidnight = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
    );
    const msPerDay = 86_400_000;
    return Math.round((targetMidnight - todayMidnight) / msPerDay);
}

/**
 * Clamp a value between min and max.
 */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * Format currency for console output.
 */
function fmt$(amount) {
    return `$${amount.toFixed(2)}`;
}


// ═══════════════════════════════════════════════════════════════════════
// §3  CORE ENGINE — DEADLINE ALERTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Determines the correct alert tier for a given application deadline.
 *
 * Logic:
 *   - If deadline is <= 30 days away  → 🔴 30-Day  (URGENT)
 *   - If deadline is <= 60 days away  → 🟡 60-Day  (WARNING)
 *   - If deadline is <= 90 days away  → 🟢 90-Day  (HEADS UP)
 *   - If deadline is > 90 days away   → null (no alert)
 *   - If deadline has passed           → null (expired)
 *
 * @param {Date|string|null} deadlineValue - Raw field value
 * @returns {{ tier: string|null, daysRemaining: number|null }}
 */
function computeAlertTier(deadlineValue) {
    const deadline = safeDate(deadlineValue);
    if (!deadline) return { tier: null, daysRemaining: null };

    const remaining = daysUntil(deadline);

    // Deadline has passed — no active alert
    if (remaining < 0) return { tier: null, daysRemaining: remaining };

    if (remaining <= CONFIG.alerts.tier3) {
        return { tier: "🔴 30-Day", daysRemaining: remaining };
    }
    if (remaining <= CONFIG.alerts.tier2) {
        return { tier: "🟡 60-Day", daysRemaining: remaining };
    }
    if (remaining <= CONFIG.alerts.tier1) {
        return { tier: "🟢 90-Day", daysRemaining: remaining };
    }

    return { tier: null, daysRemaining: remaining };
}


// ═══════════════════════════════════════════════════════════════════════
// §4  CORE ENGINE — FINANCIAL CALCULATOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculates Net Take-Home for an event.
 *
 * Formula:  Net = Actual Sales - Booth Fee - (Miles × Mileage Rate)
 *
 * All inputs are null-safe: missing values default to 0.
 *
 * @param {number|null} actualSales
 * @param {number|null} boothFee
 * @param {number|null} miles
 * @returns {{ netTakeHome: number, mileageDeduction: number, totalExpenses: number }}
 */
function computeFinancials(actualSales, boothFee, miles) {
    const sales     = safeNum(actualSales);
    const fee       = safeNum(boothFee);
    const mileage   = safeNum(miles);

    const mileageDeduction = mileage * CONFIG.mileageRate;
    const totalExpenses    = fee + mileageDeduction;
    const netTakeHome      = sales - totalExpenses;

    return {
        netTakeHome: Math.round(netTakeHome * 100) / 100,
        mileageDeduction: Math.round(mileageDeduction * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
    };
}


// ═══════════════════════════════════════════════════════════════════════
// §5  CORE ENGINE — DUD-RISK ALGORITHM
// ═══════════════════════════════════════════════════════════════════════

/**
 * The Dud-Risk scoring algorithm.
 *
 * Inputs:
 *   - Alpha Score (0–100 scale): Market quality metric = Income / Family Density.
 *     Higher means wealthier area with concentrated families (ideal for toys).
 *   - Vibe Check (1–10 scale): Your personal gut feeling from past experience.
 *
 * Process:
 *   1. Normalize Alpha Score to 0–100 (clamped, assumes raw is already 0–100).
 *   2. Normalize Vibe Check from 1–10 → 0–100.
 *   3. Compute weighted composite: (Alpha × alphaWeight) + (Vibe × vibeWeight).
 *   4. Classify into tier based on composite thresholds.
 *
 * @param {number|null} alphaScoreRaw  - The Alpha Score (expected 0–100)
 * @param {number|null} vibeCheckRaw   - Vibe Check rating (expected 1–10)
 * @returns {{ compositeScore: number, tier: string, breakdown: object }}
 */
function computeDudRisk(alphaScoreRaw, vibeCheckRaw) {
    const alpha = clamp(safeNum(alphaScoreRaw), 0, 100);
    const vibe  = clamp(safeNum(vibeCheckRaw), 0, 10);

    // Normalize vibe from 1–10 scale → 0–100
    const vibeNormalized = (vibe / 10) * 100;

    // Weighted composite
    const composite = (alpha * CONFIG.scoring.alphaWeight)
                    + (vibeNormalized * CONFIG.scoring.vibeWeight);

    // Round to 1 decimal place
    const score = Math.round(composite * 10) / 10;

    // Classify
    let tier;
    if (score >= CONFIG.scoring.sThreshold) {
        tier = "S-Tier";
    } else if (score >= CONFIG.scoring.aThreshold) {
        tier = "A-Tier";
    } else if (score >= CONFIG.scoring.bThreshold) {
        tier = "B-Tier";
    } else {
        tier = "Dud";
    }

    return {
        compositeScore: score,
        tier,
        breakdown: {
            alphaRaw: alpha,
            alphaWeighted: Math.round(alpha * CONFIG.scoring.alphaWeight * 10) / 10,
            vibeRaw: vibe,
            vibeNormalized: Math.round(vibeNormalized * 10) / 10,
            vibeWeighted: Math.round(vibeNormalized * CONFIG.scoring.vibeWeight * 10) / 10,
        },
    };
}


// ═══════════════════════════════════════════════════════════════════════
// §6  RECORD PROCESSOR — ORCHESTRATES ALL ENGINES PER RECORD
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process a single event record through all engines.
 *
 * @param {Record} record - Airtable record object
 * @param {string} mode - "alerts" | "finance" | "scoring" | "full"
 * @returns {object|null} - Update payload, or null if no changes needed
 */
function processRecord(record, mode) {
    const f = CONFIG.fields;
    const updates = {};
    const diagnostics = { name: record.getCellValueAsString(f.eventName) || "(unnamed)" };

    // ── Alert Logic ─────────────────────────────────────────────────
    if (mode === "alerts" || mode === "full") {
        const deadlineRaw = record.getCellValue(f.applicationDeadline);
        const alert = computeAlertTier(deadlineRaw);

        diagnostics.alert = alert;

        // Only write if there's an alert to set (or clear a stale one)
        const currentTier = record.getCellValueAsString(f.deadlineAlertTier);
        const newTierName = alert.tier || null;

        if (newTierName && newTierName !== currentTier) {
            updates[f.deadlineAlertTier] = { name: newTierName };
        } else if (!newTierName && currentTier) {
            // Clear expired alerts
            updates[f.deadlineAlertTier] = null;
        }
    }

    // ── Financial Engine ────────────────────────────────────────────
    if (mode === "finance" || mode === "full") {
        const sales   = record.getCellValue(f.actualSales);
        const fee     = record.getCellValue(f.boothFee);
        const miles   = record.getCellValue(f.miles);
        const finance = computeFinancials(sales, fee, miles);

        diagnostics.finance = finance;
        updates[f.netTakeHome] = finance.netTakeHome;
    }

    // ── Dud-Risk Scoring ────────────────────────────────────────────
    if (mode === "scoring" || mode === "full") {
        const alphaRaw = record.getCellValue(f.alphaScore);
        const vibeRaw  = record.getCellValue(f.vibeCheck);
        const risk     = computeDudRisk(alphaRaw, vibeRaw);

        diagnostics.scoring = risk;

        const currentEventTier = record.getCellValueAsString(f.eventTier);
        if (risk.tier !== currentEventTier) {
            updates[f.eventTier] = { name: risk.tier };
        }

        updates[f.lastScored] = new Date().toISOString().split("T")[0];
    }

    // ── Return payload ──────────────────────────────────────────────
    const hasUpdates = Object.keys(updates).length > 0;
    return {
        recordId: record.id,
        updates: hasUpdates ? updates : null,
        diagnostics,
    };
}


// ═══════════════════════════════════════════════════════════════════════
// §7  MAIN EXECUTION — BATCH PROCESSOR WITH REPORTING
// ═══════════════════════════════════════════════════════════════════════

async function main() {
    // ── Determine execution mode ────────────────────────────────────
    // When run from Automation: use input.config()
    // When run manually from Scripting Extension: default to "full"
    let mode = "full";
    try {
        const inputConfig = input.config();
        if (inputConfig && inputConfig.mode) {
            mode = inputConfig.mode;
        }
    } catch (_) {
        // Running in Scripting Extension (no input.config), default is fine
    }

    const validModes = ["alerts", "finance", "scoring", "full"];
    if (!validModes.includes(mode)) {
        output.markdown(`❌ **Invalid mode:** \`${mode}\`. Use one of: ${validModes.join(", ")}`);
        return;
    }

    output.markdown(`## 🏪 VendorFlow OS — Running in \`${mode}\` mode`);
    output.markdown("---");

    // ── Load table ──────────────────────────────────────────────────
    const table = base.getTable(CONFIG.tableName);
    const queryResult = await table.selectRecordsAsync({
        fields: Object.values(CONFIG.fields),
    });

    const records = queryResult.records;
    output.markdown(`📋 **Found ${records.length} event(s) to process.**\n`);

    if (records.length === 0) {
        output.markdown("✅ Nothing to process. Table is empty.");
        return;
    }

    // ── Process all records ─────────────────────────────────────────
    const results = records.map(record => processRecord(record, mode));

    // ── Batch update (Airtable limit: 50 records per batch) ─────────
    const updatable = results.filter(r => r.updates !== null);
    const BATCH_SIZE = 50;

    let updatedCount = 0;
    for (let i = 0; i < updatable.length; i += BATCH_SIZE) {
        const batch = updatable.slice(i, i + BATCH_SIZE).map(r => ({
            id: r.recordId,
            fields: r.updates,
        }));
        await table.updateRecordsAsync(batch);
        updatedCount += batch.length;
    }

    // ── Generate Report ─────────────────────────────────────────────
    output.markdown(`\n✅ **Updated ${updatedCount} / ${records.length} records.**\n`);
    output.markdown("---");

    // ── Alert Summary ───────────────────────────────────────────────
    if (mode === "alerts" || mode === "full") {
        const urgent  = results.filter(r => r.diagnostics.alert?.tier === "🔴 30-Day");
        const warning = results.filter(r => r.diagnostics.alert?.tier === "🟡 60-Day");
        const headsUp = results.filter(r => r.diagnostics.alert?.tier === "🟢 90-Day");

        output.markdown("### 🔔 Deadline Alerts");
        output.markdown(`| Tier | Count | Events |`);
        output.markdown(`|------|-------|--------|`);
        output.markdown(`| 🔴 30-Day (URGENT) | ${urgent.length} | ${urgent.map(r => `**${r.diagnostics.name}** (${r.diagnostics.alert.daysRemaining}d)`).join(", ") || "—"} |`);
        output.markdown(`| 🟡 60-Day | ${warning.length} | ${warning.map(r => `${r.diagnostics.name} (${r.diagnostics.alert.daysRemaining}d)`).join(", ") || "—"} |`);
        output.markdown(`| 🟢 90-Day | ${headsUp.length} | ${headsUp.map(r => `${r.diagnostics.name} (${r.diagnostics.alert.daysRemaining}d)`).join(", ") || "—"} |`);
        output.markdown("");
    }

    // ── Financial Summary ───────────────────────────────────────────
    if (mode === "finance" || mode === "full") {
        const withFinance = results.filter(r => r.diagnostics.finance);
        const totalNet = withFinance.reduce((sum, r) => sum + r.diagnostics.finance.netTakeHome, 0);
        const totalExpenses = withFinance.reduce((sum, r) => sum + r.diagnostics.finance.totalExpenses, 0);

        output.markdown("### 💰 Financial Summary");
        output.markdown(`| Metric | Value |`);
        output.markdown(`|--------|-------|`);
        output.markdown(`| Total Net Take-Home | **${fmt$(totalNet)}** |`);
        output.markdown(`| Total Expenses | ${fmt$(totalExpenses)} |`);
        output.markdown(`| Avg Net per Event | ${fmt$(withFinance.length ? totalNet / withFinance.length : 0)} |`);
        output.markdown(`| Profitable Events | ${withFinance.filter(r => r.diagnostics.finance.netTakeHome > 0).length} / ${withFinance.length} |`);

        // Top 5 earners
        const sorted = [...withFinance].sort((a, b) =>
            b.diagnostics.finance.netTakeHome - a.diagnostics.finance.netTakeHome
        );
        output.markdown("\n**Top Earners:**");
        sorted.slice(0, 5).forEach((r, i) => {
            const f = r.diagnostics.finance;
            output.markdown(`${i + 1}. ${r.diagnostics.name} → ${fmt$(f.netTakeHome)}`);
        });
        output.markdown("");
    }

    // ── Dud-Risk Tier Summary ───────────────────────────────────────
    if (mode === "scoring" || mode === "full") {
        const withScoring = results.filter(r => r.diagnostics.scoring);
        const tiers = { "S-Tier": [], "A-Tier": [], "B-Tier": [], "Dud": [] };

        withScoring.forEach(r => {
            const t = r.diagnostics.scoring.tier;
            if (tiers[t]) tiers[t].push(r);
        });

        output.markdown("### 🎯 Dud-Risk Tier Breakdown");
        output.markdown(`| Tier | Count | Events |`);
        output.markdown(`|------|-------|--------|`);
        for (const [tier, items] of Object.entries(tiers)) {
            const names = items.map(r => {
                const s = r.diagnostics.scoring;
                return `${r.diagnostics.name} (${s.compositeScore})`;
            }).join(", ") || "—";
            output.markdown(`| ${tier} | ${items.length} | ${names} |`);
        }

        // Flag duds prominently
        if (tiers["Dud"].length > 0) {
            output.markdown(`\n⚠️ **Dud Alert:** ${tiers["Dud"].map(r => `*${r.diagnostics.name}*`).join(", ")} scored below ${CONFIG.scoring.bThreshold}. Consider skipping these events.`);
        }
        output.markdown("");
    }

    output.markdown("---");
    output.markdown("*VendorFlow OS processing complete.*");
}


// ═══════════════════════════════════════════════════════════════════════
// §8  EXECUTE
// ═══════════════════════════════════════════════════════════════════════

await main();
