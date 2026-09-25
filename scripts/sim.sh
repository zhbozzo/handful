#!/usr/bin/env bash
# Simulator helpers for QA and screenshots.
#   scripts/sim.sh go /cause/hot-meal-tonight      open a route (skips onboarding)
#   scripts/sim.sh reset                           reset demo data
#   scripts/sim.sh shot submission/screenshots/01-home.png
#   scripts/sim.sh record out.mp4                  Ctrl-C to stop
set -euo pipefail
DEV="${SIM:-booted}"
case "${1:-}" in
  go) xcrun simctl openurl "$DEV" "handful://dev?action=go&to=${2:-/}" ;;
  reset) xcrun simctl openurl "$DEV" "handful://dev?action=reset" ;;
  shield) xcrun simctl openurl "$DEV" "handful://dev?action=shield${2:+&auto=$2}" ;;
  shot) mkdir -p "$(dirname "$2")"; xcrun simctl io "$DEV" screenshot --type=png "$2" ;;
  record) xcrun simctl io "$DEV" recordVideo --codec=h264 --force "$2" ;;
  status) xcrun simctl status_bar "$DEV" override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 ;;
  *) echo "usage: $0 go|reset|shield|shot|record|status" ; exit 1 ;;
esac
