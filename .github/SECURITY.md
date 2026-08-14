# Security Policy

## Supported Versions

Only the latest commit on `main` is supported. Older tags and branches do **not** receive
security patches.

| Version  | Supported          |
| -------- | ------------------ |
| `main`   | :white_check_mark: |
| anything else | :x:           |

## Reporting a Vulnerability

If you believe you have found a security vulnerability in RenocalcPro, please report it
**privately** so it can be assessed and fixed before public disclosure.

- **Preferred channel:** open a private security advisory via
  GitHub → Security → "Report a vulnerability".
- **Email fallback:** security@renocalcpro.fr (replace with your real address before going live)

Please include:

1. A description of the issue and its potential impact.
2. Reproduction steps, ideally with a minimal proof-of-concept.
3. The affected URL/route, endpoint, or file path.
4. Any logs, request/response payloads, or screenshots.

You should receive an acknowledgement within **72 hours** and a status update within
**7 days**. We aim to ship a fix within **30 days** for high/critical issues.

## Scope

In-scope:

- The web application at production URLs operated by Renocal Pro.
- This repository's source code, CI workflows, and infrastructure-as-code.

Out of scope:

- Findings limited to outdated browsers or unsupported environments.
- Volumetric DoS / DDoS without a proof of impact.
- Issues in third-party services (Stripe, Sentry, OVH, etc.) — report those upstream.
- Social engineering of staff or users.

## Safe Harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of data, or
  interruption of service.
- Only interact with their own accounts or accounts they have explicit permission to test.
- Give us reasonable time to investigate and fix before any disclosure.

Thank you for helping keep RenocalcPro and its users safe.
