#!/bin/zsh
# 이미지 다운로더를 macOS 로그인 항목(LaunchAgent)으로 등록하거나 해제합니다.
# - 로그인하면 자동으로 시작하고, 비정상 종료되면 1분 뒤 다시 시작합니다.
# - 다 받았거나 용량 한도에 도달해 정상 종료하면 다시 시작하지 않습니다.
# - 인터넷이 끊기면 다운로더가 연결될 때까지 기다렸다가 이어서 받습니다.
#
# - 2시간마다 진행 상황(받은 용량·비율·멈춤 여부)을 알림 센터로 알립니다.
# - 다운로더가 멈추거나 다시 시작하면(재부팅·오류·수동·잠자기·인터넷 끊김) 바로 알립니다.
#
# 사용: scripts/media/launch-agent.sh install [한도GB]   # 기본 200
#       scripts/media/launch-agent.sh uninstall
#       scripts/media/launch-agent.sh status
set -e
LABEL=com.ryushin0.fanatic-museum-download
PLIST=~/Library/LaunchAgents/$LABEL.plist
# 2시간마다 진행 상황을 알림 센터로 알리는 항목
NOTIFY_LABEL=com.ryushin0.fanatic-museum-progress
NOTIFY_PLIST=~/Library/LaunchAgents/$NOTIFY_LABEL.plist
NOTIFY_INTERVAL=${FANATIC_NOTIFY_INTERVAL:-7200}
REPO=${0:A:h:h:h}
MEDIA=${FANATIC_MEDIA_DIR:-$HOME/Documents/Fanatic-Museum}
DOMAIN=gui/$(id -u)

# plist(XML)에 넣는 값의 특수문자를 바꿉니다.
xml() {
  local v=${1//&/&amp;}
  v=${v//</&lt;}
  v=${v//>/&gt;}
  print -r -- "$v"
}

# 다운로더가 종료 신호를 받지 못하고 끝나도, 다음에 시작할 때 '직접 멈춘 것'으로 알릴 수 있게 시각을 남깁니다.
mark_stop_requested() {
  if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
    mkdir -p "$MEDIA"
    print -r -- "$(date +%s)" > "$MEDIA/.download-stop-requested"
  fi
}

case "$1" in
  install)
    LIMIT=${2:-200}
    NODE=$(command -v node) || { echo "node를 찾을 수 없습니다."; exit 1; }
    X_NODE=$(xml "$NODE"); X_REPO=$(xml "$REPO"); X_MEDIA=$(xml "$MEDIA")
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
    <string>$X_NODE</string><string>$X_REPO/scripts/media/download.mjs</string>
    <string>--limit-gb</string><string>$LIMIT</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>FANATIC_MEDIA_DIR</key><string>$X_MEDIA</string></dict>
  <key>WorkingDirectory</key><string>$X_REPO</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>60</integer>
  <key>StandardOutPath</key><string>$X_MEDIA/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$X_MEDIA/launchd.err.log</string>
</dict>
</plist>
PLIST
    plutil -lint "$PLIST" >/dev/null
    # 이미 등록되어 있으면 해제가 끝날 때까지 기다린 뒤 다시 등록합니다(바로 등록하면 실패합니다).
    mark_stop_requested
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    for i in {1..30}; do
      launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1 || break
      sleep 1
    done
    launchctl bootstrap "$DOMAIN" "$PLIST"
    cat > "$NOTIFY_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$NOTIFY_LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$X_NODE</string><string>$X_REPO/scripts/media/notify-progress.mjs</string><string>$LIMIT</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>FANATIC_MEDIA_DIR</key><string>$X_MEDIA</string></dict>
  <key>StartInterval</key><integer>$NOTIFY_INTERVAL</integer>
  <key>StandardErrorPath</key><string>$X_MEDIA/notify.err.log</string>
</dict>
</plist>
PLIST
    plutil -lint "$NOTIFY_PLIST" >/dev/null
    launchctl bootout "$DOMAIN/$NOTIFY_LABEL" 2>/dev/null || true
    for i in {1..30}; do
      launchctl print "$DOMAIN/$NOTIFY_LABEL" >/dev/null 2>&1 || break
      sleep 1
    done
    launchctl bootstrap "$DOMAIN" "$NOTIFY_PLIST"
    echo "등록했습니다: $PLIST (한도 ${LIMIT}GB, 보관함 $MEDIA), 진행 알림 $((NOTIFY_INTERVAL / 60))분마다"
    ;;
  uninstall)
    mark_stop_requested
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootout "$DOMAIN/$NOTIFY_LABEL" 2>/dev/null || true
    rm -f "$PLIST" "$NOTIFY_PLIST"
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
