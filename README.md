# Trip Planning Pilot: intake site

A static site (HTML, CSS, JS) with the intake form from the Concierge Test Kit. No server, no build step. Answers go to a Google Sheet through a small Apps Script.

## Files
- `index.html`, `styles.css`, `app.js`: the site
- `config.js`: the only file you edit (site name, endpoint, thank-you text)
- `apps-script/Code.gs`: the Google Sheet receiver

## 1. Test locally (demo mode)
Open `index.html` in a browser. With `endpoint` empty, submitting shows the answers on screen as JSON and sends nothing. Try both branches: tick "I am exploring" and untick it, and try dates, month, friends and family.

## 2. Set up the Google Sheet receiver
1. Create a new Google Sheet. Open Extensions > Apps Script.
2. Replace the default code with `apps-script/Code.gs`. Save.
3. Deploy > New deployment > type Web app. Execute as: Me. Who has access: Anyone. Deploy and approve the permissions.
4. Copy the Web app URL (ends in `/exec`) into `endpoint` in `config.js`.
5. Submit a test from the site. A new row appears in an `Intake` tab with a tester ID (T001, T002 and so on).

If you change `Code.gs` later, use Deploy > Manage deployments > Edit > New version, or the old code keeps running.

You can use a form service that accepts JSON POSTs (for example Formspree) instead. Put its URL in `endpoint`.

## 3. Deploy
Any static host works. Upload the folder (without `apps-script/` if you like):
- Netlify: drag the folder onto app.netlify.com/drop.
- GitHub Pages: push to a repo, Settings > Pages, pick the branch.
- Vercel: `vercel` in the folder, or import the repo.

## 4. Before you share the link
- Submit a real test and check the row in the Sheet.
- Check the page on a phone.
- Confirm the consent text, how long you keep answers, and who can open the Sheet. The form collects a phone number or email, so check with your legal team what applies to you (for example India's DPDP Act). I am not a lawyer.
- Keep the Sheet private. Share only with people running the pilot.
- Only promise in `doneText` what you will do.

## Known limits
- Delivery cannot be confirmed from the browser with Apps Script. The browser sends the request and shows success once it goes out. Check the Sheet after launch and keep an eye on the count against what testers say they sent. If the network fails, the tester sees an error and can retry.
- Spam protection is minimal: a hidden honeypot field and input length limits. Fine for an invite-only pilot, not for a public launch.
- Fonts load from Google Fonts. If blocked, the page falls back to system fonts.
- This was syntax-checked but not tested in a browser. Run step 1 and step 2 yourself before sharing.

## What the Sheet columns mean
`intakeSeconds` is how long the tester spent from first touching the form to sending it. It is a rough check on form length. It is not the pilot's active-time metric, which you measure in the sessions.
