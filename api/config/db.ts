import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure db directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'dianping.sqlite');

let dbInstance: any = null;

// Initialize the database connection
const initDb = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
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
  query
};

export default pool;