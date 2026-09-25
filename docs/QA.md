# QA checklist

Device: iOS Simulator “Handful iPhone 16 Pro” (iOS 26.5), dev build, RevenueCat Test Store key.
Legend: ✅ pass · ⚠️ pass with note · ❌ fail (fixed / open)

## Core loop

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Fresh install → launch | Splash (paper + mark) → onboarding | |
| 2 | Onboarding: swipe + Continue ×2 → Start giving | Lands on Causes; onboarding never shows again | |
| 3 | Causes: hero, Almost there carousel, chips, cards, On the way, Delivered, footer | All sections render; no clipped text; tab bar doesn’t cover content | |
| 4 | Category chip filter | List filters; “All” restores | |
| 5 | Open “Hot meal + warm socks” | Cover, pills (Food, Demo cause), org ✓, amounts, items, timeline, trust & privacy | |
| 6 | “Complete it · $4” | Give sheet opens with Complete selected | |
| 7 | Give → RevenueCat Test Store sheet → Successful purchase | Success screen: ring closes, check draws, haptic | |
| 8 | Test Store → Failed purchase | Inline error, nothing recorded | |
| 9 | Test Store → Cancel | Sheet stays, no error | |
| 10 | Give $2 on a far-from-goal cause | Success “Your $2 is in.”, % updates | |
| 11 | Your impact | Stats, updates, items, gift history with RC transaction id | |
| 12 | Notify me when delivered | iOS permission prompt → “We’ll notify you…” | |

## Nonprofit side

| # | Step | Expected | Result |
|---|---|---|---|
| 13 | Nonprofits → Post a new cause → Fill with an example | Steps 1–3 valid; Continue enabled | |
| 14 | Story check with “sleeps under the bridge on Av. Matta 123” | Warnings shown, Continue disabled | |
| 15 | Photo → choose `delivery-with-gps.jpg` | Scan animation → 2 faces + location found | |
| 16 | Protect identity | Blurred output, hold-to-compare works | |
| 17 | Consent ×3 → Publish | Published screen → View cause shows photo cover | |
| 18 | Post proof on the completed hot-meal cause | Receipt → photo → Shield → note → Post | |
| 19 | Local notification “Delivered ✓” | Banner appears; tap opens proof | |
| 20 | Proof screen | Protected photo, privacy chip, items, receipt, leftover line, note, timeline | |

## RevenueCat Supporter

| # | Step | Expected | Result |
|---|---|---|---|
| 21 | Impact → Keep Handful free | Sheet with price from offering | |
| 22 | Subscribe via Test Store | Entitlement active → Supporter pill on Impact | |

## Robustness

| # | Check | Result |
|---|---|---|
| 23 | Kill + relaunch: state persists | |
| 24 | Reset demo data | |
| 25 | No RevenueCat key (.env empty): offline demo labels everywhere | |
| 26 | Airplane mode during gift: error message, nothing recorded | |
| 27 | Dynamic Type (Larger text): no overlaps on key screens | |
| 28 | VoiceOver labels on buttons, cards, progress | |
| 29 | Keyboard never covers inputs / Continue button | |
| 30 | No yellow/red boxes, no console errors | |
