# Birthday Surprise ♡

A complete birthday surprise based on your reference video, updated with your personalised oval portrait and all four newly supplied photos. It includes a matching transparent heart collage and an extra birthday letter with four photo memories.

**Password: `2026`** · **Birthday: 20 October 2003** · **Recipient: nippu ji**

## सबसे आसान तरीका / Open the project

1. Extract **Birthday_Surprise_Project.zip** completely.
2. Double-click **index.html**, or double-click **START-WINDOWS.bat**.
3. Enter **2026** using the keypad or your keyboard.
4. Try **NO**, then **TRY AGAIN**, then **YES**.
5. Click the cake to blow out the candle. Click **I am ur gift** to open the heart collage, or wait about 10 seconds.
6. Click **one more birthday surprise**, then tap the pink envelope to open the birthday letter and all four photo memories.

**No npm, Node.js, Python, installation, internet, or database is needed to open the finished page.** Photos, font, music, code and styles are embedded in the main HTML file. Chrome, Edge, Firefox and Safari are suitable current browsers.

Music starts after your first click or key press, as browsers require a user gesture. Use the music button in the corner to mute it. The circular arrow restarts the surprise.

## Personalise without coding

1. Click the pencil in the bottom-right corner.
2. Change the name, four-digit passcode, date, question, birthday letter and signature.
3. Choose photos for the cover, the two pictures in the large heart, and the left/right hearts. Changing any heart photo also updates its memory card.
4. Click **Save my surprise** to preview changes on your device.
5. Click **Download my page** to download one complete personalised HTML file. Send that file or upload it to a static web host.

Saving in the form applies to the current browser. The downloaded personalised HTML includes your changes and uploaded photos, so a recipient receives your version. If a browser blocks local storage, changes still work for the current visit and can be downloaded. If the passcode does not match the date, the hint asks the recipient to request the code from you.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Finished, self-contained page. Open this first. |
| `START-WINDOWS.bat` | Opens the finished page on Windows. |
| `source/index.html` | Readable HTML, including editable vector cat drawings. |
| `source/styles.css` | Pink/cream colours, sizing, responsive layouts and animations. |
| `source/app.js` | Passcode, reactions, transitions, music and customisation. |
| `source/config.js` | Default name, passcode, date, messages and photo filenames. |
| `source/assets/` | Your personal portraits, generated cover/collage, music, fonts and favicon. |
| `build.py` | Optional, dependency-free script that rebuilds `dist/index.html`. |
| `LICENSES.txt` | Asset and font provenance. |

## Edit the source

Open `source/config.js` in VS Code or any text editor. For example:

```js
recipient: "nippu ji",
passcode: "2026",
specialDate: "20.10.2003",
giftLine: "You are my favourite person",
```

The passcode must be a string containing exactly four digits. This is a playful gift puzzle; the code is visible in the client-side source.

Replace photos in `source/assets/` or change their filenames in the configuration. Set `useReferenceCollage: false` to compose three hearts directly from the four individual photos. Keep `true` to use the prepared transparent personal collage. Uploading a heart photo in the form automatically switches to the individual-photo layout.

The cover image already includes its oval heart frame, so `coverIsFramed: true` shows it without a second frame. Set this to `false` for an unframed cover photo. A new cover uploaded through the form uses the page's own oval frame.

The recipient is **nippu ji**, the birthday is **20 October 2003** (displayed as **20.10.2003**), and the password is **2026**. All three remain editable in the personalisation form.

Open `source/index.html` to preview source changes. To build another self-contained version, run this optional command from the project folder:

```powershell
py build.py
```

The new file is **dist/index.html**. Open it directly or upload it as your website's `index.html`. This build step requires Python 3; no additional libraries are used.

Set `autoAdvanceMs: 0` to keep the birthday screen visible until the gift message is clicked. Reduced-motion users get immediate text, still illustrations, no confetti, and manual progression.

## What follows the reference

- Pink passcode panel and your personalised oval portrait with red/pink hearts.
- Four code boxes and a circular 3 × 4 keypad, with keyboard support.
- Curved red headings over a pale heart background.
- Wrong-password screen and working retry button.
- Cats in a gift box, YES/NO question, and the NO reaction.
- Birthday cake, candle, mint cats, hand lettering, sparkles and light confetti.
- “Will you be mine?” page with all four new photos in three hearts.
- A pink envelope, editable birthday wish/signature and four photo memory cards.

The drawings and lettering are editable recreations. The oval cover and transparent collage were created from your supplied photo references; the four individual portrait files remain unchanged copies of your uploads. The short music sample comes from your original supplied recording. The browser/laptop frame and the social-video caption were not part of the website and are excluded.

## Publish on GitHub Pages

Upload the finished **index.html** from the top of this extracted project folder into the root of your GitHub repository. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then save. The finished HTML contains all its assets; uploading the `source` folder is optional. If you rebuild source changes, upload **dist/index.html** as the repository's root **index.html**.

## Validation

The JavaScript syntax, offline asset embedding, and interactive flow were checked programmatically. A graphical browser was not available for a final visual check in this environment.
