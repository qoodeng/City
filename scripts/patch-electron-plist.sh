#!/bin/bash
# Patches the dev-mode Electron.app Info.plist so the dock shows "City" instead of "Electron"

ELECTRON_APP=$(node -e "const p = require('electron/package.json'); const d = require('path').dirname(require.resolve('electron/package.json')); console.log(d + '/dist/Electron.app')")

if [ -d "$ELECTRON_APP" ]; then
  PLIST="$ELECTRON_APP/Contents/Info.plist"
  /usr/libexec/PlistBuddy -c "Set :CFBundleName City" "$PLIST" 2>/dev/null
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName City" "$PLIST" 2>/dev/null

  # Copy icon into Electron.app Resources
  ICON_SRC="$(dirname "$0")/../build/icon.png"
  if [ -f "$ICON_SRC" ]; then
    cp "$ICON_SRC" "$ELECTRON_APP/Contents/Resources/icon.png"
  fi
fi
