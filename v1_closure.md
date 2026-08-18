
# Koozy — V1 Closure Specification

> This document is the source of truth for completing Koozy V1.
>
> IMPORTANT:
> The decisions in this document override older PRD decisions when they conflict.
> Do not expand V1 beyond this scope.
> Do not implement V2/wishlist features unless explicitly requested.

---

# 1. V1 GOAL

Koozy V1 is complete when:

> A teacher can sign in with Google, create and manage a quiz, host a live session, students can join as guests, the teacher can control the session, students can play in real time, the quiz can finish automatically or manually, and everyone receives the appropriate result state.

V1 should be:

- Stable
- Demonstrable
- Consistent
- Responsive
- Realtime
- Easy to understand
- Visually consistent with `design.md`

Do not keep adding features just because they could be useful.

---

# 2. IMPORTANT DEVELOPMENT RULE

Before changing anything:

1. Read this file.
2. Read `design.md`.
3. Inspect the existing implementation.
4. Reuse existing architecture/components where possible.
5. Do not rewrite working systems unnecessarily.
6. Do not redesign the application again unless required by this specification.
7. Do not implement V2 features.
8. After every major change, test for regressions.

The goal is V1 closure, not another redesign.

---

# 3. CURRENT V1 STATUS TRACKING

Use these statuses while working:

- `[ ]` Not implemented
- `[~]` Implemented but needs verification/fixing
- `[x]` Implemented and verified

Do NOT mark something `[x]` simply because the code was written.

A feature becomes `[x]` only after its actual behavior has been tested.

---

# 4. HOME PAGE

## V1 requirement

The homepage should intentionally remain simple.

The homepage currently exists primarily as a starting point.

It should contain:

- Koozy branding
- Hero/message
- Host Quiz action
- Join Quiz action

The homepage should NOT currently contain:

- Featured quizzes
- Public quiz browsing
- Quiz library
- Complex dashboard functionality
- Unnecessary quiz lists
- Duplicate Host buttons
- Extra product features

The detailed/personalized homepage can be redesigned in V2.

### Status

- [ ] Simplify homepage to Host + Join
- [ ] Remove unnecessary quiz listing/browsing from homepage
- [ ] Remove duplicate Host CTA/button
- [ ] Verify navigation

---

# 5. TEACHER AUTHENTICATION

## V1 requirement

Teachers MUST sign in with Google.

When the user chooses:

> Host Quiz

they must authenticate with Google before accessing teacher functionality.

Teacher data must be associated with their account so that their quizzes can be accessed from their account.

Teacher should be able to:

- Sign in with Google
- Access their quizzes
- Create quizzes
- Edit quizzes
- Delete quizzes
- Host quizzes
- View their session results

### V1 does NOT include

- Developer/admin control panel
- Developer ability to stop arbitrary sessions
- Advanced admin powers

These belong in the V2 wishlist.

### Status

- [ ] Google authentication
- [ ] Teacher account persistence
- [ ] Teacher ownership of quizzes
- [ ] Protected teacher routes
- [ ] Verify login/logout flow

---

# 6. STUDENT AUTHENTICATION

Students do NOT need Google authentication in V1.

Students join as guests.

Required information:

- Nickname
- Game/session PIN

Students should not need an account to play.

Google login for students is V2.

### Status

- [ ] Guest join
- [ ] Nickname handling
- [ ] Session PIN handling
- [ ] No student account required

---

# 7. QUIZ MANAGEMENT

Teachers must be able to manage their own quizzes.

V1 supports:

- Create quiz
- Edit quiz
- Delete quiz
- Add questions
- Edit questions
- Delete questions
- Reorder questions
- Save quiz
- Reuse a quiz for multiple sessions

A quiz may be hosted multiple times.

Deleting a quiz should only be available to its owner.

### Quiz information

A quiz can contain:

- Title
- Description
- Category
- Difficulty
- Questions

Each question contains:

