# Adaptive Verification & Subagent Protocol

---

## 1. Task-Proportional Verification Strategy

Always tailor the verification level to the scope of the change:

### A. Small Tasks / Quick Fixes
*Examples: bug fixes, localized UI adjustments, single model method additions, API field adjustments.*
- **Action**:
  1. Perform targeted lint / syntax checks (e.g. `npm run lint` with `oxlint` in `frontend/`).
  2. Run specific, relevant test cases or methods rather than the entire suite (e.g. `python manage.py test quiz.tests.TestSpecificFeature`).
  3. Verify clean code diffs.

### B. Major Tasks / Feature Milestones
*Examples: implementing a new quiz phase, WebSocket consumer overhaul, auth system, lobby/game flow.*
- **Action**:
  1. **Backend Validation**:
     - Check Django system integrity: `python manage.py check`
     - Check migration status: `python manage.py makemigrations --check --dry-run`
     - Run critical test suites for the affected modules.
  2. **Frontend Validation**:
     - Linting: `npm run lint`
     - Build verification: `npm run build` (ensures zero bundler errors or broken imports).
  3. **Integration & Edge Cases**:
     - Validate payload schemas between Django serializers/consumers and React components.

---

## 2. Subagent Strategy & Parallel Execution

When executing complex tasks:
- **Parallel Workstreams**: Spawn subagents to handle decoupled areas simultaneously:
  - Subagent 1: Backend endpoint / consumer / service logic.
  - Subagent 2: Frontend UI view / WebSocket hook integration.
- **Auditing & Testing**: Use subagents for researching existing codebase patterns or crafting targeted unit tests while the main agent prepares implementation code.
- **Reporting**: Subagents must return concise summaries of changes made and verification results.
