import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { schemaStatements, seedStatements } from '../db/bootstrap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = !!process.env.VERCEL;

const dbDir = isVercel
  ? '/tmp'
  : path.join(__dirname, '../../api/db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'dianping.sqlite');

let dbInstance: any = null;

let didBootstrap = false;

const bootstrapIfNeeded = async (db: any) => {
  if (didBootstrap) return;
  for (const stmt of schemaStatements) {
    await db.exec(stmt);
  }

  const row = await db.get('SELECT COUNT(1) as c FROM merchants');
  const c = Number(row?.c || 0);
  if (c === 0) {
    for (const stmt of seedStatements) {
      await db.exec(stmt);
    }
  }

  didBootstrap = true;
};

// Initialize the database connection
const initDb = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await bootstrapIfNeeded(dbInstance);
    console.log('Connected to the SQLite database.');
  }
  return dbInstance;
};

// Wrapper to use promises with SQLite, mimicking mysql2 interface
export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  const db = await initDb();

  if (sql.trim().toUpperCase().startsWith('SELECT')) {
    const rows = await db.all(sql, params);
    return [rows]; // Wrap in array to match mysql2 format [rows, fields]
  } else {
    const result = await db.run(sql, params);
    return [{ insertId: result.lastID, affectedRows: result.changes }];
  }
};

const pool = {
  query,
};

export default pool;
