import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { constants } from "fs";

export class BackupService {
    private backupDir: string;
    private dbPath: string;
    private intervalId: NodeJS.Timeout | null = null;
    private readonly BACKUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    private readonly MAX_BACKUPS = 50; // Keep last 50 backups

    constructor(dbPath: string) {
        this.dbPath = dbPath;
        this.backupDir = path.join(app.getPath("userData"), "backups");
    }

    async init() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log(`[BackupService] Backup directory: ${this.backupDir}`);

            // Perform initial backup on launch
            await this.performBackup("launch");

            // Start periodic backups
            this.intervalId = setInterval(() => {
                this.performBackup("auto");
            }, this.BACKUP_INTERVAL_MS);

        } catch (error) {
            console.error("[BackupService] Failed to initialize:", error);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async performBackup(reason: string = "manual") {
        try {
            // Check if DB exists
            try {
                await fs.access(this.dbPath, constants.R_OK);
            } catch {
                console.warn(`[BackupService] DB not found at ${this.dbPath}, skipping backup.`);
                return;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `city_backup_${timestamp}_${reason}.db`;
            const destPath = path.join(this.backupDir, filename);

            // Copy file
            await fs.copyFile(this.dbPath, destPath);
            console.log(`[BackupService] Backup created: ${filename}`);

            // Prune old backups
            await this.pruneBackups();

        } catch (error) {
            console.error("[BackupService] Backup failed:", error);
        }
    }

    private async pruneBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const dbFiles = files.filter(f => f.startsWith("city_backup_") && f.endsWith(".db"));

            if (dbFiles.length <= this.MAX_BACKUPS) return;

            // Sort by name (which includes timestamp) descending
            dbFiles.sort((a, b) => b.localeCompare(a));

            // Keep top MAX_BACKUPS, delete rest
            const toDelete = dbFiles.slice(this.MAX_BACKUPS);

            for (const file of toDelete) {
                await fs.unlink(path.join(this.backupDir, file));
                console.log(`[BackupService] Pruned old backup: ${file}`);
            }

        } catch (error) {
            console.error("[BackupService] Failed to prune backups:", error);
        }
    }
}
