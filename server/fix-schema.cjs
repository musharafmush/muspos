const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'pos-data.db');
const db = new sqlite3(dbPath);

console.log('🔄 Updating database schema...');

try {
    // Update cash_registers table
    try {
        db.prepare('ALTER TABLE cash_registers ADD COLUMN total_transactions INTEGER DEFAULT 0').run();
        console.log('✅ Added total_transactions to cash_registers');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('ℹ️ total_transactions already exists in cash_registers');
        } else {
            throw e;
        }
    }

    // Update cash_register_transactions table
    const trCols = [
        { name: 'reason', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'created_by', type: 'TEXT' }
    ];

    for (const col of trCols) {
        try {
            db.prepare(`ALTER TABLE cash_register_transactions ADD COLUMN ${col.name} ${col.type}`).run();
            console.log(`✅ Added ${col.name} to cash_register_transactions`);
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log(`ℹ️ ${col.name} already exists in cash_register_transactions`);
            } else {
                throw e;
            }
        }
    }

    console.log('✨ Schema update complete!');
} catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
}
