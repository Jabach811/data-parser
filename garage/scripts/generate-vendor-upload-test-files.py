from pathlib import Path
from shutil import copyfile

from openpyxl import Workbook


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "garage" / "test-upload-files" / "vendor-file-picker"


def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)


def write_text(path, lines):
    ensure_dir(path.parent)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def fixed_line(min_len, placements):
    chars = [" "] * min_len
    for start, length, value in placements:
        text = str(value)
        if len(text) > length:
            text = text[:length]
        for offset, char in enumerate(text.ljust(length)):
            index = start - 1 + offset
            if index >= len(chars):
                chars.extend([" "] * (index - len(chars) + 1))
            chars[index] = char
    return "".join(chars).rstrip()


def copy_fidelity():
    src = ROOT / "garage" / "test-fixtures" / "fidelity-summary-tabs-mock.txt"
    dst = OUT / "fidelity" / "FIDELITY_summary_tabs_mock.txt"
    ensure_dir(dst.parent)
    copyfile(src, dst)


def newport_lines():
    ssn = "111223333"
    loan = "L0001"
    return [
        fixed_line(132, [
            (1, 2, "PR"), (3, 9, ssn), (22, 16, "5.50"), (38, 16, "0.00"),
            (54, 17, "100.00"), (71, 17, "0.00"), (100, 16, "6.00"),
            (116, 17, "125.00"),
        ]),
        fixed_line(706, [
            (1, 2, "PT"), (3, 9, ssn), (553, 10, "2023-01-01"),
            (563, 17, "200.00"), (580, 10, "2023-12-31"), (590, 17, "180.00"),
            (418, 17, "50000.00"), (435, 10, "2024-01-01"),
            (445, 17, "2500.00"), (462, 10, "2024-02-01"),
            (472, 17, "900.00"), (489, 10, "2024-02-01"),
            (499, 17, "100.00"), (516, 10, "2024-02-01"),
            (685, 17, "2600.00"),
        ]),
        fixed_line(378, [
            (1, 2, "LN"), (3, 9, ssn), (12, 5, loan), (17, 17, "950.00"),
            (34, 10, "2023-02-01"), (44, 17, "1000.00"), (61, 17, "50.00"),
            (78, 16, "5.25"), (111, 1, "M"), (113, 1, "N"), (131, 10, "2024-01-01"),
        ]),
        fixed_line(104, [
            (1, 2, "LD"), (3, 9, ssn), (12, 5, loan), (17, 3, "ER"),
            (20, 17, "600.00"), (71, 17, "150.00"), (88, 17, "25.00"),
        ]),
        fixed_line(104, [
            (1, 2, "LD"), (3, 9, ssn), (12, 5, loan), (17, 3, "EE"),
            (20, 17, "350.00"), (71, 17, "100.00"), (88, 17, "15.00"),
        ]),
        fixed_line(34, [
            (1, 2, "HR"), (3, 9, ssn), (12, 1, "H"), (13, 10, "2024-12-31"),
            (23, 8, "1460.00"), (31, 3, "2.0"),
        ]),
        fixed_line(98, [
            (1, 2, "MT"), (3, 9, ssn), (12, 3, "ER"),
            (48, 17, "1200.00"), (65, 17, "100.00"), (82, 17, "75.00"),
        ]),
        fixed_line(90, [
            (1, 2, "VA"), (3, 9, ssn), (12, 3, "ER"), (15, 10, "FND01"),
            (25, 17, "600.00"), (42, 16, "65.00"),
        ]),
        fixed_line(90, [
            (1, 2, "VA"), (3, 9, ssn), (12, 3, "EE"), (15, 10, "FND02"),
            (25, 17, "350.00"), (42, 16, "35.00"),
        ]),
    ]