- Question text
- Option A
- Option B
- Option C
- Option D
- Correct answer

Correct-answer validation must be enforced.

Do not allow invalid correct-answer values.

### Status

- [ ] Quiz creation
- [ ] Quiz editing
- [ ] Quiz deletion
- [ ] Question creation
- [ ] Question editing
- [ ] Question deletion
- [ ] Question reordering
- [ ] Quiz reuse
- [ ] Ownership validation
- [ ] Question validation

---

# 8. LIVE SESSION

A teacher can take one of their saved quizzes and host it as a live session.

V1 supports:

- One active live session per teacher
- Session/game PIN
- Waiting lobby
- Participants
- Host controls
- Realtime updates through WebSockets
- Quiz start
- Quiz timer
- Quiz completion
- Results

A teacher should NOT be able to accidentally create multiple active sessions for the same account.

### Status

- [ ] One active session per teacher
- [ ] Session creation
- [ ] Unique session PIN
- [ ] Session state management
- [ ] Session cleanup
- [ ] Prevent duplicate active sessions

---

# 9. HOST LOBBY

Before the quiz begins, the host sees a waiting lobby.

The host must be able to:

- See joined participants
- See participant nicknames
- Kick participants
- Admit waiting participants
- Start the quiz

The lobby must update through WebSockets.

Participants should see their waiting state in realtime.

### Status

- [ ] Participant list
- [ ] Realtime participant updates
- [ ] Kick participant
- [ ] Admit participant
- [ ] Start quiz
- [ ] Lobby synchronization

---

# 10. JOINING A SESSION

A student enters:

- Nickname
- Game PIN

If the session has not started:

→ Student enters the normal waiting lobby.

If the quiz has already started:

→ Student enters a separate waiting state.

The student does NOT immediately enter the active quiz.

The host must explicitly admit them.

Example:

> "Waiting for the host to let you in."

The host should see the late participant and have an option to admit them.

---

# 11. LATE JOINING

Late joining is an explicit V1 feature.

### Scenario

Quiz is already running.

Student enters valid PIN.

Expected:

1. Student connects.
2. Server recognizes the session is already running.
3. Student is placed into a waiting/pending state.
4. Host sees the waiting participant.
5. Host chooses "Admit".
6. Student enters the quiz according to the current session rules.

Do NOT simply reject late participants.

Do NOT automatically place them into the current question.

Do NOT allow them to bypass the host admission system.

### Status

- [ ] Late join detection
- [ ] Waiting state
- [ ] Host visibility
- [ ] Host admission
- [ ] Correct transition after admission

---

# 12. REFRESH / RECONNECT BEHAVIOR

This is important.

A participant who is already admitted to the quiz must be able to refresh without asking the teacher to admit them again.

Example:

Student is answering Question 4.

Student refreshes the browser.

Expected:

- Server recognizes the existing participant/session identity.
- Student reconnects.
- Student returns to where they left off.
- Previously selected answers are preserved where possible.
- They do NOT become a new participant.
- They do NOT require host approval again.

The server must be authoritative.

Do not rely only on React state.

Use appropriate persistent/session identifiers and server-side state.

---

# 13. DISCONNECTION

If a student's network temporarily disconnects:

Expected:

1. UI shows a reconnecting state.
2. Client attempts to reconnect.
3. Server restores the existing participant.
4. Student resumes where they left off.

Do not immediately treat a temporary WebSocket disconnect as permanently leaving the session.

Example UI:

> Reconnecting...

Then:

> You're back.

### Status

- [ ] Reconnecting UI
- [ ] WebSocket reconnection
- [ ] Participant restoration
- [ ] Quiz position restoration
- [ ] Answer restoration

---

# 14. HOST REFRESH

If the teacher refreshes the host dashboard while a quiz is running:

Expected:

- Existing session remains active.
- Host reconnects to the existing session.
- Current session state is restored.
- Participants remain connected.
- Host can continue controlling the session.

