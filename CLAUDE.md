# Data Parser

## The one official app
`Workbook Studio.html` is the team app. Make every change there, directly. Nothing else gets updated.

- `Workbook Studio - Demo.html` is the training copy with a fictional Fidelity case preloaded. Never edit it by hand. After any change to the app, rebuild it with `node tools/build-demo.cjs`.
- `Archive/` holds the retired main app (`Data Parser App.html`), the old Workbook Studio build pieces and the old design concepts. Don't edit or rebuild anything in there.

## Check every change
After changing the app, run the vendor checks from the `tests` folder: `npm test`. Each vendor sample in `Test Samples/Vendor Files` is run through the app, and every exported sheet is compared with its saved known-good copy in `tests/expected`. Any difference fails the check.

When a difference is intended (for example, a fix that changes a column), look at what changed, confirm it with Joel, then record the new known-good copies with `npm run test:update`.
