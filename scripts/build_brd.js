// Builds docs/BRD_Procure_to_Pay.docx from scripts/content.json and the process map PNGs.
// Run: node scripts/build_brd.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, ImageRun, PageBreak, LevelFormat, Footer, PageNumber, BorderStyle,
  TableOfContents, PageOrientation,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const C = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "content.json"), "utf8"));
const FONT = "Calibri";
const INK = "18212C", ACCENT = "2453C4", MUTED = "5B6878", HEAD_FILL = "E8EDF4";
const TABLE_W = 9026; // A4 width minus 1" margins, in DXA

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 276 },
  ...opts,
  children: Array.isArray(text) ? text : [new TextRun({ text, font: FONT, size: 22, color: INK, ...(opts.run || {}) })],
});
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t })] });
const bullet = t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 },
  children: [new TextRun({ text: t, font: FONT, size: 22, color: INK })] });
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 22, color: INK, ...o });

function table(headers, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const scale = TABLE_W / total;
  const w = widths.map(x => Math.round(x * scale));
  w[w.length - 1] += TABLE_W - w.reduce((a, b) => a + b, 0);
  const cell = (text, i, head) => new TableCell({
    width: { size: w[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: HEAD_FILL, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text).split("\n").map(line => new Paragraph({
      spacing: { after: 40 },
      alignment: opts.center && opts.center.includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: line, font: FONT, size: head ? 18 : 19, bold: !!head, color: head ? INK : INK })],
    })),
  });
  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((x, i) => cell(x, i, false)) })),
    ],
  });
}
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });

function image(file, widthPx) {
  const buf = fs.readFileSync(path.join(ROOT, "process", file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: widthPx, height: Math.round(widthPx * h / w) } })] });
}

const reqRows = C.requirements.map(r => [r.id, r.text, r.priority, r.source, r.story]);
const brs = reqRows.filter(r => r[0].startsWith("BR"));
const frs = reqRows.filter(r => r[0].startsWith("FR"));
const nfrs = reqRows.filter(r => r[0].startsWith("NFR"));

