#!/bin/zsh
# 이미지 다운로더를 macOS 로그인 항목(LaunchAgent)으로 등록하거나 해제합니다.
# - 로그인하면 자동으로 시작하고, 비정상 종료되면 1분 뒤 다시 시작합니다.
# - 다 받았거나 용량 한도에 도달해 정상 종료하면 다시 시작하지 않습니다.
# - 인터넷이 끊기면 다운로더가 연결될 때까지 기다렸다가 이어서 받습니다.
#
# - 2시간마다 진행 상황(받은 용량·비율·멈춤 여부)을 알림 센터로 알립니다.
# - 다운로더가 멈추거나 다시 시작하면(재부팅·오류·수동·잠자기·인터넷 끊김) 바로 알립니다.
#
# - 잠시 멈춰도(pause) 등록은 남겨 두므로, 정한 시간이 지나거나 맥을 다시 켜면 저절로 이어 받습니다.
#
# 사용: scripts/media/launch-agent.sh install [한도GB]   # 기본 200
#       scripts/media/launch-agent.sh pause [시간]       # 잠시 멈춤. 기본 6시간 뒤(또는 맥을 다시 켜면) 자동으로 이어 받습니다
#       scripts/media/launch-agent.sh resume             # 멈춘 다운로드를 바로 이어 받습니다
#       scripts/media/launch-agent.sh uninstall          # 완전히 해제합니다(자동으로 다시 켜지지 않습니다)
#       scripts/media/launch-agent.sh status
set -e
LABEL=com.ryushin0.fanatic-museum-download
PLIST=~/Library/LaunchAgents/$LABEL.plist
# 2시간마다 진행 상황을 알림 센터로 알리는 항목
NOTIFY_LABEL=com.ryushin0.fanatic-museum-progress
NOTIFY_PLIST=~/Library/LaunchAgents/$NOTIFY_LABEL.plist
NOTIFY_INTERVAL=${FANATIC_NOTIFY_INTERVAL:-7200}
REPO=${0:A:h:h:h}
MEDIA=${FANATIC_MEDIA_DIR:-$HOME/Documents/Archive/Fanatic-Museum}
DOMAIN=gui/$(id -u)
# 잠시 멈춘 다운로드를 정한 시각에 다시 켜는 항목. 로그인할 때 저절로 올라오지 않도록 LaunchAgents 밖에 둡니다.
# macOS는 백그라운드 작업이 ~/Documents를 읽지 못하게 막으므로, 이 항목은 Documents 밖의 파일과 명령만 씁니다.
RESUME_LABEL=com.ryushin0.fanatic-museum-resume
RESUME_PLIST=~/Library/Application\ Support/Downloaders/fanatic-museum-resume.plist
PAUSE_HOURS=${FANATIC_PAUSE_HOURS:-6}

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

# 예약해 둔 자동 재개를 지웁니다. 재개 항목 안에서 부르면 자기 자신도 끝나므로 맨 마지막에 부릅니다.
clear_resume() {
  rm -f "$RESUME_PLIST"
  launchctl bootout "$DOMAIN/$RESUME_LABEL" 2>/dev/null || true
}

# 등록 파일은 그대로 두고, 멈춰 있는 다운로더와 진행 알림을 다시 켭니다.
start_agents() {
  local label plist
  for label plist in "$LABEL" "$PLIST" "$NOTIFY_LABEL" "$NOTIFY_PLIST"; do
    launchctl print "$DOMAIN/$label" >/dev/null 2>&1 || launchctl bootstrap "$DOMAIN" "$plist"
  done
}

require_installed() {
  [[ -f $PLIST && -f $NOTIFY_PLIST ]] || { echo "등록되어 있지 않습니다. 먼저 $0 install 로 등록하세요."; exit 1; }
}

