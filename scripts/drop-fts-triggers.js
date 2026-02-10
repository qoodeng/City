const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'city.db');
const db = new Database(dbPath);

console.log('Dropping FTS triggers...');
try {
    db.exec('DROP TRIGGER IF EXISTS issues_fts_insert');
    db.exec('DROP TRIGGER IF EXISTS issues_fts_update');
    db.exec('DROP TRIGGER IF EXISTS issues_fts_delete');
    console.log('Triggers dropped.');

    // Also drop the virtual table to be clean
    db.exec('DROP TABLE IF EXISTS issues_fts');
    console.log('Virtual table dropped.');
} catch (err) {
    console.error('Error:', err);
}
