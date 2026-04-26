# Matadaan Guide: Election Education Assistant

Matadaan Guide is an interactive, mentorship-focused web application designed to educate citizens about the election process, primarily focusing on the Indian democratic system.

## 🎯 Chosen Vertical: Civic Education & Literacy
The application addresses the "Election Process Education Assistant" requirement. It moves away from generic chatbots by adopting a **guided mentorship** model that leads users through a structured 6-phase election lifecycle.

## 🧠 Approach and Logic

### 1. Phased Journey Model
Elections are complex workflows. The logic is built around the **Election Lifecycle**, which is divided into six logical phases:
- Voter Registration
- Voter Verification
- Campaigning Period
- Voting Day
- Vote Counting
- Result Declaration

The app maintains a `currentStepIndex` state which dictates the visual focus of the UI (oversized phase headers and timeline highlights).

### 2. Intelligent State Synchronization
A core logic component is the **Heuristic Progress Engine** in `App.tsx`. When the AI assistant responds, the app parses the text for specific keywords related to the election phases (e.g., "EVM", "Form 6", "NVSP"). 
- **Upward Mobility:** If a user starts talking about registration, the UI shifts to Phase 1. If they ask about results, it jumps to Phase 6.
- **Context Preservation:** This ensures the UI is always in sync with the conversation without the user needing to manually click buttons.

### 3. AI Services (Gemini Integration)
The assistant uses the **Gemini 3 Flash** model to provide low-latency, conversational guidance. It is configured with a robust `SYSTEM_INSTRUCTION` that enforces:
- Neutrality and lack of political bias.
- Simplification of technical/legal jargon.
- Active verification of user status (e.g., first-time voter).

## 🛠 Tech Stack & Engineering Excellence

- **Frontend:** React 19 + Vite 6 + Tailwind CSS 4.
- **Backend:** Node.js Express proxy to secure Gemini API keys.
- **Security:** Hardened with `Helmet.js` and server-side secret management.
- **AI:** Gemini 1.5 Flash for high-speed, intelligent mentorship.
- **Persistence:** Firebase Auth + Firestore for cross-device progress synchronization.
- **Testing:** Comprehensive suite with Vitest and React Testing Library (Unit + Component tests).
- **Accessibility:** WCAG 2.1 Compliant (ARIA landmarks, labels, and keyboard navigation).

## 🧠 Engineering Logic

### 1. Phased Journey Model
Elections are complex workflows. The logic is built around the **Election Lifecycle**, which is divided into six logical phases from registration to results.

### 2. Heuristic Progress Detection
Extracted into `src/lib/electionUtils.ts`, this logic uses weighted keyword analysis to automatically detect which phase of the election the user is discussing, syncing the UI timeline in real-time.

### 3. Production Hardening
- **Security:** Moved all AI logic to a backend proxy to prevent API key leakage.
- **Stability:** Implemented health checks and robust error handling for Firebase and AI streams.
- **Accessibility:** Every interactive element has an ID and ARIA attributes for screen reader compatibility.

## 🧪 Quality Assurance

Run the test suite to verify logic and accessibility:
```bash
npx vitest run
```
The suite includes:
- **Unit Tests:** `detectStepFromText` logic verification.
- **Component Tests:** `ElectionTimeline` rendering and state highlighting.