case "$1" in
  install)
    LIMIT=${2:-200}
    NODE=$(command -v node) || { echo "node를 찾을 수 없습니다."; exit 1; }
    X_NODE=$(xml "$NODE"); X_REPO=$(xml "$REPO"); X_MEDIA=$(xml "$MEDIA")
    mkdir -p ~/Library/LaunchAgents "$MEDIA"
    clear_resume
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
  pause)
    require_installed
    HOURS=${2:-$PAUSE_HOURS}
    [[ $HOURS == <1-> ]] || { echo "시간은 1 이상의 정수로 적어 주세요. 예: $0 pause 6"; exit 1; }
    clear_resume
    mark_stop_requested
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootout "$DOMAIN/$NOTIFY_LABEL" 2>/dev/null || true
    AT=($(date -r $(( $(date +%s) + HOURS * 3600 )) '+%m %d %H %M'))
    LC=/bin/launchctl
    CMD="$LC print $DOMAIN/$LABEL >/dev/null 2>&1 || $LC bootstrap $DOMAIN ${(qq)PLIST}"
    CMD+="; $LC print $DOMAIN/$NOTIFY_LABEL >/dev/null 2>&1 || $LC bootstrap $DOMAIN ${(qq)NOTIFY_PLIST}"
    CMD+='; echo "[$(date +%Y-%m-%dT%H:%M:%S)] 예약한 시각이 되어 다시 켰습니다."'
    CMD+="; rm -f ${(qq)RESUME_PLIST}; $LC bootout $DOMAIN/$RESUME_LABEL"
    X_CMD=$(xml "$CMD"); X_MEDIA=$(xml "$MEDIA")
    mkdir -p "${RESUME_PLIST:h}"
    cat > "$RESUME_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$RESUME_LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/sh</string><string>-c</string><string>$X_CMD</string></array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Month</key><integer>$((10#${AT[1]}))</integer>
    <key>Day</key><integer>$((10#${AT[2]}))</integer>
    <key>Hour</key><integer>$((10#${AT[3]}))</integer>
    <key>Minute</key><integer>$((10#${AT[4]}))</integer>
  </dict>
  <key>StandardOutPath</key><string>$X_MEDIA/resume.log</string>
  <key>StandardErrorPath</key><string>$X_MEDIA/resume.log</string>
</dict>
</plist>
PLIST
    plutil -lint "$RESUME_PLIST" >/dev/null
    launchctl bootstrap "$DOMAIN" "$RESUME_PLIST"
    echo "잠시 멈췄습니다. $((10#${AT[1]}))월 $((10#${AT[2]}))일 ${AT[3]}:${AT[4]}에 자동으로 이어 받습니다(그 전에 맥을 다시 켜도 이어 받습니다)."
    ;;
  resume)
    require_installed
    start_agents
    echo "[$(date '+%F %T')] 다시 켰습니다. 멈춘 곳부터 이어 받습니다."
    clear_resume
    ;;
  uninstall)
    clear_resume
    mark_stop_requested
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootout "$DOMAIN/$NOTIFY_LABEL" 2>/dev/null || true
    rm -f "$PLIST" "$NOTIFY_PLIST"
    echo "해제했습니다."
    ;;
  status)
    launchctl print "$DOMAIN/$LABEL" 2>/dev/null | grep -E 'state =|runs =|pid =|last exit' | head -4
    if [[ -f $RESUME_PLIST ]]; then
      echo "잠시 멈춤 중: $(plutil -extract StartCalendarInterval.Month raw "$RESUME_PLIST")월 $(plutil -extract StartCalendarInterval.Day raw "$RESUME_PLIST")일 $(printf '%02d:%02d' $(plutil -extract StartCalendarInterval.Hour raw "$RESUME_PLIST") $(plutil -extract StartCalendarInterval.Minute raw "$RESUME_PLIST"))에 자동으로 이어 받습니다."
    fi
    tail -3 "$MEDIA/download.log"
    ;;
  *)
    echo "사용: $0 install [한도GB] | pause [시간] | resume | uninstall | status"
    exit 1
    ;;
esac
