#!/bin/bash
# Wiser OS — one-time MacBook setup. Double-click (or: bash install-mac.command).
# Builds ~/Applications/WiserOpen.app and registers the wiser-open:// link type,
# so the Open on Mac buttons launch your local video in one tap.
set -e
APP="$HOME/Applications/WiserOpen.app"
mkdir -p "$HOME/Applications"
rm -rf "$APP"
TMP="$(mktemp -d)"
cat > "$TMP/h.applescript" <<'AS'
on open location theURL
	set p to theURL
	set AppleScript's text item delimiters to "path="
	set parts to text items of p
	if (count of parts) < 2 then return
	set enc to item 2 of parts
	set p to do shell script "python3 -c 'import sys,urllib.parse;print(urllib.parse.unquote_plus(sys.argv[1]),end=\"\")' " & quoted form of enc
	if p starts with "~/" then set p to (POSIX path of (path to home folder)) & text 3 thru -1 of p
	set low to do shell script "echo " & quoted form of p & " | tr '[:upper:]' '[:lower:]'"
	-- Safety: only ever open video files
	if not (low ends with ".mp4" or low ends with ".mov" or low ends with ".m4v" or low ends with ".mkv" or low ends with ".avi" or low ends with ".webm") then
		display dialog "Wiser OS only opens video files:" & return & p buttons {"OK"} with icon stop
		return
	end if
	try
		do shell script "test -e " & quoted form of p
		do shell script "open " & quoted form of p
	on error
		display dialog "File not found on this Mac:" & return & p buttons {"OK"} with icon caution
	end try
end open location
AS
osacompile -o "$APP" "$TMP/h.applescript"
PL="$APP/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string com.wiser.open" "$PL" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :LSUIElement bool true" "$PL" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PL"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PL"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string Wiser Open" "$PL"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PL"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string wiser-open" "$PL"
codesign --force --sign - "$APP" >/dev/null 2>&1 || true
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP"
open "$APP" 2>/dev/null || true
echo "Done. Wiser OS 'Open on Mac' buttons now work. First tap: click Open when the browser asks."
