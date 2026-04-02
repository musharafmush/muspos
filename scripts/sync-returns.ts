
import { storage } from '../server/storage.js';
import { sqlite } from '../db/index.js';

async function fix() {
  try {
    const allReturns = sqlite.prepare('SELECT * FROM returns').all() as any[];
    console.log(`Found ${allReturns.length} returns.`);
    for (const ret of allReturns) {
      console.log(`Fixing sale ${ret.sale_id || ret.saleId}...`);
      sqlite.prepare('UPDATE sales SET status = ? WHERE id = ?').run('returned', ret.sale_id || ret.saleId);
    }
    console.log('✅ Statuses synchronized.');
  } catch (e) {
    console.error(e);
  }
}
fix();
