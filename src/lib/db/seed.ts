import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { counters, labels } from "./schema";
import { nanoid } from "nanoid";
import { DEFAULT_LABELS } from "../constants";
import path from "path";

const DB_PATH = path.join(process.cwd(), "city.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

async function seed() {
  console.log("Seeding database...");

  // Insert counter for issue numbering
  db.insert(counters)
    .values({ id: "issue_counter", value: 0 })
    .onConflictDoNothing()
    .run();

  console.log("  - Counter created");

  // Insert default labels
  if (DEFAULT_LABELS.length > 0) {
    db.insert(labels)
      .values(
        DEFAULT_LABELS.map((label) => ({
          id: nanoid(),
          name: label.name,
          color: label.color,
          description: label.description,
        }))
      )
      .onConflictDoNothing()
      .run();
  }

  console.log("  - Default labels created");
  console.log("Seeding complete!");

  sqlite.close();
}

seed().catch(console.error);
