"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { initialState } from "./seed";
import type {
  AppState,
  AuditEvent,
  Claim,
  ClaimDocument,
  ClaimStatus,
  Decision,
  DocumentType,
  Notification,
  Role,
} from "./types";

const STORAGE_KEY = "claims-demo-state-v1";
const SLA_HOURS_STANDARD = 72;
const SLA_HOURS_HIGH_VALUE = 48;
const HIGH_VALUE_THRESHOLD = 25_000;

let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const now = () => new Date().toISOString();

type Action =
  | { type: "SET_ROLE"; role: Role }
  | { type: "RESET" }
  | { type: "HYDRATE"; saved: AppState }
  | {
      type: "START_UPLOAD";
      doc: ClaimDocument;
    }
  | { type: "UPLOAD_FAILED"; documentId: string; reason: string }
  | { type: "UPLOAD_COMPLETE"; documentId: string }
  | { type: "VIEW_DOCUMENT"; documentId: string }
  | { type: "RECORD_DECISION"; documentId: string; decision: Decision }
  | { type: "MARK_NOTIFICATIONS_READ" };

function slaHoursFor(claim: Claim): number {
  return claim.value >= HIGH_VALUE_THRESHOLD ? SLA_HOURS_HIGH_VALUE : SLA_HOURS_STANDARD;
}

function audit(
  state: AppState,
  e: Omit<AuditEvent, "id" | "at">,
): AppState {
  return { ...state, audit: [{ ...e, id: uid("aud"), at: now() }, ...state.audit] };
}

function updateClaim(state: AppState, claimId: string, patch: Partial<Claim>): AppState {
  return {
    ...state,
    claims: state.claims.map((c) => (c.id === claimId ? { ...c, ...patch } : c)),
  };
}

function updateDoc(state: AppState, documentId: string, patch: Partial<ClaimDocument>): AppState {
  return {
    ...state,
    documents: state.documents.map((d) => (d.id === documentId ? { ...d, ...patch } : d)),
  };
}

