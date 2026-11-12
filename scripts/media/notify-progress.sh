#!/bin/zsh
# 이미지 다운로드 진행 상황을 macOS 알림 센터로 알립니다(LaunchAgent가 2시간마다 실행).
# 받은 용량·비율, 지난 알림 이후 늘어난 양, 지금 받는 모음, 멈춤 여부를 보여 줍니다.
MEDIA=${FANATIC_MEDIA_DIR:-$HOME/Documents/Fanatic-Museum}
LIMIT=${1:-200}
LOG=$MEDIA/download.log
STATE=$MEDIA/.notify-state
LABEL=com.ryushin0.fanatic-museum-download

last=$(grep -E '누적 [0-9.]+GB|사용 [0-9.]+GB' "$LOG" 2>/dev/null | tail -1)
used=$(print -r -- "$last" | grep -oE '(누적|사용) [0-9.]+GB' | grep -oE '[0-9.]+')
used=${used:-0}
prev=$(cat "$STATE" 2>/dev/null || echo "$used")
print -r -- "$used" > "$STATE"
delta=$(printf '%.2f' $(( used - prev )))
percent=$(printf '%.1f' $(( used * 100.0 / LIMIT )))
current=$(tail -1 "$LOG" 2>/dev/null | sed -E 's/^\[[^]]+\] //' | grep -oE '^[a-z0-9/-]+' | sed -E 's/#.*//')

# 마지막 로그 이후 시간(분)
mtime=$(stat -f %m "$LOG" 2>/dev/null || echo 0)
idle=$(( ($(date +%s) - mtime) / 60 ))

if ! launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null | grep -q 'state = running'; then
  title='다운로드가 멈춰 있습니다'
  body="${used}GB / ${LIMIT}GB(${percent}%). 다운로더가 실행 중이 아닙니다. pnpm media:agent install로 다시 시작하세요."
elif tail -1 "$LOG" | grep -q '인터넷 연결이 끊겨'; then
  title='인터넷 연결을 기다리는 중'
  body="${used}GB / ${LIMIT}GB(${percent}%). 연결되면 이어서 받습니다."
elif (( idle >= 60 )); then
  title="${idle}분째 기록이 없습니다"
  body="${used}GB / ${LIMIT}GB(${percent}%). 큰 파일을 받는 중일 수 있습니다. pnpm media:agent status로 확인하세요."
else
  title="${used}GB / ${LIMIT}GB(${percent}%)"
  body="지난 알림 이후 +${delta}GB · 지금: ${current:-확인 중}"
fi

osascript -e "display notification \"${body//\"/\\\"}\" with title \"Fanatic Museum 다운로드\" subtitle \"${title//\"/\\\"}\""
print -r -- "[$(date '+%F %T')] $title — $body" >> "$MEDIA/notify.log"