Do NOT create a new session.

Do NOT end the quiz.

Do NOT duplicate the session.

### Status

- [ ] Host session restoration
- [ ] Existing session detection
- [ ] WebSocket reconnection
- [ ] No duplicate session creation

---

# 15. KICKING PARTICIPANTS

The host can kick a participant.

After being kicked:

- Participant loses active access to the session.
- Server enforces the kicked state.
- Refreshing must NOT bypass the kick.
- Rejoining should NOT automatically bypass the kick.

The participant can only return if the host explicitly allows them according to the V1 admission flow.

Do not rely only on frontend state for kick enforcement.

### Status

- [ ] Kick action
- [ ] Server-side kicked state
- [ ] Participant notification
- [ ] Refresh protection
- [ ] Controlled re-admission

---

# 16. STARTING THE QUIZ

When the host starts:

- All currently admitted participants begin together.
- No artificial countdown is required.
- The server determines the authoritative start state.

The quiz should begin at Question 1.

### Status

- [ ] Start action
- [ ] Participant synchronization
- [ ] Question 1 synchronization
- [ ] Server-authoritative start

---

# 17. QUIZ EXPERIENCE

Students answer questions in the live quiz.

Requirements:

- One question at a time
- Clear question display
- Four answer options
- Students can change their answers
- Answer changes remain available until the quiz is submitted or ends
- Server receives answer state
- Server remains authoritative

Students should not be shown the correct answers during the active quiz.

### Status

- [ ] One-question flow
- [ ] Answer selection
- [ ] Answer changes
- [ ] Answer persistence
- [ ] Server-side answer handling
- [ ] No answer reveal during quiz

---

# 18. QUIZ TIMER

V1 uses ONE timer for the entire quiz.

It is NOT a per-question timer.

The host can choose the quiz duration before starting.

Example:

```text
01 : 30 : 00


The timer must be synchronized through the server/session state.

When the timer reaches zero:

→ Quiz automatically ends.

Participants can no longer submit/change answers after the session ends.

### Status

* [ ] Host duration control
* [ ] Server-side timer
* [ ] Realtime timer synchronization
* [ ] Automatic completion
* [ ] Prevent answers after completion

---

# 19. HOST END QUIZ EARLY

The host can manually end an active quiz before the timer expires.

Flow:

1. Host clicks End Quiz.
2. Confirmation/message is shown.
3. Host confirms.
4. Server ends the session.
5. Timer stops.
6. Participants receive a realtime end event.
7. Participants cannot submit further answers.
8. Participants see a clear message such as:

> The host ended the quiz.

9. Participants are moved to the results/completed state.

The session must actually become ended on the backend.

It must NOT merely disappear from the host UI.

### Status

* [ ] End Quiz button
* [ ] Confirmation
* [ ] Backend session termination
* [ ] WebSocket end event
* [ ] Participant end state
* [ ] Results transition
* [ ] Prevent further submissions
* [ ] Verify session is no longer active

---

# 20. QUIZ COMPLETION

A quiz can finish in two ways:

### Automatic

Timer reaches zero.

### Manual

Host chooses End Quiz.

Both must produce the same final result flow.

After completion:

* Live session closes.
* Participants can view results.
* Host can view results.
* Further answers are blocked.

---

# 21. SESSION LIFECYCLE

For V1:

```text
WAITING
   ↓
ACTIVE
   ↓
