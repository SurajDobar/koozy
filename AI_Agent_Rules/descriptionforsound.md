# Koozy Sound Effects Specification

This document details the sound effects implemented in Koozy and where each SFX is utilized across the application.

## Sound Mapping Reference

| Sound File | Trigger / Usage | Description & Context |
|---|---|---|
| `backward-swish.mp3` | Quiz Previous Question | Used when navigating to the previous question using the left arrow navigation button. |
| `forward-swish.mp3` | Quiz Next Question | Used when navigating to the next question using the right arrow navigation button. |
| `choose-answer-pop-button-sfx.mp3` | Option Selection | Played when a participant selects an answer option (A, B, C, D) in a live quiz. |
| `koozy-button.mp3` | Mechanical Buttons | Reserved strictly for large, tactile mechanical buttons (`.kz-btn-primary`, `.kz-btn-secondary`, `[data-sfx="koozy-button"]`) that physically depress on click. Not for generic buttons. |
| `tick-immersive.mp3` | Micro Buttons & Links | Used for small subtle buttons, time adjustments (+/- timer), question reordering, copy PIN, and micro action links/icons (edit, export, delete). |
| `url.mp3` | Page Navigation Links | Played when clicking regular anchor links (`a[href]`) navigating between pages. Defers unload by ~150ms to allow audio playback. |
| `koozy-connect.mp3` | Live Session Joined | Played when connecting into a live room/session (similar to Google Meet connect chime). |
| `koozy-disconnect.mp3` | Live Session Left | Played when disconnecting or exiting out of a live room/session. |
| `koozy-submitted.mp3` | Quiz Submission | Played when submitting quiz answers. |
| `koozy-success.mp3` | Success Action | Played on successful operations, such as AI quiz generation completion or importing quizzes. |
| `koozy-unsucess.mp3` | Subtle Failure | Played on minor errors, bans, or non-critical operation failures. |
| `koozy-error.mp3` | Warning SFX | Played on subtle warnings, confirmation dialogs (e.g. "End quiz, are you sure?"). |
| `error2_harrd.mp3` | Critical Error | Played on critical errors (e.g. login failures, AI generation failures). |
| `Koozy-win.mp3` | Victory / High Score | Played on the results screen when score accuracy is 50% or higher, or on leaderboard win. |
| `Koozy-loose.mp3` | Low Score | Played on the results screen when score accuracy is below 50%. |

## Implementation Details
- Preloaded and managed via `frontend/src/utils/sfx.js`.
- AudioContext unlocks automatically on the user's first touch/click.
- Download links and `blob:` / `data:` URLs are safely exempted from standard link redirection to prevent download interruption.