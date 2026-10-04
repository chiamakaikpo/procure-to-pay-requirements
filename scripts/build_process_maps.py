"""Build the as-is and to-be procure-to-pay process maps (.bpmn + .svg)."""
from pathlib import Path
from bpmn_builder import Process

OUT = Path(__file__).resolve().parents[1] / "process"

# ------------------------------------------------------------------ AS-IS
asis = Process("P2P_AsIs", "Procure-to-pay (as-is)", ["Requester", "Procurement", "Budget holder", "Finance (AP)"])
(asis
 .node("s", "start", "Need identified", "Requester", 0)
 .node("a1", "task", "Email request to procurement", "Requester", 1)
 .node("a2", "task", "Check request for missing details", "Procurement", 2, issue=True)
 .node("g1", "xor", "Complete?", "Procurement", 3)
 .node("a3", "task", "Resend with missing details", "Requester", 3)
 .node("a4", "task", "Work out approver and email for approval", "Procurement", 4, issue=True)
 .node("a5", "task", "Approve by email reply", "Budget holder", 5)
 .node("a6", "task", "Raise PO; collect supplier documents ad hoc", "Procurement", 6, issue=True)
 .node("a7", "task", "Receive goods", "Requester", 7)
 .node("a8", "task", "Match PO, receipt and invoice by hand", "Finance (AP)", 8, issue=True)
 .node("a9", "task", "Pay supplier", "Finance (AP)", 9)
 .node("e", "end", "Supplier paid", "Finance (AP)", 10)
 .flow("s", "a1").flow("a1", "a2").flow("a2", "g1")
 .flow("g1", "a3", "No").flow("a3", "a2")
 .flow("g1", "a4", "Yes").flow("a4", "a5").flow("a5", "a6").flow("a6", "a7")
 .flow("a7", "a8").flow("a8", "a9").flow("a9", "e"))

# ------------------------------------------------------------------ TO-BE
tobe = Process("P2P_ToBe", "Procure-to-pay (to-be)",
               ["Requester", "P2P system", "Budget holder", "Procurement", "Compliance", "Finance (AP)"])
(tobe
 .node("s", "start", "Need identified", "Requester", 0)
 .node("t1", "task", "Submit guided requisition (mandatory fields, budget code)", "Requester", 1)
 .node("t2", "task", "Validate fields and check budget", "P2P system", 2)
 .node("g1", "xor", "Above approval threshold?", "P2P system", 3)
 .node("t3", "task", "Approve or reject with budget shown", "Budget holder", 4)
 .node("t4", "task", "Select supplier from approved list", "Procurement", 5)
 .node("g2", "xor", "Supplier verified?", "P2P system", 6)
 .node("t5", "task", "Verify due diligence documents (KYC)", "Compliance", 7)
 .node("t6", "task", "Issue PO to supplier", "P2P system", 8)
 .node("t7", "task", "Confirm goods receipt", "Requester", 9)
 .node("t8", "task", "Three-way match PO, receipt, invoice", "P2P system", 10)
 .node("g3", "xor", "Within tolerance?", "P2P system", 11)
 .node("t9", "task", "Resolve exception (reason shown)", "Finance (AP)", 11)
 .node("t10", "task", "Release payment", "Finance (AP)", 12)
 .node("e", "end", "Supplier paid", "Finance (AP)", 13)
 .flow("s", "t1").flow("t1", "t2").flow("t2", "g1")
 .flow("g1", "t3", "Yes").flow("g1", "t4", "No").flow("t3", "t4", "Approved")
 .flow("t4", "g2").flow("g2", "t6", "Yes").flow("g2", "t5", "No").flow("t5", "t6")
 .flow("t6", "t7").flow("t7", "t8").flow("t8", "g3")
 .flow("g3", "t10", "Yes", route="elbow").flow("g3", "t9", "No").flow("t9", "t10").flow("t10", "e"))

for p, title, sub in [
    (asis, "Procure-to-pay · as-is", "Email- and spreadsheet-based. Red tasks are the four pain points P-01 to P-04."),
    (tobe, "Procure-to-pay · to-be", "Guided requisition, rule-based approval, supplier verification block and automatic three-way match."),
]:
    stem = "as_is" if "AsIs" in p.pid else "to_be"
    (OUT / f"{stem}.bpmn").write_text(p.to_bpmn())
    (OUT / f"{stem}.svg").write_text(p.to_svg(title, sub))
    print("wrote", stem)
