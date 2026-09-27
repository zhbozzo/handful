# Demo video — script, recording, edit

**Length:** 1:41 (the rules' limit is under 2:00). **Format:** 1920×1080, 60 fps, H.264 + AAC, −16 LUFS.
**Look:** paper background with a soft warm glow, the phone recording framed without a bezel, captions in the
app's own type (Figtree ExtraBold, one accent phrase in deep sun).
**Audio:** the entrant's own voice-over (one voice memo with retakes; `plan.json` picks the last good take of each
line and places it on its scene), cleaned and levelled by `scripts/video/voice.py`, over an original score generated
by `scripts/video/music.py` (no third-party music) that ducks under the voice, with chimes on the key moments.
Captions carry the story too, for viewers watching without sound.

Everything on screen is the real app in the iOS Simulator (iPhone 16), driven by real taps, with real RevenueCat
Test Store purchases and a real Privacy Shield run on a photo picked from the library. Nothing is mocked up.

## Script

| Time | Picture | Caption |
|---|---|---|
| 0:00 | Title card | People want to help. / But most donations disappear into a **general fund.** |
| 0:08 | Launch animation → Causes | **Handful** — Small, real needs from **verified nonprofits.** |
| 0:12 | Causes: “Almost there” carousel with photos, open causes | **Real needs** — Priced **item by item.** |
| 0:18 | “Hot meal + warm socks” → what it pays for → Follow the money | **Transparency** — What it pays for. Who verified it. **What’s left.** |
| 0:25 | Complete it · $4 → gift sheet → **RevenueCat Test Store sheet** (`handful_gift_4`) → “You completed this cause.” | **Complete it** — Only $4 left. **One tap finishes it.** |
| 0:37 | Your impact: $4, “Your causes” tracker (Funded → Bought → Delivered), gift history with transaction ID | **Your impact** — Follow your gift **like an order.** |
| 0:42 | Nonprofit studio: $18 available → Withdraw → “$18 on its way” | **Nonprofit** — Every dollar reaches **the nonprofit.** |
| 0:49 | Receipt step → thank-you photo step → photo library | **Proof** — Then it posts the receipt and **a thank-you photo.** |
| 0:56 | **Privacy Shield**: 2 faces + GPS found → Protect identity → blurred → hold to compare | **Privacy Shield** — Faces blurred. Location removed. **On the phone.** |
| 1:07 | Post proof → “Proof posted.” → iOS notification “Delivered ✓” | **Delivered** — Everyone who gave **gets notified.** |
| 1:17 | Your impact: “Delivered · See the result” card → “It got there.” → receipt | **The result** — And you see **it got there.** |
| 1:25 | Keep Handful free → **RevenueCat Test Store** (`handful_supporter_monthly`) → Supporter · Active | **Supporter** — Nonprofits pay nothing. **Supporters keep it free.** |
| 1:35 | End card | Small gifts. Real needs. **Proof that protects.** |

## Recording

1. Start from a clean state: `-handfulDev rcfresh` (new RevenueCat customer, no subscription), then
   `-handfulDev reset` (seed data). Both need the dev-mode bundle.
2. Record with a **production-mode JS bundle** on the same debug build (the Test Store still works):
   `npx expo start --dev-client --port 8090 --no-dev --minify`. Dev-mode React renders too slowly for smooth
   transitions in the Simulator, and it hid a real bug (the success celebration played behind the closing sheet).
   Keep the Simulator window closed (boot the device headless) while recording.
3. Launch with `-handfulRecording 1 -handfulDemoScroll 1` (`result` for the donor-sees-the-result scene). The
   Simulator delivers scripted drags in bursts, so scrolls are played by `src/lib/demoScroll.ts` instead: the
   screen scrolls itself on a fixed script, on the UI thread. Heavy screens (home, Your impact, the result) run
   their script 3× slower and the edit speeds them back up, so no frame is ever dropped.
4. Record each scene with `xcrun simctl io booted recordVideo --codec=h264 <scene>.mp4` into
   `submission/video/raw/`. `python3 scripts/video/activity.py <scene>.mp4` lists where the screen moves; cuts in
   `scripts/video/plan.json` join still frames only. A cut is `[start, end, speed, dissolve]`: the dissolve steps
   over the iOS zoom transition into a cause, which the Simulator renders at ~15 fps.
5. Check the result frame by frame: no motion in the final video freezes for more than 2 frames (33 ms).

## Edit (automated)

`python3 scripts/video/build.py` converts each recording to constant 60 fps, renders the title cards and captions
(`cards.py`), frames the phone, cross-fades the segments and mixes the score (`music.py`). Output:
`submission/video/handful-demo.mp4`; thumbnail: `submission/video/thumbnail.png` (1280×720).

## Cause photos

The nine demo cover photos in `assets/causes/` come from Unsplash (credits in the README), imported with
`scripts/import-cause-photos.py` (3:2 crop, 1200 px, metadata stripped). The night-street photo was cropped by hand
to drop a dark foreground silhouette.
