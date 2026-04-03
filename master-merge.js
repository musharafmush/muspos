import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'pos-data.db'); // Adjust if DB is elsewhere

console.log('🔄 Opening database at:', dbPath);
const db = new Database(dbPath);

try {
  // 🛑 DISABLE FOREIGN KEYS TO ALLOW MERGE
  db.pragma('foreign_keys = OFF');
  console.log('🔓 Foreign keys disabled for merge...');

  console.log('🔄 1. Fixing Tenant IDs...');
  db.prepare("UPDATE customers SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0").run();
  db.prepare("UPDATE suppliers SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0").run();
  db.prepare("UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0 AND role != 'super_admin'").run();

  console.log('🔄 2. Identifying Duplicate Customers...');
  const duplicates = db.prepare(`
    SELECT name, COALESCE(phone, '') as phone_grouped, GROUP_CONCAT(id) as ids, COUNT(*) as count 
    FROM customers 
    GROUP BY name, phone_grouped
    HAVING count > 1
  `).all();

  if (duplicates.length === 0) {
    console.log('✅ No duplicated customers found.');
  }

  for (const dup of duplicates) {
    const idArray = dup.ids.split(',').map(Number).sort((a, b) => a - b);
    const masterId = idArray[0];
    const redundantIds = idArray.slice(1);

    console.log(`➡️ Merging "${dup.name}" (${dup.phone_grouped}) into Master ID ${masterId}...`);
    
    for (const oldId of redundantIds) {
      // Move ALL related data to the master ID
      db.prepare('UPDATE sales SET customer_id = ? WHERE customer_id = ?').run(masterId, oldId);
      
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      
      if (tables.includes('customer_loyalty')) {
        db.prepare('UPDATE customer_loyalty SET customer_id = ? WHERE customer_id = ?').run(masterId, oldId);
      }
      if (tables.includes('offer_usage')) {
        db.prepare('UPDATE offer_usage SET customer_id = ? WHERE customer_id = ?').run(masterId, oldId);
      }
      
      // Delete the duplicate
      db.prepare('DELETE FROM customers WHERE id = ?').run(oldId);
      console.log(`   - Successfully merged ID ${oldId} -> ${masterId}`);
    }
  }

  // 🔒 RE-ENABLE FOREIGN KEYS
  db.pragma('foreign_keys = ON');
  console.log('🔒 Foreign keys re-enabled.');
  console.log('🎉 ALL FIXED! Please restart your server now.');

} catch (e) {
  console.error('❌ Error during merge:', e.message);
} finally {
  db.close();
}
