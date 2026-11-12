#!/bin/zsh
# 이미지 다운로더를 macOS 로그인 항목(LaunchAgent)으로 등록하거나 해제합니다.
# - 로그인하면 자동으로 시작하고, 비정상 종료되면 1분 뒤 다시 시작합니다.
# - 다 받았거나 용량 한도에 도달해 정상 종료하면 다시 시작하지 않습니다.
# - 인터넷이 끊기면 다운로더가 연결될 때까지 기다렸다가 이어서 받습니다.
#
# 사용: scripts/media/launch-agent.sh install [한도GB]   # 기본 200
#       scripts/media/launch-agent.sh uninstall
#       scripts/media/launch-agent.sh status
set -e
LABEL=com.ryushin0.fanatic-museum-download
PLIST=~/Library/LaunchAgents/$LABEL.plist
REPO=${0:A:h:h:h}
MEDIA=${FANATIC_MEDIA_DIR:-$HOME/Documents/Fanatic-Museum}
NODE=$(command -v node)
DOMAIN=gui/$(id -u)

case "$1" in
  install)
    LIMIT=${2:-200}
    mkdir -p ~/Library/LaunchAgents "$MEDIA"
    cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string><string>-i</string>
    <string>$NODE</string><string>$REPO/scripts/media/download.mjs</string>
    <string>--limit-gb</string><string>$LIMIT</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>FANATIC_MEDIA_DIR</key><string>$MEDIA</string></dict>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>60</integer>
  <key>StandardOutPath</key><string>$MEDIA/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$MEDIA/launchd.err.log</string>
</dict>
</plist>
PLIST
    plutil -lint "$PLIST" >/dev/null
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    echo "등록했습니다: $PLIST (한도 ${LIMIT}GB, 보관함 $MEDIA)"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "해제했습니다."
    ;;
  status)
    launchctl print "$DOMAIN/$LABEL" | grep -E 'state =|runs =|pid =|last exit' | head -4
    tail -3 "$MEDIA/download.log"
    ;;
  *)
    echo "사용: $0 install [한도GB] | uninstall | status"
    exit 1
    ;;
esac
