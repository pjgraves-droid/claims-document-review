import type { AppState, AuditEvent, Claim, ClaimDocument } from "./types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

export function svgPreview(title: string, lines: string[], accent = "#1e3a5f"): string {
  const body = lines
    .map(
      (l, i) =>
        `<text x="40" y="${140 + i * 30}" font-family="Helvetica, Arial" font-size="16" fill="#334155">${l}</text>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="420" viewBox="0 0 620 420">
  <rect width="620" height="420" fill="#ffffff" stroke="#cbd5e1"/>
  <rect width="620" height="80" fill="${accent}"/>
  <text x="40" y="50" font-family="Helvetica, Arial" font-size="24" font-weight="bold" fill="#ffffff">${title}</text>
  ${body}
  <text x="40" y="390" font-family="Helvetica, Arial" font-size="12" fill="#94a3b8">Demo document — generated for illustration</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const POLICYHOLDER = "Sarah Mitchell";
export const ASSESSOR = "James Okafor";

const claims: Claim[] = [
  {
    id: "clm-1001",
    reference: "CLM-2026-1001",
    policyholder: POLICYHOLDER,
    policyNumber: "MTR-88213-A",
    product: "Motor",
    description: "Rear-end collision on Parramatta Rd — bumper and tail-light damage.",
    value: 8400,
    lodgedAt: daysAgo(6),
    status: "Open",
  },
  {
    id: "clm-1002",
    reference: "CLM-2026-1002",
    policyholder: POLICYHOLDER,
    policyNumber: "HOM-40199-C",
    product: "Home",
    description: "Storm damage to roof and ceiling — water ingress in two bedrooms.",
    value: 46500,
    lodgedAt: daysAgo(14),
    status: "Information Requested",
    slaDueAt: hoursAgo(-20),
    queuedAt: daysAgo(3),
  },
  {
    id: "clm-1003",
    reference: "CLM-2026-1003",
    policyholder: POLICYHOLDER,
    policyNumber: "HLT-77120-B",
    product: "Health",
    description: "Physiotherapy following knee surgery — 12 sessions.",
    value: 2160,
    lodgedAt: daysAgo(2),
    status: "Under Assessment",
    slaDueAt: hoursAgo(-60),
    queuedAt: hoursAgo(12),
  },
  {
    id: "clm-1004",
    reference: "CLM-2026-1004",
    policyholder: "Daniel Reyes",
    policyNumber: "MTR-10422-F",
    product: "Motor",
    description: "Windscreen replacement after highway debris strike.",
    value: 1150,
    lodgedAt: daysAgo(9),
    status: "Under Assessment",
    slaDueAt: hoursAgo(6),
    queuedAt: daysAgo(4),
  },
  {
    id: "clm-1005",
    reference: "CLM-2026-1005",
    policyholder: "Priya Nair",
    policyNumber: "TRV-55301-D",
    product: "Travel",
    description: "Lost luggage and emergency purchases — Singapore stopover.",
    value: 3200,
    lodgedAt: daysAgo(20),
    status: "Approved",
  },
];

const documents: ClaimDocument[] = [
  {
    id: "doc-2001",
    claimId: "clm-1002",
    type: "Estimate",
    filename: "roof-repair-estimate-v1.pdf",
    mime: "application/pdf",
    size: 412_000,
    uploadedAt: daysAgo(4),
    uploadedBy: POLICYHOLDER,
    status: "More Info Required",
    version: 1,
    previewUrl: svgPreview("Repair Estimate", [
      "Contractor: Harbour Roofing Pty Ltd",
      "Scope: Replace 24 roof tiles, patch ceiling",
      "Estimated total: $46,500 (excl. GST)",
      "Note: no itemised breakdown supplied",
    ]),
    decision: {
      outcome: "More Info Required",
      note: "Please provide an itemised breakdown separating materials from labour, and confirm the contractor's licence number.",
      actor: ASSESSOR,
      decidedAt: daysAgo(3),
    },
  },
  {
    id: "doc-2002",
    claimId: "clm-1002",
    type: "Photo",
    filename: "ceiling-damage-bedroom-1.jpg",
    mime: "image/jpeg",
    size: 2_400_000,
    uploadedAt: daysAgo(4),
    uploadedBy: POLICYHOLDER,
    status: "Accepted",
    version: 1,
    previewUrl: svgPreview("Photo — Bedroom 1 ceiling", [
      "Visible water staining across ~2m section",
      "Plaster sagging near light fitting",
    ], "#475569"),
    decision: { outcome: "Accepted", actor: ASSESSOR, decidedAt: daysAgo(3) },
  },
  {
    id: "doc-2003",
    claimId: "clm-1003",
    type: "Medical Report",
    filename: "physio-referral-dr-chen.pdf",
    mime: "application/pdf",
    size: 188_000,
    uploadedAt: hoursAgo(12),
    uploadedBy: POLICYHOLDER,
    status: "Pending Review",
    version: 1,
    previewUrl: svgPreview("Medical Report", [
      "Referring practitioner: Dr A. Chen (Orthopaedics)",
      "Procedure: Arthroscopic meniscus repair, 12 Aug 2026",
      "Recommendation: 12 x physiotherapy sessions",
    ], "#0e7490"),
  },
  {
    id: "doc-2004",
    claimId: "clm-1003",
    type: "Invoice",
    filename: "physio-invoice-sessions-1-4.pdf",
    mime: "application/pdf",
    size: 96_000,
    uploadedAt: hoursAgo(11),
    uploadedBy: POLICYHOLDER,
    status: "Pending Review",
    version: 1,
    previewUrl: svgPreview("Tax Invoice", [
      "Provider: Northside Physio & Rehab",
      "Sessions 1–4 @ $180.00 = $720.00",
      "ABN 51 824 753 556  |  Paid in full",
    ], "#0e7490"),
  },
  {
    id: "doc-2005",
    claimId: "clm-1004",
    type: "Invoice",
    filename: "windscreen-invoice.pdf",
    mime: "application/pdf",
    size: 120_000,
    uploadedAt: daysAgo(4),
    uploadedBy: "Daniel Reyes",
    status: "Pending Review",
    version: 1,
    previewUrl: svgPreview("Tax Invoice", [
      "Provider: O'Brien AutoGlass",
      "Windscreen supply & fit: $1,150.00",
      "Vehicle: 2021 Toyota Corolla — ABC-123",
    ]),
  },
  {
    id: "doc-2006",
    claimId: "clm-1005",
    type: "Other",
    filename: "airline-pir-report.pdf",
    mime: "application/pdf",
    size: 64_000,
    uploadedAt: daysAgo(18),
    uploadedBy: "Priya Nair",
    status: "Accepted",
    version: 1,
    previewUrl: svgPreview("Property Irregularity Report", [
      "Carrier: Singapore Airlines  |  PIR: SINSQ12345",
      "Bag not located after 21 days — declared lost",
    ]),
    decision: { outcome: "Accepted", actor: ASSESSOR, decidedAt: daysAgo(16) },
  },
];

const audit: AuditEvent[] = [
  {
    id: "aud-1",
    at: daysAgo(4),
    actor: POLICYHOLDER,
    role: "policyholder",
    action: "DOCUMENT_UPLOADED",
    claimId: "clm-1002",
    documentId: "doc-2001",
    version: 1,
    detail: "Uploaded roof-repair-estimate-v1.pdf (Estimate)",
  },
  {
    id: "aud-2",
    at: daysAgo(4),
    actor: POLICYHOLDER,
    role: "policyholder",
    action: "DOCUMENT_UPLOADED",
    claimId: "clm-1002",
    documentId: "doc-2002",
    version: 1,
    detail: "Uploaded ceiling-damage-bedroom-1.jpg (Photo)",
  },
  {
    id: "aud-3",
    at: daysAgo(4),
    actor: "system",
    role: "system",
    action: "CLAIM_QUEUED",
    claimId: "clm-1002",
    detail: "Claim routed to assessor queue",
  },
  {
    id: "aud-4",
    at: daysAgo(3),
    actor: ASSESSOR,
    role: "assessor",
    action: "DOCUMENT_DECISION",
    claimId: "clm-1002",
    documentId: "doc-2002",
    version: 1,
    detail: "Accepted ceiling-damage-bedroom-1.jpg",
  },
  {
    id: "aud-5",
    at: daysAgo(3),
    actor: ASSESSOR,
    role: "assessor",
    action: "DOCUMENT_DECISION",
    claimId: "clm-1002",
    documentId: "doc-2001",
    version: 1,
    detail: "More Info Required on roof-repair-estimate-v1.pdf",
    reason: "Itemised breakdown and contractor licence number required",
  },
  {
    id: "aud-6",
    at: hoursAgo(12),
    actor: POLICYHOLDER,
    role: "policyholder",
    action: "DOCUMENT_UPLOADED",
    claimId: "clm-1003",
    documentId: "doc-2003",
    version: 1,
    detail: "Uploaded physio-referral-dr-chen.pdf (Medical Report)",
  },
  {
    id: "aud-7",
    at: hoursAgo(11),
    actor: POLICYHOLDER,
    role: "policyholder",
    action: "DOCUMENT_UPLOADED",
    claimId: "clm-1003",
    documentId: "doc-2004",
    version: 1,
    detail: "Uploaded physio-invoice-sessions-1-4.pdf (Invoice)",
  },
];

export const initialState: AppState = {
  role: "policyholder",
  currentUser: { policyholder: POLICYHOLDER, assessor: ASSESSOR },
  claims,
  documents,
  audit,
  notifications: [
    {
      id: "ntf-1",
      at: daysAgo(3),
      recipient: POLICYHOLDER,
      claimId: "clm-1002",
      documentId: "doc-2001",
      channel: "in-app",
      subject: "More information required — CLM-2026-1002",
      body: "Your Estimate \"roof-repair-estimate-v1.pdf\" needs more information before it can be accepted.",
      nextAction:
        "Please provide an itemised breakdown separating materials from labour, and confirm the contractor's licence number.",
      read: false,
    },
    {
      id: "ntf-2",
      at: daysAgo(3),
      recipient: POLICYHOLDER,
      claimId: "clm-1002",
      documentId: "doc-2002",
      channel: "in-app",
      subject: "Document accepted — CLM-2026-1002",
      body: "Your Photo \"ceiling-damage-bedroom-1.jpg\" has been accepted by the assessor.",
      read: true,
    },
  ],
};
