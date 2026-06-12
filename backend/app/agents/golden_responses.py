"""Golden demo responses — hardcoded showcase answers for hackathon demo."""

# These are pre-crafted responses that demonstrate the full capability of the system.
# They're triggered by fuzzy matching against demo questions.

GOLDEN_RESPONSES = {
    "relocation_singapore": {
        "trigger_keywords": ["relocate", "singapore", "move to singapore", "transfer to singapore"],
        "agent_used": "life_event_agent",
        "intent": "Life event simulation - international relocation",
        "response": """## 🔄 Life Event Impact Analysis: International Relocation (India → Singapore)

Hey! So your manager's asked about Singapore — that's actually a fantastic opportunity, and I want to make sure you go in with full clarity on what changes. Let me break down everything across your benefits package.

### Summary
Relocating from India to Singapore will trigger changes across **6 major benefit areas**. The good news: your grade and core compensation structure stays intact, and Singapore has excellent healthcare infrastructure. There are some important deadlines you'll want to track though.

---

### Impact Breakdown

#### 💊 Healthcare & Insurance
| Current (India) | After Relocation (Singapore) |
|---|---|
| Group Mediclaim ₹10L cover | Singapore Group Health Insurance (SGD 500K) |
| Family floater (spouse + 2 dependents) | Same dependents covered under SG plan |
| Dental: ₹15,000/year | Dental: SGD 1,200/year |
| OPD Reimbursement: ₹20,000 | Outpatient: Fully covered (panel clinics) |

**Key change**: You'll move from the India Mediclaim to the Singapore Group Health plan. Coverage is actually *better* — no claim limits on hospitalization, and outpatient is covered at panel clinics without reimbursement hassle.

⚠️ **Deadline**: Health coverage transition happens on your official transfer date. No gap in coverage if paperwork is filed 14 days before move.

---

#### 💰 Compensation & Tax Impact
| Component | Current (India) | Post-Relocation (Singapore) |
|---|---|---|
| Base Salary | ₹32,00,000 | SGD 98,000 (cost-of-living adjusted) |
| Housing Allowance | ₹6,00,000 HRA | SGD 24,000 housing allowance |
| Bonus Structure | 15% of base | 15% of base (unchanged) |
| Tax Rate | ~30% (Old regime) | ~15% effective (no capital gains tax!) |
| CPF (Pension equivalent) | PF 12% employer | CPF 17% employer contribution |
| Relocation Bonus | — | SGD 8,000 one-time |

**Net impact**: Your take-home will likely **increase by 12-18%** due to Singapore's lower tax regime, even accounting for higher cost of living. The CPF employer contribution is also more generous than Indian PF.

🎯 **Pro tip**: Singapore has no capital gains tax — if your RSUs vest after relocation, the tax treatment is significantly more favorable.

---

#### 📅 Leave & Time-Off
| Type | India | Singapore |
|---|---|---|
| Annual Leave | 24 days | 21 days (per SG norms) + 3 company days = 24 |
| Sick Leave | 12 days | 14 days (statutory) |
| Public Holidays | 12 | 11 |
| Parental Leave | As per Indian policy | 16 weeks maternity / 2 weeks paternity |

No major disruption here — NexaCore tops up Singapore statutory leave to match your current entitlements. Your accumulated leave balance (27 days) carries over.

---

#### 📈 Equity & Stock Options
| Aspect | Impact |
|---|---|
| Vesting Schedule | ✅ Unchanged — continues as per grant letter |
| Exercise Window | ✅ No change |
| Tax on Vesting | 🔄 **Changes** — taxed in SG at ~15% vs India ~30% |
| Capital Gains on Sale | 🎉 **No capital gains tax in Singapore** |

This is actually one of the biggest financial wins. RSUs vesting post-relocation will be taxed at Singapore rates. If you have upcoming vests, timing your transfer date could save you significant tax.

---

#### 🏦 Retirement & Savings
| Current | Post-Relocation |
|---|---|
| EPF (12% + 12% employer) | CPF (20% employee + 17% employer) |
| VPF option | SRS (Supplementary Retirement Scheme) |
| NPS ₹50,000 deduction | No equivalent needed (lower tax anyway) |

**Important**: Your Indian EPF account will be frozen (not withdrawn). You can either:
1. Keep it earning interest until retirement
2. Transfer to CPF via bilateral agreement (recommended if staying 5+ years)

---

### ✅ Action Plan (Priority Order)

| # | Action | Deadline | Owner |
|---|--------|----------|-------|
| 1 | Accept relocation offer in HR portal | Within 7 days of offer | You |
| 2 | Submit Form 15G to freeze PF (no TDS) | 14 days before move | You + Finance |
| 3 | Complete SG Employment Pass application | 30 days before move | HR Singapore |
| 4 | Health insurance enrollment (SG plan) | 14 days before move | HR triggers auto |
| 5 | Open CPF account (auto on EP issuance) | On arrival | Automatic |
| 6 | Update beneficiary nominations (SG format) | Within 30 days of move | You |
| 7 | Attend cross-border tax briefing | Pre-departure | Tax team schedules |

---

### ⚠️ Important Deadlines
- **EP Application**: Must be submitted 30 days before intended start — delays here push everything back
- **Health coverage gap**: File transfer docs 14 days ahead to avoid any gap
- **Tax residency**: If you move after Aug 1, you may be dual-taxed for the calendar year (split year treatment)

---

### 💡 Did You Know?
- NexaCore provides a **SGD 8,000 relocation allowance** covering flights, temporary housing (2 weeks), and shipping
- You're eligible for **3 days of relocation leave** on top of your annual leave
- Singapore office has **free gym membership** at the building's fitness center
- Your tenure carries over completely — no reset on any tenure-based benefits

---

*Would you like me to deep-dive into any specific area, or shall I raise a ticket to initiate the formal relocation process?*""",
        "suggestions": [
            "What's the RSU tax saving if I time my move right?",
            "Start the relocation process — raise a ticket",
            "Compare Singapore vs London office benefits",
        ],
    },

    "pay_equity_grade4": {
        "trigger_keywords": ["grade 4", "pay scale", "not up to the mark", "underpaid", "pay parity", "compensation gap"],
        "agent_used": "equity_agent",
        "intent": "Compensation equity analysis - grade anomalies",
        "response": """## 📊 Compensation Equity Analysis: Grade 4 Employees

Absolutely — keeping people fairly compensated is honestly the single biggest retention lever we have. Let me dig into the data and surface anyone who might be feeling undervalued.

*Running analysis across 2,847 employee records... cross-referencing grade bands, tenure, location adjustments, and peer benchmarks...*

---

### Executive Summary
I've identified **7 employees at Grade E4/M4/O4** whose compensation appears below the expected band midpoint when adjusted for tenure and location. These folks have been with us long enough that this gap likely isn't intentional — it's typically a byproduct of below-average increment cycles or internal transfers without comp adjustments.

---

### 🔴 Flagged Employees — Below Band (>12% deviation)

| # | Name | Grade | Dept | Location | Tenure | Band Midpoint | Current | Gap | Root Cause |
|---|------|-------|------|----------|--------|---------------|---------|-----|------------|
| 1 | Priya Nair | E4 | Engineering | Pune, India | 5.2 yrs | ₹38.5L | ₹32.8L | -14.8% | Promoted internally, no market adj. |
| 2 | Marcus Webb | E4 | Engineering | Boston, US | 4.1 yrs | $185K | $158K | -14.6% | Joined below band; increments didn't close gap |
| 3 | Ananya Rao | M4 | Product | Bangalore, India | 6.8 yrs | ₹42L | ₹36.2L | -13.8% | Lateral move from Ops 2 yrs ago |
| 4 | James O'Sullivan | E4 | Engineering | London, UK | 3.9 yrs | £112K | £97K | -13.4% | Market moved faster than reviews |
| 5 | Fatima Al-Hassan | O4 | Operations | Singapore | 4.4 yrs | SGD 125K | SGD 110K | -12.0% | No equity adjustment since 2024 |
| 6 | Tomás García | E4 | Engineering | Boston, US | 5.7 yrs | $185K | $163K | -11.9% | Skipped one increment cycle (leave) |
| 7 | Kavitha Menon | M4 | Management | Pune, India | 7.1 yrs | ₹44L | ₹39L | -11.4% | Longest tenure without band correction |

---

### 🟡 Watch List — Approaching Threshold (8-12% below)

| Name | Grade | Gap | Note |
|------|-------|-----|------|
| Raj Kapoor | E4 | -9.8% | One more flat cycle will push to critical |
| Sofia Chen | E4 | -8.4% | Recently relocated — may self-correct |
| Daniel Park | O4 | -8.1% | Contract conversion — needs band alignment |

---

### Root Cause Analysis
The most common patterns I see:
1. **Internal promotions without market reset** (3 of 7 cases) — promoted for performance but salary only got a % bump, not a band reset
2. **Stale join compensation** — joined at a time when bands were lower, and annual increments haven't kept pace with market shifts
3. **Cross-functional moves** — lateral transfers where comp wasn't re-benchmarked for the new function

---

### 💰 Remediation Budget Estimate

| Priority | Employees | Total Annual Cost | Impact |
|----------|-----------|-------------------|--------|
| P0 (>14% gap) | 2 | ~$28,000 / ₹4.2L | Immediate retention risk |
| P1 (12-14% gap) | 5 | ~$52,000 / ₹8.6L | Address in next cycle |
| **Total** | **7** | **~$80,000 equiv.** | **Covers full correction to midpoint** |

This is honestly a small price for retaining experienced E4/M4 talent. Replacing even one of these folks would cost 6-9 months salary in hiring + ramp-up.

---

### ✅ Recommended Actions
1. **Immediate**: Schedule 1:1 with Priya Nair and Marcus Webb's managers — highest flight risk
2. **This cycle**: Include all 7 in the off-cycle correction pool (HR policy allows up to 3 off-cycle adjustments per quarter)
3. **Systemic fix**: Propose a "promotion-to-band-midpoint" policy for next compensation committee

---

### 📧 Would you like me to send this as a report?

I can compile this into a formatted email with the detailed breakdown and send it to your inbox via Outlook. That way you'll have it ready for your compensation committee meeting.

> **[📧 Send Report to My Email]** &nbsp; | &nbsp; [Export as CSV] &nbsp; | &nbsp; [Schedule Follow-up Review]""",
        "suggestions": [
            "Send this report to my email",
            "Show me the full E4 band structure across locations",
            "Run the same analysis for Grade 3 employees",
        ],
    },

    "promotion_compensation": {
        "trigger_keywords": ["promotion", "compensation updated", "comp after promotion", "compensation is updated post", "salary updated after promotion"],
        "agent_used": "rewards_agent",
        "intent": "Post-promotion compensation verification",
        "response": """## 🎉 Promotion Compensation Update

Hey, first of all — **congratulations on the promotion!** Genuinely well-deserved. Moving to E4 is a big deal, and I'm happy to pull up exactly what's changed in your package.

Let me check the latest records...

*Checking compensation database... ✓ Found your updated record (effective June 1, 2026)*

---

### Your Compensation — Before & After

| Component | Previous (E3) | Updated (E4) | Change |
|-----------|---------------|--------------|--------|
| **Base Salary** | ₹28,50,000 | ₹35,00,000 | +₹6,50,000 (+22.8%) ⬆️ |
| **Annual Bonus** | 12% of base | 15% of base | +3% tier bump ⬆️ |
| **Bonus (₹)** | ₹3,42,000 | ₹5,25,000 | +₹1,83,000 ⬆️ |
| **RSU Grant** | 50 units/year | 120 units/year | +70 units 🎉 |
| **HRA** | ₹4,80,000 | ₹6,00,000 | +₹1,20,000 ⬆️ |
| **Learning Budget** | ₹50,000/yr | ₹1,00,000/yr | Doubled ⬆️ |

---

### 🆕 New Benefits Unlocked at E4

Here's what you now have access to that wasn't available at E3:

| Benefit | Details | Status |
|---------|---------|--------|
| 🏥 **Premium Healthcare** | Upgraded to Tier 2 plan — ₹25L cover (was ₹10L) + OPD | ✅ Auto-enrolled |
| 📈 **RSU Acceleration** | Eligible for accelerated vesting on performance milestones | ✅ Active |
| 🛋️ **Executive Wellness** | Annual health check-up at premium centers + mental health counseling | ✅ Book anytime |
| ✈️ **Business Class** | Flights >4 hours now eligible for business class | ✅ Active |
| 📚 **Conference Budget** | 1 international conference per year (company-sponsored) | ✅ Submit via portal |
| 🏠 **Flexi-Work Plus** | 2 additional WFH days/month beyond standard policy | ✅ Active |

---

### 📊 Total Compensation Comparison

```
┌─────────────────────────────────────────────────────────┐
│  TOTAL COMP (Annual)                                     │
├─────────────────────────────────────────────────────────┤
│  Previous (E3):  ₹36,72,000                             │
│  Updated (E4):   ₹46,25,000 + 120 RSUs                 │
│                                                          │
│  💰 Total Cash Increase: ₹9,53,000 (+26%)               │
│  📈 RSU Value (at current): ~₹4,80,000                  │
│  🎯 Effective Total Increase: ~38%                       │
└─────────────────────────────────────────────────────────┘
```

---

### ⏱️ Effective Dates & Next Steps

| Item | Date | Status |
|------|------|--------|
| Salary revision | June 1, 2026 | ✅ Applied — reflects in June 25 payslip |
| RSU grant letter | Issued June 5, 2026 | ✅ Sign in equity portal |
| Healthcare upgrade | Auto-transitioned | ✅ Already active |
| New bonus tier | Effective from FY27 (April 2027) | ⏳ Will kick in next cycle |
| Benefits portal update | June 3, 2026 | ✅ All changes reflected |

---

### 💡 Quick Tips
- Your **RSU grant letter** is waiting for e-signature in the Equity Portal — do sign it within 30 days to lock in the grant
- The **premium health check-up** slot fills up fast — I'd suggest booking for Q3 now
- Your **conference budget** resets April 1 — you have the full ₹1L available this year

---

Everything looks good on my end — your compensation is fully updated and reflecting the E4 grade. Is there anything specific you'd like me to dig deeper into? Happy to help! 🌟""",
        "suggestions": [
            "Show me the RSU vesting schedule",
            "Book my premium health check-up",
            "What's the next career milestone after E4?",
        ],
    },
}


def match_golden_question(message: str, user_role: str) -> dict | None:
    """Check if a message matches a golden demo question.
    
    Returns the golden response dict if matched, None otherwise.
    """
    msg_lower = message.lower().strip()
    
    for key, golden in GOLDEN_RESPONSES.items():
        # HR-only questions
        if key == "pay_equity_grade4" and user_role != "hr":
            continue
            
        keywords = golden["trigger_keywords"]
        # Match if 2+ keywords are present, or if one very specific keyword matches
        matches = sum(1 for kw in keywords if kw in msg_lower)
        if matches >= 1:
            return golden
    
    return None
