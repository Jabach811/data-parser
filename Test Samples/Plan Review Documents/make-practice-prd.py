"""Builds a made-up Plan Review Document (PRD) in the same layout as the real ones.

Run: python make-practice-prd.py
Writes Practice PRD.docx here. Every name and number in it is invented.

Line shorthand used below:
  **      at the start makes the line bold (a provision title)
  [x] [ ] a ticked / empty legacy check box
  {text}  a typed fill-in (legacy text field); {} is an empty one
  <<y:text>> / <<c:text>>  yellow (question) / teal (confirmed) highlight
  \t      a tab
"""
import os
import re
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Inches, Pt, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
W = nsdecls("w")
RED = "C00000"
_tick_style = [0]


def shade(cell, color):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    cell._tc.get_or_add_tcPr().append(shd)


def repeat_header(row):
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    row._tr.get_or_add_trPr().append(el)


def run(p, text, bold=False, color=None, size=8, highlight=None, underline=False):
    r = p.add_run(text)
    r.font.name = "Arial Narrow"
    r.font.size = Pt(size)
    r.bold = bold
    r.underline = underline
    if color:
        r.font.color.rgb = RGBColor.from_string(color)
    if highlight:
        r.font.highlight_color = highlight
    return r


def check_box(p, on):
    # Word writes a ticked legacy box either as <w:checked/> or as a default of 1; use both.
    _tick_style[0] += 1
    state = ('<w:default w:val="0"/><w:checked/>' if _tick_style[0] % 2 else '<w:default w:val="1"/>') if on else '<w:default w:val="0"/>'
    p._p.append(parse_xml('<w:r %s><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val=""/><w:enabled/>'
                          '<w:calcOnExit w:val="0"/><w:checkBox><w:sizeAuto/>%s</w:checkBox></w:ffData></w:fldChar></w:r>' % (W, state)))
    p._p.append(parse_xml('<w:r %s><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r>' % W))
    p._p.append(parse_xml('<w:r %s><w:fldChar w:fldCharType="end"/></w:r>' % W))


