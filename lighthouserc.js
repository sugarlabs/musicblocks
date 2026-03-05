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
            // Assertions for performance budgets
            // These will warn but not fail the build initially
            assertions: {
                "categories:performance": ["warn", { minScore: 0.5 }],
                "categories:accessibility": ["warn", { minScore: 0.8 }],
                "categories:best-practices": ["warn", { minScore: 0.8 }],
                "categories:seo": ["warn", { minScore: 0.8 }],
                // Specific metrics to track
                "first-contentful-paint": ["warn", { maxNumericValue: 4000 }],
                "largest-contentful-paint": ["warn", { maxNumericValue: 6000 }],
                "cumulative-layout-shift": ["warn", { maxNumericValue: 0.25 }],
                "total-blocking-time": ["warn", { maxNumericValue: 600 }],
                "speed-index": ["warn", { maxNumericValue: 5000 }]
            }
        },
        upload: {
            // Use temporary public storage for reports (free, no setup required)
            target: "temporary-public-storage"
        }
    }
};
