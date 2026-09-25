# Devpost submission — Handful

> Copy-paste source for the Devpost form. Fields marked **[FILL]** need the entrant.

## Basics

- **Project name:** Handful
- **Tagline (≤ 60 chars):** Small gifts for real needs — with proof that protects.
- **Category:** Next Gen Award (student)
- **Academic email:** **[FILL — your university email]**
- **RevenueCat Project ID:** `proje8b43c37`
- **Repository:** https://github.com/zhbozzo/handful **[confirm after publishing]**
- **Video:** **[FILL — YouTube/Vimeo URL]**
- **Platform:** iOS (iPhone), built with Expo SDK 57 / React Native 0.86
- **Built with:** expo, react-native, typescript, expo-router, revenuecat, react-native-purchases, swift, apple-vision, core-image, reanimated, react-native-svg, zustand, sf-symbols

## Elevator pitch

Handful lets verified nonprofits turn real needs into small, fundable causes — a hot meal and dry socks for tonight, a bus fare to a hospital, a month of dog food. You see exactly what it pays for, who verified it and what’s left, you can finish it with one small gift, and you get the receipt and a delivery photo afterwards. Before any photo is posted, Privacy Shield runs on the phone and blurs faces, hides license plates and documents, and strips location data. Transparent giving that doesn’t cost anyone their dignity.

## Inspiration

> **[EDIT]** If you have a personal reason for building this, put it here in one or two sentences — a real story beats this paragraph. Don’t add anything that didn’t happen.

A lot of people who want to help stop giving because “you never know where it goes.” Meanwhile, small outreach teams — in Santiago, where we live, and everywhere else — know *exactly* what someone needs tonight: a meal, a coat, a pharmacy run. What they don’t have is a simple way to ask a few neighbors for $18 and show them it happened.

When organizations do try to show impact, it often goes wrong in the other direction: photos of people at their lowest, faces, recognizable places. We wanted transparency that points at the help, not at the person.

## What it does

- **Causes, not campaigns.** A verified nonprofit posts a need as items with prices (“Hot meal $6, hygiene essentials $5, warm socks $4, water $3”), a short story and a general area. Only nonprofits can post — never anonymous individuals.
- **Complete it.** When a cause is close, Handful shows exactly what’s left and lets you finish it with one tap. “Only $4 left” is the whole interaction.
- **Follow the money.** Every cause has the same four-step timeline: verified & published → fully funded → items purchased (receipt, with any leftover moved to the next cause) → delivered with proof.
- **Privacy Shield.** When the nonprofit attaches a delivery photo, an on-device Swift module using Apple Vision finds faces, text (plates, ID numbers, addresses, phone numbers) and documents, and reads GPS metadata. It blurs what it found, lets staff compare with the original, and re-encodes a fresh JPEG without GPS, camera or capture metadata. Faces are always blurred in public posts — that isn’t a setting. The same idea applies to text: a story check blocks exact addresses, where someone sleeps, diagnoses, children’s ages and full names before a cause can be published.
- **Proof for donors.** When proof is posted, donors get a “Delivered ✓” update with the receipt and the protected photo.
- **An honest impact screen.** It starts at zero and only counts what you actually did.

## How we built it

- **App:** Expo SDK 57 dev build, React Native 0.86 (New Architecture), Expo Router with native tabs, TypeScript, Reanimated 4 for motion, react-native-svg for the progress rings, SF Symbols, expo-haptics, Zustand + AsyncStorage for local state. No backend and no login — scope discipline.
- **RevenueCat:** `react-native-purchases` 10 with RevenueCat’s **Test Store**.
  - Every gift is a consumable (`handful_gift_1` … `handful_gift_20`, whole-dollar tiers so “Complete it” always matches the exact remainder), bought with `getProducts` + `purchaseStoreProduct`. The transaction ID is stored with the gift and shown in the donor’s history.
  - **Handful Supporter** is an auto-renewing subscription with an offering (`supporter`), a `$rc_monthly` package and a `supporter` entitlement read from `CustomerInfo`, with a live update listener.
