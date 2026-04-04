import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'pos-data.db');

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
      // 1. Move Sales
      db.prepare('UPDATE sales SET customer_id = ? WHERE customer_id = ?').run(masterId, oldId);
      
      // 2. Merge Loyalty Points (Handle UNIQUE constraint)
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      
      if (tables.includes('customer_loyalty')) {
        const masterLoyalty = db.prepare('SELECT id, available_points FROM customer_loyalty WHERE customer_id = ?').get(masterId);
        const oldLoyalty = db.prepare('SELECT id, available_points FROM customer_loyalty WHERE customer_id = ?').get(oldId);

        if (masterLoyalty && oldLoyalty) {
          // Combine points and delete the duplicate loyalty record
          const totalPoints = (masterLoyalty.available_points || 0) + (oldLoyalty.available_points || 0);
          db.prepare('UPDATE customer_loyalty SET available_points = ? WHERE id = ?').run(totalPoints, masterLoyalty.id);
          db.prepare('DELETE FROM customer_loyalty WHERE id = ?').run(oldLoyalty.id);
          console.log(`   - Combined loyalty points for ID ${oldId} into Master ${masterId}`);
        } else if (oldLoyalty) {
          // No master loyalty, move the old one to master
          db.prepare('UPDATE customer_loyalty SET customer_id = ? WHERE id = ?').run(masterId, oldLoyalty.id);
          console.log(`   - Moved loyalty record from ID ${oldId} to Master ${masterId}`);
        }
      }

      // 3. Move Offer Usage
      if (tables.includes('offer_usage')) {
        db.prepare('UPDATE offer_usage SET customer_id = ? WHERE customer_id = ?').run(masterId, oldId);
      }
      
      // 4. Delete the duplicate customer
      db.prepare('DELETE FROM customers WHERE id = ?').run(oldId);
      console.log(`   - Successfully deleted redundant customer ID ${oldId}`);
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
