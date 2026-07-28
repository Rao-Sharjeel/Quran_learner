# PRD: Learn & Sessions Engagement Flow

**Product:** Ilm (Family Quran learning)  
**Feature:** Hire teachers (Learn) and manage recurring sessions (Sessions)  
**Status:** Phase 1 — UI + mocks  
**Owner:** Product / Engineering  
**Last updated:** 2026-07-27  

---

## 1. Summary

Replace one-off “book a single slot” with a lasting **teaching engagement** between a guardian family and a teacher: request weekly times → teacher accepts → free intro (once per guardian+teacher) → pay for a package of sessions → auto-scheduled calendar until the family ends the engagement.

**Learn** is where families hire. **Sessions** is where they manage classes with teachers they already work with.

---

## 2. Problem

Parents need to:

1. Find a vetted teacher and commit to a recurring weekly rhythm (not one random slot).
2. Try the teacher with a short free intro before paying.
3. Pay in packages (minimum 4 sessions) and see what’s paid vs unpaid on a clear timeline.
4. Bring multiple kids (and themselves) into the same live class from one device.
5. Keep session artifacts (title/topic, notes, transcript, per-learner homework + marks) in one place.
6. Stop working with a teacher without losing paid sessions already on the calendar.

Teachers need a simple way to accept/decline/reschedule requests and run class (notes, homework, marks).

---

## 3. Goals

| Goal | Success signal (Phase 1) |
|------|---------------------------|
| Clear hire vs manage split | Nav: Learn = hire; Sessions = current teachers’ calendar |
| Recurring weekly booking | Request supports multi-select weekly slots |
| Intro → pay → schedule | Happy path completable in mocks end-to-end |
| Package of 4 sessions | Pay marks next 4 occurrences paid; more dates show unpaid |
| Multi-learner, one device | Session lists all learners; classroom assumes shared device |
| Session dossier | Title, shared notes, private notes, homework/marks, transcript |
| Teacher can operate the loop | `/teacher` requests + session detail + room tools |

### Non-goals (this PRD)

- Real Stripe / payment processor
- Separate video devices per learner in one session
- Assignments (homework only)
- Full teacher application / admin vetting redesign
- Auto-charging or auto-extending packages beyond prepaid credits
- Synced audio recording + timestamped transcript player

---

## 4. Users & roles

| Role | Needs |
|------|--------|
| **Guardian** | Hire, pay, see family timeline, join class with kids on one device, private notes, end engagement |
| **Learner (self or kid)** | Attached to sessions/homework; not a separate login in Phase 1 |
| **Teacher** | Review hire requests, run sessions, shared + private notes, assign/mark homework |

---

## 5. Product principles

1. **Engagement is the relationship; session is the occurrence.**
2. **Learn = acquire; Sessions = operate.**
3. **Paid sessions are protected** — ending never cancels paid (or free intro) scheduled sessions.
4. **Intro is a guardian–teacher privilege**, not per child.
5. **Homework is per learner** so progress and marks stay individual even when the class is shared.

---

## 6. Locked decisions

| Topic | Decision |
|-------|----------|
| Nav | Teachers → **Learn** (`/learn`). Sessions = engaged teachers only |
| Package | Pay for **4 sessions total** across selected weekly slots (not 4 weeks × every slot) |
| Multi-learner | One session, multiple `learnerIds`; same-device UX |
| Free intro | **15 min**, once per **guardian + teacher**; restart = no free intro |
| End sessions | Stop auto-schedule; cancel **unpaid** future; keep **paid** / free |
| Notes | Shared session notes + private notes for guardian and for teacher |
| Homework | Per learner; marks **0–10**; no assignments |
| Session title | Topic discussed / to discuss; guardian can suggest; teacher edits |
| Regular length | Teacher `durationMinutes` (seed 45/60) |
| Calendar horizon | ~**2 months** of occurrences visible |
| Teacher portal | Simple mock under `/teacher/*` |

---

## 7. User journeys

### 7.1 Guardian hires a teacher

```
Login → (optional) Add family modal
  → Learn → Teacher profile (weekly calendar, rate, duration)
  → Request: weekly slots + subject + learners (+ topic suggestion)
  → Pending on Sessions / teacher inbox
```

### 7.2 Teacher reviews

