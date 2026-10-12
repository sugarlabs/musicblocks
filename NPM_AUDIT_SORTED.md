# npm Audit Report (Sorted by Severity)

Sorted vulnerabilities based on `--audit-level=high` with `--omit=dev`.

After running `npm audit fix --force`, the following vulnerabilities have been addressed:

## Critical (Fixed)

- **proxy-addr** 1.1.0 - 2.0.7 - Fixed via `npm audit fix`

## High (Fixed)

- **compression** <1.8.2 - Fixed via `npm audit fix`
- **source-map-js** 1.0.0 - 1.2.1 - Fixed via `npm audit fix`

## Moderate (Remaining)

- **i18next-http-backend** <4.0.2 - Upgraded to 4.0.2 via `npm audit fix --force` (breaking change)
- **materialize-css** * - No fix available; contains 4 XSS and input neutralization vulnerabilities

## Low

- None

---

**Total: 1 moderate vulnerability remaining** (materialize-css has no fix available)

To address the remaining issue:
- `npm audit fix --force` resolves all fixable vulnerabilities except materialize-css
- materialize-css requires manual review or replacement due to no available fix