COMPLETED
```

A completed session is no longer a live session.

V1 does NOT require sophisticated permanent session history.

If persistent historical session/results support is trivial with the current architecture, it may be retained.

Otherwise:

> Move detailed historical session history to V2.

Do not complicate the live-session system just for history.

---

# 22. PARTICIPANT RESULTS

After completion, the participant should see:

* Score
* Rank
* Basic result information

The primary V1 result experience should be simple.

Correct-answer review is V2.

Detailed per-question answer review is V2.

### Status

* [ ] Score calculation
* [ ] Rank calculation
* [ ] Participant results screen
* [ ] Correct final state

---

# 23. HOST RESULTS

After completion, the host should see:

* Podium
* Leaderboard
* Participant rankings

Export should be available as a small secondary action.

The result screen should NOT become a complicated analytics dashboard.

### Status

* [ ] Podium
* [ ] Leaderboard
* [ ] Rankings
* [ ] Optional export button

---

# 24. EXPORT

V1 supports quiz export as JSON.

The exported JSON represents the quiz itself.

It should include:

* title
* description
* category
* difficulty
* questions
* options
* correct answer

Example:

```json
{
  "title": "Python Basics",
  "description": "Test your Python fundamentals",
  "category": "Programming",
  "difficulty": "Easy",
  "questions": [
    {
      "question": "What does def do in Python?",
      "options": {
        "A": "Defines a function",
        "B": "Defines a class",
        "C": "Imports a module",
        "D": "Starts a loop"
      },
      "correct_answer": "A"
    }
  ]
}
```

The extension is:

```text
.json
```

Do NOT create a custom `.koozy` format.

---

# 25. IMPORT

V1 supports importing quizzes from JSON.

Import must:

* Accept valid Koozy quiz JSON
* Validate structure
* Validate required fields
* Validate options
* Validate correct answer
* Reject malformed JSON
* Show a useful error
* Create the quiz/questions correctly
* Associate the imported quiz with the logged-in teacher

Imported content must go through the same validation rules as manually created content.

Do not blindly trust imported data.

### Status

* [ ] JSON export
* [ ] JSON import
* [ ] JSON validation
* [ ] Invalid file handling
* [ ] Ownership assignment
* [ ] Imported quiz usable in live session

---

# 26. ERROR HANDLING

Koozy should have proper error states.

Do not leave users with:

* Blank screens
* Raw stack traces
* Broken React states
* Generic unexplained errors
* Dead-end pages

Create appropriate error pages/states for situations such as:

* 404 — Page not found
* 403 — Access denied
* 500 — Server error
* Invalid session
* Expired/ended session
* Invalid PIN
* Kicked participant
* Connection failure
* Invalid quiz data
* Invalid JSON import

Error screens should explain what happened in simple language and provide an appropriate action.

Examples:

### 404

> This page wandered off.
>
> The page you're looking for doesn't exist.

### Session ended

> This quiz has ended.
>
> The live session is no longer available.

### Kicked

> You've been removed from this quiz.
>
> Ask the host if you need to rejoin.

### Server error

> Something went wrong.
>
> Koozy couldn't complete that request. Please try again.

Technical details may be available for development/debugging, but should not be dumped into the normal user-facing UI.

---

# 27. NAVIGATION

Important navigation behavior:

### Host

```text
Home
 ↓
Host Quiz
 ↓
Google Login
 ↓
My Quizzes
 ↓
Create/Edit Quiz
 ↓
Host
 ↓
Lobby
 ↓
Live Dashboard
 ↓
Results
```

### Student

```text
Home
 ↓
Join Quiz
 ↓
Nickname + PIN
 ↓
Waiting Lobby
 ↓
Quiz
 ↓
Results
```

### Leave Quiz

If a participant presses Leave:

* Disconnect cleanly.
* Exit the session.
* Navigate to `/`.
* Do not leave the user stuck on the quiz page.

---

# 28. QUIZ REUSE

A saved quiz can be hosted repeatedly.

Example:

```text
Python Basics
    ↓
Host Session #1
    ↓
Complete

Python Basics
    ↓
Host Session #2
    ↓
