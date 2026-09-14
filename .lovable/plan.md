# Refresh ProfitPilot installed-app branding

## What will change
- Rebuild the favicon, Apple touch icon, and 192px/512px install icons from the latest attached ProfitPilot artwork.
- Give the install icons new versioned filenames and update the web app manifest, so Chrome and Edge do not keep selecting the older cached artwork.
- Update all browser and in-app logo references to the same latest source while preserving the existing appearance and layout.
- Complete the existing production-only service-worker setup with safe caching rules: cache only the app shell and same-origin built assets, use network-first navigation, and never cache authentication or backend API responses.
- Register the worker only on the published site, preserving the existing preview safeguards and `?sw=off` cleanup path.

## Verification
- Confirm every manifest icon has the declared dimensions and comes from the attached logo.
- Run the production build and verify the generated manifest/service worker.
- Check the home, sign-in, and dashboard screens plus icon/manifest requests without changing features or stored data.

## Release note
- Publish the verified update. Existing desktop installations may require closing and reopening the app after the browser receives the refreshed manifest; reinstalling will immediately use the new icon.

## Technical details
- Keep the manifest identity, scope, and `/dashboard` start URL unchanged so existing installations remain the same app.
- Use `vite-plugin-pwa` with one guarded registrar, `injectRegister: null`, disabled development workers, automatic updates, network-first HTML navigation, and no caching for Lovable Cloud/backend requests.
