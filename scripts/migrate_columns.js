import Database from 'better-sqlite3';
const db = new Database('pos-data.db');

function migrateTable(tableName, columnsToChange) {
    console.log(`Migrating table: ${tableName}`);
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    if (!row) {
        console.log(`Table ${tableName} not found.`);
        return;
    }

    let sql = row.sql;
    let changed = false;
    for (const col of columnsToChange) {
        const regex = new RegExp(`\\b${col}\\b\\s+INTEGER`, 'gi');
        if (regex.test(sql)) {
            sql = sql.replace(regex, `${col} REAL`);
            changed = true;
        }
    }

    if (!changed) {
        console.log(`Table ${tableName} already migrated or doesn't need change.`);
        return;
    }

    console.log(`New SQL for ${tableName}: ${sql}`);

    try {
        db.prepare("PRAGMA foreign_keys = OFF").run();
        db.transaction(() => {
            db.prepare(`ALTER TABLE ${tableName} RENAME TO ${tableName}_old`).run();
            db.prepare(sql).run();

            const info = db.prepare(`PRAGMA table_info(${tableName}_old)`).all();
            const cols = info.map(c => `"${c.name}"`).join(', ');

            db.prepare(`INSERT INTO ${tableName} (${cols}) SELECT ${cols} FROM ${tableName}_old`).run();
            db.prepare(`DROP TABLE ${tableName}_old`).run();
        })();
        db.prepare("PRAGMA foreign_keys = ON").run();
        console.log(`✅ Table ${tableName} migrated successfully.`);
    } catch (err) {
        db.prepare("PRAGMA foreign_keys = ON").run();
        console.error(`❌ Failed to migrate ${tableName}:`, err.message);
    }
}

migrateTable('products', ['stock_quantity']);
migrateTable('sale_items', ['quantity']);
migrateTable('purchase_items', ['quantity', 'received_qty', 'free_qty']);

db.close();
