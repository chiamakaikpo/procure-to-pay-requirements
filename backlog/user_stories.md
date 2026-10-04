# User story backlog

Import `user_stories.csv` into Jira (or Azure DevOps) to recreate this backlog.

## Requisition

### US-01 · Must · 5 points

As a **requester**, I want a guided requisition form with mandatory fields and budget codes, so that I do not have to resubmit my request.

**Acceptance criteria**

- Given a required field is empty, when I try to submit, then the form blocks submission and highlights the field.
- Given I have selected a cost centre, then only budget codes valid for that cost centre are shown.

Traces to: FR-01, FR-02

### US-10 · Could · 3 points

As a **requester**, I want to see where my requisition is, so that I do not have to email procurement for updates.

**Acceptance criteria**

- Given I open my requisitions, then each shows its current stage and who it is waiting on.

Traces to: FR-10

## Approval

### US-02 · Must · 8 points

As a **procurement officer**, I want requisitions to route to the right approver automatically by value threshold and category, so that I no longer chase approvals by email.

**Acceptance criteria**

- Given a requisition exceeds an approval threshold, when it is approved at one level, then it routes to the next level automatically.
- Every approval records the approver, timestamp and decision.

Traces to: BR-01, FR-03

### US-06 · Should · 3 points

As a **budget holder**, I want to see remaining budget next to each request, so that I can decide without asking finance.

**Acceptance criteria**

- Given a requisition assigned to me, when I open it, then I see the cost centre, budget remaining and request value.
- Given approving would exceed budget, then I must enter a reason to approve.

Traces to: FR-04

### US-08 · Should · 3 points

As a **requester**, I want stalled approvals to escalate automatically, so that my request does not wait while an approver is away.

**Acceptance criteria**

- Given an approval has not been actioned for 2 working days, then it is sent to the approver's delegate and the requester is notified.

Traces to: FR-05

## Supplier onboarding

### US-03 · Must · 5 points

As a **compliance officer**, I want the system to block POs to any supplier whose due diligence documents are not verified, so that we never pay an unvetted supplier.

**Acceptance criteria**

- Given a supplier's status is Pending, when a PO is raised for that supplier, then the system blocks it and shows which documents are missing.

Traces to: BR-02, FR-06

### US-05 · Should · 5 points

As a **compliance officer**, I want a standard onboarding checklist and alerts before documents expire, so that supplier files stay complete without manual tracking.

**Acceptance criteria**

- Given a new supplier, then all checklist documents must be uploaded before status can be set to Verified.
- Given a document expires in 30 days, then compliance receives a notification.

Traces to: BR-02, FR-07

## Invoice to pay

### US-04 · Must · 8 points

As a **accounts payable officer**, I want invoices matched automatically to POs and goods receipts, so that I only handle real exceptions.

**Acceptance criteria**

- Given the invoice, PO and receipt match within tolerance, then the invoice is marked ready for payment.
- Given a mismatch, then the invoice goes to the exception queue with the reason.

Traces to: BR-03, FR-09

### US-09 · Must · 2 points

As a **requester**, I want to confirm receipt of goods against the PO in the system, so that finance can match and pay the invoice.

**Acceptance criteria**

- Given goods arrive, when I record the received quantity against the PO, then a goods receipt is created and linked to the PO.

Traces to: FR-08

## Controls

### US-07 · Must · 5 points

As a **internal auditor**, I want a complete, uneditable history of each purchase, so that I can evidence controls without rebuilding email trails.

**Acceptance criteria**

- Given any requisition, PO or invoice, then I can view every action with user, timestamp and before/after values.
- No user, including administrators, can edit or delete audit entries.

Traces to: BR-01, NFR-01, NFR-03

### US-12 · Must · 5 points

As a **compliance officer**, I want segregation of duties enforced by the system, so that no single person can complete a purchase alone.

**Acceptance criteria**

- Given I raised a requisition, then I cannot approve it.
- Given I created a supplier, then I cannot approve payments to that supplier.

Traces to: NFR-02

## Reporting

### US-11 · Should · 5 points

As a **head of procurement**, I want a monthly report of P2P performance, so that I can show the process is under control.

**Acceptance criteria**

- The report shows requisition-to-PO cycle time, first-time-complete rate, first-time match rate and spend with unverified suppliers (which must be zero).

Traces to: FR-11
