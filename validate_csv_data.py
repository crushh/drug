#!/usr/bin/env python3
"""
Validate normalized CSV files against main.sql without importing data.

Usage:
  python validate_csv_data.py
  python validate_csv_data.py --csv-dir csv_templates_normalized --schema main.sql

The script uses only Python standard library modules.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any


TABLE_ORDER = [
    "rdc_drug",
    "target",
    "indication",
    "chemical_entity",
    "reference",
    "drug_target",
    "drug_indication",
    "drug_chemical_rel",
    "chemical_affinity",
    "in_vitro",
    "in_vitro_measurement",
    "human_activity",
    "animal_in_vivo_study",
    "animal_in_vivo_biodist",
    "animal_in_vivo_efficacy",
    "rdc_drug_reference",
]

HEADER_ALIASES = {
    "rdc_drug": {"Type": "type", "MOA": "moa"},
    "drug_indication": {"RDC-ID": "drug_id"},
    "animal_in_vivo_study": {"drug-id": "drug_id"},
    "animal_in_vivo_biodist": {"Type": "biodist_type", "Cell lines": "cell_lines"},
}

IGNORED_HEADERS: dict[str, set[str]] = {}

DEFAULT_COLUMNS = {"id", "created_at", "updated_at"}

ZH = {
    "report_title": "\u0023 CSV \u6570\u636e\u6821\u9a8c\u62a5\u544a",
    "generated_by": "\u672c\u62a5\u544a\u7531 `validate_csv_data.py` \u751f\u6210\u3002\u811a\u672c\u53ea\u8bfb\u53d6 CSV \u548c SQL \u6587\u4ef6\uff0c\u4e0d\u4f1a\u4fee\u6539\u4efb\u4f55\u6570\u636e\u3002",
    "summary": "\u6982\u8981",
    "files": "\u6587\u4ef6\u6570",
    "rows": "\u6570\u636e\u884c\u6570",
    "issues": "\u95ee\u9898\u6570",
    "header_issues": "\u8868\u5934\u95ee\u9898",
    "row_issues": "\u884c\u7ea7\u95ee\u9898",
    "quick_fix": "\u4f18\u5148\u4fee\u590d\u5efa\u8bae",
    "quick_fix_text": "\u5148\u4fee\u7236\u8868\uff08\u5982 `chemical_entity`\u3001`reference`\u3001`rdc_drug`\u3001`target`\u3001`indication`\uff09\u7684\u679a\u4e3e\u3001\u65e5\u671f\u3001\u6570\u5b57\u683c\u5f0f\u95ee\u9898\uff0c\u518d\u4fee\u5173\u8054\u8868\u5916\u952e\u95ee\u9898\u3002\u5916\u952e\u9519\u8bef\u5f88\u591a\u662f\u524d\u7f6e\u8868\u6570\u636e\u4e0d\u5408\u6cd5\u5bfc\u81f4\u7684\u8fde\u9501\u95ee\u9898\u3002",
    "insertable": "\u5b57\u6bb5\u683c\u5f0f\u57fa\u7840\u6821\u9a8c\u901a\u8fc7\u884c\u6570\uff08\u4e0d\u542b\u5916\u952e\uff09",
    "table": "\u8868",
    "count": "\u6570\u91cf",
    "type": "\u7c7b\u578b",
    "problem": "\u95ee\u9898",
    "fix": "\u4fee\u590d\u5efa\u8bae",
    "samples": "\u6837\u4f8b",
    "line": "\u884c",
    "column": "\u5b57\u6bb5",
    "value": "\u5f53\u524d\u503c",
    "details": "\u660e\u7ec6",
}

ISSUE_TEXT = {
    "MISSING_FILE": (
        "\u7f3a\u5c11 CSV \u6587\u4ef6",
        "\u5efa\u8868 SQL \u4e2d\u6709\u8be5\u8868\uff0c\u4f46 CSV \u76ee\u5f55\u4e2d\u627e\u4e0d\u5230\u5bf9\u5e94\u6587\u4ef6\u3002",
        "\u8865\u5145\u5bf9\u5e94 CSV \u6587\u4ef6\uff0c\u6216\u8005\u786e\u8ba4\u8be5\u8868\u4e0d\u9700\u8981\u5bfc\u5165\u3002",
    ),
    "HEADER_ALIAS": (
        "\u8868\u5934\u4f7f\u7528\u4e86\u522b\u540d",
        "CSV \u8868\u5934\u4e0e\u5efa\u8868\u5b57\u6bb5\u4e0d\u5b8c\u5168\u4e00\u81f4\uff0c\u811a\u672c\u5df2\u6309\u5185\u7f6e\u89c4\u5219\u6620\u5c04\u3002",
        "\u5efa\u8bae\u628a CSV \u8868\u5934\u76f4\u63a5\u6539\u6210 SQL \u91cc\u7684\u5b57\u6bb5\u540d\u3002",
    ),
    "HEADER_BLANK": (
        "\u7a7a\u8868\u5934",
        "CSV \u5b58\u5728\u7a7a\u5217\u540d\u3002",
        "\u5220\u9664\u591a\u4f59\u7a7a\u5217\uff0c\u6216\u8005\u586b\u5199\u6b63\u786e\u5b57\u6bb5\u540d\u3002",
    ),
    "HEADER_UNKNOWN": (
        "\u672a\u77e5\u8868\u5934",
        "CSV \u5217\u540d\u4e0d\u5728 SQL \u8868\u7ed3\u6784\u4e2d\u3002",
        "\u5220\u9664\u8be5\u5217\uff0c\u6216\u8005\u5728 SQL \u4e2d\u589e\u52a0\u5bf9\u5e94\u5b57\u6bb5\u3002",
    ),
    "HEADER_IGNORED": (
        "\u975e\u5efa\u8868\u5b57\u6bb5",
        "\u8be5\u5217\u4e0d\u5728 SQL \u4e2d\uff0c\u811a\u672c\u6309\u914d\u7f6e\u5ffd\u7565\u3002",
        "\u5982\u679c\u786e\u5b9a\u8981\u5165\u5e93\uff0c\u9700\u5148\u5728 SQL \u4e2d\u589e\u52a0\u5b57\u6bb5\uff1b\u5426\u5219\u53ef\u4ece CSV \u5220\u9664\u3002",
    ),
    "HEADER_DUPLICATE": (
        "\u8868\u5934\u91cd\u590d",
        "\u591a\u4e2a CSV \u5217\u6620\u5c04\u5230\u540c\u4e00\u4e2a SQL \u5b57\u6bb5\u3002",
        "\u4fdd\u7559\u552f\u4e00\u4e00\u5217\uff0c\u5220\u9664\u6216\u6539\u540d\u91cd\u590d\u5217\u3002",
    ),
    "REQUIRED_EMPTY": (
        "\u5fc5\u586b\u5b57\u6bb5\u4e3a\u7a7a",
        "SQL \u4e2d\u8be5\u5b57\u6bb5\u4e3a NOT NULL\uff0cCSV \u4e2d\u4e3a\u7a7a\u3002",
        "\u8865\u9f50\u8be5\u5b57\u6bb5\uff0c\u6216\u5220\u9664\u8be5\u884c\u65e0\u6548\u6570\u636e\u3002",
    ),
    "ENUM_INVALID": (
        "\u679a\u4e3e\u503c\u9519\u8bef",
        "\u5b57\u6bb5\u503c\u4e0d\u5728 SQL ENUM \u5141\u8bb8\u8303\u56f4\u5185\u3002",
        "\u6309 SQL \u91cc\u7684\u679a\u4e3e\u503c\u7edf\u4e00\u4fee\u6539\uff0c\u6ce8\u610f\u5927\u5c0f\u5199\u3002",
    ),
    "DECIMAL_INVALID": (
        "\u6570\u5b57\u683c\u5f0f\u9519\u8bef",
        "SQL \u8981\u6c42 DECIMAL\uff0cCSV \u4e2d\u5374\u662f\u8303\u56f4\u3001\u5747\u503c\u00b1\u8bef\u5dee\u3001\u6587\u672c\u6216\u5176\u5b83\u975e\u7eaf\u6570\u5b57\u3002",
        "\u53ea\u4fdd\u7559\u4e00\u4e2a\u7eaf\u6570\u5b57\uff0c\u6216\u8005\u8c03\u6574\u8868\u7ed3\u6784\u589e\u52a0 raw_value/min/max/error \u7b49\u5b57\u6bb5\u3002",
    ),
    "INTEGER_INVALID": (
        "\u6574\u6570\u683c\u5f0f\u9519\u8bef",
        "SQL \u8981\u6c42 INT\uff0cCSV \u4e2d\u4e0d\u662f\u6574\u6570\u3002",
        "\u6539\u6210\u7eaf\u6574\u6570\uff0c\u4e0d\u8981\u5e26\u5355\u4f4d\u3001\u8303\u56f4\u6216\u6587\u672c\u3002",
    ),
    "DATE_INVALID": (
        "\u65e5\u671f\u683c\u5f0f\u9519\u8bef",
        "SQL \u8981\u6c42 DATE\uff0cCSV \u65e5\u671f\u4e0d\u662f YYYY-MM-DD\u3002",
        "\u7edf\u4e00\u6539\u6210 YYYY-MM-DD\uff0c\u4f8b\u5982 20-Jun-25 -> 2025-06-20\u3002",
    ),
    "DATETIME_INVALID": (
        "\u65e5\u671f\u65f6\u95f4\u683c\u5f0f\u9519\u8bef",
        "SQL \u8981\u6c42 DATETIME\uff0cCSV \u683c\u5f0f\u4e0d\u7b26\u5408 YYYY-MM-DD HH:MM:SS\u3002",
        "\u6539\u6210 YYYY-MM-DD HH:MM:SS\uff0c\u6216\u7559\u7a7a\u8ba9\u6570\u636e\u5e93\u4f7f\u7528\u9ed8\u8ba4\u65f6\u95f4\u3002",
    ),
    "VALUE_TOO_LONG": (
        "\u5b57\u6bb5\u8fc7\u957f",
        "CSV \u503c\u957f\u5ea6\u8d85\u8fc7 SQL VARCHAR \u9650\u5236\u3002",
        "\u7f29\u77ed\u5185\u5bb9\uff0c\u6216\u628a SQL \u5b57\u6bb5\u6539\u6210\u66f4\u5927\u7684 VARCHAR/TEXT\u3002",
    ),
    "UNIQUE_DUPLICATE": (
        "\u552f\u4e00\u952e\u91cd\u590d",
        "\u8be5\u8868\u7684 UNIQUE KEY \u88ab\u91cd\u590d\u4f7f\u7528\u3002",
        "\u53bb\u91cd\uff0c\u4fdd\u7559\u4e00\u884c\uff1b\u5982\u9700\u4fdd\u7559\u591a\u6761\uff0c\u9700\u8c03\u6574\u552f\u4e00\u952e\u8bbe\u8ba1\u3002",
    ),
    "UNIQUE_EMPTY_STRING_RISK": (
        "\u53ef\u7a7a\u552f\u4e00\u952e\u7a7a\u5b57\u7b26\u4e32\u98ce\u9669",
        "SQL \u4e2d\u8be5 UNIQUE KEY \u5b57\u6bb5\u53ef\u4e3a NULL\uff0c\u4f46 CSV \u7a7a\u5355\u5143\u683c\u5982\u88ab\u5bfc\u5165\u4e3a\u7a7a\u5b57\u7b26\u4e32 `''`\uff0cMySQL \u4f1a\u5c06\u591a\u4e2a `''` \u89c6\u4e3a\u91cd\u590d\u503c\u3002",
        "\u5bfc\u5165\u65f6\u5c06\u7a7a\u503c\u6620\u5c04\u4e3a NULL\uff0c\u6216\u4ece CSV \u4e2d\u79fb\u9664\u8be5\u53ef\u7a7a\u5b57\u6bb5\u8ba9\u6570\u636e\u5e93\u4f7f\u7528\u9ed8\u8ba4 NULL\u3002",
    ),
    "FK_MISSING_PARENT": (
        "\u5916\u952e\u7f3a\u5931",
        "\u5173\u8054\u8868\u5f15\u7528\u7684\u7236\u8868 ID \u4e0d\u5b58\u5728\u3002",
        "\u5148\u8865\u9f50\u7236\u8868\u8bb0\u5f55\u3002\u5982\u679c\u4e00\u4e2a\u5355\u5143\u683c\u6709\u591a\u4e2a ID\uff0c\u9700\u8981\u62c6\u6210\u591a\u884c\u3002",
    ),
    "MULTIPLE_IDS": (
        "\u5355\u5143\u683c\u5305\u542b\u591a\u4e2a ID",
        "\u5173\u8054\u5b57\u6bb5\u4e2d\u51fa\u73b0\u9017\u53f7\u6216\u5206\u53f7\u5206\u9694\u7684\u591a\u4e2a ID\u3002",
        "\u5173\u8054\u8868\u5e94\u8be5\u4e00\u884c\u4e00\u4e2a\u5173\u8054\uff0c\u8bf7\u62c6\u6210\u591a\u884c\u3002",
    ),
}


@dataclass
class ColumnDef:
    name: str
    raw_type: str
    nullable: bool = True
    default: bool = False
    auto_increment: bool = False
    enum_values: list[str] = field(default_factory=list)
    varchar_length: int | None = None
    data_type: str = ""


@dataclass
class TableDef:
    name: str
    columns: dict[str, ColumnDef] = field(default_factory=dict)
    uniques: list[tuple[str, list[str]]] = field(default_factory=list)
    foreign_keys: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class Issue:
    code: str
    table: str
    file: str
    line: int | str
    column: str
    value: str
    details: str


class CsvDecodeError(Exception):
    def __init__(self, table: str, csv_path: Path, encoding: str, error: UnicodeDecodeError, preview: str) -> None:
        data = error.object
        line_no = data.count(b"\n", 0, error.start) + 1
        line_start = data.rfind(b"\n", 0, error.start) + 1
        column_no = error.start - line_start + 1
        byte_value = data[error.start] if error.start < len(data) else None
        byte_text = f"0x{byte_value:02x}" if byte_value is not None else "EOF"
        message = (
            "CSV decode failed\n"
            f"  table: {table}\n"
            f"  file: {csv_path}\n"
            f"  encoding: {encoding}\n"
            f"  line: {line_no}\n"
            f"  byte column: {column_no}\n"
            f"  byte offset: {error.start}\n"
            f"  byte: {byte_text}\n"
            f"  content: {preview}"
        )
        super().__init__(message)


def preview_decode_error_line(data: bytes, error_pos: int, limit: int = 240) -> str:
    line_start = data.rfind(b"\n", 0, error_pos) + 1
    line_end = data.find(b"\n", error_pos)
    if line_end == -1:
        line_end = len(data)
    line = data[line_start:line_end].rstrip(b"\r")
    text = line.decode("utf-8-sig", errors="backslashreplace")
    if len(text) <= limit:
        return text
    error_col = error_pos - line_start
    half = max(20, limit // 2)
    start = max(0, error_col - half)
    end = min(len(text), error_col + half)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    return f"{prefix}{text[start:end]}{suffix}"


def split_sql_items(body: str) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    quote: str | None = None
    depth = 0
    i = 0
    while i < len(body):
        ch = body[i]
        if quote:
            current.append(ch)
            if ch == quote and (i == 0 or body[i - 1] != "\\"):
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
                current.append(ch)
            elif ch == "(":
                depth += 1
                current.append(ch)
            elif ch == ")":
                depth -= 1
                current.append(ch)
            elif ch == "," and depth == 0:
                item = "".join(current).strip()
                if item:
                    items.append(item)
                current = []
            else:
                current.append(ch)
        i += 1
    item = "".join(current).strip()
    if item:
        items.append(item)
    return items


def strip_sql_comments(sql: str) -> str:
    lines = []
    for line in sql.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("--"):
            continue
        lines.append(line)
    return "\n".join(lines)


def parse_schema(schema_path: Path) -> dict[str, TableDef]:
    sql = strip_sql_comments(schema_path.read_text(encoding="utf-8-sig"))
    tables: dict[str, TableDef] = {}
    pattern = re.compile(
        r"CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`(?P<name>[^`]+)`\s*\((?P<body>.*?)\)\s*ENGINE",
        re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.finditer(sql):
        table = TableDef(name=match.group("name"))
        for item in split_sql_items(match.group("body")):
            if item.startswith("`"):
                col_match = re.match(r"`([^`]+)`\s+(.+)$", item, re.DOTALL)
                if not col_match:
                    continue
                name = col_match.group(1)
                rest = " ".join(col_match.group(2).split())
                raw_type = rest.split(" COMMENT ", 1)[0]
                col = ColumnDef(name=name, raw_type=raw_type)
                col.nullable = " NOT NULL" not in f" {raw_type.upper()} "
                col.default = " DEFAULT " in f" {raw_type.upper()} "
                col.auto_increment = "AUTO_INCREMENT" in raw_type.upper()
                type_match = re.match(r"([A-Z]+)(?:\((.*?)\))?", raw_type.strip(), re.IGNORECASE)
                if type_match:
                    col.data_type = type_match.group(1).lower()
                    type_args = type_match.group(2) or ""
                    if col.data_type == "enum":
                        col.enum_values = re.findall(r"'([^']*)'", type_args)
                    if col.data_type == "varchar":
                        try:
                            col.varchar_length = int(type_args)
                        except ValueError:
                            pass
                table.columns[name] = col
                continue

            unique_match = re.match(r"(?:UNIQUE\s+KEY|PRIMARY\s+KEY)\s+`?([^`\s(]+)?`?\s*\((.*?)\)", item, re.IGNORECASE)
            if unique_match:
                key_name = unique_match.group(1) or "PRIMARY"
                cols = re.findall(r"`([^`]+)`", unique_match.group(2))
                if cols:
                    table.uniques.append((key_name, cols))
                continue

            fk_match = re.search(
                r"CONSTRAINT\s+`([^`]+)`\s+FOREIGN\s+KEY\s*\((.*?)\)\s+REFERENCES\s+`([^`]+)`\s*\((.*?)\)",
                item,
                re.IGNORECASE | re.DOTALL,
            )
            if fk_match:
                table.foreign_keys.append(
                    {
                        "name": fk_match.group(1),
                        "columns": re.findall(r"`([^`]+)`", fk_match.group(2)),
                        "ref_table": fk_match.group(3),
                        "ref_columns": re.findall(r"`([^`]+)`", fk_match.group(4)),
                    }
                )
        tables[table.name] = table
    return tables


def ordered_table_names(tables: dict[str, TableDef]) -> list[str]:
    ordered = [table for table in TABLE_ORDER if table in tables]
    ordered.extend(table for table in tables if table not in TABLE_ORDER)
    return ordered


def is_empty(value: Any) -> bool:
    return value is None or str(value).strip() == ""


def normalize_empty(value: str) -> str:
    return value.strip()


def has_multiple_ids(value: str) -> bool:
    return bool(re.search(r"\b[A-Z]{2,}\d{2,}\s*[,;]\s*[A-Z]{2,}\d{2,}\b", value))


def valid_decimal(value: str) -> bool:
    if not re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)", value.strip()):
        return False
    try:
        Decimal(value.strip())
        return True
    except InvalidOperation:
        return False


def valid_int(value: str) -> bool:
    return bool(re.fullmatch(r"[+-]?\d+", value.strip()))


def valid_date(value: str) -> bool:
    try:
        datetime.strptime(value.strip(), "%Y-%m-%d")
        return True
    except ValueError:
        return False


def valid_datetime(value: str) -> bool:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            datetime.strptime(value.strip(), fmt)
            return True
        except ValueError:
            pass
    return False


def mysql_unique_value(value: str) -> str:
    # The schema uses utf8mb4_unicode_ci, so unique indexes on text columns are
    # case-insensitive in MySQL. This approximates the behavior closely enough
    # to catch import-blocking duplicates before loading CSV files.
    return value.strip().casefold()


def csv_line_number(row: dict[str, Any], fallback: int) -> int:
    try:
        return int(row.get("__line__", fallback))
    except (TypeError, ValueError):
        return fallback


def read_csv_rows(table: str, csv_path: Path) -> tuple[list[str], list[dict[str, str]]]:
    encoding = "utf-8-sig"
    try:
        text = csv_path.read_bytes().decode(encoding)
    except UnicodeDecodeError as exc:
        preview = preview_decode_error_line(exc.object, exc.start)
        raise CsvDecodeError(table, csv_path, encoding, exc, preview) from exc

    with io.StringIO(text, newline="") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return [], []
        rows = []
        for line_no, row in enumerate(reader, start=2):
            if len(row) == 1 and is_empty(row[0]):
                continue
            item = {f"__col_{idx}__": value for idx, value in enumerate(row)}
            item["__line__"] = str(line_no)
            rows.append(item)
        return headers, rows


def build_header_map(table: str, table_def: TableDef, headers: list[str], issues: list[Issue], file_name: str) -> dict[int, str]:
    aliases = HEADER_ALIASES.get(table, {})
    ignored = IGNORED_HEADERS.get(table, set())
    mapped: dict[int, str] = {}
    seen: dict[str, int] = {}

    for idx, raw_header in enumerate(headers):
        header = raw_header.strip()
        if header == "":
            issues.append(Issue("HEADER_BLANK", table, file_name, 1, f"#{idx + 1}", "", ""))
            continue
        if header in ignored:
            issues.append(Issue("HEADER_IGNORED", table, file_name, 1, header, "", ""))
            continue
        column = aliases.get(header, header)
        if column != header:
            issues.append(Issue("HEADER_ALIAS", table, file_name, 1, header, column, f"{header} -> {column}"))
        if column not in table_def.columns:
            issues.append(Issue("HEADER_UNKNOWN", table, file_name, 1, header, "", ""))
            continue
        if column in seen:
            issues.append(Issue("HEADER_DUPLICATE", table, file_name, 1, header, "", f"{header} -> {column}"))
            continue
        seen[column] = idx
        mapped[idx] = column
    return mapped


def mapped_row(raw_row: dict[str, str], header_map: dict[int, str]) -> dict[str, str]:
    result: dict[str, str] = {}
    for idx, col in header_map.items():
        result[col] = normalize_empty(raw_row.get(f"__col_{idx}__", ""))
    return result


def issue_sample(issue: Issue) -> str:
    value = issue.value.replace("\n", " ").replace("\r", " ")
    if len(value) > 90:
        value = value[:87] + "..."
    details = issue.details.replace("\n", " ").replace("\r", " ")
    if len(details) > 120:
        details = details[:117] + "..."
    return f"- `{issue.file}` {ZH['line']} {issue.line}: `{issue.column}` = `{value}` {details}"


def first_line_from_details(details: str) -> str:
    match = re.search(r"first line=(\d+)", details)
    return match.group(1) if match else ""


def friendly_issue_text(issue: Issue) -> tuple[str, str, str]:
    first_line = first_line_from_details(issue.details)

    if issue.code == "UNIQUE_EMPTY_STRING_RISK":
        if issue.table == "rdc_drug" and issue.column == "external_id":
            return (
                "外部编号为空",
                "药物的 external_id 列为空。这个字段不是必须都填写，只有确实有来源编号时才需要补充。",
                "如果没有真实外部编号，可以保持为空；不要为了消除报告而随便编编号。如果这列暂时不用，建议后续统一补真实编号。",
            )
        return (
            "关键字段为空",
            f"{issue.column} 列为空。该字段可能用于区分记录，建议确认是否确实缺失。",
            "有真实值就补充；没有真实值就保持为空，不要随意编造。",
        )

    if issue.code == "UNIQUE_DUPLICATE":
        duplicate_hint = f"，与第 {first_line} 行重复" if first_line else ""
        return (
            "重复记录",
            f"这一行和文件里的另一行内容重复{duplicate_hint}。",
            "请人工确认两行是否表示同一条数据。若是同一条，保留信息更完整、写法更规范的一条，删除或合并另一条。",
        )

    if issue.code == "MISSING_FILE":
        return ("缺少文件", "应该提供这个 CSV 文件，但当前目录中没有找到。", "补充对应 CSV 文件，或确认这类数据本次不需要提供。")
    if issue.code == "HEADER_BLANK":
        return ("空列名", "CSV 中有一列没有列名。", "删除多余空列，或填写正确列名。")
    if issue.code == "HEADER_UNKNOWN":
        return ("多余列", f"CSV 中的 {issue.column} 列不是当前模板需要的列。", "确认该列是否需要保留；不需要则删除。")
    if issue.code == "HEADER_DUPLICATE":
        return ("重复列名", f"CSV 中的 {issue.column} 列重复。", "只保留一列，删除或改名重复列。")
    if issue.code == "REQUIRED_EMPTY":
        return ("必填内容为空", f"{issue.column} 列不能为空。", "补齐该字段；如果整行无效，请删除该行。")
    if issue.code == "ENUM_INVALID":
        return ("选项值不规范", f"{issue.column} 列的值不在允许范围内。", "按模板允许的选项统一修改，注意大小写和拼写。")
    if issue.code == "DECIMAL_INVALID":
        return ("数字格式不规范", f"{issue.column} 列应填写单个数字。", "只保留一个明确数字；范围、均值加误差、文字说明请拆到备注或其他字段。")
    if issue.code == "INTEGER_INVALID":
        return ("整数格式不规范", f"{issue.column} 列应填写整数。", "改成纯整数，不要带单位、范围或文字。")
    if issue.code == "DATE_INVALID":
        return ("日期格式不规范", f"{issue.column} 列日期格式不统一。", "统一改成 YYYY-MM-DD，例如 2025-06-20。")
    if issue.code == "DATETIME_INVALID":
        return ("日期时间格式不规范", f"{issue.column} 列日期时间格式不统一。", "统一改成 YYYY-MM-DD HH:MM:SS；不确定时先留空。")
    if issue.code == "VALUE_TOO_LONG":
        return ("内容过长", f"{issue.column} 列内容过长。", "请缩短内容，只保留必要信息。")
    if issue.code == "FK_MISSING_PARENT":
        return ("引用编号不存在", f"{issue.column} 列填写的编号在对应主数据文件中找不到。", "先确认编号是否写错；如果编号正确，请补充对应主数据记录。")
    if issue.code == "MULTIPLE_IDS":
        return ("一个单元格填了多个编号", f"{issue.column} 列同一个单元格中包含多个编号。", "拆成多行，每行只保留一个编号。")

    title, problem, fix = ISSUE_TEXT.get(issue.code, (issue.code, issue.details, "请人工确认并修正。"))
    return title, problem, fix


def friendly_issue_sample(issue: Issue) -> str:
    value = issue.value.replace("\n", " ").replace("\r", " ")
    if len(value) > 90:
        value = value[:87] + "..."
    first_line = first_line_from_details(issue.details)
    duplicate_hint = f"，疑似与第 {first_line} 行重复" if issue.code == "UNIQUE_DUPLICATE" and first_line else ""
    value_text = "空" if value == "" else f"`{value}`"
    return f"- `{issue.file}` 第 {issue.line} 行，`{issue.column}` = {value_text}{duplicate_hint}"


def validate_rows(
    table: str,
    table_def: TableDef,
    file_name: str,
    rows: list[dict[str, str]],
    header_map: dict[int, str],
) -> tuple[list[Issue], list[dict[str, str]]]:
    issues: list[Issue] = []
    normalized_rows: list[dict[str, str]] = []
    unique_seen: dict[str, dict[tuple[str, ...], int]] = defaultdict(dict)

    for idx, raw_row in enumerate(rows, start=2):
        line = csv_line_number(raw_row, idx)
        row = mapped_row(raw_row, header_map)
        normalized_rows.append({"__line__": str(line), **row})

        for col_name, col_def in table_def.columns.items():
            value = row.get(col_name, "")
            if col_name in DEFAULT_COLUMNS and is_empty(value):
                continue
            if not col_def.nullable and not col_def.default and not col_def.auto_increment and is_empty(value):
                issues.append(Issue("REQUIRED_EMPTY", table, file_name, line, col_name, value, ""))
                continue
            if is_empty(value):
                continue

            if col_def.enum_values and value not in col_def.enum_values:
                details = "\u5141\u8bb8\u503c: " + ", ".join(col_def.enum_values)
                issues.append(Issue("ENUM_INVALID", table, file_name, line, col_name, value, details))
            elif col_def.data_type in {"decimal", "numeric"} and not valid_decimal(value):
                issues.append(Issue("DECIMAL_INVALID", table, file_name, line, col_name, value, ""))
            elif col_def.data_type in {"int", "integer", "bigint", "smallint", "tinyint"} and not valid_int(value):
                issues.append(Issue("INTEGER_INVALID", table, file_name, line, col_name, value, ""))
            elif col_def.data_type == "date" and not valid_date(value):
                issues.append(Issue("DATE_INVALID", table, file_name, line, col_name, value, ""))
            elif col_def.data_type == "datetime" and not valid_datetime(value):
                issues.append(Issue("DATETIME_INVALID", table, file_name, line, col_name, value, ""))
            elif col_def.varchar_length is not None and len(value) > col_def.varchar_length:
                details = f"max={col_def.varchar_length}, actual={len(value)}"
                issues.append(Issue("VALUE_TOO_LONG", table, file_name, line, col_name, value, details))

        for fk in table_def.foreign_keys:
            for child_col in fk["columns"]:
                value = row.get(child_col, "")
                if value and has_multiple_ids(value):
                    issues.append(Issue("MULTIPLE_IDS", table, file_name, line, child_col, value, ""))

        for key_name, key_cols in table_def.uniques:
            if key_name == "PRIMARY":
                continue
            if any(col not in row for col in key_cols):
                continue
            values = tuple(row.get(col, "") for col in key_cols)
            unique_values = tuple(mysql_unique_value(value) for value in values)
            if any(is_empty(v) for v in values):
                nullable_cols = [col for col in key_cols if table_def.columns.get(col) and table_def.columns[col].nullable]
                seen_line = unique_seen[key_name].get(unique_values)
                if nullable_cols and seen_line is not None:
                    details = f"{key_name}: " + ", ".join(f"{c}={v}" for c, v in zip(key_cols, values))
                    issues.append(Issue("UNIQUE_EMPTY_STRING_RISK", table, file_name, line, ",".join(key_cols), "|".join(values), details + f"; first line={seen_line}"))
                else:
                    unique_seen[key_name][unique_values] = line
                continue
            seen_line = unique_seen[key_name].get(unique_values)
            if seen_line is not None:
                details = f"{key_name}: " + ", ".join(f"{c}={v}" for c, v in zip(key_cols, values))
                issues.append(Issue("UNIQUE_DUPLICATE", table, file_name, line, ",".join(key_cols), "|".join(values), details + f"; first line={seen_line}"))
            else:
                unique_seen[key_name][unique_values] = line

    return issues, normalized_rows


def build_parent_indexes(tables: dict[str, TableDef], rows_by_table: dict[str, list[dict[str, str]]]) -> dict[tuple[str, tuple[str, ...]], set[tuple[str, ...]]]:
    indexes: dict[tuple[str, tuple[str, ...]], set[tuple[str, ...]]] = defaultdict(set)
    for table_name, table_def in tables.items():
        for _, unique_cols in table_def.uniques:
            key = (table_name, tuple(unique_cols))
            for row in rows_by_table.get(table_name, []):
                values = tuple(row.get(col, "") for col in unique_cols)
                if not any(is_empty(v) for v in values):
                    indexes[key].add(values)
    return indexes


def validate_foreign_keys(
    tables: dict[str, TableDef],
    rows_by_table: dict[str, list[dict[str, str]]],
    parent_indexes: dict[tuple[str, tuple[str, ...]], set[tuple[str, ...]]],
) -> list[Issue]:
    issues: list[Issue] = []
    for table_name, table_def in tables.items():
        file_name = f"{table_name}.csv"
        for fk in table_def.foreign_keys:
            parent_key = (fk["ref_table"], tuple(fk["ref_columns"]))
            parent_values = parent_indexes.get(parent_key, set())
            for row in rows_by_table.get(table_name, []):
                values = tuple(row.get(col, "") for col in fk["columns"])
                if any(is_empty(v) for v in values):
                    continue
                if values not in parent_values:
                    details = f"{','.join(fk['columns'])} -> {fk['ref_table']}.{','.join(fk['ref_columns'])}"
                    issues.append(
                        Issue(
                            "FK_MISSING_PARENT",
                            table_name,
                            file_name,
                            row.get("__line__", ""),
                            ",".join(fk["columns"]),
                            "|".join(values),
                            details,
                        )
                    )
    return issues


def make_report(
    output_dir: Path,
    all_issues: list[Issue],
    inserted_counts: dict[str, int],
    files_count: int,
    data_rows_count: int,
    table_order: list[str],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    grouped: dict[tuple[str, str, str], list[Issue]] = defaultdict(list)
    for issue in all_issues:
        title, problem, fix = friendly_issue_text(issue)
        grouped[(issue.code, title, problem + "\n" + fix)].append(issue)

    sorted_groups = sorted(grouped.items(), key=lambda item: len(item[1]), reverse=True)

    md: list[str] = []
    md.append("# CSV 数据修改建议报告")
    md.append("")
    md.append("本报告面向数据整理人员，只说明需要检查哪些 CSV、哪些行，以及推荐如何修改。")
    md.append("")
    md.append("## 概要")
    md.append("")
    md.append(f"- 检查文件数: {files_count}")
    md.append(f"- 检查数据行数: {data_rows_count}")
    md.append(f"- 需要关注的问题数: {len(all_issues)}")
    md.append("")
    md.append("## 优先处理建议")
    md.append("")
    md.append("先处理重复记录，再处理格式错误、必填为空、编号不存在等问题。对于“外部编号为空”这类问题，如果没有真实编号，可以保持为空，不要随意编造。")
    md.append("")
    md.append("## 问题分组")
    md.append("")
    for index, ((code, title, combined), issues) in enumerate(sorted_groups, start=1):
        problem, fix = combined.split("\n", 1)
        file_counts = Counter(issue.file for issue in issues)
        md.append(f"### {index}. {title} ({len(issues)} \u6761)")
        md.append("")
        md.append(f"**需要查看的文件**: " + ", ".join(f"`{file}` ({count} 条)" for file, count in file_counts.most_common()))
        md.append("")
        md.append(f"**问题说明**: {problem}")
        md.append("")
        md.append(f"**推荐修改**: {fix}")
        md.append("")
        md.append("**样例**:")
        md.extend(friendly_issue_sample(issue) for issue in issues[:8])
        md.append("")

    (output_dir / "csv_validation_report.md").write_text("\n".join(md), encoding="utf-8")

    summary_path = output_dir / "csv_validation_summary.csv"
    with summary_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["优先级", "问题类型", "数量", "需要查看的文件", "问题说明", "推荐修改", "样例"])
        for index, ((code, title, combined), issues) in enumerate(sorted_groups, start=1):
            problem, fix = combined.split("\n", 1)
            file_counts = Counter(issue.file for issue in issues)
            writer.writerow(
                [
                    index,
                    title,
                    len(issues),
                    "; ".join(f"{file}({count})" for file, count in file_counts.most_common()),
                    problem,
                    fix,
                    "\n".join(friendly_issue_sample(issue) for issue in issues[:5]),
                ]
            )

    details_path = output_dir / "csv_validation_details.csv"
    with details_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["文件", "行号", "列名", "当前值", "问题类型", "问题说明", "推荐修改"])
        for issue in all_issues:
            title, problem, fix = friendly_issue_text(issue)
            writer.writerow([issue.file, issue.line, issue.column, issue.value, title, problem, fix])

    json_path = output_dir / "csv_validation_report.json"
    json_path.write_text(
        json.dumps(
            {
                "issue_count": len(all_issues),
                "insertable_counts": inserted_counts,
                "issues": [issue.__dict__ for issue in all_issues],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def run(schema_path: Path, csv_dir: Path, output_dir: Path) -> int:
    if not schema_path.exists():
        print(f"main.sql not found: {schema_path}", file=sys.stderr)
        return 2
    if not csv_dir.exists():
        print(f"CSV directory not found: {csv_dir}", file=sys.stderr)
        return 2

    tables = parse_schema(schema_path)
    table_order = ordered_table_names(tables)
    issues: list[Issue] = []
    rows_by_table: dict[str, list[dict[str, str]]] = {}
    inserted_counts: dict[str, int] = {}
    files_count = 0
    data_rows_count = 0

    for table_name in table_order:
        table_def = tables.get(table_name)
        if table_def is None:
            continue
        csv_path = csv_dir / f"{table_name}.csv"
        if not csv_path.exists():
            issues.append(Issue("MISSING_FILE", table_name, csv_path.name, "", "", "", ""))
            rows_by_table[table_name] = []
            inserted_counts[table_name] = 0
            continue
        files_count += 1
        try:
            headers, raw_rows = read_csv_rows(table_name, csv_path)
        except CsvDecodeError as exc:
            print(str(exc), file=sys.stderr)
            return 2
        data_rows_count += len(raw_rows)
        header_issues: list[Issue] = []
        header_map = build_header_map(table_name, table_def, headers, header_issues, csv_path.name)
        row_issues, normalized = validate_rows(table_name, table_def, csv_path.name, raw_rows, header_map)
        issues.extend(header_issues)
        issues.extend(row_issues)
        rows_by_table[table_name] = normalized

        bad_lines = {str(issue.line) for issue in row_issues if issue.code not in {"HEADER_ALIAS", "HEADER_BLANK", "HEADER_UNKNOWN", "HEADER_IGNORED", "HEADER_DUPLICATE"}}
        inserted_counts[table_name] = sum(1 for row in normalized if row.get("__line__", "") not in bad_lines)

    parent_indexes = build_parent_indexes(tables, rows_by_table)
    fk_issues = validate_foreign_keys(tables, rows_by_table, parent_indexes)
    issues.extend(fk_issues)

    for issue in fk_issues:
        line = str(issue.line)
        if issue.table in inserted_counts and inserted_counts[issue.table] > 0:
            # This count is an estimate of rows that pass all local checks. FK issues are
            # still reported in detail, but keeping this simple avoids double-counting
            # rows with multiple foreign-key failures.
            pass

    make_report(output_dir, issues, inserted_counts, files_count, data_rows_count, table_order)
    print("\u6821\u9a8c\u5b8c\u6210")
    print(f"\u95ee\u9898\u6570: {len(issues)}")
    print(f"\u62a5\u544a\u76ee\u5f55: {output_dir}")
    print(f"- {output_dir / 'csv_validation_report.md'}")
    print(f"- {output_dir / 'csv_validation_summary.csv'}")
    print(f"- {output_dir / 'csv_validation_details.csv'}")
    return 1 if issues else 0


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Validate CSV files against main.sql without importing data.")
    parser.add_argument("--schema", default=str(script_dir / "main.sql"), help="Path to main.sql")
    parser.add_argument("--csv-dir", default=str(script_dir / "csv_templates_normalized"), help="Path to CSV directory")
    parser.add_argument("--out", default=str(script_dir / "csv_validation_reports"), help="Output report directory")
    args = parser.parse_args()
    return run(Path(args.schema), Path(args.csv_dir), Path(args.out))


if __name__ == "__main__":
    raise SystemExit(main())