- **Privacy Shield:** a local Expo module in Swift: `VNDetectFaceRectanglesRequest`, `VNRecognizeTextRequest`, `VNDetectDocumentSegmentationRequest`, ImageIO for metadata, Core Image (pixellate + Gaussian blur through a feathered mask) for redaction. Text classification (plates incl. Chilean formats, RUT and other ID numbers, addresses, phones, emails) happens in TypeScript.
- **Design:** paper, ink and one warm accent. Instrument Serif for the human moments, SF Pro for everything functional. Covers are still lifes of the items being funded, generated from each cause’s budget — no stock photos of people in need.

## Challenges we ran into

- **Donations and in-app purchase don’t mix — on purpose.** App Store Guideline 3.2.2(iv) doesn’t allow collecting charitable donations through IAP; only Apple-approved nonprofits can fundraise, with Apple Pay (3.2.1(vi)). We didn’t want to hand-wave that. So we split the roles: in this prototype, gifts run through RevenueCat’s Test Store (real SDK, zero real money, labeled everywhere); in production, gifts go through Apple Pay / Stripe to approved nonprofits, and RevenueCat powers the Supporter membership that keeps the platform fee-free — which the guidelines explicitly allow.
- **Vision in the Simulator.** Some Vision requests can’t use the Neural Engine in the Simulator, so the module falls back to CPU compute devices there.
- **Making redaction actually irreversible.** A light blur can be partially undone. We pixellate first, then blur heavily through a feathered mask, and re-encode from scratch so no GPS, camera or capture metadata survives.
- **Copy.** Writing about need without pity or guilt took more rewrites than any screen. We ended up describing needs in terms of what the person asked for and what will be bought.

## Accomplishments that we’re proud of

- A privacy feature that runs fully on the device and changes what gets published, not just a policy page.
- “Complete it”: finishing a cause is one decision, one tap and a ring that closes.
- Being precise about what’s real (the SDK, the transactions, the on-device ML) and what’s simulated (the nonprofits, the causes, the money) — in the app, not just in the README.

## What we learned

- Transparency and dignity pull in opposite directions unless you design for both from the start; the timeline and Privacy Shield were designed together.
- RevenueCat’s Test Store makes it possible to build and demo a complete purchase flow without App Store Connect — but the payment rail has to match what’s being bought.
- Small, whole numbers are a product decision: fixed gift tiers made the “exact remainder” interaction possible.

## What’s next for Handful

1. Pilot with two or three outreach nonprofits in Santiago (manual onboarding, real verification visit).
2. Apple Pay / Stripe Connect payouts to Apple-approved nonprofits; tax receipts where required.
3. Receipt photos with automated checks; payouts held until proof is posted.
4. A server-side second pass of Privacy Shield plus human review for flagged posts.
5. Android, with ML Kit for the on-device checks.

## Next Gen — why this project

- **Clear, useful idea:** small, specific, verified needs with proof — solving the “where does my money go?” problem for donors and the “how do we ask for $18?” problem for small nonprofits.
- **Working app:** a real iOS build with the full loop — browse, complete a cause, Test Store purchase, impact, nonprofit posting, Privacy Shield, proof, donor update.
- **Thoughtful RevenueCat use:** consumables for the prototype’s gift flow, and a subscription + entitlement + offering for the part RevenueCat should power in production, with the reasoning written down.
- **Care in the build:** native Swift module, design system, motion and haptics, accessibility labels, 29 unit tests on the privacy rules and the gift/proof state machine (one caught a real bug in address detection), strict TypeScript, ESLint with React Compiler rules, CI, honest demo labeling, and a README that says what isn’t built yet.

## Privacy approach

- Money goes to verified nonprofits, never to individuals.
- No full names, exact locations, diagnoses or identifiable children — enforced by the story check.
- Photos pass through Privacy Shield on the device; faces are always blurred, location and device metadata always stripped; only the protected version is ever attached.
- This prototype does not claim a complete legal framework. Production needs written consent flows, a strict policy for minors, data-retention rules and local legal review.

## Demo & production disclaimer

All nonprofits, causes, donor counts and amounts in the app are fictional demo data. Gifts are RevenueCat Test Store purchases: no real money moves and nothing is delivered. Verification, consent and receipts are simulated and labeled as such in the app.

## Assets

- App icon 1024×1024: `submission/app-icon-1024.png`
- Screenshots 1179×2556 (no frame): `submission/screenshots/`
- Video: `submission/video/handful-demo.mp4` → upload to YouTube/Vimeo
