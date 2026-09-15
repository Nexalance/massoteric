# Reviewer Access Link (Magic Link) — Quick Guide

One time-limited URL opens the live site in a **full admin session** — no password shared, nothing for reviewers to install.

## Generating a link

1. Open the **Admin Dashboard** (`/admin`) and find the **Reviewer Access Link** card (right column, next to Feature Access Controls).
2. Pick how long the link stays valid — **1, 7, 14 or 30 days** (7 is the default).
3. Click **Generate Link** (or **Generate New Link (revokes old)** if one already exists).
4. **Copy the URL immediately** — it is shown only once and can never be viewed again (only its hash is stored).

The link looks like:

```
https://your-domain/dev-access?token=<64-character code>
```

## Sharing it

Send the URL to your reviewer by any channel. When they open it:

- The site loads logged-in as an **admin** — full dashboard (sync, resolve markets, users, feature toggles) plus the entire public site.
- It works on desktop and mobile. No login form, nothing to install.
- **Important:** anyone holding the link has real admin powers. Treat the URL itself like a password — anything a reviewer does is a live change to the site.

## Revoking

In the same admin card, click **Revoke Now**. The link dies **instantly** — anyone using it loses admin access on their very next click. You can generate a fresh link at any time; generating a new one automatically revokes the previous one (only one link is active at a time).

The link also **expires on its own** at the chosen date — check the card to see the current link's expiry ("Active — expires …").

## FAQ

- **I lost the URL.** Generate a new one; the old link is revoked automatically.
- **Reviewer closed the browser.** The session cookie lasts until the link expires — reopening the same URL restores admin access while the link is alive.
- **Who do reviewer actions show up as?** The reviewer carries the site's primary admin identity (the first ID in `ADMIN_USER_IDS`), so their actions appear as that admin. Keep the link inside your trusted circle.
- **Does the site change for normal users?** No. Regular sign-ins, tiers and permissions are untouched; the link only opens an additional admin door that you control.
