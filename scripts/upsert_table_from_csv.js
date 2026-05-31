#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SCHEMA = path.join(ROOT, "main.sql");
const DEFAULT_ENV = path.join(ROOT, ".env.local");

function printUsage() {
  console.log(`
Usage:
  node scripts/upsert_table_from_csv.js --table rdc_drug --csv csv_templates_normalized/rdc_drug.csv
  node scripts/upsert_table_from_csv.js --table rdc_drug --csv csv_templates_normalized/rdc_drug.csv --apply
  node scripts/upsert_table_from_csv.js --table drug_target --csv csv_templates_normalized/drug_target.csv --key drug_id,target_id --apply

Options:
  --table <name>       Target database table name.
  --csv <path>         New CSV file path.
  --key <columns>      Key column(s), comma-separated. Defaults to the first single-column unique key.
  --schema <path>      Schema SQL path. Defaults to main.sql.
  --env <path>         Env file path. Defaults to .env.local.
  --compare-all-columns
                       Read-only diff mode for tables without a stable key.
  --replace-table      Replace the whole table with CSV rows. Requires --apply.
  --apply             Write changes to database. Without this flag, only prints a dry-run summary.
  --no-backup         Skip automatic backup table creation when using --apply.
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--compare-all-columns") {
      args.compareAllColumns = true;
    } else if (arg === "--replace-table") {
      args.replaceTable = true;
    } else if (arg === "--no-backup") {
      args.noBackup = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      args[key] = value;
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const result = {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function splitSqlItems(body) {
  const items = [];
  let current = "";
  let quote = null;
  let depth = 0;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quote) {
      current += ch;
      if (ch === quote && body[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      current += ch;
    } else if (ch === "(") {
      depth += 1;
      current += ch;
    } else if (ch === ")") {
      depth -= 1;
      current += ch;
    } else if (ch === "," && depth === 0) {
      items.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) items.push(current.trim());
  return items;
}

function parseSchema(schemaPath) {
  const sql = fs.readFileSync(schemaPath, "utf8");
  const tables = new Map();
  const tableRegex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`([^`]+)`\s*\(([\s\S]*?)\)\s*ENGINE=/gi;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(sql)) !== null) {
    const [, tableName, body] = tableMatch;
    const table = { name: tableName, columns: new Map(), uniques: [] };
    for (const item of splitSqlItems(body)) {
      const columnMatch = item.match(/^`([^`]+)`\s+(.+)$/s);
      if (columnMatch) {
        const [, name, rest] = columnMatch;
        table.columns.set(name, {
          name,
          autoIncrement: /\bAUTO_INCREMENT\b/i.test(rest),
          nullable: !/\bNOT\s+NULL\b/i.test(rest),
          hasDefault: /\bDEFAULT\b/i.test(rest),
        });
        continue;
      }
      const uniqueMatch = item.match(/^(?:UNIQUE\s+KEY|PRIMARY\s+KEY)\s+(?:`([^`]+)`\s*)?\(([^)]+)\)/i);
      if (uniqueMatch) {
        const keyName = uniqueMatch[1] || "PRIMARY";
        const columns = [...uniqueMatch[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
        table.uniques.push({ keyName, columns });
      }
    }
    tables.set(tableName, table);
  }
  return tables;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readCsv(csvPath) {
  let text = fs.readFileSync(csvPath, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = parseCsv(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1)
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row, index) => {
      const record = { __line__: index + 2 };
      headers.forEach((header, columnIndex) => {
        record[header] = row[columnIndex] ?? "";
      });
      return record;
    });
  return { headers, records };
}

function chooseKey(table, explicitKey) {
  if (explicitKey) {
    return explicitKey.split(",").map((item) => item.trim()).filter(Boolean);
  }
  const singleUnique = table.uniques.find((key) => (
    key.keyName !== "PRIMARY"
    && key.columns.length === 1
    && key.columns[0] !== "external_id"
    && key.columns[0] !== "id"
  ));
  if (!singleUnique) {
    throw new Error(`Cannot auto-detect key for table ${table.name}. Pass --key column_name or --key col1,col2.`);
  }
  return singleUnique.columns;
}

function sqlId(name) {
  return `\`${String(name).replace(/`/g, "``")}\``;
}