def nationwide_lines():
    ssn = "111223333"
    loan = "L0001"
    return [
        fixed_line(132, [
            (1, 2, "PR"), (3, 9, ssn), (22, 16, "5.50"), (38, 16, "0.00"),
            (54, 17, "100.00"), (71, 17, "0.00"), (100, 16, "6.00"),
            (116, 17, "125.00"),
        ]),
        fixed_line(706, [
            (1, 2, "PT"), (3, 9, ssn), (553, 10, "2023-01-01"),
            (563, 17, "200.00"), (580, 10, "2023-12-31"), (590, 17, "180.00"),
        ]),
        fixed_line(378, [
            (1, 2, "LN"), (3, 9, ssn), (12, 5, loan), (17, 17, "950.00"),
            (34, 10, "2023-02-01"), (44, 17, "1000.00"), (61, 17, "50.00"),
            (78, 16, "5.25"), (101, 10, "2023-03-01"), (131, 10, "2024-01-01"),
        ]),
        fixed_line(104, [
            (1, 2, "LD"), (3, 9, ssn), (12, 5, loan), (17, 3, "ER"),
            (20, 17, "600.00"),
        ]),
        fixed_line(104, [
            (1, 2, "LD"), (3, 9, ssn), (12, 5, loan), (17, 3, "EE"),
            (20, 17, "350.00"),
        ]),
    ]


def adp_lines():
    ssn = "111223333"
    return [
        fixed_line(574, [
            (1, 2, "PH"), (3, 9, ssn), (12, 30, "DOE JOHN"), (329, 5, "4.00"),
            (539, 4, "2.0"), (543, 8, "03012022"), (563, 11, "275.00"),
            (113, 5, "3.00"), (118, 7, "1540.0"),
        ]),
        fixed_line(73, [
            (1, 2, "PF"), (3, 9, ssn), (12, 2, "AA"), (14, 1, "R"),
            (15, 4, "7500"), (20, 11, "125000.00"),
        ]),
        fixed_line(138, [
            (1, 2, "LH"), (3, 9, ssn), (12, 3, "101"), (15, 8, "01012023"),
            (23, 8, "02012023"), (31, 8, "01152023"), (39, 11, "1000.00"),
            (50, 11, "800.00"), (61, 7, "6.50"), (68, 11, "75.00"),
            (80, 8, "01012025"), (90, 11, "0.00"), (101, 11, "0.00"),
        ]),
        fixed_line(52, [
            (1, 2, "LF"), (3, 9, ssn), (12, 2, "AA"), (14, 1, "R"),
            (15, 3, "101"), (19, 11, "700.00"), (31, 11, "200.00"), (43, 9, "25.00"),
        ]),
        fixed_line(52, [
            (1, 2, "LF"), (3, 9, ssn), (12, 2, "BB"), (14, 1, "E"),
            (15, 3, "101"), (19, 11, "300.00"), (31, 11, "75.00"), (43, 9, "10.00"),
        ]),
    ]


