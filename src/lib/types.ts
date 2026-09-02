export type Role = "policyholder" | "assessor";

export const DOCUMENT_TYPES = [
  "Invoice",
  "Estimate",
  "Photo",
  "Medical Report",
  "Other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type DocumentStatus =
  | "Uploading"
  | "Failed"
  | "Pending Review"
  | "Accepted"
  | "Rejected"
  | "More Info Required"
  | "Superseded";

export type ClaimStatus =
  | "Open"
  | "Information Requested"
  | "Under Assessment"
  | "Approved"
  | "Closed";

export type DecisionOutcome = "Accepted" | "Rejected" | "More Info Required";

export const REJECTION_REASON_CODES = [
  { code: "ILLEGIBLE", label: "Document illegible or incomplete" },
  { code: "WRONG_CLAIM", label: "Document relates to a different claim" },
  { code: "NOT_ITEMISED", label: "Invoice/estimate not itemised" },
  { code: "OUT_OF_DATE", label: "Document predates the incident" },
  { code: "UNVERIFIED", label: "Provider could not be verified" },
  { code: "DUPLICATE", label: "Duplicate of an existing document" },
] as const;
export type RejectionReasonCode = (typeof REJECTION_REASON_CODES)[number]["code"];

export interface Decision {
  outcome: DecisionOutcome;
  reasonCode?: RejectionReasonCode;
  note?: string;
  actor: string;
  decidedAt: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  type: DocumentType;
  filename: string;
  mime: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  status: DocumentStatus;
  version: number;
  previousVersionId?: string;
  supersededById?: string;
  failureReason?: string;
  previewUrl?: string;
  decision?: Decision;
}

export interface Claim {
  id: string;
  reference: string;
  policyholder: string;
  policyNumber: string;
  product: "Motor" | "Home" | "Health" | "Travel";
  description: string;
  value: number;
  lodgedAt: string;
  status: ClaimStatus;
  slaDueAt?: string;
  queuedAt?: string;
}

export type AuditAction =
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_REJECTED_BY_VALIDATION"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_DECISION"
  | "DOCUMENT_SUPERSEDED"
  | "CLAIM_QUEUED"
  | "CLAIM_STATUS_CHANGED"
  | "NOTIFICATION_SENT";

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role: Role | "system";
  action: AuditAction;
  claimId: string;
  documentId?: string;
  version?: number;
  detail: string;
  reason?: string;
}

export interface Notification {
  id: string;
  at: string;
  recipient: string;
  claimId: string;
  documentId?: string;
  channel: "email" | "in-app";
  subject: string;
  body: string;
  nextAction?: string;
  read: boolean;
}

export interface AppState {
  role: Role;
  currentUser: { policyholder: string; assessor: string };
  claims: Claim[];
  documents: ClaimDocument[];
  audit: AuditEvent[];
  notifications: Notification[];
}