```
Teacher portal → Requests
  → Accept → intro scheduled (if intro available) OR awaiting payment (restart)
  → Decline (optional message)
  → Message to reschedule (without accepting yet)
```

### 7.3 Intro → pay → calendar

```
Guardian notified → Join free intro
  → Intro completed → awaiting payment notification
  → Pay for 4 sessions
  → Next 4 weekly occurrences marked paid; further dates unpaid until next package
```

### 7.4 Ongoing class

```
Home Upcoming / Sessions timeline → Session detail → Join room
  → Teacher: previous homework + assign homework
  → After class: notes, transcript, homework/marks on dossier
```

### 7.5 End relationship

```
Sessions → End sessions with teacher
  → Unpaid future cancelled
  → Paid / free scheduled remain
  → Re-hire later = no second free intro
```

---

## 8. Functional requirements

### 8.1 Learn (directory & hire)

| ID | Requirement |
|----|-------------|
| L1 | Directory lists vetted teachers with subjects, rating, **rate/session**, **duration** |
| L2 | Filter by subject (and existing language/search) |
| L3 | Profile shows bio, badges, subjects, **weekly availability** |
| L4 | Hire form: multi-select weekly slots, subject, multi-select learners, optional topic + note |
| L5 | Show price summary and intro eligibility (free intro vs restart) |
| L6 | Submit creates `TeachingEngagement` with status `pending` |
| L7 | Legacy `/teachers/*` redirects to `/learn/*` |

### 8.2 Engagement lifecycle

| ID | Requirement |
|----|-------------|
| E1 | Statuses: `pending` \| `intro_scheduled` \| `awaiting_payment` \| `active` \| `ended` \| `declined` |
| E2 | Accept with unused intro → schedule intro (`kind: intro`, `paymentStatus: free`) |
| E3 | Accept after intro already used → `awaiting_payment` (no free intro) |
| E4 | Completing intro → `awaiting_payment` + payment-due notification |
| E5 | `payPackage(count=4)` adds credits and marks next 4 regular occurrences `paid` |
| E6 | Generate ~60 days of regular occurrences from weekly slots |
| E7 | Occurrences beyond prepaid credits show as `unpaid` (or payment pending in UI) |
| E8 | `endEngagement` cancels unpaid scheduled; never cancels paid/free scheduled |
| E9 | `hadFreeIntro(guardianId, teacherId)` spans prior ended engagements |

### 8.3 Sessions (timeline & dossier)

| ID | Requirement |
|----|-------------|
| S1 | Flat timeline ordered by time; day groups; filter by learner |
| S2 | Show ~2 months ahead (+ recent completed history) |
| S3 | Row shows title, teacher, learners, time, duration, payment badge, status |
| S4 | Engagement header: End sessions; Pay / Buy more when needed |
| S5 | Detail: title, payment, join (if scheduled + paid/free), shared notes, guardian private notes, per-learner homework + marks, transcript |
| S6 | Join blocked for unpaid sessions |

### 8.4 Home & notifications

| ID | Requirement |
|----|-------------|
| H1 | Upcoming driven by scheduled sessions (prefer joinable paid/free for primary CTA) |
| N1 | Notification on teacher accept (intro time) |
| N2 | Notification when payment is due after intro / on restart accept |
| N3 | Dismissible banner in guardian shell |

### 8.5 Payment (mock)

| ID | Requirement |
|----|-------------|
| P1 | Checkout at `/engagements/:id/pay` — “4 × $rate” |
| P2 | Confirm activates package and regenerates/updates calendar |
| P3 | No real payment processor in Phase 1 |

### 8.6 Classroom

| ID | Requirement |
|----|-------------|
| C1 | Show session title and all learner names (same-device) |
| C2 | **Previous homework** panel from last completed session on same engagement |
| C3 | Teacher can **assign homework** per learner during class |
| C4 | Guardian can view previous homework read-only |
| C5 | Teacher End session completes class and advances intro → payment when applicable |

### 8.7 Teacher portal

| ID | Requirement |
|----|-------------|
| T1 | `/teacher` — upcoming sessions for active demo teacher |
| T2 | `/teacher/requests` — accept / decline / reschedule message |
| T3 | `/teacher/sessions/:id` — edit title, shared + private notes, homework + marks |
| T4 | `/teacher/sessions/:id/room` — classroom with teacher tools |
| T5 | Demo entry from login (“Continue as teacher”) + teacher switcher |

