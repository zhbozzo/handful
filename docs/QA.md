# QA checklist

Device: iOS Simulator “Handful iPhone 16” (iOS 26.5), dev build, RevenueCat Test Store key. Last pass: 2026-09-26.
Legend: ✅ pass · ⚠️ pass with note · ❌ fail (fixed / open)

## Core loop

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Fresh install → launch | Splash (paper + mark) → onboarding | ⚠️ via `-handfulDev onboarding` (state reset), not a reinstall; splash fades into first screen |
| 2 | Onboarding: swipe + Continue ×2 → Start giving | Lands on Causes; onboarding never shows again | ✅ |
| 3 | Causes: hero, Almost there carousel, chips, cards, On the way, Delivered, footer | All sections render; no clipped text; tab bar doesn’t cover content | ✅ |
| 4 | Category chip filter | List filters; “All” restores | ✅ |
| 5 | Open “Hot meal + warm socks” | Cover, pills (Food, Demo cause), org ✓, amounts, items, timeline, trust & privacy | ✅ |
| 6 | “Complete it · $4” | Give sheet opens with Complete selected | ✅ |
| 7 | Give → RevenueCat Test Store sheet → Successful purchase | Success screen: ring closes, check draws, haptic | ✅ `handful_gift_4` |
| 8 | Test Store → Failed purchase | Inline error, nothing recorded | ✅ error clears on retry |
| 9 | Test Store → Cancel | Sheet stays, no error | ✅ |
| 10 | Give $2 on a far-from-goal cause | Success “Your $2 is in.”, % updates | ✅ ran with $5 (`handful_gift_5`) |
| 11 | Your impact | Stats, updates, items, gift history with RC transaction id | ✅ |
| 12 | Notify me when delivered | iOS permission prompt → “We’ll notify you…” | ✅ |

## Nonprofit side

| # | Step | Expected | Result |
|---|---|---|---|
| 13 | Nonprofits → Post a new cause (3 steps) → Fill with an example | Each step valid; Continue enabled; category + icons suggested from text | ✅ also typed by hand: “Next” jumps to the price |
| 14 | Story check with “sleeps under the bridge on Av. Matta 123” | Warnings shown, Continue disabled | ✅ typed into the area field; “Fix the privacy check first” |
| 15 | Photo → choose `delivery-with-gps.jpg` | Scan animation → 2 faces + location found | ⚠️ photo injected with `?devPhoto=1` (picker not tapped); 2 faces + GPS found |
| 16 | Protect identity | Blurred output, hold-to-compare works | ✅ blur; hold-to-compare not re-tested |
| 17 | One confirmation → Publish | Published screen with donor preview | ✅ |
| 18 | Post proof on the completed hot-meal cause | Receipt → photo + note + confirm → Post | ✅ |
| 19 | Local notification “Delivered ✓” | Banner appears; tap opens proof | ✅ |
| 20 | Proof screen | Protected photo, privacy chip, items, receipt, leftover line, note, timeline | ✅ |

## RevenueCat Supporter

| # | Step | Expected | Result |
|---|---|---|---|
| 21 | Impact → Keep Handful free | Sheet with price from offering | ✅ $2.99 from `$rc_monthly` |
| 22 | Subscribe via Test Store | Entitlement active → Supporter pill on Impact | ✅ also Restore purchases |

## Robustness

| # | Check | Result |
|---|---|---|
| 23 | Kill + relaunch: state persists | ✅ gifts and proof survived every relaunch in this pass |
| 24 | Reset demo data | ✅ confirmation alert → starting state |
| 25 | No RevenueCat key (.env empty): offline demo labels everywhere | |
| 26 | Airplane mode during gift: error message, nothing recorded | |
| 27 | Dynamic Type (Larger text): no overlaps on key screens | ✅ accessibility-large; gift sheet opens full height |
| 28 | VoiceOver labels on buttons, cards, progress | |
| 29 | Keyboard never covers inputs / Continue button | |
| 30 | No yellow/red boxes, no console errors | ⚠️ no errors; one react-native-screens form-sheet layout warning in dev |
| 31 | Cause page: donor stack + last 3 gifts, anonymous; amounts add up to what was raised | ✅ (unit-tested; caught a negative amount before release) |
| 32 | Share from a cause and from the success screen | ✅ native share sheet, text only |
| 33 | Studio: funds card (received / collecting / available / paid out) updates after a cause is completed | ✅ $0 → $18 available after a real Test Store gift |
| 34 | Withdraw sheet → Transfer → “on its way” → Post receipt & thank-you photo | ✅ simulated payout, labelled as demo |
| 35 | Thank-you photo picked from the photo library (no dev shortcut) → Privacy Shield → Post | ✅ 2 faces blurred, GPS removed |
| 36 | Your impact: money bar + Thank-yous card with the protected photo, tab badge | ✅ |
| 37 | A funded/delivered cause never moves backwards if another gift arrives | ✅ unit test (found while capturing screenshots) |
