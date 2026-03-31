const Database = require('better-sqlite3');
const db = new Database('pos-data.db');
console.log('🔄 Starting Supplier Balance Synchronization...');
try {
  db.exec('UPDATE suppliers SET outstanding_balance = 0');
  const purchases = db.prepare('SELECT supplier_id, SUM(CAST(total AS REAL) - COALESCE(CAST(amount_paid AS REAL), 0)) as true_balance FROM purchases GROUP BY supplier_id').all();
  const updateStmt = db.prepare('UPDATE suppliers SET outstanding_balance = ? WHERE id = ?');
  let count = 0;
  for (const p of purchases) {
    if (p.supplier_id) {
       updateStmt.run(p.true_balance, p.supplier_id);
       count++;
       console.log('✅ Synced Supplier ID ' + p.supplier_id + ' -> New Balance: ₹' + p.true_balance);
    }
  }
  console.log('🎉 Successfully synchronized balances for ' + count + ' suppliers!');
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}
