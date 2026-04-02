module.exports = {
    ci: {
        collect: {
            // Use the static server to serve Music Blocks
            staticDistDir: "./",
            // Number of runs to average for more accurate results
            numberOfRuns: 3,
            // URLs to test
            url: ["http://localhost/index.html"],
            settings: {
                // Chrome flags for headless testing
                chromeFlags: "--headless --no-sandbox --disable-gpu",
                // Categories to audit
                onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
                // Emulate mobile device for realistic testing
                preset: "desktop",
                // Set throttling for consistent results
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1
                }
            }
        },
        assert: {
            assertions: {
                // Category scores - error on performance, warn on the rest
                "categories:performance": ["error", { minScore: 0.4 }],
                "categories:accessibility": ["warn", { minScore: 0.8 }],
                "categories:best-practices": ["warn", { minScore: 0.8 }],
                "categories:seo": ["warn", { minScore: 0.8 }],
                // Core Web Vitals - fail CI if any regress past these ceilings
                "first-contentful-paint": ["error", { maxNumericValue: 4000 }],
                "largest-contentful-paint": ["error", { maxNumericValue: 6000 }],
                "cumulative-layout-shift": ["error", { maxNumericValue: 0.25 }],
                "total-blocking-time": ["error", { maxNumericValue: 600 }],
                "speed-index": ["warn", { maxNumericValue: 5000 }],
                // Resource size budgets (bytes) - catch bundle bloat early
                "resource-summary:script:size": ["error", { maxNumericValue: 5242880 }],
                "resource-summary:stylesheet:size": ["warn", { maxNumericValue: 1048576 }],
                "resource-summary:image:size": ["warn", { maxNumericValue: 2097152 }],
                "resource-summary:total:size": ["error", { maxNumericValue: 10485760 }]
            }
        },
        upload: {
            // Use temporary public storage for reports (free, no setup required)
            target: "temporary-public-storage"
        }
    }
};