### 8.8 Onboarding

| ID | Requirement |
|----|-------------|
| O1 | After login to `/app`, if no kids, show Add family modal (add / done / skip) |
| O2 | Skip persists so modal doesn’t loop forever |

---

## 9. Data model (Phase 1)

### Teacher
- Existing profile fields + `durationMinutes`
- `availability: { id, weekday, startTime, label }[]` (weekly template)

### TeachingEngagement
- `guardianId`, `teacherId`, `subject`, `learnerIds[]`, `weeklySlotIds[]`
- `status`, `introUsed`, `prepaidSessionCredits`
- `titleSuggestion?`, `studentNote?`, `teacherMessage?`, `endedAt?`

### Session
- `engagementId`, `teacherId`, `learnerIds[]`, `title`, `subject`
- `startsAt`, `durationMinutes`, `kind` (`intro` \| `regular`)
- `status` (`scheduled` \| `completed` \| `cancelled`)
- `paymentStatus` (`free` \| `paid` \| `unpaid` \| `pending_payment`)
- `sharedNotes?`, `privateNotesGuardian?`, `privateNotesTeacher?`
- `homework[]` with `learnerId`, `text`, `done`, `mark?` (0–10), optional audio fields
- `transcript?` (readable sections)

### Notification
- `kind`, `title`, `body`, `href?`, `read`, `createdAt`

---

## 10. UX requirements

- Learn and Sessions must not feel like the same page: Learn is discovery; Sessions is “your teachers’ calendar.”
- Payment status must be visible on list and detail (Paid / Free intro / Unpaid / Payment pending).
- Multi-learner selection copy must state **everyone joins from the same device**.
- Ending engagement requires confirmation that explains unpaid vs paid behavior.
- Session **title** is first-class (not only subject label).

---

## 11. Analytics (Phase 2 readiness)

Track (when backend exists):

- Hire request submitted / accepted / declined
- Intro completed → pay conversion
- Package purchase count
- End engagement rate
- Join rate for paid vs unpaid (should be zero joins unpaid)

---

## 12. Risks & edge cases

| Case | Expected behavior |
|------|-------------------|
| Restart with same teacher | No free intro; accept → pay |
| Multiple weekly slots + pay 4 | Next 4 occurrences across those slots are paid |
| End while unpaid future exists | Those cancel; paid remain |
| Unpaid session time arrives | Shown on timeline; Join disabled until paid |
| Empty family (no kids) | Modal to add kids; guardian can still hire for self |
| Teacher reschedule message only | Engagement stays pending; message visible to guardian |

---

## 13. Acceptance criteria (Phase 1 demo)

1. Guardian can hire from Learn with 2 weekly slots and 2 learners; request appears as pending.
2. Teacher can accept; guardian gets notification; intro appears as Free.
3. Completing intro moves engagement to awaiting payment; pay for 4 schedules paid sessions.
4. Sessions timeline shows ~2 months with payment badges; unpaid cannot join.
5. End sessions cancels unpaid only.
6. Session detail shows title, shared notes, private notes, per-learner homework/marks, transcript (when seeded/completed).
7. Classroom shows prev homework; teacher can assign homework.
8. `/teachers` redirects to `/learn`.
9. Docs (`PLAN.md`) describe Learn / Sessions engagement model.

---

## 14. Rollout

| Phase | Scope |
|-------|--------|
| **Phase 1 (now)** | React UI + mock store; demo teacher portal |
| **Phase 2** | Django APIs, real auth, payments, notifications push, video |
| **Later** | Multi-device learners, packages UX variants, calendar sync |

---

## 15. Open items (explicitly deferred)

- Exact timezone display / DST handling for weekly slots across regions  
- Refunds and partial package cancellation policy  
- Teacher capacity limits when many families pick the same weekly slot  
- Automated reminders N minutes before class  

---

## 16. References

- Build plan: engagement flow (Learn / Sessions)  
- Platform plan: [`docs/PLAN.md`](./PLAN.md)  
- Key routes: `/learn`, `/learn/:id/hire`, `/sessions`, `/engagements/:id/pay`, `/teacher/*`
