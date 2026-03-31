import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
      
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await pool.query(statements[i]);
        console.log(`Executed statement ${i + 1}/${statements.length} successfully.`);
      } catch (err) {
        console.warn(`Warning executing statement ${i + 1}:`, (err as Error).message);
        // Continue execution even if a statement fails (like INSERT IGNORE failing or tables already existing)
      }
    }
    
    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDatabase();
