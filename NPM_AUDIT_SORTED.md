# npm Audit Report (Sorted by Severity)

Sorted vulnerabilities based on `--audit-level=high` with `--omit=dev`:

## Critical

- **proxy-addr** 1.1.0 - 2.0.7
  - Severity: critical
  - Vulnerability: IP spoofing via IPv4-mapped IPv6 trust subnet
  - Reference: https://github.com/advisories/GHSA-jqcg-44mw-7w3h
  - Fix: `npm audit fix`
  - Note: No version upgrade available that fixes this without breaking changes

## High

- **compression** <1.8.2
  - Severity: high
  - Vulnerability: Denial of Service via memory leak on premature response close
  - Reference: https://github.com/advisories/GHSA-vc2v-76pw-4v95
  - Fix: `npm audit fix`

- **source-map-js** 1.0.0 - 1.2.1
  - Severity: high
  - Vulnerability: Event-loop denial of service through indexed source-map section offsets
  - Reference: https://github.com/advisories/GHSA-68fv-2mgg-jv7q
  - Fix: `npm audit fix`

## Moderate

- **i18next-http-backend** <4.0.2
  - Severity: moderate
  - Vulnerability: Incomplete URL validation permits SSRF
  - Reference: https://github.com/advisories/GH-xvq9-wjp8-hwqf
  - Fix: `npm audit fix --force`
  - Note: Will install i18next-http-backend@4.0.2, which is a breaking change

- **materialize-css** *
  - Severity: moderate
  - Vulnerabilities:
    - Cross-site Scripting (XSS) due to improper escape of user input - GHSA-7jvx-f994-rfw2
    - Cross-site Scripting in autocomplete component - GHSA-7752-f4gf-94gc
    - Cross-site Scripting in tooltip component - GHHA-98f7-p5rc-jx67
    - Improper Neutralization of Input During Web Page Generation - GHGA-rg3q-jxmp-pvjj
  - Reference: Multiple GitHub advisories
  - Fix: No fix available

## Low

- None found with `--audit-level=high` and `--omit=dev`

---

**Total: 5 vulnerabilities** (1 critical, 2 high, 2 moderate, 0 low)

To address all issues:
- `npm audit fix` - fixes compression, proxy-addr, source-map-js
- `npm audit fix --force` - fixes all including breaking change i18next-http-backend upgrade
- materialize-css has no fix available