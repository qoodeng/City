import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.DATABASE_URL || process.env.DB_PATH || path.join(process.cwd(), "city.db");

let sqlite: Database.Database | null = null;

function initFts(db: Database.Database) {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS issues_fts USING fts5(
      title, description, content='issues', content_rowid='rowid'
    );
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS issues_fts_insert AFTER INSERT ON issues BEGIN
      INSERT INTO issues_fts(rowid, title, description)
      VALUES (NEW.rowid, NEW.title, COALESCE(NEW.description, ''));
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS issues_fts_update AFTER UPDATE ON issues BEGIN
      INSERT INTO issues_fts(issues_fts, rowid, title, description)
      VALUES ('delete', OLD.rowid, OLD.title, COALESCE(OLD.description, ''));
      INSERT INTO issues_fts(rowid, title, description)
      VALUES (NEW.rowid, NEW.title, COALESCE(NEW.description, ''));
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS issues_fts_delete AFTER DELETE ON issues BEGIN
      INSERT INTO issues_fts(issues_fts, rowid, title, description)
      VALUES ('delete', OLD.rowid, OLD.title, COALESCE(OLD.description, ''));
    END;
  `);

  // Rebuild FTS index if table is empty but issues exist
  const ftsCount = db.prepare("SELECT count(*) as cnt FROM issues_fts").get() as { cnt: number };
  const issueCount = db.prepare("SELECT count(*) as cnt FROM issues").get() as { cnt: number };
  if (ftsCount.cnt === 0 && issueCount.cnt > 0) {
    db.exec("INSERT INTO issues_fts(issues_fts) VALUES('rebuild')");
  }
}

function getMigrationsFolder(): string {
  // In Electron production, migrations are bundled alongside the server
  if (process.env.NODE_ENV === "production" && process.resourcesPath) {
    return path.join(process.resourcesPath, "server", "drizzle");
  }
  return path.join(process.cwd(), "drizzle");
}

function getSqlite() {
  if (!sqlite) {
    sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    // Run Drizzle migrations (applies only pending ones, no-op if up to date)
    const orm = drizzle(sqlite, { schema });
    migrate(orm, { migrationsFolder: getMigrationsFolder() });

    initFts(sqlite);
  }
  return sqlite;
}

export const db = drizzle(getSqlite(), { schema });
export { getSqlite };