function keyOf(row, keyColumns) {
  return keyColumns.map((column) => String(row[column] ?? "").trim()).join("\u0001");
}

function normalizeCsvValue(value, columnDef) {
  const trimmed = String(value ?? "").trim();
  if (trimmed !== "") return trimmed;
  if (columnDef && columnDef.nullable) return null;
  if (columnDef && columnDef.hasDefault) return undefined;
  return "";
}

function normalizeCompareValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace("T", " ");
  return String(value).trim();
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function loadExistingRows(connection, tableName, columns) {
  const [rows] = await connection.query(
    `SELECT ${columns.map(sqlId).join(", ")} FROM ${sqlId(tableName)}`
  );
  return rows;
}

async function insertRows(connection, tableName, columns, rows, table) {
  for (const batch of chunk(rows, 200)) {
    const placeholders = batch.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
    const sql = `
      INSERT INTO ${sqlId(tableName)} (${columns.map(sqlId).join(", ")})
      VALUES ${placeholders}
    `;
    const values = [];
    for (const record of batch) {
      for (const column of columns) {
        const value = normalizeCsvValue(record[column], table.columns.get(column));
        values.push(value === undefined ? null : value);
      }
    }
    await connection.query(sql, values);
  }
}

function rowContentKey(row, columns, table) {
  return JSON.stringify(columns.map((column) => {
    const value = row[column];
    const normalized = normalizeCsvValue(value, table.columns.get(column));
    return normalizeCompareValue(normalized === undefined ? null : normalized);
  }));
}

function addToMultiMap(map, key, row) {
  const items = map.get(key);
  if (items) {
    items.push(row);
  } else {
    map.set(key, [row]);
  }
}

