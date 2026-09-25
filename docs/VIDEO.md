# Demo video — script, shot list, edit

**Length:** 1:50 (hard cap 2:00). **Format:** 1920×1080, 30 fps, H.264 + AAC, for YouTube (unlisted is fine, but it must be public-viewable).
**Look:** warm paper background (#F6F3EC), the app’s own serif (Instrument Serif) for captions, the phone recording framed without a device bezel, rounded corners.
**Audio:** original ambient track generated for this video (no third-party music). Optional voice-over (script below) — captions carry the story on their own.

The first 15 seconds do the work: problem → the one line that explains the product → the app.

| # | Time | Picture | On-screen caption | Voice-over (optional) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Paper, serif text fades in | People want to help. | People want to help. |
| 2 | 0:04–0:08 | Same, second line | But a donation disappears into a general fund. | But most donations disappear into a general fund. |
| 3 | 0:08–0:13 | App icon → wordmark | **Handful.** Small, real needs from verified nonprofits. | Handful turns real needs into small causes you can actually finish. |
| 4 | 0:13–0:24 | Home: hero, “Almost there” carousel, scroll to open causes | Real needs, priced item by item. | A hot meal. A bus fare. Food for a dog named Toby. Each one posted and verified by a local nonprofit. |
| 5 | 0:24–0:38 | Open “Hot meal + warm socks”: budget, org ✓, timeline, trust & privacy | What it pays for. Who verified it. What’s left. | You see exactly what it pays for, who checked it, and how much is left. |
| 6 | 0:38–0:50 | “Complete it · $4” → gift sheet → **RevenueCat Test Store sheet** → Successful purchase → ring closes | Only $4 left. Complete it. · RevenueCat Test Store — real SDK, no real money | Four dollars left. Complete it. The purchase runs through RevenueCat — in this demo, its Test Store. |
| 7 | 0:50–0:57 | Success screen, items tick → Impact tab, gift history with transaction ID | Your impact counts only what you did. | No made-up impact numbers. Just what you did. |
| 8 | 0:57–1:05 | Nonprofits tab → “Post proof” → receipt lines | The nonprofit buys the items and posts the receipt. | Then the nonprofit buys everything and posts the receipt. |
| 9 | 1:05–1:25 | Choose delivery photo → **Privacy Shield** scan → face + plate + GPS found → Protect identity → blurred → hold to compare | Privacy Shield runs on the phone. Faces blurred. Plates hidden. Location removed. | Before any photo is posted, Privacy Shield runs on the phone: faces blurred, license plates hidden, location data stripped. Nothing is uploaded. |
| 10 | 1:25–1:37 | Post proof → notification “Delivered ✓” → proof screen: “It got there.” receipt + protected photo | Proof — without anyone losing their dignity. | And you get the proof. Without anyone losing their dignity. |
| 11 | 1:37–1:44 | Supporter sheet (brief) | Nonprofits pay nothing. Supporters keep it free. | Nonprofits pay nothing. An optional membership keeps it that way. |
| 12 | 1:44–1:50 | Paper, logo, lines | Small gifts. Real needs. Proof that protects. **Handful** · Built with Expo + RevenueCat | Handful. Give to something real. |

## Shot list (simulator recordings, iPhone 16 Pro, 1179×2556)

Record each with `xcrun simctl io booted recordVideo --codec h264 <file>.mp4`, starting from a **reset** demo state.

1. `home.mp4` — cold start on Causes, pause on hero 2s, swipe the carousel once, scroll slowly to the first card.
2. `cause.mp4` — tap the hot-meal card, scroll through budget → timeline → trust & privacy, back to top.
3. `complete.mp4` — tap “Complete it · $4” → sheet → Complete it → Test Store sheet → *Successful purchase* → success ring.
4. `impact.mp4` — Done → Your impact tab → scroll to gift history.
5. `proof-post.mp4` — Nonprofits tab → Post proof on the hot-meal cause → Continue → Choose delivery photo → pick the demo photo → Shield review → Protect identity → hold to compare → Use protected photo → Post proof.
6. `delivered.mp4` — notification banner → proof screen scroll.
7. `supporter.mp4` — Impact → Keep Handful free sheet.

## Edit (automated)

`scripts/video/build.sh` composes the recordings, title cards and captions with ffmpeg (no third-party editor needed):
- Title cards rendered with Pillow in Instrument Serif at 1920×1080.
- Phone recordings scaled to 980 px tall, rounded-corner mask, soft shadow, left-aligned; captions on the right.
- Cross-fades 8 frames between shots, music ducked −6 dB under voice-over if present.
- Export: `submission/video/handful-demo.mp4` (H.264 High, CRF 18, 30 fps, AAC 192 kbps, `+faststart`).

## Thumbnail

`submission/video/thumbnail.png` (1280×720): paper background, the success ring at 100%, “Only $4 left. Complete it.” in serif, the app icon.
