# Handful — project plan (RevenueCat Shipaton 2026)

**Target:** Next Gen Award (student). Deadline: Sep 30, 2026, 11:45 PM PDT.
Peace Prize / Design Award require a published store app — out of scope for Next Gen
(see "Decisions" below). The social-impact work still drives the product.

## Definition of done

- [x] Concept, name, design system, architecture
- [x] Vertical slice: Home → Cause → Complete → gift → Success → Impact
- [x] Nonprofit flow (3 steps): need & budget → story & photo (Privacy Shield) → review & one confirmation
- [x] Proof flow (2 steps): receipt → photo + note → post → donor update
- [x] Supporter membership (RevenueCat subscription + entitlement)
- [x] App icon 1024×1024
- [x] iOS dev build running in the Simulator (iPhone 16, iOS 26.5)
- [x] RevenueCat Test Store project `proje8b43c37`: 20 consumables, `supporter` entitlement + offering (verified from the app)
- [x] Privacy Shield verified on a real photo (2 faces + GPS found, blurred, metadata stripped)
- [x] QA pass (see docs/QA.md) — a few steps marked ⚠️ where a dev shortcut was used
- [x] Ethical review (see docs/ETHICS.md)
- [x] Screenshots 1179×2556 (no frame), from a real Test Store + Privacy Shield run
- [x] Demo video < 2 min (1:40; script: docs/VIDEO.md; built by scripts/video/build.py)
- [x] README, LICENSE, .env.example, secret scan (clean), unit tests, lint, CI
- [ ] Public GitHub repo with license visible
- [x] Devpost copy (submission/DEVPOST.md)

## Needs from the entrant

- RevenueCat: Test Store API key, Project ID (optional: v2 secret key for scripted setup)
- Academic email for Devpost
- Upload video to YouTube/Vimeo, submit on Devpost (identity + terms)

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Category | Next Gen only | Rules: every other category needs "a URL to a fully published app". |
| Name | **Handful** | Short, human, international. A handful of dollars, help in real hands. No giving app on the App Store uses it ("Kept" had 35 collisions incl. a fintech). |
| Platform | iOS (iPhone), Expo SDK 57 dev build | RevenueCat Test Store needs native SDK; Privacy Shield uses Apple Vision. |
| Payments in demo | RevenueCat Test Store consumables `handful_gift_1…20` | Real SDK + real transactions, zero real money. |
| Payments in production | Apple Pay / Stripe to Apple-approved nonprofits | App Store Guideline 3.2.2(iv) forbids charity donations via IAP; 3.2.1(vi) allows approved nonprofits with Apple Pay. |
| RevenueCat in production | Handful Supporter subscription | 3.1.1 allows IAP to support the developer. Keeps gifts fee-free. |
| Backend | None (local state) | No auth, no API, no admin — scope discipline. |
| Photos | No photos of people in seed data; covers are item still-lifes | "Show the help, not the suffering." |
| Face policy | Faces always blurred in public posts (locked) | Dignity by default; consent isn't something a UI toggle can prove. |
| Status model | open → funded → purchased → delivered (with proof) | Each step is a promise the donor can check. |
| Currency | USD, whole-dollar gifts | Judges are international; IAP tiers need fixed prices. |