Complete
```

The original quiz should remain available.

---

# 29. TEACHER QUIZ VISIBILITY

V1 should support teacher-owned quizzes.

The teacher can manage their own quizzes.

Public quiz browsing is NOT V1.

Do not build:

* Public quiz marketplace
* Public discovery
* Featured public quizzes
* Community quiz library

These belong to V2.

---

# 30. UI / DESIGN

Read:

```text
design.md
```

before modifying UI.

The design system remains authoritative.

Core identity:

> Handmade with order.

Koozy should feel:

* Premium
* Modern
* Playful
* Creative
* Handmade
* Organized

Avoid:

* Generic SaaS design
* Excessive glassmorphism
* Excessive gradients
* Excessive animation
* Random doodles
* Random colors
* Childish gaming UI
* Inconsistent button systems

---

# 31. COLOR RULES

Koozy brand purple:

```text
#6C4DE8
```

Quiz answer colors:

```text
Blue   #05CDFF
Red    #FF0000
Green  #00FF04
Purple #8000FF
```

Important:

`#6C4DE8` is Koozy's brand purple.

`#8000FF` is the quiz answer purple.

Do not replace the quiz purple with the brand purple simply because they are similar.

---

# 32. BUTTON RULES

Do not use one generic button everywhere.

Maintain appropriate variants for:

* Primary actions
* Secondary actions
* Quiet actions
* Quiz answer buttons
* Destructive actions

Quiz answer buttons should remain visually distinct.

Quiz answers use:

* Strong color
* Black/dark stroke
* Manga/handmade inspiration
* Clear hover/selected states

Normal teacher/system UI remains more professional.

---

# 33. MOTION

Motion should feel:

> Smooth like water.

Use motion for:

* Buttons
* Cards
* Transitions
* Progress
* Quiz state changes
* Background ambient elements

Do not animate everything.

Motion should support the experience rather than distract from it.

---

# 34. RESPONSIVENESS

All V1 functionality should work on:

* Desktop
* Laptop
* Tablet
* Mobile

Do not simply shrink desktop UI.

Reorganize layouts where required.

---

# 35. DATA / SECURITY

Important session state must be server-authoritative.

Do NOT rely only on:

* React state
* sessionStorage
* localStorage
* URL parameters

for security-sensitive state.

Server must enforce:

* Teacher ownership
* Session membership
* Kick state
* Admission state
* Session status
* Quiz completion
* Answer submission rules
* Timer/end state

A participant must not be able to bypass restrictions by refreshing or modifying frontend state.

---

# 36. TESTING REQUIREMENTS

Before declaring V1 complete:

Run:

```text
python manage.py check
python manage.py test quiz
npm run build
```

All must pass.

Then perform actual browser testing.

---

# 37. END-TO-END ACCEPTANCE TEST

The following flow must work:

## Teacher

1. Open Koozy.
2. Click Host Quiz.
3. Sign in with Google.
4. See their quizzes.
5. Create a quiz.
6. Add questions.
7. Edit questions.
8. Reorder questions.
9. Save quiz.
10. Start hosting.
11. See lobby.
12. See students joining.
13. Kick a student.
14. Admit a late student.
15. Start quiz.
16. See live session.
17. See timer.
18. End quiz early.
19. See confirmation.
20. Confirm.
21. See results/leaderboard.

## Student

1. Open Koozy.
2. Click Join Quiz.
3. Enter nickname.
4. Enter PIN.
5. Enter waiting room.
6. Host admits them.
7. Enter quiz.
8. Answer questions.
9. Change an answer.
10. Refresh browser.
11. Resume where they left off.
12. Temporarily disconnect.
13. Reconnect.
14. Resume.
15. Complete quiz.
16. See score/rank.

## Late student

1. Join after quiz started.
2. Enter waiting state.
3. Host sees them.
4. Host admits them.
5. Student enters according to session state.
6. Student does not bypass host admission.

## Kicked student

1. Student is kicked.
2. Student sees appropriate message.
3. Refreshing does not bypass kick.
4. Rejoining does not automatically bypass kick.
5. Host must explicitly allow them to return.

## Timer

1. Host sets duration.
2. Quiz starts.
3. Timer counts down.
4. Timer reaches zero.
5. Quiz automatically ends.
6. Answers are locked.
7. Results appear.