function setClaimStatus(state: AppState, claim: Claim, status: ClaimStatus, actor: string, role: Role | "system"): AppState {
  if (claim.status === status) return state;
  let s = updateClaim(state, claim.id, { status });
  s = audit(s, {
    actor,
    role,
    action: "CLAIM_STATUS_CHANGED",
    claimId: claim.id,
    detail: `Claim status changed: ${claim.status} → ${status}`,
  });
  return s;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "RESET":
      return initialState;
    case "HYDRATE":
      return { ...action.saved, documents: action.saved.documents.filter((d) => d.status !== "Uploading") };

    case "START_UPLOAD":
      return { ...state, documents: [action.doc, ...state.documents] };

    case "UPLOAD_FAILED": {
      const doc = state.documents.find((d) => d.id === action.documentId);
      if (!doc) return state;
      let s = updateDoc(state, doc.id, { status: "Failed", failureReason: action.reason });
      s = audit(s, {
        actor: doc.uploadedBy,
        role: "policyholder",
        action: "DOCUMENT_REJECTED_BY_VALIDATION",
        claimId: doc.claimId,
        documentId: doc.id,
        version: doc.version,
        detail: `Upload of ${doc.filename} rejected`,
        reason: action.reason,
      });
      return s;
    }

    case "UPLOAD_COMPLETE": {
      const doc = state.documents.find((d) => d.id === action.documentId);
      const claim = state.claims.find((c) => c.id === doc?.claimId);
      if (!doc || !claim) return state;
      let s = updateDoc(state, doc.id, { status: "Pending Review" });
      s = audit(s, {
        actor: doc.uploadedBy,
        role: "policyholder",
        action: "DOCUMENT_UPLOADED",
        claimId: claim.id,
        documentId: doc.id,
        version: doc.version,
        detail: `Uploaded ${doc.filename} (${doc.type})${doc.version > 1 ? ` — replaces version ${doc.version - 1}` : ""}`,
      });

      if (doc.previousVersionId) {
        s = updateDoc(s, doc.previousVersionId, { status: "Superseded", supersededById: doc.id });
        s = audit(s, {
          actor: "system",
          role: "system",
          action: "DOCUMENT_SUPERSEDED",
          claimId: claim.id,
          documentId: doc.previousVersionId,
          version: doc.version - 1,
          detail: `Version ${doc.version - 1} superseded by version ${doc.version}`,
        });
      }

      // Route to assessor queue. Preserve existing SLA context on resubmission.
      const alreadyQueued = !!claim.slaDueAt;
      if (!alreadyQueued) {
        const due = new Date(Date.now() + slaHoursFor(claim) * 3600 * 1000).toISOString();
        s = updateClaim(s, claim.id, { slaDueAt: due, queuedAt: now() });
        s = audit(s, {
          actor: "system",
          role: "system",
          action: "CLAIM_QUEUED",
          claimId: claim.id,
          detail: `Claim routed to assessor queue — SLA ${slaHoursFor(claim)}h`,
        });
      } else {
        s = audit(s, {
          actor: "system",
          role: "system",
          action: "CLAIM_QUEUED",
          claimId: claim.id,
          detail: "Claim re-entered assessor queue — original SLA preserved",
        });
      }
      const current = s.claims.find((c) => c.id === claim.id)!;
      s = setClaimStatus(s, current, "Under Assessment", "system", "system");
      return s;
    }

    case "VIEW_DOCUMENT": {
      const doc = state.documents.find((d) => d.id === action.documentId);
      if (!doc) return state;
      return audit(state, {
        actor: state.currentUser.assessor,
        role: "assessor",
        action: "DOCUMENT_VIEWED",
        claimId: doc.claimId,
        documentId: doc.id,
        version: doc.version,
        detail: `Viewed ${doc.filename}`,
      });
    }

    case "RECORD_DECISION": {
      const doc = state.documents.find((d) => d.id === action.documentId);
      const claim = state.claims.find((c) => c.id === doc?.claimId);
      if (!doc || !claim || doc.status !== "Pending Review") return state;
      const { decision } = action;
      let s = updateDoc(state, doc.id, { status: decision.outcome, decision });
      const reasonText = [decision.reasonCode, decision.note].filter(Boolean).join(" — ");
      s = audit(s, {
        actor: decision.actor,
        role: "assessor",
        action: "DOCUMENT_DECISION",
        claimId: claim.id,
        documentId: doc.id,
        version: doc.version,
        detail: `${decision.outcome} on ${doc.filename}`,
        reason: reasonText || undefined,
      });

      // Notification (email + in-app)
      const subjectMap = {
        Accepted: "Document accepted",
        Rejected: "Document rejected",
        "More Info Required": "More information required",
      } as const;
      const nextAction =
        decision.outcome === "Accepted"
          ? undefined
          : decision.outcome === "Rejected"
            ? `Please upload a replacement ${doc.type.toLowerCase()} that addresses the reason above.`
            : decision.note || "Please upload the requested information.";
      const body =
        decision.outcome === "Accepted"
          ? `Your ${doc.type} "${doc.filename}" has been accepted by the assessor.`
          : decision.outcome === "Rejected"
            ? `Your ${doc.type} "${doc.filename}" was rejected. Reason: ${reasonText}.`
            : `Your ${doc.type} "${doc.filename}" needs more information before it can be accepted.`;
      const base = {
        at: now(),
        recipient: claim.policyholder,
        claimId: claim.id,
        documentId: doc.id,
        subject: `${subjectMap[decision.outcome]} — ${claim.reference}`,
        body,
        nextAction,
        read: false,
      };
      const notifications: Notification[] = [
        { ...base, id: uid("ntf"), channel: "in-app" },
        { ...base, id: uid("ntf"), channel: "email" },
      ];
      s = { ...s, notifications: [...notifications, ...s.notifications] };
      s = audit(s, {
        actor: "system",
        role: "system",
        action: "NOTIFICATION_SENT",
        claimId: claim.id,
        documentId: doc.id,
        detail: `Email + in-app notification sent to ${claim.policyholder}: ${subjectMap[decision.outcome]}`,
      });

      // Claim status update
      const remainingPending = s.documents.filter(
        (d) => d.claimId === claim.id && d.status === "Pending Review",
      ).length;
      const anyOpenRequest = s.documents.some(
        (d) => d.claimId === claim.id && (d.status === "Rejected" || d.status === "More Info Required"),
      );
      const activeDocs = s.documents.filter(
        (d) => d.claimId === claim.id && d.status !== "Superseded" && d.status !== "Failed",
      );
      let nextStatus: ClaimStatus = claim.status;
      if (remainingPending > 0) nextStatus = "Under Assessment";
      else if (anyOpenRequest) nextStatus = "Information Requested";
      else if (activeDocs.length > 0 && activeDocs.every((d) => d.status === "Accepted")) nextStatus = "Approved";
      s = setClaimStatus(s, s.claims.find((c) => c.id === claim.id)!, nextStatus, decision.actor, "assessor");
      if (remainingPending === 0) {
        s = updateClaim(s, claim.id, { queuedAt: undefined, ...(nextStatus === "Approved" ? { slaDueAt: undefined } : {}) });
      }
      return s;
    }

    case "MARK_NOTIFICATIONS_READ":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
  }
}

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  setRole: (role: Role) => void;
  reset: () => void;
  beginUpload: (input: {
    claimId: string;
    type: DocumentType;
    file: File;
    previousVersionId?: string;
    previewUrl?: string;
  }) => ClaimDocument;
  failUpload: (documentId: string, reason: string) => void;
  completeUpload: (documentId: string) => void;
  viewDocument: (documentId: string) => void;
  recordDecision: (documentId: string, decision: Omit<Decision, "actor" | "decidedAt">) => void;
  markNotificationsRead: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) dispatch({ type: "HYDRATE", saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Object URLs from uploads don't survive reloads; drop them before persisting.
    const persistable: AppState = {
      ...state,
      documents: state.documents.map((d) =>
        d.previewUrl?.startsWith("blob:") ? { ...d, previewUrl: undefined } : d,
      ),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state, hydrated]);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      hydrated,
      setRole: (role) => dispatch({ type: "SET_ROLE", role }),
      reset: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        dispatch({ type: "RESET" });
      },
      beginUpload: ({ claimId, type, file, previousVersionId, previewUrl }) => {
        const prev = state.documents.find((d) => d.id === previousVersionId);
        const doc: ClaimDocument = {
          id: uid("doc"),
          claimId,
          type,
          filename: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          uploadedAt: now(),
          uploadedBy: state.currentUser.policyholder,
          status: "Uploading",
          version: prev ? prev.version + 1 : 1,
          previousVersionId,
          previewUrl,
        };
        dispatch({ type: "START_UPLOAD", doc });
        return doc;
      },
      failUpload: (documentId, reason) => dispatch({ type: "UPLOAD_FAILED", documentId, reason }),
      completeUpload: (documentId) => dispatch({ type: "UPLOAD_COMPLETE", documentId }),
      viewDocument: (documentId) => dispatch({ type: "VIEW_DOCUMENT", documentId }),
      recordDecision: (documentId, decision) =>
        dispatch({
          type: "RECORD_DECISION",
          documentId,
          decision: { ...decision, actor: state.currentUser.assessor, decidedAt: now() },
        }),
      markNotificationsRead: () => dispatch({ type: "MARK_NOTIFICATIONS_READ" }),
    }),
    [state, hydrated],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/* ---------- Selectors ---------- */

