import { app, BrowserWindow, shell, nativeImage, ipcMain, utilityProcess } from "electron";
import path from "path";
import { autoUpdater } from "electron-updater";
import { BackupService } from "./backup-service";

// Check if we are in development mode
// app.isPackaged is the reliable way to detect packaged Electron apps
// (NODE_ENV is not automatically set in packaged builds)
const isDev = !app.isPackaged;
const PORT = 3000;

let mainWindow: BrowserWindow | null = null;

// Set app name (shows in macOS menu bar)
app.setName("C.I.T.Y.");

// Set dock icon on macOS
const iconPath = isDev
    ? path.join(__dirname, "..", "build", "icon.png")
    : path.join(process.resourcesPath, "icon.png");

if (process.platform === "darwin") {
    try {
        const icon = nativeImage.createFromPath(iconPath);
        if (!icon.isEmpty()) {
            app.dock?.setIcon(icon);
        }
    } catch {
        // Icon not found, use default
    }
}

// Auto-updates are triggered inside app.on("ready") below

const createWindow = () => {
    mainWindow = new BrowserWindow({
        title: "C.I.T.Y.",
        icon: iconPath,
        width: 1280,
        height: 800,
        show: false, // Don't show until content is ready
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: "hiddenInset", // Native macOS look
        trafficLightPosition: { x: 12, y: 12 },
        backgroundColor: "#000000",
    });

    const startUrl = `http://localhost:${PORT}`;

    // Show window once content has loaded
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });

    // Retry loading if server isn't ready yet (ERR_CONNECTION_REFUSED, etc.)
    let retryCount = 0;
    const maxRetries = 10;
    mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
        console.log(`Page load failed (attempt ${retryCount + 1}): ${errorDescription} (${errorCode})`);
        if (retryCount < maxRetries && mainWindow && !mainWindow.isDestroyed()) {
            retryCount++;
            const delay = Math.min(500 * retryCount, 3000);
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    console.log(`Retrying load (attempt ${retryCount})...`);
                    mainWindow.loadURL(startUrl);
                }
            }, delay);
        }
    });

    mainWindow.loadURL(startUrl);

    // Permission request handler
    mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
        return callback(true);
    });

    // Hide window buttons on startup (macOS)
    if (process.platform === "darwin") {
        mainWindow.setWindowButtonVisibility(false);
    }

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    // Handle traffic light visibility from renderer
    ipcMain.on("city:set-window-controls", (_, visible: boolean) => {
        if (process.platform === "darwin" && mainWindow) {
            mainWindow.setWindowButtonVisibility(visible);
        }
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};

// Application Lifecycle
app.on("ready", async () => {
    if (isDev) {
        // In dev, we assume 'pnpm dev' is already running
        createWindow();
    } else {
        // In prod, we MUST spawn the Next.js server ourselves
        // The standalone build exposes 'server.js' in the root of the bundled output
        await startNextServer();
        createWindow();
    }

    // Initialize Backup Service
    // In Dev: project-root/city.db
    // In Prod: resources/server/city.db (since server.js runs there)
    const dbPath = isDev
        ? path.join(process.cwd(), "city.db")
        : path.join(process.resourcesPath, "server", "city.db");

    // Ensure we handle backups gracefully
    try {
        const backupService = new BackupService(dbPath);
        // Start periodic backups (and initial one)
        backupService.init();

        // Perform final backup on quit
        app.on("before-quit", async () => {
            console.log("Creating backup before quit...");
            await backupService.performBackup("quit");
            backupService.stop();
        });
    } catch (err) {
        console.error("Failed to start backup service:", err);
    }

    // Check for updates after app is fully loaded (production only)
    if (!isDev) {
        setTimeout(() => {
            try {
                autoUpdater.checkForUpdatesAndNotify();
            } catch (err) {
                console.error("Auto-update check failed:", err);
            }
        }, 10000); // Wait 10s for app to fully load
    }
});

// Handle uncaught exceptions in the main process
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception in Main Process:", error);
    // Optional: Show a dialog if mainWindow exists
    if (mainWindow && !mainWindow.isDestroyed()) {
        const { dialog } = require("electron");
        dialog.showErrorBox("Application Error", `An unexpected error occurred: ${error.message}\n\nThe application will try to continue.`);
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

async function startNextServer() {
    return new Promise<void>((resolve, reject) => {
        try {
            const serverPath = path.join(
                process.resourcesPath,
                "server",
                "server.js"
            );

            console.log("Starting production server from:", serverPath);

            // Use utilityProcess.fork() instead of child_process.spawn()
            // to avoid a second dock icon on macOS
            const serverProcess = utilityProcess.fork(serverPath, [], {
                env: {
                    ...process.env,
                    NODE_ENV: "production",
                    PORT: "3000",
                    HOSTNAME: "127.0.0.1",
                },
                cwd: path.dirname(serverPath),
                stdio: "pipe",
            });

            serverProcess.stdout?.on("data", (data: Buffer) => {
                const str = data.toString();
                console.log("Next.js:", str);
                if (str.includes("Ready")) {
                    resolve();
                }
            });

            serverProcess.stderr?.on("data", (data: Buffer) => {
                console.error("Next.js Error:", data.toString());
            });

            serverProcess.on("spawn", () => {
                console.log("Next.js server process spawned");
            });

            serverProcess.on("exit", (code: number) => {
                console.log(`Next.js server exited with code ${code}`);
            });

            // Fallback timeout in case "Ready" message isn't caught
            setTimeout(() => resolve(), 5000);

            app.on("before-quit", () => {
                serverProcess.kill();
            });
        } catch (err) {
            console.error("Failed to start server:", err);
            reject(err);
        }
    });
}
