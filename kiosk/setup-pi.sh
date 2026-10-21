#!/usr/bin/env bash
# ============================================================
# 라즈베리파이 키오스크 설정 (Raspberry Pi OS Bookworm / Bullseye)
#
# 사용법 (파이의 터미널에서):
#   bash setup-pi.sh https://내-주소.vercel.app/kiosk
#
# 하는 일
#   - 부팅하면 자동 로그인 → 크롬(Chromium)이 주소창·탭 없이 전체 화면 키오스크로 실행
#   - 손가락으로 밀어서 스크롤, 마인드맵 안에서만 두 손가락 확대·축소
#   - 화면 확대·스와이프 뒤로가기·번역 팝업·복구 팝업 끄기
#   - 화면 꺼짐(화면 보호기) 끄기, 크롬이 꺼지면 자동으로 다시 실행
#
# 키오스크 잠시 끄기 (관리용): 파이에 키보드 연결 → Ctrl+Alt+T 로 터미널 → touch ~/kiosk/OFF → Alt+F4
#   다시 켜기: rm ~/kiosk/OFF 후 재부팅
# 완전히 해제: bash setup-pi.sh --uninstall
# ============================================================
set -euo pipefail

KDIR="$HOME/kiosk"
MARK="# ai-kiosk"

uninstall() {
  rm -rf "$KDIR"
  for f in "$HOME/.config/labwc/autostart" "$HOME/.config/lxsession/LXDE-pi/autostart"; do
    [ -f "$f" ] && sed -i "/$MARK/d" "$f"
  done
  [ -f "$HOME/.config/wayfire.ini" ] && sed -i "/$MARK/d" "$HOME/.config/wayfire.ini"
  echo "키오스크 설정을 지웠어요. 재부팅하면 일반 바탕화면으로 시작해요."
  exit 0
}
[ "${1:-}" = "--uninstall" ] && uninstall

URL="${1:-}"
if [ -z "$URL" ]; then
  echo "사용법: bash setup-pi.sh https://내-주소.vercel.app/kiosk" >&2
  exit 1
fi

CHROME="$(command -v chromium-browser || command -v chromium || true)"
if [ -z "$CHROME" ]; then
  echo "Chromium 이 없어서 설치해요..."
  sudo apt-get update && sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium
  CHROME="$(command -v chromium-browser || command -v chromium)"
fi

mkdir -p "$KDIR"

# 1) 크롬 키오스크 실행 스크립트 (꺼지면 3초 뒤 다시 실행)
cat > "$KDIR/start.sh" <<EOF
#!/usr/bin/env bash
URL="$URL"
PREF="\$HOME/.config/chromium/Default/Preferences"
while [ ! -f "\$HOME/kiosk/OFF" ]; do
  # 지난번에 비정상 종료돼도 '복구하시겠습니까' 팝업이 뜨지 않게
  [ -f "\$PREF" ] && sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "\$PREF"
  "$CHROME" \\
    --kiosk "\$URL" \\
    --noerrdialogs --disable-infobars --no-first-run \\
    --disable-session-crashed-bubble --disable-features=Translate,TranslateUI \\
    --touch-events=enabled \\
    --disable-pinch \\
    --overscroll-history-navigation=0 \\
    --check-for-update-interval=31536000 \\
    --password-store=basic \\
    --ozone-platform-hint=auto
  sleep 3
done
EOF
chmod +x "$KDIR/start.sh"
# 참고: --disable-pinch 는 '페이지 전체' 확대만 막아요. 마인드맵 안의 두 손가락 확대·축소는 그대로 돼요.

# 2) 데스크톱 자동 로그인 + 화면 꺼짐 끄기
if command -v raspi-config >/dev/null; then
  sudo raspi-config nonint do_boot_behaviour B4 || true   # 바탕화면으로 자동 로그인
  sudo raspi-config nonint do_blanking 1 || true          # 화면 보호기(꺼짐) 끄기
fi

# 3) 바탕화면이 뜨면 키오스크 자동 실행 (labwc / wayfire / X11 모두 지원)
if [ -d "$HOME/.config/labwc" ] || pgrep -x labwc >/dev/null; then
  mkdir -p "$HOME/.config/labwc"
  touch "$HOME/.config/labwc/autostart"
  sed -i "/$MARK/d" "$HOME/.config/labwc/autostart"
  echo "$KDIR/start.sh & $MARK" >> "$HOME/.config/labwc/autostart"
  echo "→ labwc 자동 실행에 등록했어요"
elif [ -f "$HOME/.config/wayfire.ini" ] || pgrep -x wayfire >/dev/null; then
  touch "$HOME/.config/wayfire.ini"
  sed -i "/$MARK/d" "$HOME/.config/wayfire.ini"
  grep -q "^\[autostart\]" "$HOME/.config/wayfire.ini" || printf "\n[autostart]\n" >> "$HOME/.config/wayfire.ini"
  sed -i "/^\[autostart\]/a kiosk = $KDIR/start.sh $MARK" "$HOME/.config/wayfire.ini"
  echo "→ wayfire 자동 실행에 등록했어요"
else
  mkdir -p "$HOME/.config/lxsession/LXDE-pi"
  AS="$HOME/.config/lxsession/LXDE-pi/autostart"
  [ -f "$AS" ] || cp /etc/xdg/lxsession/LXDE-pi/autostart "$AS" 2>/dev/null || touch "$AS"
  sed -i "/$MARK/d" "$AS"
  { echo "@xset s off $MARK"; echo "@xset -dpms $MARK"; echo "@xset s noblank $MARK"; echo "@$KDIR/start.sh $MARK"; } >> "$AS"
  sudo apt-get install -y unclutter >/dev/null 2>&1 && echo "@unclutter -idle 0.5 $MARK" >> "$AS" || true
  echo "→ X11(LXDE) 자동 실행에 등록했어요"
fi

echo
echo "완료! 재부팅하면 키오스크로 시작해요:  sudo reboot"
echo "주소: $URL"