function takeFromMultiMap(map, key) {
  const items = map.get(key);
  if (!items || items.length === 0) return null;
  const item = items.pop();
  if (items.length === 0) map.delete(key);
  return item;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printUsage();
    return;
  }
  if (!args.table || !args.csv) {
    printUsage();
    throw new Error("--table and --csv are required.");
  }

  const tableName = args.table;
  const csvPath = path.resolve(ROOT, args.csv);
  const schemaPath = path.resolve(ROOT, args.schema || DEFAULT_SCHEMA);
  const envPath = path.resolve(ROOT, args.env || DEFAULT_ENV);
  const apply = Boolean(args.apply);
  const compareAllColumns = Boolean(args.compareAllColumns);
  const replaceTable = Boolean(args.replaceTable);
  const backup = apply && !args.noBackup;

  if (apply && compareAllColumns) {
    throw new Error("--compare-all-columns is read-only and cannot be used with --apply.");
  }
  if (replaceTable && !apply) {
    throw new Error("--replace-table requires --apply.");
  }
  if (replaceTable && compareAllColumns) {
    throw new Error("--replace-table cannot be combined with --compare-all-columns.");
  }

  if (!fs.existsSync(csvPath)) throw new Error(`CSV file not found: ${csvPath}`);
  if (!fs.existsSync(schemaPath)) throw new Error(`Schema file not found: ${schemaPath}`);

  const schema = parseSchema(schemaPath);
  const table = schema.get(tableName);
  if (!table) throw new Error(`Table not found in schema: ${tableName}`);

  const { headers, records } = readCsv(csvPath);
  const ignoredColumns = new Set(["id", "created_at", "updated_at"]);
  const unknownHeaders = headers.filter((header) => header && !table.columns.has(header));
  const dataColumns = headers.filter((header) => (
    header
    && table.columns.has(header)
    && !table.columns.get(header).autoIncrement
    && !ignoredColumns.has(header)
  ));

  const env = { ...loadEnv(envPath), ...process.env };
  const connection = await mysql.createConnection({
    host: env.DB_HOST || "127.0.0.1",
    port: env.DB_PORT ? Number(env.DB_PORT) : 3306,
    user: env.DB_USER || "root",
    password: env.DB_PASS || "",
    database: env.DB_NAME || "rdcdb",
  });

  if (compareAllColumns) {
    try {
      const existingRows = await loadExistingRows(connection, tableName, dataColumns);
      const existingByContent = new Map();
      for (const row of existingRows) {
        addToMultiMap(existingByContent, rowContentKey(row, dataColumns, table), row);
      }

      const csvOnly = [];
      const unchanged = [];
      for (const record of records) {
        const key = rowContentKey(record, dataColumns, table);
        const matched = takeFromMultiMap(existingByContent, key);
        if (matched) {
          unchanged.push(record);
        } else {
          csvOnly.push(record);
        }
      }

      const dbOnly = [...existingByContent.values()].reduce((total, rows) => total + rows.length, 0);

      console.log(`Table: ${tableName}`);
      console.log(`CSV: ${csvPath}`);
      console.log(`Key: full row content`);
      console.log(`Mode: dry-run`);
      console.log("");
      console.log(`CSV rows: ${records.length}`);
      console.log(`Existing DB rows: ${existingRows.length}`);
      console.log(`CSV-only rows: ${csvOnly.length}`);
      console.log(`DB-only rows: ${dbOnly}`);
      console.log(`Unchanged: ${unchanged.length}`);
      if (unknownHeaders.length > 0) {
        console.log(`Ignored CSV columns not in table: ${unknownHeaders.join(", ")}`);
      }
      if (csvOnly.length > 0) {
        console.log("");
        console.log("CSV-only samples:");
        csvOnly.slice(0, 10).forEach((record) => {
          console.log(`- line ${record.__line__}`);
        });
      }
      console.log("");
      console.log("Dry-run only. Full-row comparison is read-only and does not apply changes.");
      return;
    } finally {
      await connection.end();
    }
  }

  if (replaceTable) {
    try {
      console.log(`Table: ${tableName}`);
      console.log(`CSV: ${csvPath}`);
      console.log(`Mode: apply`);
      console.log(`Write strategy: replace table`);
      if (backup) console.log(`Backup: yes`);
      console.log("");
      console.log(`CSV rows: ${records.length}`);

      if (backup) {
        const now = new Date();
        const timestamp = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
          String(now.getHours()).padStart(2, "0"),
          String(now.getMinutes()).padStart(2, "0"),
          String(now.getSeconds()).padStart(2, "0"),
        ].join("");
        const backupTable = `${tableName}_backup_${timestamp}`;
        await connection.query(`CREATE TABLE ${sqlId(backupTable)} AS SELECT * FROM ${sqlId(tableName)}`);
        console.log(`Backup table created: ${backupTable}`);
      }

      await connection.beginTransaction();
      try {
        await connection.query(`DELETE FROM ${sqlId(tableName)}`);
        await insertRows(connection, tableName, dataColumns, records, table);
        await connection.commit();
        console.log("");
        console.log(`Applied successfully. Replaced rows: ${records.length}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
      return;
    } finally {
      await connection.end();
    }
  }

  const keyColumns = chooseKey(table, args.key);
  for (const keyColumn of keyColumns) {
    if (!table.columns.has(keyColumn)) throw new Error(`Key column ${keyColumn} does not exist in table ${tableName}.`);
    if (!headers.includes(keyColumn)) throw new Error(`CSV is missing key column: ${keyColumn}`);
  }

  const updateColumns = dataColumns.filter((column) => !keyColumns.includes(column));
  const selectColumns = [...new Set([...keyColumns, ...updateColumns])];

  const duplicateCsvKeys = [];
  const csvByKey = new Map();
  for (const record of records) {
    const key = keyOf(record, keyColumns);
    if (keyColumns.some((column) => String(record[column] ?? "").trim() === "")) {
      throw new Error(`CSV line ${record.__line__} has empty key column: ${keyColumns.join(",")}`);
    }
    if (csvByKey.has(key)) {
      duplicateCsvKeys.push({ line: record.__line__, firstLine: csvByKey.get(key).__line__, key });
    } else {
      csvByKey.set(key, record);
    }
  }
  if (duplicateCsvKeys.length > 0) {
    console.log("CSV contains duplicate keys:");
    duplicateCsvKeys.slice(0, 20).forEach((item) => {
      console.log(`- line ${item.line} duplicates line ${item.firstLine}`);
    });
    throw new Error(`Please fix duplicate keys in CSV before updating. Count: ${duplicateCsvKeys.length}`);
  }

  try {
    const existingRows = await loadExistingRows(connection, tableName, selectColumns);
    const existingByKey = new Map(existingRows.map((row) => [keyOf(row, keyColumns), row]));

    const inserts = [];
    const updates = [];
    const unchanged = [];
    for (const record of records) {
      const key = keyOf(record, keyColumns);
      const existing = existingByKey.get(key);
      if (!existing) {
        inserts.push(record);
        continue;
      }
      const changedColumns = [];
      for (const column of updateColumns) {
        const newValue = normalizeCsvValue(record[column], table.columns.get(column));
        if (newValue === undefined) continue;
        const oldValue = normalizeCompareValue(existing[column]);
        if (normalizeCompareValue(newValue) !== oldValue) {
          changedColumns.push(column);
        }
      }
      if (changedColumns.length > 0) {
        updates.push({ record, changedColumns });
      } else {
        unchanged.push(record);
      }
    }

    console.log(`Table: ${tableName}`);
    console.log(`CSV: ${csvPath}`);
    console.log(`Key: ${keyColumns.join(", ")}`);
    console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
    if (apply) console.log(`Backup: ${backup ? "yes" : "no"}`);
    console.log("");
    console.log(`CSV rows: ${records.length}`);
    console.log(`Existing DB rows: ${existingRows.length}`);
    console.log(`Will insert: ${inserts.length}`);
    console.log(`Will update: ${updates.length}`);
    console.log(`Unchanged: ${unchanged.length}`);
    if (unknownHeaders.length > 0) {
      console.log(`Ignored CSV columns not in table: ${unknownHeaders.join(", ")}`);
    }
    if (updates.length > 0) {
      console.log("");
      console.log("Update samples:");
      updates.slice(0, 10).forEach((item) => {
        console.log(`- line ${item.record.__line__}, key=${keyColumns.map((column) => item.record[column]).join("|")}, columns=${item.changedColumns.join(",")}`);
      });
    }
    if (inserts.length > 0) {
      console.log("");
      console.log("Insert samples:");
      inserts.slice(0, 10).forEach((record) => {
        console.log(`- line ${record.__line__}, key=${keyColumns.map((column) => record[column]).join("|")}`);
      });
    }

    if (!apply) {
      console.log("");
      console.log("Dry-run only. Add --apply to write these changes to the database.");
      return;
    }

    if (backup) {
      const now = new Date();
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
      ].join("");
      const backupTable = `${tableName}_backup_${timestamp}`;
      await connection.query(`CREATE TABLE ${sqlId(backupTable)} AS SELECT * FROM ${sqlId(tableName)}`);
      console.log("");
      console.log(`Backup table created: ${backupTable}`);
    }

    await connection.beginTransaction();
    try {
      const insertColumns = dataColumns;
      const updateAssignments = updateColumns.map((column) => `${sqlId(column)} = VALUES(${sqlId(column)})`);
      if (updateAssignments.length === 0) {
        throw new Error("No updatable columns found in CSV.");
      }
      const rowsToWrite = [...inserts, ...updates.map((item) => item.record)];
      for (const batch of chunk(rowsToWrite, 200)) {
        const placeholders = batch.map(() => `(${insertColumns.map(() => "?").join(", ")})`).join(", ");
        const sql = `
          INSERT INTO ${sqlId(tableName)} (${insertColumns.map(sqlId).join(", ")})
          VALUES ${placeholders}
          ON DUPLICATE KEY UPDATE ${updateAssignments.join(", ")}
        `;
        const values = [];
        for (const record of batch) {
          for (const column of insertColumns) {
            const value = normalizeCsvValue(record[column], table.columns.get(column));
            values.push(value === undefined ? null : value);
          }
        }
        await connection.query(sql, values);
      }
      await connection.commit();
      console.log("");
      console.log(`Applied successfully. Inserted/updated rows: ${rowsToWrite.length}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
