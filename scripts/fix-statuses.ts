
import { sqlite } from '../db/index.js';

async function fixStatuses() {
  try {
    console.log('🔄 Fixing stale sale statuses...');
    const result = sqlite.prepare(`
      UPDATE sales 
      SET status = 'returned' 
      WHERE id IN (SELECT DISTINCT sale_id FROM returns)
    `).run();
    console.log(`✅ Fixed statuses for ${result.changes} sales.`);
  } catch (error) {
    console.error('❌ Failed to fix statuses:', error);
  }
}

fixStatuses();