const body = [
  // ---------------- cover
  new Paragraph({ spacing: { before: 1800, after: 120 }, children: [run("BUSINESS REQUIREMENTS DOCUMENT", { size: 20, color: ACCENT, bold: true })] }),
  new Paragraph({ spacing: { after: 240 }, children: [run("Controlled procure-to-pay and supplier onboarding", { size: 48, bold: true })] }),
  p("Portfolio case study by Chiamaka Ikpo, based on my experience as a Procurement Officer at a commercial bank. The organisation is anonymised, the process is generalised, and approval values are illustrative. No confidential information is included.", { run: { color: MUTED } }),
  gap(),
  table(["Item", "Detail"], [
    ["Document", "Business Requirements Document (BRD)"],
    ["Version", "1.0 (portfolio edition)"],
    ["Author", "Chiamaka Ikpo, Business Analyst"],
    ["Status", "Draft for stakeholder review"],
    ["Related artefacts", "process/as_is.bpmn, process/to_be.bpmn, backlog/user_stories.csv, docs/P2P_Requirements_Workbook.xlsx"],
  ], [25, 75]),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ spacing: { after: 160 }, children: [run("Contents", { size: 32, bold: true })] }),
  ...["1. Purpose and scope", "2. Background and problem statement", "3. Business objectives and success measures", "4. Stakeholders and RACI",
      "5. Current process (as-is)", "6. Future process (to-be)", "7. Requirements and business rules", "8. User stories",
      "9. Assumptions, constraints, dependencies and risks", "10. Open questions", "11. Sign-off"].map(t => p(t)),
  new Paragraph({ children: [new PageBreak()] }),

  // ---------------- 1
  h1("1. Purpose and scope"),
  p("This document sets out the business requirements for a controlled procure-to-pay (P2P) process covering requisition, approval, supplier onboarding, purchase ordering, goods receipt and invoice matching. It is written for the business owners who must agree the requirements and for the delivery team that will build or configure the solution."),
  h2("1.1 In scope"),
  ...["Requisitions for goods and services raised by internal departments", "Approval routing and the approval matrix", "Supplier onboarding and due diligence (KYC) status", "Purchase order creation and issue", "Goods and service receipt", "Three-way matching of invoice, PO and receipt, and the exception queue", "Audit trail and segregation of duties", "Process performance reporting"].map(bullet),
  h2("1.2 Out of scope"),
  ...["Strategic sourcing and tendering for contracts", "Contract lifecycle management", "Payment execution in the core banking system (the P2P process hands over an approved invoice)", "Choice of software vendor"].map(bullet),

  // ---------------- 2
  h1("2. Background and problem statement"),
  p("Banks are closely regulated, so every purchase must be traceable. The current process relies on email chains, spreadsheets and manual checks. It works, but slowly, and it depends on individuals knowing what to do and who to ask."),
  p([run("Problem statement: ", { bold: true }), run("Incomplete requisitions, email-based approvals, inconsistent supplier onboarding and manual invoice matching slow purchasing down, weaken the audit trail, and create a risk that the bank pays a supplier whose due diligence is incomplete.")]),
  h2("2.1 Pain points"),
  table(["ID", "Pain point", "Impact"], C.pain_points.map(x => [x.id, x.text, x.impact]), [10, 50, 40]),

  // ---------------- 3
  h1("3. Business objectives and success measures"),
  ...["Make the compliant path the easiest path for requesters", "Remove the possibility of issuing POs to unverified suppliers", "Give audit a complete, system-held trail for every purchase", "Pay correctly matched invoices without manual checking"].map(bullet),
  gap(),
  table(["KPI", "Definition", "Target"], C.kpis, [28, 48, 24]),
  p("Baselines will be measured in the first month of discovery, from a sample of recent requisitions and invoices, before targets are confirmed.", { run: { color: MUTED, size: 20 } }),

  // ---------------- 4
  h1("4. Stakeholders"),
  table(["ID", "Stakeholder", "Interest", "Influence", "Impact on them", "Engagement"], C.stakeholders.map(s => s.slice(0, 6)), [8, 20, 28, 11, 11, 22]),
  h2("4.1 RACI"),
  table(["Activity", ...C.raci.roles], C.raci.rows, [32, 17, 17, 17, 17], { center: [1, 2, 3, 4] }),
  p("R = Responsible, A = Accountable, C = Consulted, I = Informed.", { run: { color: MUTED, size: 20 } }),

];
const maps = [
  h1("5. Current process (as-is)"),
  p("The current process is mapped in BPMN 2.0 (process/as_is.bpmn). Tasks shown in red are the four pain points."),
  image("as_is.png", 860),
  new Paragraph({ children: [new PageBreak()] }),
  h1("6. Future process (to-be)"),
  p("The future process (process/to_be.bpmn) moves validation, routing, supplier checks and matching into the system, so people only handle decisions and exceptions."),
  image("to_be.png", 860),
];
const rest = [
  h2("6.1 What changes"),
  table(["Step", "As-is", "To-be", "Pain point addressed"], [
    ["Request", "Free-text email", "Guided form; mandatory fields; valid budget codes only", "P-01"],
    ["Approval", "Procurement works out the approver and emails them", "Rule-based routing from the approval matrix; escalation after 2 days", "P-02"],
    ["Supplier", "Documents collected ad hoc", "Standard checklist; PO blocked unless supplier is Verified", "P-03"],
    ["Invoice", "PO, receipt and invoice compared by hand", "Automatic three-way match; only exceptions reach AP", "P-04"],
  ], [14, 28, 40, 18]),

  // ---------------- 7
  h1("7. Requirements"),
  p("Priorities use MoSCoW (Must, Should, Could, Won't this time). Each requirement traces to a pain point and to the user stories in backlog/user_stories.csv."),
  h2("7.1 Business requirements"),
  table(["ID", "Requirement", "Priority", "Pain point", "Stories"], brs, [9, 55, 10, 12, 14]),
  h2("7.2 Functional requirements"),
  table(["ID", "Requirement", "Priority", "Pain point", "Stories"], frs, [9, 55, 10, 12, 14]),
  h2("7.3 Non-functional requirements"),
  table(["ID", "Requirement", "Priority", "Pain point", "Stories"], nfrs, [9, 55, 10, 12, 14]),
  h2("7.4 Business rules"),
  table(["ID", "Rule", "Detail"], C.rules, [10, 28, 62]),

  // ---------------- 8
  h1("8. User stories"),
  p("The full backlog of 12 stories, with acceptance criteria and estimates, is in backlog/user_stories.csv (Jira import format). The four core stories are:"),
  ...C.stories.slice(0, 4).flatMap(s => [
    new Paragraph({ spacing: { before: 160, after: 60 }, children: [run(`${s.id} · ${s.epic}`, { bold: true, color: ACCENT })] }),
    p(`As a ${s.role}, I want ${s.want}, so that ${s.so}.`),
    ...s.ac.map(a => bullet(a)),
  ]),

  // ---------------- 9
  h1("9. Assumptions, constraints, dependencies and risks"),
  table(["Type", "Item"], [
    ["Assumption", "The bank's ERP or a P2P module can hold supplier status and enforce a PO block."],
    ["Assumption", "Finance will own and maintain the approval matrix and match tolerances."],
    ["Constraint", "Controls must meet the bank's regulatory and internal audit standards; no control may be weakened to save time."],
    ["Dependency", "HR data for line managers and delegates must be current for routing to work."],
    ["Dependency", "Cost centre and budget data must be available to the requisition form."],
    ["Risk", "Requesters work around the system by raising purchases after the fact. Mitigation: retrospective POs reported monthly to the Head of Procurement."],
    ["Risk", "Existing suppliers lack complete documents at go-live and are blocked. Mitigation: a document clean-up sprint before go-live, prioritised by spend."],
  ], [18, 82]),

  // ---------------- 10
  h1("10. Open questions"),
  ...["What are the agreed approval thresholds and who approves at each level? (Values in BRL-01 are placeholders.)", "What price and quantity tolerances will Finance accept for automatic matching?", "Should low-value, low-risk purchases (for example under ₦50,000) use a simpler route or purchase cards?", "How should urgent purchases be handled when a supplier is still Pending?"].map(bullet),

  // ---------------- 11
  h1("11. Sign-off"),
  table(["Role", "Name", "Decision", "Date"], [
    ["Head of Procurement", "", "", ""], ["Head of Finance / AP", "", "", ""], ["Head of Compliance", "", "", ""], ["Business Analyst", "Chiamaka Ikpo", "Author", ""],
  ], [30, 30, 20, 20]),
];

const portrait = { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } };
const footer = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
  children: [new TextRun({ text: "BRD · Procure-to-pay · Chiamaka Ikpo · Page ", font: FONT, size: 16, color: MUTED }),
             new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: MUTED })] })] });

const doc = new Document({
  creator: "Chiamaka Ikpo",
  title: "BRD: Controlled procure-to-pay and supplier onboarding",
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 32, bold: true, color: INK }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 26, bold: true, color: ACCENT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [
    { properties: portrait, footers: { default: footer() }, children: body },
    { properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      footers: { default: footer() }, children: maps },
    { properties: portrait, footers: { default: footer() }, children: rest },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(ROOT, "docs", "BRD_Procure_to_Pay.docx"), buf);
  console.log("wrote docs/BRD_Procure_to_Pay.docx");
});
