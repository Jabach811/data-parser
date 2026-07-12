import argparse
import json
import re
from pathlib import Path

try:
    from pypdf import PdfReader
except Exception as exc:
    raise SystemExit(f"pypdf is required to extract the Fidelity spec PDF: {exc}")


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_HTML_PATH = ROOT / "Workbook Console - Source refresh.html"


REPORT_NAMES = {
    "01": "Participant Name",
    "02D": "Participant Dates",
    "02E": "Employee Number Information",
    "03": "Street Address",
    "04": "City, State, & Zip + 4",
    "05": "Foreign Country Address",
    "06": "Division/Region",
    "07D": "Suspension Start and Reinstatement Dates and Original Participant Date of Death",
    "07DR": "Date of First Contribution Roth",
    "07Y": "Non Qualified Plans Key Employees",
    "08": "Salary",
    "09": "Deferral Percentages",
    "09R": "Roth Deferral Percentages",
    "09PRIOR": "Prior Deferral Percentages for Participants on Suspension",
    "09RPRIOR": "Prior Roth Deferral Percentages for Participants on Suspension",
    "10": "Investment Elections",
    "11": "Participant Status Code",
    "14": "Previous Division, Division Changed Date",
    "3N": "Flexible Deferral Elections",
    "3P": "Participant Enrollment to MPRS",
    "3V": "Prior Status Code for Participants on Suspension",
    "44": "Vesting Modifiers",
    "57": "Misc. Participant Reporting Information I",
    "58": "Salary",
    "60": "Misc. Participant Reporting Information II",
    "61": "Misc. Dates",
    "70": "Deferral Dollar Amounts",
    "70R": "Roth Deferral Dollar Amounts",
    "70PRIOR": "Prior Deferral Dollar Amounts for Participants on Suspension",
    "70RPRIOR": "Prior Roth Deferral Dollar Amounts for Participants on Suspension",
    "93": "Dividend Pass Thru Elections (ESOP)",
    "EA": "E-mail Address",
    "15": "Class Year Buckets",
    "15NC": "Net Contribution Amounts",
    "15WDL": "Withdrawal Restriction Bucket Amounts",
    "16": "Pre-tax Hardship Available",
    "17": "Fresh Start Shares",
    "18": "Pre-87 and Post-86 After-tax Cost Amounts",
    "18R": "Roth Tax Cost Amounts",
    "24": "Federal and State Tax Withholding Information/Distribution Indicators",
    "30": "Contribution Basis",
    "31": "Alternate Payee Name(s) and Address(es)",
    "32": "Alternate Payee Name(s) and Address(es)",
    "33": "Alternate Payee Name(s) and Address(es)",
    "34": "Alternate Payee Name(s) and Address(es)",
    "37": "Loan Information",
    "38": "Loan Information",
    "3A": "Loan Payoff Date",
    "40": "Delinquent Loan Information",
    "41": "Delinquent Loan Information",
    "45": "402G Amounts",
    "47": "SWIP Information",
    "49": "Bank Information on Distributions",
    "49ACH": "Bank Information for ACH Loan Repayments",
    "49ACHAD": "Bank Information for ACH Loan Repayments",
    "49ACHBN": "Bank Information for ACH Loan Repayments",
    "49EFTAD": "Bank Information for EFT Distributions",
    "49EFTBN": "Bank Information for EFT Distributions",
    "51": "Highest Outstanding Loan Balances For the Previous 12 Months",
    "63": "Service Unit History",
    "65": "MRD Information",
    "66": "MRD Information",
    "67": "MRD Information",
    "76": "MRD Information",
    "68": "Beneficiary Information",
    "69": "Beneficiary Information",
    "77": "Balances (Shares/Market Value/Cost)",
    "78": "Summary of Contributions",
    "79": "Outstanding (Unpaid) Loan Balances by Source",
    "WF": "Prior Withdrawals and Forfeitures",
}

VARIANT_CODES = {
    "02": ["02D", "02E"],
    "07": ["07D", "07DR", "07Y"],
    "09": ["09", "09R"],
    "09PRIOR": ["09PRIOR", "09RPRIOR"],
    "15": ["15", "15NC", "15WDL"],
    "18": ["18", "18R"],
    "70": ["70", "70R"],
    "70PRIOR": ["70PRIOR", "70RPRIOR"],
}

