# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately by opening a [GitHub Security Advisory](https://github.com/mitchins/lunchsaga/security/advisories/new) rather than a public issue.

Include as much detail as you can: steps to reproduce, impact, and any suggested fix. We aim to respond within 5 business days and will keep you updated on the fix timeline.

## Safe Harbor

We support good-faith security research. If you:

- Make a good-faith effort to avoid privacy violations, data destruction, and service disruption
- Only interact with accounts you own or have explicit permission to test
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report findings promptly and privately

We will not pursue legal action against you. We ask that you give us reasonable time to address findings before any public disclosure.

## Scope

### In Scope

- Authentication and session handling (magic-link flow, JWT tokens)
- API endpoints and authorization checks
- Data exposure or privilege escalation between teams

### Out of Scope

- Denial of Service attacks
- Social engineering or phishing
- Physical security
- Vulnerabilities in third-party dependencies (please report those upstream)
- Rate limiting on unauthenticated public endpoints

## Disclosure Policy

We follow coordinated disclosure. After a fix ships, we aim to publicly acknowledge the vulnerability within 90 days of the original report. We appreciate patience while we address issues before public discussion.
