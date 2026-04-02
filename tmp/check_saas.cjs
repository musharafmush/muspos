const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'pos-data.db'));

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log('Users in DB:', users);

const tenants = db.prepare('SELECT id, name, subdomain FROM tenants').all();
console.log('Tenants in DB:', tenants);

db.close();
