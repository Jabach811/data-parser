# Data Parser

## Keep Workbook Studio in sync — every change, every time
Any change to `Data Parser App.html` must also land in Workbook Studio. After editing the app, run:

    node "Workbook Studio/sync-from-app.cjs"

That rebuilds all four Workbook Studio files (Workbook Studio, Demo, Focus, Focus Demo) from the app. Then check the change in Workbook Studio - Focus.html too, not just the main app. Never edit the Workbook Studio HTML files by hand; they get overwritten. Workbook Studio's own look lives in its .css/.js files next to the builders.