def text_field(p, value, bold=False):
    shown = value if value else " " * 5
    b = "<w:rPr><w:b/></w:rPr>" if bold else ""
    p._p.append(parse_xml('<w:r %s><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val=""/><w:enabled/>'
                          '<w:calcOnExit w:val="0"/><w:textInput/></w:ffData></w:fldChar></w:r>' % W))
    p._p.append(parse_xml('<w:r %s><w:instrText xml:space="preserve"> FORMTEXT </w:instrText></w:r>' % W))
    p._p.append(parse_xml('<w:r %s><w:fldChar w:fldCharType="separate"/></w:r>' % W))
    p._p.append(parse_xml('<w:r %s>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (W, b, shown)))
    p._p.append(parse_xml('<w:r %s><w:fldChar w:fldCharType="end"/></w:r>' % W))


PIECE = re.compile(r"(\[x\]|\[ \]|\{[^}]*\}|<<[yc]:[^>]*>>)")


def line(p, spec, color=None):
    bold = spec.startswith("**")
    if bold:
        spec = spec[2:]
    for piece in PIECE.split(spec):
        if not piece:
            continue
        if piece in ("[x]", "[ ]"):
            check_box(p, piece == "[x]")
            run(p, " ")
        elif piece.startswith("{"):
            text_field(p, piece[1:-1], bold)
        elif piece.startswith("<<"):
            mark = WD_COLOR_INDEX.YELLOW if piece[2] == "y" else WD_COLOR_INDEX.TURQUOISE
            run(p, piece[4:-2], bold=bold, color=color, highlight=mark)
        else:
            run(p, piece, bold=bold, color=color)


def fill(cell, lines, color=None):
    cell.paragraphs[0].text = ""
    for i, spec in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        if spec:
            line(p, spec, color)


# (provisions lines, cite, comments lines, requested changes lines); a plain string is a section heading.
ROWS = [
    "I. Account Information",
    (["**Account Number", "TA099999-00001"], "Initial Sales Email", [], []),
    (["**Effective Date with Transamerica", "1/1/2027"], "Initial Sales Email", [], []),
    (["**Type of Plan", "401(k) Plan"], "AA pg 2", [], []),
    (["**Plan Name", "Harbor View Practice Group 401(k) Plan"], "AA pg 1", [], []),
    (["**Current Document Type", "[x] Pre-approved Plan", "[ ] Individually Designed Plan"], "AA pg 1", [], []),
    "II. Employer Information",
    (["**Sponsoring Employer Name/Address/Phone", "Harbor View Practice Group LLC", "100 Example Way, Suite 200", "Springfield, Colorado 80000"],
     "AA pg 1", [], ["<<y:Per DC checklist the phone number is (555) 010-0100. Please confirm.>> <<c:Confirmed.>>"]),
    (["**Fiscal Year End (Tax Year End)", "December 31st"], "AA pg 1", [], []),
    "IV. Eligibility and Participation",
    (["**Eligibility Provisions", "[ ] Eligibility provisions apply to all sources", "[x] Eligibility provisions vary by source (see below)"],
     "AA pg 5", ["NOTE: Transamerica's Cycle 3 Plan document allows for only one definition of year of service for eligibility."], []),
    (["**Employee Exclusions", "[ ] N/A - No exclusions", "[x] Union employees ({All})", "[x] Non-resident aliens ({All})",
      "[ ] Leased employees ({})", "[x] Residents of Puerto Rico ({All})", "[ ] Highly compensated employees ({})",
      "[x] Other: {Interns and temporary employees hired through a staffing agency} ({ER sources})"],
     "AA pg 5-6", ["NOTE: Any part-time/temporary/seasonal employee will be eligible to make Elective Deferrals under the long-term, part-time rules."], []),
    (["**Minimum Age", "[ ] No minimum age ({})", "[x] Age {21} ({All})"], "AA pg 6", [], []),
    (["**Service Requirement", "[ ] No service ({})", "[x] No service ({Elective and Roth deferrals})", "[x] {1} year(s) of service ({ER sources})",
      "[ ] {} months of service ({})"],
     "AA pg 6", [], ["Mailing Kits:", "<<y:Please confirm the one year of service applies to employer sources only.>> <<c:Confirmed 12/1/2026.>>"]),
    (["**Hours of Service for Eligibility", "[x] {1,000} hours in an eligibility computation period", "[ ] Elapsed time method"], "AA pg 7", [], []),
    (["**Eligibility Computation Period", "[x] Shifts to the plan year after the first computation period", "[ ] Anniversary of date of hire (no shift)"], "AA pg 7", [], []),
    (["**Entry Dates", "[ ] Immediate ({})", "[x] 1st day of the month on or next following ({EE sources})",
      "[ ] 1st day of the payroll period on or next following ({})", "[x] 1st day of the plan year quarter on or next following ({ER sources})",
      "[ ] Other: {} ({})", "(cannot be a date later than the latest date permitted under Code § 410(a)(4))"], "AA pg 10-11", [], []),
    (["**Waiver of Eligibility Requirements (Open Enrollment)", "[x] N/A - This is not a start-up Plan", "[ ] All must meet the age and service requirements",
      "The service and/or age requirements will be waived in accordance with the following:", "[ ] If employed on {}, the requirements elected below will be waived"],
     "AA pg 11", [], []),
    "V. Service Crediting",
    (["**Service with Unrelated Predecessor Employers", "[x] N/A - the plan does not recognize service with any unrelated predecessor employer",
      "[ ] The plan will recognize service with all unrelated predecessor employers for all purposes under the plan"], "AA pg 8", [], []),
    "VI. Vesting",
    (["**Vesting Schedules", "Option\tYears/Periods of Service", "\t1\t2\t3\t4\t5\t6", "1.\t100% immediate", "2.\t{}%\t100%",
      "3.\t{}%\t{}%\t100%", "4.\t{25}%\t{50}%\t75%\t100%\t100%\t100%", "5.\t{20}%\t{40}%\t60%\t80%\t100%\t100%",
      "6.\t{0}%\t{20}%\t40%\t60%\t80%\t100%", "7.\t{}%\t{}%\t{}%\t{}%\t{}%\t100%", "",
      "Employer Contribution\tVesting Schedule Option", "All Employer Contributions\t{}", "Matching Contribution #1\t{6}",
      "Matching Contribution #2\t{}", "Nonelective Contribution\t{5}", "QACA Safe Harbor Contribution\t{}",
      "Top Heavy Minimum Contribution\t{}", "Other: {Prior QNEC} (i.e., frozen or protected source)\t{1}"],
     "AA pg 29", ["NOTE: Changes to the calculation of a participant's vested percentage are subject to the protections in Code 411(a)(10)."],
     ["Transamerica's Approving: [x] Yes [ ] No"]),
    (["**Vesting Computation Period", "[x] Plan Year", "[ ] Anniversary of date of hire"], "AA pg 29", [], []),
    (["**Vesting Service Excluded", "The following service with the employer is excluded:", "[x] None - all service with the employer counts for vesting purposes",
      "[ ] Service before the original effective date of the plan or a predecessor plan is excluded",
      "[ ] Service completed before the employee's 18th birthday is excluded"], "AA pg 30", [], []),
    (["**Vesting Upon Death, Disability or Early Retirement Age While Employed",
      "Regardless of the vesting schedule, a Participant will become fully vested upon:", "[x] Death", "[x] Disability", "[ ] Early Retirement Age"],
     "AA pg 28", ["NOTE: If plan does not provide for an ERD, make sure reference to vesting at ERD is not included."], []),
    "VIII. Compensation",
    (["**Compensation Definition", "[ ] W-2 Wages ({})", "[ ] Code § 3401(a) Wages ({})", "[x] Code § 415 safe harbor compensation ({All})"],
     "AA pg 15", [], []),
    (["**Compensation Determination Period", "[x] Plan Year ({All})", "[ ] Employee's final year ending with or within the Plan Year ({})"], "AA pg 15", [], []),
    (["**Compensation for Initial Year of Participation", "[ ] Only Compensation earned while a participant ({})", "[x] Compensation for the entire Plan Year ({All})"],
     "AA pg 15", [], []),
    (["**Compensation Exclusions", "[ ] N/A - No exclusions", "[x] Bonuses ({ER sources})", "[ ] Overtime ({})", "[ ] Commissions ({})",
      "[x] Other: {Group term life insurance premiums, HSA employer contributions, phone reimbursements} ({All})"], "AA pg 16", [], []),
    (["**Post-Severance Compensation Exclusions", "[ ] Regular pay ({})", "[ ] Leave cash-outs ({})", "[x] Disability continuation payments ({All})"],
     "AA pg 6", ["NOTE: Transamerica's default is to exclude disability continuation payments from post-severance compensation."], []),
    "IX. Employee Contributions",
    (["**Elective Deferrals (Pre-tax)", "[ ] Up to {}%", "[ ] From {}% to maximum of {}%", "[x] Maximum allowable by law"],
     "AA pg 12", [], ["Outsourced: [ ] Yes [x] No", "OBF Frequency: {9 days before each pay period}"]),
    (["**Roth 401(k) Deferrals", "[ ] No", "[x] Yes"], "AA pg 12", [], []),
    (["**Age 50 Catch-up Contributions:", "[ ] Catch-up contributions are NOT allowed", "[x] Catch-up contributions are allowed",
      "[x] Catch-up contributions are matched", "[ ] Catch-up contributions are NOT matched", "",
      "**<<y:Higher Catch-Up limit applies>> (applicable for calendar years beginning on/after 1/1/25):", "[ ] No", "[x] Yes"],
     "AA pg 16 and pg 23", ["NOTE: Transamerica will apply the SECURE 2.0 higher catch-up limit unless the Plan Sponsor specifically directs otherwise."],
     ["<<y:Please confirm if higher catch-up limits apply.>> <<c:Confirmed yes.>>", "Catch-up elections exist - <<c:confirmed spillover>>",
      "[x] Yes [ ] No", "<<c:Confirmed Deemed for Roth Catch-up.>>"]),
    (["**Automatic Elective Deferrals", "[ ] N/A", "[x] ACA", "[ ] EACA", "[ ] QACA",
      "**Initial (default) Automatic Enrollment Rate: {4} %", "Effective date of automatic enrollment: {1/1/2024}"],
     "AA pg 14", [], ["<<y:Please confirm auto enroll effective date.>> <<c:Confirmed 1/1/2024.>>"]),
    (["**Escalation in Automatic Percentage for ACA or EACA", "[ ] N/A - No automatic escalation",
      "[x] Annual increase in Automatic Enrollment Percentage: {1} % each year up to a maximum of {10} %", "First increase effective 1/1/2028"],
     "Amendment 1", [], ["Escalation Applies: [x] Yes [ ] No", "Date escalation provision was added: <<c:Amended 10/1/2027, first increase 1/1/2028>>", "Annual Increase: {1}%"]),
    (["**Timing of Increase in Automatic Percentage", "[x] First day of the plan year", "[ ] Anniversary of the participant's automatic enrollment",
      "[ ] Specific increase date: {}"], "Amendment 1", [], []),
    "XI. Employer Contributions",
    (["**Matching Contribution #1", "[x] Elective (including Roth deferrals)", "[ ] Voluntary After-tax"], "AA pg 22-23", [],
     ["Transamerica calculates Match: [x] Yes [ ] No"]),
    "XII. Distribution Provisions",
    (["**Normal Form of Benefit", "[x] Lump sum. No annuities are offered under the plan"], "AA pg 34", [], []),
    "XVI. Loan Provisions",
    (["**Loans", "[ ] Participant loans are not permitted", "[x] Participant loans are permitted"], "Loan Policy", [],
     ["Repayment: {Payroll}", "Default Frequency: {Semi-monthly}"]),
    (["**Minimum Loan Amount", "${1,000}"], "Loan Policy", [], []),
    (["**Sources Available for Loans", "[x] All sources", "[ ] Specific sources only: {}"], "Loan Policy", [], []),
    (["**Maximum Number of Loans Outstanding", "{2 (two)}"], "Loan Policy", [], []),
    (["**Loan Term", "General purpose loans: {60} months", "Home loans permitted: [x] Yes [ ] No", "Home loan term: {360} months"], "Loan Policy", [], []),
    (["**Interest Rate", "Prime + {1}%", "Rate is reset: {Monthly}"], "Loan Policy", [], []),
    (["**Terminated Participants", "May continue to repay: [ ] Yes [x] No", "May initiate new loans: [ ] Yes [x] No"], "Loan Policy", [], []),
    (["**Refinancing", "[ ] Permitted", "[x] Not permitted"], "Loan Policy", [], []),
]

CONTRIB_TYPES = [
    ("Elective Deferrals", True, "Active", "Qualified Match", False, ""),
    ("Roth Elective Deferrals", True, "Active", "Nonelective", True, "Active"),
    ("Voluntary After-tax", True, "Frozen", "Safe Harbor Nonelective", False, ""),
    ("Rollover", True, "Active", "QACA Safe Harbor Nonelective", False, ""),
    ("Match #1", True, "Active", "Qualified Nonelective", True, "Frozen"),
    ("Match #2", False, "", "Other:", False, ""),
]

MAPPING_HEAD = ["Current Source", "W/D Rules (Current)", "Vesting Schedule (Current)", "Transamerica Statement Name* (Report Output Tab)",
                "W/D Rules (New)", "Vesting Schedule (New)", "Freq. of Contrib.", "Active or Frozen"]
MAPPING = [
    ["Employee Before Tax", "Age 59 ½, Loans, Hardship", "100% Immediate", "Employee Pre-tax", "Age 59 ½, Loans, Hardship", "100% Immediate", "Payroll", "Active"],
    ["Roth Contribution", "Age 59 ½, Loans, Hardship", "100% Immediate", "Roth Deferral", "Age 59 ½, Loans, Hardship", "100% Immediate", "Payroll", "Active"],
    ["Employer Match", "Age 59 ½", "Option 6", "Employer Match", "Age 59 ½", "Option 6", "Payroll", "Active"],
    ["Profit Sharing", "Age 59 ½", "Option 5", "Employer Nonelective", "Age 59 ½", "Option 5", "Annual", "Active"],
    ["QNEC", "Age 59 ½", "100% Immediate", "Prior QNEC", "Age 59 ½", "100% Immediate", "N/A", "Frozen"],
    ["Voluntary After-tax", "Anytime", "100% Immediate", "Prior Employee After-tax", "Anytime", "100% Immediate", "N/A", "Frozen"],
    ["Employee Rollover", "Anytime, Loans", "100% Immediate", "Rollover", "Anytime, Loans", "100% Immediate", "As Needed", "Active"],
    ["Roth Rollover", "Anytime, Loans", "100% Immediate", "Roth Rollover", "Anytime, Loans", "100% Immediate", "As Needed", "Active"],
    ["N/A", "", "", "Unclaimed Benefit", "Anytime, No Loans", "100%", "N/A", "Active"],
]


def build(path):
    doc = Document()
    sec = doc.sections[0]
    sec.orientation = WD_ORIENT.LANDSCAPE
    sec.page_width, sec.page_height = Inches(11), Inches(8.5)
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Inches(0.5))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run(p, "TA099999-00001", bold=True, size=11, underline=True)
    p = doc.add_paragraph()
    run(p, "Contribution Types provided under the plan document:", bold=True, size=10)
    ct = doc.add_table(rows=1, cols=6)
    ct.style = "Table Grid"
    for cell, text in zip(ct.rows[0].cells, ["Source", "", "Active or Frozen", "Source", "", "Active or Frozen"]):
        run(cell.paragraphs[0], text, bold=True)
    for left, lon, lstate, right, ron, rstate in CONTRIB_TYPES:
        cells = ct.add_row().cells
        run(cells[0].paragraphs[0], left)
        check_box(cells[1].paragraphs[0], lon)
        run(cells[2].paragraphs[0], lstate)
        run(cells[3].paragraphs[0], right)
        check_box(cells[4].paragraphs[0], ron)
        run(cells[5].paragraphs[0], rstate)
    doc.add_paragraph()

    widths = [Inches(4.2), Inches(0.9), Inches(2.4), Inches(2.5)]
    table = doc.add_table(rows=1, cols=4)
    table.style = "Table Grid"
    table.autofit = False
    hrow = table.rows[0]
    repeat_header(hrow)
    for cell, text, w in zip(hrow.cells, ["Current Plan Provisions", "Cite", "Comments", "Requested Changes/\nAdministrative Information"], widths):
        cell.width = w
        shade(cell, "BFBFBF")
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        run(cell.paragraphs[0], text, bold=True, size=9)
    for item in ROWS:
        cells = table.add_row().cells
        for c, w in zip(cells, widths):
            c.width = w
        if isinstance(item, str):
            merged = cells[0].merge(cells[3])
            shade(merged, "D9D9D9")
            run(merged.paragraphs[0], item, bold=True, color=RED, size=9)
            continue
        prov, cite, comments, requested = item
        fill(cells[0], prov)
        fill(cells[1], [cite])
        fill(cells[2], comments)
        fill(cells[3], requested)

    doc.add_paragraph()
    m = doc.add_table(rows=3 + len(MAPPING), cols=8)
    m.style = "Table Grid"
    title = m.rows[0].cells[0].merge(m.rows[0].cells[7])
    shade(title, RED)
    title.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    run(title.paragraphs[0], "Source Mapping", bold=True, color="FFFFFF", size=14)
    run(m.rows[1].cells[0].paragraphs[0], "Date of Last Update:", bold=True)
    for cell, text in zip(m.rows[2].cells, MAPPING_HEAD):
        shade(cell, "D9D9D9")
        run(cell.paragraphs[0], text, bold=True)
    for row, values in zip(m.rows[3:], MAPPING):
        for cell, text in zip(row.cells, values):
            run(cell.paragraphs[0], text)
    doc.save(path)


if __name__ == "__main__":
    out = os.path.join(HERE, "Practice PRD.docx")
    build(out)
    print(out)
