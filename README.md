# GymLog PWA v0.1

GymLog is a mobile-first, installable web app for the 26-week Mon/Wed/Fri gym programme. It is designed for iPhone and does not require Xcode or a Mac to run once hosted on an HTTPS web address.

## What is included

- Routine A / B / C with the 26-week set and rep progression.
- Week 9 additions: Wednesday light goblet squat and Friday neutral-grip lat pulldown.
- Warm-up and cool-down checklists in every workout.
- Weight, reps/distance, RIR and actual rest-time logging for each set.
- Timed-set stopwatch for the forearm plank; the recorded value is the set duration.
- Previous workout values prefilled into today's sets.
- Previous workout's suggested modification shown above the exercise; it never changes today's load automatically.
- Exercise instruction sheet with an illustration, muscles worked, instructions and technique cues.
- Automatic programme week from the programme start date, with a manual week override before starting a workout.
- Workout date determines the weekday used in the generated Note. A manual weekday-label override is also available in Workout Details.
- Automatic start, finish and total workout duration.
- Local workout history and autosave.
- Apple Notes log generation with RIR, actual rest, set duration, notes and next-session suggestions.
- Apple Shortcuts handoff: GymLog copies the completed log and opens a named Shortcut.
- Offline app shell and exercise images after the first successful load.
- JSON backup/restore for workout history.
- No account, analytics, ads or cloud database.

## Important: a PWA still needs hosting

Safari cannot install a PWA directly from this ZIP or from the iPhone Files app. Put this folder on any static **HTTPS** web host first. No server-side code is required.

The host must serve these files as normal static files and preserve the relative paths. The entry page is `index.html`.

Examples of suitable static hosting are GitHub Pages, Netlify, Cloudflare Pages, or any ordinary HTTPS web space. You can upload these files from Windows; a Mac is not required.

## Install on iPhone

1. Upload the entire `GymLog_PWA_v0.1` folder to an HTTPS static host.
2. Open the resulting web address in **Safari on the iPhone**.
3. Tap **Share**.
4. Choose **Add to Home Screen**.
5. If shown, enable **Open as Web App** and tap **Add**.
6. Launch GymLog from its new Home Screen icon.

Load the app once while online so the service worker can cache the app and exercise illustrations for offline use.

## First setup

Open **Settings** in GymLog and set:

- **Programme start date** — used to calculate Week 1 through Week 26.
- **Apple Shortcut name** — default is `Save Gym Workout`.

A programme week can also be overridden immediately before a workout is started.

## Apple Notes Shortcut

Apple Notes does not provide a normal web API for silently inserting a note into a selected folder. GymLog therefore hands the generated text to an Apple Shortcut.

On the iPhone:

1. Open **Shortcuts** and create a new shortcut.
2. Name it exactly `Save Gym Workout` (or use the name entered in GymLog Settings).
3. Add a **Create Note** action.
4. Use **Shortcut Input** as the note content. GymLog launches the shortcut using clipboard input.
5. In the Create Note action, choose the Apple Notes folder where workout logs should be stored.
6. Save the shortcut.

If Shortcut Input is not available in the expected way on your iOS version, add **Get Clipboard** before Create Note and pass the clipboard result to Create Note.

After a workout, tap **Copy + Run Notes Shortcut**. GymLog copies the generated log, opens the Shortcut, and the Shortcut creates the Apple Note. The first line is the requested title, for example:

`Wk7 A-Tue 22/09/26`

## Rest timer workflow

For a reps or carry set, enter the result and tap the round completion button. Rest timing starts immediately. Tap **Continue** when you begin the next set/exercise; the elapsed rest time is saved to the completed set.

For the forearm plank, tap **Start**, then **Finish set**. The elapsed time becomes the set duration automatically, and the rest timer begins.

## Data storage and backup

Workout data is stored in browser local storage on the device. Use **Settings → Export backup** periodically. The JSON backup can be restored later through **Restore backup**.

Clearing Safari website data can remove locally stored PWA data, so backups are recommended.

## Files

- `index.html` — app entry page
- `styles.css` — iPhone-first UI
- `app.js` — workouts, history, timers, Notes generation and storage
- `program.js` — 26-week programme data and progression rules
- `manifest.webmanifest` — installable PWA metadata
- `service-worker.js` — offline cache
- `assets/` — icons and exercise illustrations
- `SAMPLE_NOTES_LOG.txt` — example generated Notes output

## Updating

When replacing files on the host, change the cache name in `service-worker.js` (for example from `gymlog-v0.1.0` to `gymlog-v0.1.1`) so installed devices fetch the new version cleanly.
