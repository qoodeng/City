import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    isElectron: true,
    // robust pattern: expose only specific IPC channels if needed
    send: (channel: string, data: unknown) => {
        // whitelist channels
        const validChannels = ["toMain", "city:set-window-controls"];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel: string, func: (...args: unknown[]) => void) => {
        const validChannels = ["fromMain"];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
});
