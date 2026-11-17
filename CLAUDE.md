# Data Parser

## The one official app
`Workbook Studio.html` is the team app. Make every change there, directly. Nothing else gets updated.

- `Workbook Studio - Demo.html` is the training copy with a fictional Fidelity case preloaded. Never edit it by hand. After any change to the app, rebuild it with `node tools/build-demo.cjs`.
- `Send to Work/` holds copies of everything Joel emails to work. Never edit it; `build-demo.cjs` refreshes it. When a new file needs to go to work, add it to the list in `tools/build-send-folder.cjs`.
- `Archive/` holds the retired main app (`Data Parser App.html`), the old Workbook Studio build pieces and the old design concepts. Don't edit or rebuild anything in there.

## Update log
The app keeps two update logs, both shown in the app under What's new:
- `CHANGELOG.md` is the technical one, in standard Keep a Changelog form. Every change gets an entry under [Unreleased], sorted into Added, Changed, Fixed or Removed, with the specifics a developer would want.
- `WHATS-NEW.md` is the plain-language one for the team. Every change gets a short, general line under "Newest changes", sorted into New, Better or Fixed. No jargon.

After editing either log, run `node tools/build-update-log.cjs` to copy both into the app, then rebuild the demo. When Joel calls a release, turn the unreleased section of both logs into a numbered, dated version.

## Check every change
After changing the app, run the vendor checks from the `tests` folder: `npm test`. Each vendor sample in `Test Samples/Vendor Files` is run through the app, and every exported sheet is compared with its saved known-good copy in `tests/expected`. Any difference fails the check.

When a difference is intended (for example, a fix that changes a column), look at what changed, confirm it with Joel, then record the new known-good copies with `npm run test:update`.