def empower_lines():
    participants = [
        {
            "ssn": "111223333", "last": "DOE", "first": "JOHN", "deferral_type": "PRETX",
            "deferral_percent": "6.00", "deferral_amount": "0.00", "roth_amount": "1250.00",
            "basis": "275.00", "loan": "LN001", "repay": "75.00", "loan_original": "1000.00",
            "loan_outstanding": "800.00", "loan_splits": [("EE", "70.00"), ("ER", "30.00")],
            "balances": [("RTH", "0001", "FND01", "1250.00"), ("PRE", "0002", "FND02", "2840.00")],
            "allocations": [("RTH", "0001", "FND01", "60.00"), ("PRE", "0002", "FND02", "40.00")]
        },
        {
            "ssn": "222334444", "last": "CHEN", "first": "MARA", "deferral_type": "ROTH",
            "deferral_percent": "4.00", "deferral_amount": "25.00", "roth_amount": "980.00",
            "basis": "310.00", "loan": "", "balances": [("RTH", "0001", "FND03", "980.00"), ("ERM", "0002", "FND02", "520.00")],
            "allocations": [("RTH", "0001", "FND03", "75.00"), ("ERM", "0002", "FND02", "25.00")]
        },
        {
            "ssn": "333445555", "last": "RIVERA", "first": "LUIS", "deferral_type": "PRETX",
            "deferral_percent": "8.00", "deferral_amount": "0.00", "roth_amount": "725.00",
            "basis": "190.00", "loan": "LN204", "repay": "110.00", "loan_original": "2500.00",
            "loan_outstanding": "1875.00", "loan_splits": [("EE", "65.00"), ("ER", "35.00")],
            "balances": [("PRE", "0001", "FND01", "3400.00"), ("RTH", "0002", "FND05", "725.00")],
            "allocations": [("PRE", "0001", "FND01", "80.00"), ("RTH", "0002", "FND05", "20.00")]
        },
        {
            "ssn": "444556666", "last": "PATEL", "first": "AISHA", "deferral_type": "PRETX",
            "deferral_percent": "5.00", "deferral_amount": "50.00", "roth_amount": "1425.00",
            "basis": "455.00", "loan": "", "balances": [("RTH", "0001", "FND01", "1425.00"), ("PRE", "0002", "FND04", "2310.00")],
            "allocations": [("RTH", "0001", "FND01", "55.00"), ("PRE", "0002", "FND04", "45.00")]
        },
    ]
    lines = []
    for person in participants:
        base = [(20, 9, person["ssn"]), (46, 35, person["last"]), (81, 20, person["first"])]
        lines.append(fixed_line(254, [
            (1, 6, "DFRL"), *base, (136, 6, person["deferral_type"]),
            (159, 8, "20240101"), (167, 9, person["deferral_percent"]),
            (176, 18, person["deferral_amount"]), (246, 8, "20250101"),
        ]))
        lines.append(fixed_line(266, [
            (1, 6, "ITD"), *base, (136, 3, "RTH"), (139, 4, "0001"),
            (143, 3, "CNT"), (146, 3, "DEP"), (149, 18, person["roth_amount"]),
            (257, 10, "2022-03-01"),
        ]))
        lines.append(fixed_line(342, [
            (1, 6, "PYEB"), *base, (136, 4, "COST"), (140, 6, person["basis"]),
            (146, 3, "RTH"), (149, 4, "0001"), (153, 8, "20231231"),
            (161, 182, person["basis"]),
        ]))
        if person.get("loan"):
            lines.append(fixed_line(418, [
                (1, 6, "LOANS"), *base, (136, 10, person["loan"]),
                (162, 8, "20240201"), (172, 18, person["repay"]),
                (198, 18, person["loan_original"]), (249, 18, person["loan_outstanding"]),
                (267, 8, "20260101"), (410, 8, "20240115"),
            ]))
            for index, (money_type, split_percent) in enumerate(person.get("loan_splits", []), start=1):
                lines.append(fixed_line(180, [
                    (1, 6, "LOMNTY"), *base, (136, 10, person["loan"]),
                    (146, 3, money_type), (149, 4, f"{index:04d}"),
                    (153, 11, split_percent), (164, 8, "20240101"),
                ]))
        for money_type, sequence, fund, amount in person["balances"]:
            lines.append(fixed_line(284, [
                (1, 6, "BALANC"), *base, (136, 3, money_type),
                (139, 4, sequence), (143, 7, fund), (150, 18, amount),
                (276, 8, "20240131"),
            ]))
        for money_type, sequence, fund, percent in person["allocations"]:
            lines.append(fixed_line(160, [
                (1, 6, "ALLOC"), *base, (136, 3, money_type),
                (139, 4, sequence), (143, 7, fund), (150, 7, percent),
                (157, 1, "N"),
            ]))
    return lines


def paychex_balance_lines():
    return [
        "PLAN 123-456 PAYCHEX TEST PLAN",
        "AS OF 2024/01/31",
        "PARTICIPANT VALUATION SUMMARY",
        "111-22-3333 STATUS: ACTIVE 01 LOCATION: TEST",
        "=>DOE JOHN",
        "Target Fund  AAE  50.00%  1000.00  100.00  25.00  0.00  0.00  0.00  1125.00",
        "Loan Source  L0E  0.00%  750.00  0.00  0.00  0.00  -50.00  0.00  750.00",
    ]


def paychex_loan_lines():
    return [
        "PLAN 123-456 PAYCHEX TEST PLAN",
        "AS OF 2024/01/31",
        "EMPLOYEE LOAN PAYMENT SCHEDULE",
        "111-22-3333 DOE JOHN",
        "LOAN #",
        "1",
        "L O A N  S U M M A R Y",
        "001  1000.00  X  X  750.00  2024/01/01  6.25%  26-BI WEEKLY  1-ACTIVE",
        "1-ACTIVE",
        "P A Y M E N T  S E C T I O N",
        "50.00  50.00  2024/02/01  X  2024/01/15  X",
    ]


