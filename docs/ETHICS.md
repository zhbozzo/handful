# Ethical review

We went through the product screen by screen with the questions below, and changed things when the answer was uncomfortable. This is a prototype review, not a legal assessment.

## Does this exploit vulnerable people?

- **Covers never show people.** They are still lifes of the items being funded, generated from the budget. No stock photos of people in need.
- **Beneficiaries are never named.** One demo cause names a dog (Toby); that’s the only name in the app.
- **Stories describe the need, not the misery.** We rewrote seed copy around what the person *asked for* and what will be bought (“asked for a hot meal and dry socks before tonight’s cold front”), not how bad things are.
- **No urgency tricks.** No countdown timers, no “people are starving while…”, no red. “Only $4 left” is a fact about the budget, not pressure; there is always a plain “Give” option and no nagging after a gift.

## Does any screen encourage photographing people without consent?

- The photo step asks for the **items, hands or setting**, explicitly “not the person”.
- Privacy Shield **always** blurs faces in public posts; there is no toggle to publish a face.
- Publishing requires three consent confirmations (consent obtained, no exact location, images follow the dignity policy).
- *Changed during review:* an earlier seed story placed a woman “near a clinic entrance” — that’s a location. Removed.

## Does it reveal location?

- Causes show a **neighborhood or city**, labeled “general area”.
- The story check blocks exact addresses and descriptions of where someone sleeps or lives.
- Privacy Shield strips EXIF/GPS from every photo by re-encoding it, and detects address/plate text in the image.

## Does the copy infantilize or dehumanize beneficiaries?

- People are “a man our night team visits every week”, “a grandmother we support”, “a family of four” — adults with agency (“asked for”), not objects of pity.
- Donor copy avoids “save”, “rescue”, “hero”. The success screen celebrates *the cause being complete*, not the donor’s virtue.

## Could a malicious user abuse this?

- **Only verified nonprofits can post** (in production, after registry, bank-account ownership and a field visit). Individuals can’t create causes or receive money.
- Money is paid to the **nonprofit**, never to a person; payouts should be held until a receipt is posted.
- Remaining risks for production: a compromised nonprofit account, fake receipts, a nonprofit posting exploitative stories. Mitigations: receipt photos + review, anomaly checks, per-cause caps (causes are small by design), report button, human review of flagged Privacy Shield posts.
- Privacy Shield is a safety net, not a guarantee: it can miss small or occluded faces, and its text rules are heuristics. Production adds a server-side second pass and human review.

## Are we implying money moved when it didn’t?

- Every gift path says **RevenueCat Test Store · no real money moves** (give sheet, success screen, gift history).
- If no RevenueCat key is configured, gifts are labeled **offline demo** everywhere.
- The About sheet and README say plainly: no money moves, nothing is delivered.

## Are demo causes clearly demos?

- “Demo” pill on the home header, “Demo cause” pill on every cause, a dashed demo footer on home, “Demo nonprofit · verification simulated” in the studio, “Demo evidence” on proof screens.
- Impact starts at zero and only counts the user’s own test gifts.

## Do photos respect dignity?

- The one bundled proof photo shows hands passing groceries — no faces.
- The Privacy Shield demo photo is a licensed stock photo of adult models (Pexels License); it exists to show the blur working.

## Does Privacy Shield actually reduce risk?

Yes, for the common cases: frontal and three-quarter faces, readable plates/IDs/addresses/phones, document-like regions, and all embedded metadata. It runs before upload, so an unprotected original never leaves the phone. Known gaps are listed in the README (“Limitations”).

## What a production version needs

Written consent flows (including withdrawal), a strict policy for minors (no identifiable children, ever), data retention and deletion rules, local legal review (e.g. Chile’s Ley 19.628 as amended by Ley 21.719; GDPR where applicable), and Apple nonprofit approval for every listed organization.
