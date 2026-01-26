---
name: ai-data-report
description: "Generates data-driven reports about the project. Use for initial project reports or session summaries."
---

# Skill: AI Data Report

## Description
Generates data-driven reports about the project. Use `/ai-data-report` to invoke.

## Where reports are saved
- **Location:** `.claude/reports/`
- **Naming:** `YYYY-MM-DD-[type].md` (e.g., `2026-01-22-session.md`, `2026-01-22-initial.md`)
- **Git:** Reports are committed to the repo for history tracking

## Modes

### 1. Initial Report (first time on project)
Generates a complete report with:

```
## 📊 Project Report

**Production URL:** [production URL]
**GitHub URL:** [repo URL]
**Development time:** [estimated hours and context]

### Services used:
| Service | Purpose |
|---------|---------|
| [Service 1] | [What it does] |
| [Service 2] | [What it does] |
...

### Flow when someone uses the app:
1. [Step 1]
2. [Step 2]
...

### Tech stack:
- Backend: [technology]
- Frontend: [technology]
- Database: [technology]
- Hosting: [technology]

### Deployment:
- [How it deploys]
- [Where env variables are stored]
```

### 2. Session Report (when finishing work)
Generates a session summary:

```
## 📝 Session Summary

**Date:** [date]
**Approximate duration:** [time]

### Changes made:
| Area | Change | Files |
|------|--------|-------|
| [area] | [description] | [files] |

### Commits:
- `[hash]` [message]

### Bugs found/fixed:
- [bug 1]

### Suggested next steps:
- [ ] [task 1]
- [ ] [task 2]

### Metrics:
| Metric | Value |
|--------|-------|
| Lines changed | +X / -Y |
| Files modified | N |
| Commits | N |
| **Time - Claude** | ~Xh Xmin (coding, debugging, testing) |
| **Time - Human** | ~Xmin (reviewing, testing, giving feedback) |
```

## Instructions for Claude

When user invokes `/project-report`:

1. **Detect mode:**
   - If first interaction or they ask for "initial report" → Mode 1
   - If they ask for "session summary" or "what did we do" → Mode 2

2. **Gather data:**
   - Read `package.json`, `requirements.txt`, `.env.example` to detect services
   - Check `git log` for recent commits
   - Check `git remote -v` for URLs
   - Look for production URLs in README or configs

3. **Be data-driven:**
   - Use real data from code, don't make things up
   - If data is missing, indicate "[pending configuration]"
   - Include specific numbers when possible

4. **Format:**
   - Use tables for structured information
   - Use emojis for main sections
   - Be concise but complete
