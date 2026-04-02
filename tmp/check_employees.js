
import Database from 'better-sqlite3';
const sqlite = new Database('pos-data.db');

console.log('--- Employees Table ---');
try {
  const employees = sqlite.prepare('SELECT * FROM employees').all();
  console.log('Count:', employees.length);
  console.log('Sample:', JSON.stringify(employees[0], null, 2));
} catch (e) {
  console.log('Error:', e.message);
}

console.log('--- Users Table ---');
try {
  const users = sqlite.prepare('SELECT id, username, name FROM users').all();
  console.log('Count:', users.length);
  console.log('Sample:', JSON.stringify(users[0], null, 2));
} catch (e) {
  console.log('Error:', e.message);
}