export function priorityScore(claim: Claim, docs: ClaimDocument[]): number {
  const ageDays = (Date.now() - new Date(claim.lodgedAt).getTime()) / 86_400_000;
  const valueScore = Math.min(60, Math.log10(Math.max(claim.value, 1)) * 12);
  const ageScore = Math.min(30, ageDays * 2);
  const slaRemainingH = claim.slaDueAt ? (new Date(claim.slaDueAt).getTime() - Date.now()) / 3_600_000 : 999;
  const slaScore = slaRemainingH < 0 ? 25 : slaRemainingH < 12 ? 15 : 0;
  const pending = docs.filter((d) => d.claimId === claim.id && d.status === "Pending Review").length;
  return Math.round(valueScore + ageScore + slaScore + Math.min(10, pending * 2));
}

export function priorityBand(score: number): "High" | "Medium" | "Low" {
  return score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
}

export function assessorQueue(state: AppState) {
  return state.claims
    .filter((c) => state.documents.some((d) => d.claimId === c.id && d.status === "Pending Review"))
    .map((c) => ({
      claim: c,
      pendingCount: state.documents.filter((d) => d.claimId === c.id && d.status === "Pending Review").length,
      score: priorityScore(c, state.documents),
    }))
    .sort((a, b) => b.score - a.score);
}

export function documentsForClaim(state: AppState, claimId: string) {
  return state.documents
    .filter((d) => d.claimId === claimId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function versionChain(state: AppState, doc: ClaimDocument): ClaimDocument[] {
  const chain: ClaimDocument[] = [doc];
  let cur = doc;
  while (cur.previousVersionId) {
    const prev = state.documents.find((d) => d.id === cur.previousVersionId);
    if (!prev) break;
    chain.push(prev);
    cur = prev;
  }
  return chain;
}
