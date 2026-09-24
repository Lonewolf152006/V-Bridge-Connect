# VBridgeConnect — Academic & Industry Collaboration Hub

VBridgeConnect is an institutional, academic collaboration and project governance platform designed for universities to connect **students**, **faculty mentors**, **department coordinators**, **external reviewers**, and **industry partners**.

---

## 🌟 Key Capabilities

* **14 Production-Grade MVP Screens** covering the complete academic lifecycle:
  * Unified SSO & credential authentication portal
  * Student personal workspace & deadline tracker
  * Mentor cohort risk matrix (FR-070 to FR-075) & submission evaluation queue
  * Multidisciplinary opportunity catalogue with prerequisite matching
  * **9-Tab Shared Workspace Hub** (`/projects/[teamId]`) bridging students, faculty, and industry
  * Immutable deliverable version history (FR-052)
  * Split-screen interactive rubric grading console & ABET audit sign-off
  * Dual-ledger digital credential portfolio (Platform-Issued verified credentials with QR & SHA-256 vs self-reported external certifications)
  * Scoped messaging and collaborative team communications
  * Coordinator 5-step opportunity builder wizard
  * Real-time application review pipeline with transactional capacity locks
  * Department directory & granular role permissions
  * Institutional analytics & NAAC/NBA accreditation audit reporting
* **Evaluator Presentation Demo Controller**:
  * Floating dock with 1-click toggling between **Desktop PC**, **Phone (iPhone 15 simulation frame)**, and **Tablet** viewports.
  * Instant switching across all **6 User Personas** (Student, Mentor, Coordinator, Partner, Reviewer, Dean).
  * Direct screen jump selector.
* **Full-Stack Next.js (App Router)** with live server route handlers under `/app/api/*` (`auth`, `activities`, `submissions`, `certificates`).

---

## 🚀 Quick Start

### 1. Install & Run
```bash
cd next-app
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Production Build
```bash
cd next-app
npm run build
npm run start
```

---

## 📁 Repository Structure

```
├── next-app/                 # Next.js Full-Stack Application (App Router + API routes)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages and /api route handlers
│   │   ├── components/       # Design System UI components & Presentation Control Panel
│   │   ├── layouts/          # Responsive desktop, mobile, and tablet shells
│   │   ├── screens/          # 14 role-based application views
│   │   ├── services/         # Mock fixtures & data services
│   │   ├── store/            # Zustand global application state
│   │   ├── types/            # TypeScript domain interfaces
│   │   └── lib/              # Formatting, rubric calculations & utilities
├── DESIGN.md                 # Design system tokens, color palettes, and Stitch prototypes
├── PRD_text.txt              # Product Requirements Document (FR-001 through FR-126)
├── VBridgeConnect_IA_Map.pdf # Official Information Architecture & Navigation Rules
├── architecture.md           # System design & API contract specifications
├── rules.md                  # Non-negotiable engineering directives
├── task.md                   # Phased implementation master checklist
└── memory.md                 # Persistent AI context & session state
```

---

## 🛡️ License & Institutional Governance
Protected by university tamper-evident audit logging protocols (FR-130).
All actions, evaluations, and state transitions are signed and timestamped in UTC.
