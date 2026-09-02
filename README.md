# Claim Document Upload & Assessor Review — demo

Interactive demo of a typical insurance claims workflow, built from the
"Claim Document Upload & Assessor Review" user story:

1. **Policyholder** uploads supporting documents (Invoice / Estimate / Photo / Medical Report / Other) against an open claim.
2. Files are validated (PDF/JPG/PNG/DOCX, ≤ 20 MB) and pass a simulated malware scan; rejected files show a specific reason and are never attached.
3. Accepted uploads land as **Pending Review** and route the claim into the **assessor work queue** with an SLA due date, prioritised by claim value, age and SLA.
4. **Assessor** opens the claim, views the document inline alongside claim details, and records **Accepted**, **Rejected** (mandatory reason code + note) or **More Info Required**.
5. The policyholder receives an in-app + email notification with outcome, reason and next action; claim status updates.
6. Every upload / view / decision / notification is captured in an immutable **audit log** (actor, timestamp, action, version, reason).
7. Replacing a rejected document creates a **new version**, supersedes the original and re-enters the queue with the original SLA preserved.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run lint`, `npm run typecheck`, `npm run build`.

## Notes

- All state is in-memory (React reducer) and persisted to `localStorage`; use the reset icon in the header to restore seed data.
- The malware scan is simulated: any filename containing `virus`, `malware` or `eicar` fails the scan.
- Use the header toggle to switch between the Policyholder and Assessor personas.