def oneamerica_balance_lines():
    return [
        "PLAN A-12345 ONEAMERICA TEST PLAN",
        "AS OF 01/31/2024",
        "PARTICIPANT VALUATION SUMMARY",
        "111-22-3333 STATUS: ACTIVE 01 LOCATION: TEST",
        "=>DOE JOHN",
        "Target Fund  AAE  50.00%  1000.00  100.00  25.00  0.00  0.00  0.00  1125.00",
    ]


def oneamerica_loan_lines():
    return [
        "01/31/2024 ACTIVE LOANS OF TERMINATED PLANS",
        "A12345 - ONEAMERICA TEST PLAN",
        "111223333 - DOE JOHN",
        "001 01/01/2024 $75.00 BIWEEKLY 6.25 02/01/2024",
        "Status: ACTIVE",
        "EE SOURCE $500.00 $375.00 | ER SOURCE $500.00 $375.00",
    ]


def vanguard_line(placements, length=170):
    return fixed_line(length, placements)


def vanguard_recordkeeping_lines():
    pid = "111223333"
    name = "DOE JOHN"
    common = [(1, 6, "123456"), (7, 9, pid), (26, 4, "0001"), (30, 30, name)]
    return [
        vanguard_line(common + [(16, 3, "010"), (160, 2, "00")]),
        vanguard_line(common + [
            (16, 3, "020"), (70, 6, "FUND01"), (76, 3, "EE"),
            (79, 15, "100000"), (94, 13, "100000"),
            (107, 15, "2500"), (122, 17, "112500"),
            (139, 13, "100000"), (152, 5, "6000"),
        ]),
        vanguard_line(common + [
            (16, 3, "050"), (70, 3, "001"), (77, 12, "100000"),
            (89, 12, "75000"), (101, 8, "6250000"), (109, 8, "20230101"),
            (117, 8, "20230102"), (125, 8, "20240201"), (133, 8, "20250101"),
            (141, 12, "5000"), (153, 1, "1"), (154, 1, "6"),
            (155, 1, "0"), (156, 1, "0"),
        ]),
        vanguard_line(common + [
            (16, 3, "053"), (70, 3, "001"), (73, 3, "EE"),
            (76, 17, "50000"), (93, 12, "15000"),
        ]),
        vanguard_line(common + [
            (16, 3, "053"), (70, 3, "001"), (73, 3, "ER"),
            (76, 17, "25000"), (93, 12, "7500"),
        ]),
    ]


def vanguard_payroll_lines():
    pid = "111223333"
    name = "DOE JOHN"
    common = [(1, 6, "123456"), (7, 9, pid), (26, 4, "0001"), (30, 30, name)]
    return [
        vanguard_line(common + [
            (16, 3, "120"), (70, 3, "EE"), (73, 4, "PCT"),
            (77, 7, "6000"), (84, 16, "0"), (100, 8, "20240101"),
            (108, 4, "INIT"),
        ])
    ]


def voya_lines():
    pid = "111223333"
    return [
        fixed_line(140, [
            (1, 6, "123456"), (7, 3, "001"), (10, 17, pid), (27, 3, "001"),
            (46, 2, "LH"), (49, 8, "20230101"), (58, 8, "20240201"),
            (67, 8, "20240115"), (75, 11, "1000.00"), (95, 11, "750.00"),
            (106, 7, "6.25"), (113, 11, "75.00"), (124, 1, "B"),
            (126, 8, "20250101"),
        ]),
        fixed_line(120, [
            (1, 6, "123456"), (7, 3, "001"), (10, 17, pid), (27, 3, "001"),
            (30, 3, "EE"), (46, 2, "LF"), (48, 11, "500.00"),
            (59, 11, "125.00"), (70, 11, "25.00"), (92, 5, "70.0"),
        ]),
    ]


