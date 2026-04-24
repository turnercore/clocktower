# Cookie and Local Storage Policy

**Effective date:** 24 April 2026  
**Site:** `https://www.clocktower.monster/`  
**Contact:** `me@turnercore.dev`

This policy explains how Clocktower uses cookies, local storage, session storage, and similar browser technologies.

For simplicity, this policy uses “browser storage” to mean cookies, local storage, session storage, IndexedDB, and similar technologies that store or access information on your device.

## 1. Summary

Clocktower uses browser storage to make the site work. This may include authentication sessions, shared clock functionality, security, realtime synchronization, and interface preferences.

As currently drafted, Clocktower does not intentionally use advertising cookies, cross-site tracking cookies, marketing pixels, or behavioral advertising technologies.

If non-essential analytics, advertising, or tracking technologies are added later, this policy should be updated and a consent mechanism should be added where required.

## 2. Why browser storage is used

Clocktower may use browser storage to:

- keep you logged in;
- maintain authentication tokens;
- save interface preferences, such as theme or accessibility options;
- remember active or recently used clocks;
- support realtime synchronization and app state;
- protect against abuse, fraud, and unauthorized access;
- improve security and reliability.

## 3. Current storage categories

The exact keys may vary by build, Supabase project reference, framework, and browser. Confirm them in production using browser developer tools before publishing this table.

| Category | Example keys / provider | Purpose | Duration | Consent status |
|---|---|---|---|---|
| Essential authentication storage | Supabase Auth; often similar to `sb-<project-ref>-auth-token`; may use cookies if server-side auth is configured | Keeps users logged in and allows authorized access to saved clocks and account features | Until sign-out, token/session expiry, account deletion, or browser storage clearing | Treated as strictly necessary for logged-in features |
| Essential app/session state | Clocktower app storage; `Not currently enumerated; expected keys include Supabase Auth session storage and next-themes theme preference storage.` | Maintains active clock state, share/session state, or realtime app behavior | Session or until cleared, depending on implementation | Treated as strictly necessary where needed to provide requested functionality |
| Preferences | Theme/accessibility keys; `Not currently enumerated; expected keys include Supabase Auth session storage and next-themes theme preference storage.` | Remembers UI choices such as dark/light theme or accessibility settings | Until changed or browser storage is cleared | Usually low-risk preference storage; disclose clearly |
| Hosting/backend security and logs | Vercel and Supabase | Security, abuse prevention, rate limiting, request handling, debugging | Provider-dependent | Necessary for security and service operation |
| Analytics | `None intentionally used as of this draft.` | `None intentionally used as of this draft` | N/A | Add consent if non-essential analytics uses cookies/storage or similar tracking |
| Advertising / marketing | None | No advertising or behavioral marketing storage is intentionally used | N/A | Not used |

## 4. Supabase Auth storage

If Clocktower uses Supabase Auth in the browser, Supabase may store authentication session information in browser storage. This can include access tokens, refresh tokens, expiry information, and user/session metadata. This storage is used to keep you signed in and to authorize requests to the backend.

Do not share your browser storage, auth tokens, account credentials, or private clock links with others.

## 5. Third-party login providers

If you use a third-party login provider, such as GitHub, Google, Discord, or another OAuth provider, that provider may use its own cookies and tracking technologies when you visit its login pages or use its services. Those technologies are controlled by the provider, not Clocktower.

Current login providers:

`Supabase auth`

## 6. Managing browser storage

You can control cookies and browser storage through your browser settings. Depending on your browser, you may be able to:

- delete cookies and site data;
- block cookies;
- clear local storage or session storage;
- use private/incognito browsing;
- block third-party cookies.

Blocking or deleting essential storage may prevent login, saved clocks, realtime synchronization, preferences, or other features from working correctly.

## 7. Consent

Clocktower does not request consent for browser storage that is strictly necessary to provide requested functionality, such as keeping you logged in or running shared clocks.

If Clocktower adds non-essential cookies, analytics, advertising, marketing, or similar tracking technologies, the site should request consent before using them where legally required, and should make withdrawal of consent as easy as giving it.

## 8. Updates

This policy may be updated when the site’s storage practices change. The updated version will be posted with a new effective date.

## 9. Contact

For questions about cookies or browser storage:

**Email:** `me@turnercore.dev`
