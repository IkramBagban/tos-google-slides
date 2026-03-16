# TelemetryOS Developer Feedback

## Instructions

**When to fill this out:**
- **Stage 1 (Mockup):**Complete sections as you go.
- **Stage 2 (Final):** Finalize all sections when submitting your production version.

**How to use:**
1. Copy this template to your github repo. `applications/[app-name]/feedback.md`
2. Fill in the YAML fields below progressively during development
3. Finalize before Stage 2 submission (estimated: 5 minutes)

**Privacy:** Your feedback is used internally to improve TelemetryOS. Specific examples may be anonymized and shared with the product team.

---

```yaml
# Application Overview
app_name: "google-slides"
developer: "Ikram Bagban"
stage_1_date: "2026-03-10"
stage_1_hours: 2
stage_2_date: "2026-03-16"
stage_2_hours: 4
total_hours: 6
complexity: "moderate"

# Overall Ratings (1-5, where 1 = Poor, 5 = Excellent)
platform_rating: 4
sdk_rating: 4

# Blocking Issues — list any issues that prevented progress or required workarounds
blocking_issues:
  - category: docs
    description: "The PRD should clearly define scope, limitations, and potential issues. For embed-based apps, while the iframe can be made responsive, the embedded content itself cannot be responsively scaled. This and similar limitations should be explicitly documented, as clear guidance helps developers avoid wasted effort and saves time."

# SDK & API Design
sdk_worked_well:
  - "createUseInstanceStoreState for Settings ↔ Render sync"
  - "Responsive scaling hooks (useUiScaleToSetRem, useUiAspectRatio)"
sdk_frustrating: []
sdk_missing: []

# Documentation
docs_helpful:
  - "https://docs.telemetryos.com/docs/settings-components"
  - "https://docs.telemetryos.com/docs/store-hooks"
  - "https://docs.telemetryos.com/docs/ui-scale-hooks"
docs_missing:
  - "No skill documentation found for useUiResponsiveFactors()."
  - "No skill guidance for iframe lifecycle management or heartbeat handling."
  - "Clarify iframe lifecycle/heartbeat handling under SDK v1.16+."

# AI Tools & Workflow
ai_tools:
  - "copilot"
  - "codex"
ai_time_savings: "significant"
ai_helped_with: "Requirements mapping, edge-case handling, and TypeScript refactoring."
ai_hindered:

# Top 3 Improvements — what would most improve TelemetryOS development?
top_improvements:
  - "Clarify published-vs-shared link distinction in docs."
  - "Explicitly document embed content limitations, scope, and potential issues in PRDs."
  - add documentation for Iframe lifecycle management + heartbeat

# Additional Comments (optional)
comments: ""
```