def principal_workbook():
    path = OUT / "principal" / "1-12345 Principal Test.xlsx"
    ensure_dir(path.parent)
    wb = Workbook()
    ws = wb.active
    ws.title = "Account Value Data"
    ws.append(["EE SS#", "CONTRIBUTION ID", "Investment", "End Balance"])
    ws.append(["111223333", "EE", "Investment A", 1250.00])
    ws.append(["111223333", "ER", "Investment B", 750.00])
    wb.save(path)


def write_readme():
    write_text(OUT / "README.md", [
        "# Vendor File Picker Test Files",
        "",
        "Use these files with `Workbook Console - Source refresh.html` after selecting the matching vendor.",
        "For vendors with more than one file listed, select all listed files together in the file picker.",
        "",
        "| Vendor | Select these file(s) |",
        "|---|---|",
        "| Fidelity | `fidelity/FIDELITY_summary_tabs_mock.txt` |",
        "| Newport | `newport/PME_vendor_summary_test.txt` |",
        "| Nationwide | `nationwide/NWI_vendor_summary_test.txt` |",
        "| ADP | `adp/123456_EXTRAC.txt`, `adp/123456_REPORT.txt` |",
        "| Empower | `empower/d123456_test.txt`, `empower/s123456_summary.txt` |",
        "| Paychex | `paychex/123456M.txt`, `paychex/123456LN.txt` |",
        "| OneAmerica | `oneamerica/A12345PV.TXT`, `oneamerica/A12345LN.TXT` |",
        "| Vanguard | `vanguard/ENTJ767_TEST.txt`, `vanguard/ENTJ768_TEST-PAYROLL-PART.txt` |",
        "| Voya | `voya/EXTRACT_LH_123456.TXT`, `voya/EXTRACT_LF_123456.TXT` |",
        "| Principal | `principal/1-12345 Principal Test.xlsx` |",
        "",
        "These are synthetic test files for parser/export validation only.",
    ])


def main():
    copy_fidelity()
    write_text(OUT / "newport" / "PME_vendor_summary_test.txt", newport_lines())
    write_text(OUT / "nationwide" / "NWI_vendor_summary_test.txt", nationwide_lines())
    write_text(OUT / "adp" / "123456_EXTRAC.txt", adp_lines())
    write_text(OUT / "adp" / "123456_REPORT.txt", [
        "TOTALS BY SOURCE",
        "SOURCE R  0.00  0.00  1250.00",
        "TOTALS BY FUND",
        "FUND AA  0.00  0.00  1250.00",
    ])
    write_text(OUT / "empower" / "d123456_test.txt", empower_lines())
    write_text(OUT / "empower" / "s123456_summary.txt", [
        "ACCOUNT BALANCE SUMMARY by Money Type",
        "RTH 1  ROTH SOURCE  0.00  4380.00",
        "PRE 2  PRE TAX SOURCE  0.00  8550.00",
        "ERM 3  EMPLOYER MATCH  0.00  520.00",
        "sum  0.00  13450.00",
        "ACCOUNT BALANCE SUMMARY by Fund",
        "FND01  0.00  6075.00",
        "FND02  0.00  3360.00",
        "FND03  0.00  980.00",
        "FND04  0.00  2310.00",
        "FND05  0.00  725.00",
    ])
    write_text(OUT / "paychex" / "123456M.txt", paychex_balance_lines())
    write_text(OUT / "paychex" / "123456LN.txt", paychex_loan_lines())
    write_text(OUT / "oneamerica" / "A12345PV.TXT", oneamerica_balance_lines())
    write_text(OUT / "oneamerica" / "A12345LN.TXT", oneamerica_loan_lines())
    write_text(OUT / "vanguard" / "ENTJ767_TEST.txt", vanguard_recordkeeping_lines())
    write_text(OUT / "vanguard" / "ENTJ768_TEST-PAYROLL-PART.txt", vanguard_payroll_lines())
    write_text(OUT / "voya" / "EXTRACT_LH_123456.TXT", [voya_lines()[0]])
    write_text(OUT / "voya" / "EXTRACT_LF_123456.TXT", [voya_lines()[1]])
    principal_workbook()
    write_readme()
    print(f"Generated vendor upload test files in {OUT}")


if __name__ == "__main__":
    main()
