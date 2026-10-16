# Security Policy

Booth stores owner accounts, customer contact data and payment receipts, so security reports are taken seriously and handled first.

## Supported versions

| Version                  | Supported |
| ------------------------ | --------- |
| `main` (latest release)  | Yes       |
| `develop` (next release) | Yes       |
| Older tags and forks     | No        |

## Reporting a vulnerability

**Please do not open a public issue, pull request or discussion for security problems.**

Report privately through GitHub: go to the repository's **Security** tab → **Report a vulnerability** ([direct link](https://github.com/keylorpineda/booth/security/advisories/new)). Include:

- What is affected (endpoint, page, package) and the impact.
- Steps to reproduce or a proof of concept.
- Any suggested fix, if you have one.

Reports in English or Spanish are welcome.

## What to expect

- Acknowledgement within **3 business days**.
- An initial assessment within **7 days**, with severity and next steps.
- A fix in a private advisory, then a release and a published advisory crediting you (unless you prefer to stay anonymous).

## Scope

In scope:

- Tenant isolation: one store reading or changing another store's data.
- Authentication and sessions (tokens, refresh rotation, cookies).
- Order integrity: prices, totals, stock reservation, order tracking tokens.
- Access to private receipts or customer personal data.
- The demo read-only guard.
- Injection, XSS, CSRF, SSRF or file upload issues.

Out of scope:

- Denial of service or load testing against hosted instances.
- Social engineering, spam or physical attacks.
- Reports from automated scanners without a demonstrated impact.
- Issues in third-party services (Cloudinary, Neon, Render, Vercel, WhatsApp) not caused by Booth.

## Safe harbor

Good-faith research that follows this policy is welcome: use your own accounts and test stores, never access or keep other people's data, and give us reasonable time to fix the issue before disclosing it.
