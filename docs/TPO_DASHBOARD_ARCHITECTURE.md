# SmartNShine Institutional TPO Dashboard Architecture

## Overview

The SmartNShine TPO (Training & Placement Officer) Dashboard is an institutional SaaS platform integrated natively into SmartNShine (`smartnshine.app`). It allows colleges and universities to manage students, monitor AI resume preparation, track AI mock interview performance, distribute career assignments, and assess student placement readiness without duplicating any existing student tools.

---

## Architecture & Data Isolation

### Institutional Multi-Tenancy

- **Middleware Isolation (`server/middleware/tpo.middleware.js`)**:
  - `isTpo`: Enforces `role === "tpo"`, account status, and verifies that the institution's approval state is `verified`.
  - `validateStudentAccess`: Confirms that the target student is actively enrolled in the requesting TPO's institution and has granted explicit consent.
  - `auditLog`: Immutably records every TPO read and write interaction on student records into `TPOAuditLog`.

---

## Database Models Summary

| Model                  | Path                                          | Purpose                                                                                      |
| ---------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `Institution`          | `server/models/Institution.model.js`          | College metadata, logo, verified status, departments, academic batches, and formula settings |
| `StudentInstitution`   | `server/models/StudentInstitution.model.js`   | Student-institution link, consent tracking, roll number, department & batch assignment       |
| `Assignment`           | `server/models/Assignment.model.js`           | TPO-created career assignments (ATS resume creation, technical mock interview, etc.)         |
| `AssignmentSubmission` | `server/models/AssignmentSubmission.model.js` | Tracks student task completion linked to actual `Resume` or `InterviewSession` records       |
| `Announcement`         | `server/models/Announcement.model.js`         | Targeted notices and placement schedules with read receipts and priority pinning             |
| `ReadinessSnapshot`    | `server/models/ReadinessSnapshot.model.js`    | Explainable readiness scores, sub-pillar performance breakdown, and recommendation trends    |
| `TPOAuditLog`          | `server/models/TPOAuditLog.model.js`          | Immutable institutional audit log trail                                                      |

---

## AI Readiness Engine Formula

$$\text{ReadinessScore} = 0.30 \times R_{resume} + 0.40 \times R_{interview} + 0.20 \times R_{technical} + 0.10 \times R_{engagement}$$

### Normalization Rule

Missing assessment signals (e.g. fresh students who have not yet undertaken a mock interview) are **not penalized as zero**. Instead, the remaining available component weights are dynamically scaled to 100%, and actionable recommendations are generated.

---

## Routes & Pages

### Public Routes

- `/tpo/login`: TPO Officer Authentication
- `/tpo/register`: Institution Onboarding Form
- `/tpo/accept-invite`: Student Invitation Acceptance & Privacy Consent

### Protected TPO Routes (`/tpo/*`)

- `/tpo/dashboard`: Cohort KPI Overview & Readiness Spectrum
- `/tpo/students`: Student Roster, Single & Bulk CSV Invitations, Department/Batch Filtering
- `/tpo/students/:studentId`: Comprehensive Student Career Drilldown
- `/tpo/resume-analytics`: Intelligence on skills frequency, template adoption, and section completeness
- `/tpo/interview-analytics`: AI Voice & Text Mock Interview benchmark analytics
- `/tpo/readiness`: AI Readiness Engine, scoring formula, and batch recalculation
- `/tpo/assignments`: Career preparation task management and submission tracking
- `/tpo/announcements`: Institutional noticeboard with priority pinning
- `/tpo/leaderboard`: Readiness rankings and cohort champions
- `/tpo/reports`: Department comparisons, batch progress, and CSV exports
- `/tpo/settings`: Department/Batch management, authorized TPO staff, and formula weights
