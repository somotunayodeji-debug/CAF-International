# Christ Ambassadors Fellowship International

This site is a static church website for sharing sermons, events, blog posts, gallery content, and contact information.

## Folder structure

- `index.html` — homepage
- `about.html` — about the fellowship
- `events.html` — church events and weekly service times
- `sermons.html` — sermon library and audio player
- `videos.html` — Facebook live/video links
- `gallery.html` — church photo gallery
- `blog.html` and `post.html` — blog/news posts
- `contact.html` — connect and prayer forms
- `admin/` — administrator dashboard and sign-in flow
- `css/` — site and admin styles
- `js/` — shared scripts, dynamic content, and page logic
- `images/` — site logo and icons
- `supabase/` — schema and SQL for Supabase models

## Run locally with Live Server

1. Open the project folder in VS Code.
2. Install the Live Server extension if you do not already have it.
3. Right-click on `index.html` and choose "Open with Live Server".
4. The site will run at your local local preview URL.

## Deploy on Netlify

1. Push the project to GitHub.
2. In Netlify, click "Add new site" and choose the repository.
3. Set the publish directory to the project root.
4. Keep the default build settings for a static site (no build command needed).
5. Deploy and ensure the domain has the public pages and `manifest.json`, `sw.js`, and `offline.html` accessible at the root.

## Update the WhatsApp links and service times

- WhatsApp group links: update `PHASE5_WHATSAPP_GROUP_URL` and `PHASE5_YOUTH_WHATSAPP_GROUP_URL` in `js/phase5.js`.
- Service times: update the site-wide service schedule in `js/components.js` footer text and on the homepage in `index.html`.

## PWA / App icons

Create the following PNG files in `images/icons/` before launch:

- `icon-192.png` — 192x192
- `icon-512.png` — 512x512
- `icon-maskable-512.png` — 512x512 maskable icon

The manifest and touch icons already point to those filenames.

## Launch checklist

Before going live, finish the remaining manual tasks:

- Add the final icon files in `images/icons/`
- Confirm both WhatsApp group links in `js/phase5.js`
- Confirm weekly service times and service days
- Set the Supabase auth redirect URLs in the Supabase dashboard
- Create the admin account(s) and assign the correct permissions
- Test the site on a real Android phone
- Run a Lighthouse performance/accessibility audit and fix any remaining issues
