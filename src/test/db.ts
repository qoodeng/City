import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { counters } from "@/lib/db/schema";
import fs from "fs";
import path from "path";
import os from "os";

interface TestDb {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
  dbPath: string;
}

export function createTestDb(): TestDb {
  const dbPath = path.join(os.tmpdir(), `city-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Create tables matching schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      color TEXT NOT NULL DEFAULT '#FFD700',
      icon TEXT NOT NULL DEFAULT 'folder',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      priority TEXT NOT NULL DEFAULT 'none',
      assignee TEXT,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      parent_id TEXT,
      due_date TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
    CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
    CREATE INDEX IF NOT EXISTS idx_issues_number ON issues(number);
    CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues(due_date);
    CREATE INDEX IF NOT EXISTS idx_issues_parent_id ON issues(parent_id);

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6B7280',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS issue_labels (
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_issue_labels_issue_id ON issue_labels(issue_id);
    CREATE INDEX IF NOT EXISTS idx_issue_labels_label_id ON issue_labels(label_id);

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);

    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );

    -- FTS5 virtual table
    CREATE VIRTUAL TABLE IF NOT EXISTS issues_fts USING fts5(
      title, description, content='issues', content_rowid='rowid'
    );

    -- FTS triggers
    CREATE TRIGGER IF NOT EXISTS issues_fts_insert AFTER INSERT ON issues BEGIN
      INSERT INTO issues_fts(rowid, title, description)
      VALUES (NEW.rowid, NEW.title, COALESCE(NEW.description, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS issues_fts_update AFTER UPDATE ON issues BEGIN
      INSERT INTO issues_fts(issues_fts, rowid, title, description)
      VALUES ('delete', OLD.rowid, OLD.title, COALESCE(OLD.description, ''));
      INSERT INTO issues_fts(rowid, title, description)
      VALUES (NEW.rowid, NEW.title, COALESCE(NEW.description, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS issues_fts_delete AFTER DELETE ON issues BEGIN
      INSERT INTO issues_fts(issues_fts, rowid, title, description)
      VALUES ('delete', OLD.rowid, OLD.title, COALESCE(OLD.description, ''));
    END;
  `);

  const db = drizzle(sqlite, { schema });

  // Seed counter
  db.insert(counters)
    .values({ id: "issue_counter", value: 0 })
    .onConflictDoNothing()
    .run();

  return { db, sqlite, dbPath };
}

export function cleanupTestDb(testDb: TestDb) {
  try {
    testDb.sqlite.close();
  } catch {
    // Already closed
  }
  try {
    fs.unlinkSync(testDb.dbPath);
    // Also try to remove WAL and SHM files
    fs.unlinkSync(testDb.dbPath + "-wal");
    fs.unlinkSync(testDb.dbPath + "-shm");
  } catch {
    // Files may not exist
  }
}