REPORT_ORDER = [
    "01", "02D", "02E", "03", "04", "05", "06", "07D", "07DR", "07Y",
    "08", "09", "09R", "09PRIOR", "09RPRIOR", "10", "11", "14", "3N",
    "3P", "3V", "44", "57", "58", "60", "61", "70", "70R", "70PRIOR",
    "70RPRIOR", "93", "EA", "15", "15NC", "15WDL", "16", "17", "18",
    "18R", "24", "30", "31", "32", "33", "34", "37", "38", "3A", "40",
    "41", "45", "47", "49", "49ACH", "49ACHAD", "49ACHBN", "49EFTAD",
    "49EFTBN", "51", "63", "65", "66", "67", "76", "68", "69", "77",
    "78", "79", "WF",
]


def extract_pdf_text(pdf_path):
    reader = PdfReader(str(pdf_path))
    chunks = []
    for idx, page in enumerate(reader.pages, start=1):
        chunks.append(f"\n\n===== PAGE {idx} =====\n{page.extract_text() or ''}")
    return "".join(chunks)


def normalize_ascii(value):
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00a0": " ",
        "\uf0d8": "",
    }
    out = str(value or "")
    for old, new in replacements.items():
        out = out.replace(old, new)
    out = out.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", out).strip()


def picture_from_text(value):
    cleaned = normalize_ascii(value)
    pattern = r"(S?9\(\d+\)\s*V\s*(?:9\(\d+\)|\(\d+\)|9+)|S?9\(\d+\)|X\(\d+\))\)?\s*$"
    match = re.search(pattern, cleaned, re.I)
    if not match:
        return ""
    return re.sub(r"\s+", "", match.group(1)).upper()


def remove_picture(value):
    cleaned = normalize_ascii(value)
    pattern = r"(S?9\(\d+\)\s*V\s*(?:9\(\d+\)|\(\d+\)|9+)|S?9\(\d+\)|X\(\d+\))\)?\s*$"
    match = re.search(pattern, cleaned, re.I)
    return cleaned[:match.start()].strip() if match else cleaned.strip()


def title_field_name(value):
    text = remove_picture(value)
    text = re.sub(r"^#+(?:[-# ]+)?", "", text).strip()
    text = re.sub(r"^(MMDDCCYY|CCYYMMDD)\s+", "", text, flags=re.I)
    text = re.sub(r"^(SEE KEY)\s+", "", text, flags=re.I)
    text = re.sub(r"^\d+\s*-\s*\d+\s+", "", text)
    text = re.sub(r"^[A-Z](?:\s*,\s*[A-Z])+\s+", "", text)
    if re.search(r"\bSOCIAL SECURITY NUMBER\b", text, re.I):
        text = "SOCIAL SECURITY NUMBER"
    elif re.search(r"\bRECORD IDENTIF(?:IE|E)R\b", text, re.I):
        text = "RECORD IDENTIFIER"
    else:
        for _ in range(4):
            next_text = re.sub(r"^(SPACES?|ZEROS?)\s+(.+)$", r"\2", text, flags=re.I).strip()
            if next_text == text:
                break
            text = next_text
        constant_match = re.match(r"^([A-Z0-9]{1,8})\s+(.+)$", text)
        if constant_match and constant_match.group(1).upper() in {"S", "Y", "P", "D", "E", "CLS", "WDL", "NC"}:
            text = constant_match.group(2).strip()
    if not text:
        text = "Field"
    # NOTE: a no-op `text = text.replace("PCTG", "PCTG")` used to live here.
    # Its intent was unclear (possibly an abandoned abbreviation expansion),
    # so it was removed; "PCTG" tokens are title-cased to "Pctg" as before.
    def title_token(token):
        if token in {"#", "ID"}:
            return token
        if "/" in token:
            return "/".join(title_token(part) for part in token.split("/"))
        if "-" in token:
            return "-".join(title_token(part) for part in token.split("-"))
        if re.search(r"\d", token):
            return token[:1].upper() + token[1:].lower() if re.search(r"[A-Z]", token) else token
        return token[:1].upper() + token[1:].lower()

    return " ".join(title_token(part) for part in text.split())


