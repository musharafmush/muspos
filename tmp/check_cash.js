import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'pos-data.db');

const db = new Database(dbPath);

console.log('--- Current Cash Registers ---');
try {
  const registers = db.prepare("SELECT id, status, current_cash, cash_received, total_refunds, total_sales, total_transactions FROM cash_registers WHERE status = 'open'").all();
  console.log(registers);
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n--- Recent Register Transactions ---');
try {
  const transactions = db.prepare("SELECT * FROM cash_register_transactions ORDER BY created_at DESC LIMIT 10").all();
  console.log(transactions);
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n--- Recent Returns ---');
try {
  const returns = db.prepare("SELECT * FROM returns ORDER BY created_at DESC LIMIT 10").all();
  console.log(returns);
} catch (e) {
  console.log('Error:', e.message);
}
