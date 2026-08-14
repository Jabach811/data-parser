# Source Mapping Reference

## Overview

The source mapping file is a shared team template used to map a prior vendor’s plan sources to Transamerica’s internal source structure. It drives the Informatica import process and serves as the single source of truth for source-level plan configuration during a conversion.

**Key rule:** Only map sources that have balances. Zero-balance sources are excluded — don’t waste the row.

-----

## File Layout

### Top of File (Rows 1–6)

|Range  |Content                                                                                   |
|-------|------------------------------------------------------------------------------------------|
|`B1:C5`|Basic plan details (plan name, number, etc.)                                              |
|`N1:N5`|Source type codes for pre-tax, after-tax, Roth, and Roth rollover — referenced in Column O|

### Row 7 — Section Ownership (Merged Headers)

Row 7 uses merged cells to label which team is responsible for each column group.

|Columns|Owner                     |
|-------|--------------------------|
|A–D    |Data Consultant (DC)      |
|E–K    |Transition Consultant (TC)|
|L–M    |COM                       |
|N      |Blank                     |
|O–Q    |Data Consultant (DC)      |

### Rows 8–10 — Headers and Instructions

- **Row 8** — Column headers (detail below)
- **Rows 9–10** — Reference/instruction rows; informational only, not live data

### Row 11+ — Live Data

All source mapping entries begin at row 11 and continue down, one row per source.

-----

## Column Reference

### DC Section (Columns A–D)

|Col|Field                       |Description                                                                                                                             |
|---|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
|A  |**Filter Code**             |Always `CIT`. Informatica uses this as its row filter — only rows tagged `CIT` are processed on import.                                 |
|B  |**Prior Source Code**       |The vendor’s own source code. Arbitrary — just mirrors whatever the prior recordkeeper used.                                            |
|C  |**Prior Source Name**       |The vendor’s source name.                                                                                                               |
|D  |**Prior Source Description**|The vendor’s full source description. Often identical to C, but some vendors use an abbreviated name in C and a longer description in D.|

### TC Section (Columns E–K)

|Col|Field                         |Description                                                                                                                                                                                       |
|---|------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|E  |**Map To — TRS Source Name**  |Transamerica’s internal source name. This is what we’re mapping the prior source *to*.                                                                                                            |
|F  |**Contribution Type Code**    |Internal category code (numeric). Classifies the source by money type — EE deferral, employer match, profit sharing, etc. This is the “what kind of money is this” field, not a unique identifier.|
|G  |**Withdrawal Provisions**     |Text description of distribution rules for this source — e.g., *age 59½ only*, *hardship eligible*, *anytime*, *100% vested required*.                                                            |
|H  |**Vesting**                   |Text description of the vesting schedule — e.g., *100%*, *4-year graded*, *3-year cliff*.                                                                                                         |
|I  |**Frequency of Contributions**|Payroll contribution frequency for this source — *bi-weekly*, *semi-monthly*, *monthly*, *quarterly*, etc. Left blank if the source isn’t on the payroll file (e.g., rollovers).                  |
|J  |**TRS Statement Name**        |How this source appears on participant statements. May be worded slightly differently than the internal name in E, but often identical.                                                           |
|K  |**Source-Specific Number**    |The unique source ID. This is the actual individual identifier for this source within Transamerica’s system.                                                                                      |

### COM Section (Columns L–M)

|Col|Field                           |Description                                                                                                               |
|---|--------------------------------|--------------------------------------------------------------------------------------------------------------------------|
|L  |**Source Hierarchy — Elections**|**Always blank.** Elections are imported for a single source and copied across all others, so no hierarchy is needed here.|
|M  |**Source Hierarchy — Loans**    |**Required if the plan has loans.** Defines the order in which loan payments are applied across sources.                  |

### DC Section (Columns O–Q)

|Col|Field                      |Description                                                                                                                               |
|---|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
|N  |*(Blank)*                  |Spacer column — no data.                                                                                                                  |
|O  |**Source Type**            |Uses the codes defined in `N1:N5` at the top of the file. Flags special source types: pre-tax, after-tax, Roth, Roth rollover.            |
|P  |**Source Translation Code**|Blank. Purpose is unclear; leave empty.                                                                                                   |
|Q  |**Takeover Amount**        |The balance amount pulled from test files and/or final files. Populated for all mapped sources — if it’s in the mapping, it has a balance.|

-----

## SOURCE_I Table

After the last mapped source row, the `SOURCE_I` table is pasted in. The table name is:

```
SOURCE_I
```

The TC uses this table to look up and populate source ID values in the mapping. This table is refreshed by the DC and can be treated as reliable.

> **Note:** Source_I validation against this table has been removed from the workflow. The table is present for TC use only — no separate validation step is required.

-----

## Quick Reference: Key Distinctions

|Columns|Easy Confusion                    |Clarification                                                                                               |
|-------|----------------------------------|------------------------------------------------------------------------------------------------------------|
|C vs D |Both are vendor source labels     |C = name (often abbreviated), D = full description. Often identical.                                        |
|E vs J |Both are Transamerica source names|E = internal name used in the system, J = statement-facing label for participants. Often identical.         |
|F vs K |Both look like source codes       |F = contribution *type* category (EE, match, employer), K = unique source ID. Completely different purposes.|
|L vs M |Both are source hierarchy         |L is always blank (elections don’t need it), M is required for loan plans.                                  |