def decimal_places(picture):
    if "V" not in picture:
        return 0
    after = picture.split("V", 1)[1]
    match = re.search(r"9\((\d+)\)", after)
    if match:
        return int(match.group(1))
    match = re.search(r"\((\d+)\)", after)
    if match:
        return int(match.group(1))
    return after.count("9")


def field_type(row_text, picture):
    upper = normalize_ascii(row_text).upper()
    if "MMDDCCYY" in upper or "CCYYMMDD" in upper:
        return "date"
    if "V" in picture:
        return "decimal"
    return "text"


def parse_rows(text):
    rows = []
    pending = None
    page = None
    for line in text.splitlines():
        s = normalize_ascii(line)
        if not s:
            continue
        if s.startswith("===== PAGE"):
            match = re.search(r"PAGE (\d+)", s)
            page = int(match.group(1)) if match else None
            if pending:
                rows.append(pending)
                pending = None
            continue
        if page is None or page > 156:
            continue
        if "RECORD SPECIFICATION DETAILS" in s or s == "DESCRIPTION" or s.startswith("PURPOSE"):
            if pending:
                rows.append(pending)
                pending = None
            continue
        match = re.match(r"^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*(.*)$", s)
        if match:
            if pending:
                rows.append(pending)
            pending = {
                "field": int(match.group(1)),
                "positions": int(match.group(2)),
                "start": int(match.group(3)),
                "end": int(match.group(4)),
                "text": match.group(5),
                "page": page,
            }
            continue
        split_match = re.match(r"^(\d+)\s+(\d+)\s*$", s)
        if split_match:
            if pending:
                rows.append(pending)
            pending = {
                "field": int(split_match.group(1)),
                "positions": int(split_match.group(2)),
                "start": None,
                "end": None,
                "text": "",
                "page": page,
                "need_from_to": True,
            }
            continue
        if pending and pending.get("need_from_to"):
            from_to = re.match(r"^(\d+)\s+(\d+)\s*(.*)$", s)
            if from_to:
                pending["start"] = int(from_to.group(1))
                pending["end"] = int(from_to.group(2))
                pending["text"] = from_to.group(3)
                pending.pop("need_from_to", None)
                continue
        if pending and not re.match(r"^(FIELD|NUMBER|BYTES|FROM|TO|NO\. OF|VALUE|PICTURE)\b", s, re.I):
            pending["text"] += " " + s
    if pending:
        rows.append(pending)
    return [row for row in rows if row.get("start") is not None]


def group_tables(rows):
    tables = []
    current = []
    for row in rows:
        if row["field"] == 1 and row["start"] == 1 and current:
            tables.append(current)
            current = []
        current.append(row)
    if current:
        tables.append(current)
    return tables


def base_record_code(table):
    for row in table:
        if row["start"] <= 31 and row["end"] >= 30 and "RECORD IDENT" in row["text"].upper():
            match = re.search(r"\b([0-9A-Z]{2,8})\s+RECORD IDENT", row["text"], re.I)
            if match:
                return match.group(1).upper()
    return ""


def layout_code(base_code, seen_counts):
    seen_counts[base_code] = seen_counts.get(base_code, 0) + 1
    variants = VARIANT_CODES.get(base_code)
    if variants:
        index = seen_counts[base_code] - 1
        if index < len(variants):
            return variants[index]
    return base_code


def build_layout(row, old_field):
    picture = picture_from_text(row["text"])
    header = title_field_name(row["text"])
    field = {
        "header": header,
        "start": row["start"],
        "length": row["end"] - row["start"] + 1,
        "type": field_type(row["text"], picture),
        "picture": picture,
    }
    places = decimal_places(picture)
    if places:
        field["valueDivisor"] = int(old_field.get("valueDivisor") or (10 ** places))
        field["decimalPlaces"] = places
    if picture.startswith("S9"):
        field["signedLastChar"] = True
    if old_field.get("trimLastChar") and not field.get("signedLastChar"):
        field["trimLastChar"] = True
    return field


def find_old_field(current_layouts, code, row):
    for field in current_layouts.get(code, []):
        if field.get("start") == row["start"] and field.get("length") == row["end"] - row["start"] + 1:
            return field
    return {}


