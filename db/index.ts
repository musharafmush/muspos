import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "../shared/sqlite-schema.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For desktop app, always use SQLite for offline capability
const dbPath = path.join(__dirname, '..', 'pos-data.db');
console.log('Diagnostic: SQLite DB Path:', dbPath);
const sqlite = new Database(dbPath);
console.log('🚩 Checkpoint 0: Database constructor finished');
// sqlite.pragma('foreign_keys = ON');
console.log('🚩 Checkpoint 0.1: Pragma skipped (testing for crash)');

export const db = drizzle(sqlite, { schema });
console.log('🚩 Checkpoint 0.2: Drizzle initialized');
export { sqlite };