# Fix remaining ProfitPilot audit findings

## Changes
- Replace the published site's `unsafe-inline` and `unsafe-eval` CSP allowances with a cryptographic nonce generated for each HTML response.
- Apply that nonce to rendered script and style elements while preserving required same-origin assets, backend authentication connections, images, and fonts.
- Keep the embedded development preview compatible; enforce the strict policy on the published site audited by SiteTest.
- Confirm the existing login password field retains its label, unique ID, name, and `current-password` autocomplete value.

## Verification
- Run type and production build checks.
- Inspect `/auth` in the browser for rendering and authentication errors.
- Verify the published-mode response has CSP without unsafe directives and keeps frame and permissions protections.
- Confirm password autocomplete in rendered HTML.

## Hosting and DNS
- SPF and DMARC cannot be changed for the platform-controlled `profitpilot-business.lovable.app` subdomain from application code. No invented DNS records will be added.
- The supplied report enumerates four findings despite saying five; no unspecified finding will be guessed.