def js_literal(value, indent=4):
    return json.dumps(value, indent=indent, ensure_ascii=True)


def replace_property_block(config_text, prop_name, replacement):
    match = re.search(rf"(\n\s*{prop_name}:\s*)", config_text)
    if not match:
        raise RuntimeError(f"Could not find {prop_name}")
    value_start = match.end()
    opener = config_text[value_start]
    closer = "]" if opener == "[" else "}"
    depth = 0
    in_string = False
    escape = False
    for idx in range(value_start, len(config_text)):
        ch = config_text[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
            continue
        if ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                end = idx + 1
                if end < len(config_text) and config_text[end] == ",":
                    end += 1
                return config_text[:value_start] + replacement + "," + config_text[end:]
    raise RuntimeError(f"Could not replace {prop_name}")


def fidelity_config_text(html):
    marker = "window.FIDELITY_SOURCE_CONFIG = "
    start = html.index(marker)
    object_start = html.index("{", start)
    depth = 0
    for idx in range(object_start, len(html)):
        if html[idx] == "{":
            depth += 1
        elif html[idx] == "}":
            depth -= 1
            if depth == 0:
                return start, idx + 2, html[start:idx + 2]
    raise RuntimeError("Could not find Fidelity config end")


def extract_property_value(config_text, prop_name):
    match = re.search(rf"(\n\s*{prop_name}:\s*)", config_text)
    if not match:
        raise RuntimeError(f"Could not find {prop_name}")
    value_start = match.end()
    opener = config_text[value_start]
    closer = "]" if opener == "[" else "}"
    depth = 0
    in_string = False
    escape = False
    for idx in range(value_start, len(config_text)):
        ch = config_text[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
            continue
        if ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return config_text[value_start:idx + 1]
    raise RuntimeError(f"Could not extract {prop_name}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Rebuild the Fidelity layouts in the workbook console HTML from the Fidelity record/report specification PDF."
    )
    parser.add_argument(
        "pdf",
        type=Path,
        help="Path to the Fidelity 'Record and Report Specifications' PDF.",
    )
    parser.add_argument(
        "--html",
        type=Path,
        default=DEFAULT_HTML_PATH,
        help=f"HTML file to update in place (default: {DEFAULT_HTML_PATH}).",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    pdf_path = args.pdf
    html_path = args.html
    if not pdf_path.is_file():
        raise SystemExit(f"Fidelity spec PDF not found: {pdf_path}")
    if not html_path.is_file():
        raise SystemExit(f"HTML file not found: {html_path}")

    html = html_path.read_text(encoding="utf-8")
    start, end, config = fidelity_config_text(html)
    try:
        current_layouts = json.loads(extract_property_value(config, "layouts"))
    except Exception:
        current_layouts = {}
    rows = parse_rows(extract_pdf_text(pdf_path))
    tables = group_tables(rows)
    seen = {}
    layouts = {}
    for table in tables:
        base = base_record_code(table)
        if not base:
            continue
        code = layout_code(base, seen)
        if code not in REPORT_ORDER:
            continue
        layouts[code] = [build_layout(row, find_old_field(current_layouts, code, row)) for row in table]

    missing = [code for code in REPORT_ORDER if code not in layouts]
    if missing:
        raise RuntimeError(f"Missing expected Fidelity layouts from PDF parse: {missing}")

    report_names = {code: REPORT_NAMES[code] for code in REPORT_ORDER}
    config = replace_property_block(config, "reports", js_literal(REPORT_ORDER))
    config = replace_property_block(config, "reportNames", js_literal(report_names))
    config = replace_property_block(config, "layouts", js_literal(layouts))

    backup_path = html_path.with_suffix(html_path.suffix + ".bak")
    backup_path.write_text(html, encoding="utf-8")
    tmp_path = html_path.with_suffix(html_path.suffix + ".tmp")
    tmp_path.write_text(html[:start] + config + html[end:], encoding="utf-8")
    tmp_path.replace(html_path)
    print(f"Backed up original HTML to: {backup_path}")
    print(f"Updated Fidelity reports: {len(REPORT_ORDER)}")
    print(f"Updated Fidelity layouts: {len(layouts)}")


if __name__ == "__main__":
    main()