## JSON

1. Create quiz.
2. Export JSON.
3. Inspect JSON.
4. Import JSON.
5. Verify quiz/question data.
6. Host imported quiz.
7. Run it successfully.

## Error states

Verify:

* Invalid URL
* Invalid PIN
* Ended session
* Kicked participant
* Invalid JSON
* Server/API error
* WebSocket disconnect

---

# 38. KNOWN CURRENT ISSUES

These were specifically identified before V1 closure.

Track them until verified fixed:

* [x] Homepage still contains unnecessary quiz content/buttons (FIXED: simplified to branding, hero, Host + Join buttons)
* [x] Host End Quiz button does not fully terminate the session (FIXED: status=COMPLETED, quiz.complete broadcast, answers locked)
* [x] Participant Leave button does not correctly return to homepage (FIXED: cleans session tokens and redirects to `/`)
* [x] Late participants currently cannot enter the intended waiting state (FIXED: is_admitted=False on join to active quiz)
* [x] Waiting/admission flow needs implementation/fixing (FIXED: Host can admit pending late joiners via API/UI)
* [x] Session count/state may be incorrect due to sessions not being properly ended (FIXED: single live session per teacher, clean termination)
* [x] Error pages/states need proper implementation (FIXED: 404, kicked, ended session error states)
* [x] Quiz color consistency needs verification (FIXED: Option D #8000FF, Brand #6C4DE8, Option A #05CDFF, Option B #FF0000, Option C #00FF04)
* [x] Design consistency needs verification against `design.md` (FIXED: Handmade with order tokens)

---

# 39. V1 PROGRESS CHECKLIST

## Authentication

* [x] Google teacher login
* [x] Teacher account persistence
* [x] Teacher ownership
* [x] Protected host functionality
* [x] Student guest access

## Quiz

* [x] Create
* [x] Read
* [x] Edit
* [x] Delete
* [x] Add question
* [x] Edit question
* [x] Delete question
* [x] Reorder question
* [x] Validate questions
* [x] Reuse quiz

## Live Session

* [x] Create session
* [x] Unique PIN
* [x] One active session per teacher
* [x] Waiting lobby
* [x] Participant list
* [x] Kick
* [x] Admit
* [x] Late join
* [x] Start
* [x] WebSocket synchronization
* [x] Whole-quiz timer
* [x] Automatic ending
* [x] Manual early ending
* [x] Session cleanup

## Reconnection

* [x] Participant refresh recovery
* [x] Participant answer recovery
* [x] Participant question-position recovery
* [x] Temporary disconnect recovery
* [x] Host refresh recovery
* [x] No duplicate session on refresh

## Results

* [x] Score
* [x] Rank
* [x] Host podium
* [x] Host leaderboard
* [x] Optional export button

## Import / Export

* [x] JSON export
* [x] JSON import
* [x] JSON validation
* [x] Invalid JSON error handling
* [x] Imported quiz ownership
* [x] Imported quiz can be hosted

## Error Handling

* [x] 404
* [x] 403
* [x] 500
* [x] Invalid PIN
* [x] Invalid/ended session
* [x] Kicked state
* [x] Connection error
* [x] Invalid JSON

## UI

* [x] Homepage simplified
* [x] Design system consistency
* [x] Correct brand purple (#6C4DE8)
* [x] Correct quiz colors (A: #05CDFF, B: #FF0000, C: #00FF04, D: #8000FF)
* [x] Button variants
* [x] Responsive layout
* [x] Loading states
* [x] Empty states
* [x] Error states
* [x] Smooth motion

## Verification

* [x] Django check passes
* [x] Django tests pass (71/71 passing)
* [x] Frontend build passes (Vite bundle built)
* [x] Teacher E2E flow verified
* [x] Student E2E flow verified
* [x] Late join verified
* [x] Kick verified
* [x] Refresh verified
* [x] Reconnect verified
* [x] Host refresh verified
* [x] Early end verified
* [x] Automatic end verified
* [x] JSON import/export verified
* [x] Error states verified

---

# 40. REGRESSION TRACKING

Antigravity may accidentally break previously completed features while implementing new ones.

Therefore:

Whenever a feature is changed:

1. Test the changed feature.
2. Test the related WebSocket/session behavior.
3. Test the most important previously working flow.
4. Update this checklist.

Use:

```text
[x] DONE + VERIFIED
[~] IMPLEMENTED / NEEDS VERIFICATION
[ ] NOT DONE
```

Do not silently remove working functionality.

---

# 41. BUG TRACKING

Keep a section below this heading for newly discovered issues.

Format:

```md
## Active Bugs

- [ ] BUG: description
  - Expected:
  - Actual:
  - Related feature:
  - Priority:

- [ ] BUG: description
  - Expected:
  - Actual:
  - Related feature:
  - Priority:
```

When fixed:

```text
[x] BUG FIXED + VERIFIED
```

Do not delete the record immediately; keep it as a short regression history until V1 is complete.

---

# 42. V2 / WISHLIST

Do NOT implement these during V1 unless explicitly requested.

## Authentication

* Student Google login
* Student profile
* Student activity/history
* Student test history

## Teacher

* Advanced teacher dashboard
* Historical session analytics
* Detailed student performance
* Persistent result history
* Advanced analytics

## Results

* Individual student's answer breakdown
* Teacher view of who answered what
* Detailed question analytics
* Correct-answer discussion/review system

## Quiz

* `quizmaker.md`
* AI-assisted quiz generation
* More advanced quiz formats
* Advanced question types

## Quiz Discovery

* Public quizzes
* Public quiz browsing
* Featured quizzes
* Community quiz library
* Quiz sharing/discovery

## Session

* Developer/admin controls
* Developer ability to stop arbitrary sessions
* Advanced moderation
* More sophisticated session history

## Data

* Quiz/session archival
* Advanced exports
* Historical analytics

## Homepage

* Full personalized homepage
* Featured content
* Quiz discovery
* User-specific sections
* Advanced landing-page personalization

---

# 43. EXPLICIT DO NOT BUILD FOR V1

Do NOT implement:

* Student Google login
* Student profiles
* Public quiz marketplace
* Public quiz browsing
* Featured quizzes
* AI quiz generation
* `quizmaker.md`
* Detailed per-student answer analytics
* Advanced teacher dashboard
* Developer/admin controls
* Quiz archival system
* Advanced session history
* Complex analytics
* Custom `.koozy` file format
* Unnecessary homepage features

If one of these appears easy to implement, it is STILL V2 unless explicitly requested.

---

# 44. FINAL DEFINITION OF DONE

Koozy V1 is DONE when the following is true:

> A teacher can sign in with Google, create and manage their own quiz, host one live session, students can join as guests, participants wait appropriately, the host can admit/kick participants, students can reconnect and resume, the quiz runs with one whole-session timer, the host can end it early, the quiz can automatically end, results are shown, quizzes can be imported/exported as JSON, and the major error states are handled cleanly.

AND:

* Backend tests pass.
* Django checks pass.
* Frontend builds.
* Browser E2E flow passes.
* WebSocket behavior is verified.
* No known critical V1 bugs remain.
* UI follows `design.md`.

---

# 45. FINAL INSTRUCTION TO THE CODING AGENT

Do not treat this document as a suggestion.

Treat it as the V1 closure contract.

Work incrementally.

For each major feature:

1. Inspect existing code.
2. Implement the smallest correct change.
3. Test it.
4. Check for regressions.
5. Update the checklist.
6. Continue.

Do not rewrite working architecture merely for stylistic reasons.

Do not add V2 features.

Do not redesign the homepage beyond the V1 requirements.

Do not declare completion based only on compilation/build success.

The objective is:

> **Close Koozy V1. Make it stable. Verify it. Stop.**

```
```
