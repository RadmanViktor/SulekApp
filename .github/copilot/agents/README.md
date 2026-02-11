# SulekApp Agent Team

Welcome to the SulekApp orchestrated agent team! This directory contains 5 specialized agents that work together to build features, fix bugs, and maintain quality.

## The Team

### 1. 👑 Orchestrator (MAIN AGENT)
**Role:** Task coordinator and workflow manager

The Orchestrator receives your requests and coordinates the entire team. It delegates work in a specific order and handles iteration loops when bugs are found.

**When to use:** Start every task by talking to the Orchestrator!

**Location:** `.github/copilot/agents/orchestrator/agent.md`

---

### 2. 🔧 Screen Expert
**Role:** React Native implementation specialist

Builds screen components, implements state management, handles hooks and navigation. Receives tasks from Orchestrator.

**Specialties:**
- Screen components
- React hooks (useState, useEffect, etc.)
- Navigation flows
- Form handling
- TypeScript typing

**Location:** `.github/copilot/agents/screen-expert/agent.md`

---

### 3. 🌐 API Expert
**Role:** Backend integration specialist

Handles all API calls, types, error handling, and data transformations. Works with Screen Expert's code to add backend integration.

**Specialties:**
- REST API calls
- TypeScript types (WorkoutDto, SetDto)
- Error handling
- Data parsing
- Network optimization

**Location:** `.github/copilot/agents/api-expert/agent.md`

---

### 4. 🎨 UI Expert
**Role:** Visual polish specialist

Reviews ENTIRE screens/features (not just new parts) and polishes styling, spacing, colors, animations, and Swedish text. Always runs after implementation.

**Specialties:**
- Complete UI review
- Design system enforcement
- Styling consistency
- Typography and spacing
- Animations
- Swedish text polish

**Location:** `.github/copilot/agents/ui-expert/agent.md`

---

### 5. 🧪 QA Tester
**Role:** Quality assurance specialist

Tests features thoroughly, finds bugs, and reports back to Orchestrator. Has the power to reject features that don't meet quality standards.

**Specialties:**
- Manual testing
- Edge case finding
- Bug reporting
- User flow testing
- Log analysis

**Location:** `.github/copilot/agents/qa-tester/agent.md`

---

## How It Works

### The Delegation Chain

```
                    You (Developer)
                           ↓
                  👑 ORCHESTRATOR
                           ↓
                  🔧 Screen Expert
                           ↓
              🌐 API Expert (if needed)
                           ↓
        🎨 UI Expert (always - full review)
                           ↓
          🧪 QA Tester (always - validates)
                           ↓
                  ┌─────────────────┐
           ✅ PASS │           │ ❌ FAIL
                  │             │
            Task Complete    Report to
                            Orchestrator
                                 ↓
                          Re-delegate fix
                                 ↓
                        Restart from UI Expert
```

### Sequential Workflow

The agents work **sequentially** (not in parallel):

1. **Screen Expert** implements functionality
2. **API Expert** adds backend integration (if needed)
3. **UI Expert** polishes entire UI
4. **QA Tester** validates everything

If QA finds a bug, it goes back to Orchestrator who re-delegates to the right expert.

---

## Usage Examples

### Example 1: Simple Feature

**You:** "Add delete button to WorkoutDetailScreen"

**Orchestrator will:**
1. Delegate to Screen Expert → Implement delete button UI
2. Delegate to API Expert → Implement DELETE endpoint call
3. Delegate to UI Expert → Polish entire screen
4. Delegate to QA Tester → Test deletion flow

**Result:** Feature is implemented, polished, and tested!

---

### Example 2: Bug Fix

**You:** "Fix timer not stopping in CardioDetailScreen"

**Orchestrator will:**
1. Delegate to Screen Expert → Fix timer logic
2. Delegate to UI Expert → Review UI
3. Delegate to QA Tester → Test timer

If QA finds another issue:
4. Orchestrator re-delegates to Screen Expert
5. Back to UI Expert → QA Tester
6. Loop until QA passes

**Result:** Bug is fixed and verified!

---

### Example 3: UI-Only Task

**You:** "Improve spacing in CalenderScreen"

**Orchestrator will:**
1. Delegate to UI Expert → Polish styling
2. Delegate to QA Tester → Verify changes

**Result:** Visual improvements verified!

---

## Agent Communication Format

### How Agents Report Completion

Each agent reports back to Orchestrator with a standard format:

```
✅ [Agent Name] complete

Changes made:
- [Change 1]
- [Change 2]

Files modified:
- [File 1]

Ready for [next agent].
```

### How QA Reports Results

**PASS:**
```
✅ QA PASS - All tests passed!

Tested flows:
- [Flow 1]: ✅ Works
- [Flow 2]: ✅ Works

Feature is ready!
```

**FAIL:**
```
❌ QA FAIL - Bug found!

Issue: [Description]
Steps to reproduce: [Steps]
Severity: [HIGH/MEDIUM/LOW]

Returning to Orchestrator.
```

---

## Best Practices

### For You (Developer)

1. **Always start with Orchestrator** - Don't talk directly to sub-agents
2. **Be clear in your requests** - "Add X to Y screen with Z behavior"
3. **Trust the process** - Let the chain work
4. **Review final results** - Agents do great work, but you're still in charge

### For the System

1. **Never skip steps** - Always follow the chain
2. **UI Expert reviews EVERYTHING** - Not just new code
3. **QA is the gatekeeper** - Nothing ships without testing
4. **Iterate until perfect** - Loop until QA passes

---

## Workflow Guarantees

✅ **Quality:** QA Tester ensures everything works
✅ **Polish:** UI Expert ensures everything looks good
✅ **Integration:** API Expert ensures backend works
✅ **Functionality:** Screen Expert ensures logic is correct
✅ **Coordination:** Orchestrator ensures smooth workflow

---

## Project Context

**SulekApp** is a Swedish workout tracking app built with:
- **Tech Stack:** React Native, TypeScript, Expo
- **Backend:** REST API at localhost:5026
- **Language:** Swedish UI
- **Key Features:** Workout tracking (strength + cardio), calendar, progress

**Design System:**
- Primary color: #14B8A6 (teal)
- Font: Poppins
- Spacing: Consistent 16px base
- Border radius: 12px standard

---

## Quick Start

1. **Give task to Orchestrator:**
   ```
   "Add feature X to screen Y"
   ```

2. **Orchestrator coordinates:**
   - Screen Expert implements
   - API Expert integrates
   - UI Expert polishes
   - QA Tester validates

3. **Receive final report:**
   ```
   ✅ TASK COMPLETE
   Summary: [...]
   Feature is ready!
   ```

---

## Troubleshooting

### "Agent didn't do what I expected"
- Check if you talked to Orchestrator first (not sub-agents directly)
- Be more specific in your request
- Let Orchestrator coordinate

### "QA keeps failing"
- This is good! It means bugs are being caught
- Trust the iteration process
- Let the team fix issues

### "Too many steps for simple task"
- The process ensures quality
- Quick tasks still go fast
- You can skip QA for tiny changes (ask Orchestrator)

---

## Need Help?

- Check individual agent files for detailed capabilities
- Review workflow examples above
- Start simple and build confidence
- Remember: Orchestrator coordinates everything!

---

**Version:** 1.0
**Last Updated:** 2026-02-11
**Team Size:** 5 agents (1 Orchestrator + 4 Specialists)

Happy building! 🚀
