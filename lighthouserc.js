const lighthouseProfile = process.env.LHCI_PROFILE || "desktop";
const isMobileProfile = lighthouseProfile === "mobile";

const sharedAssertions = {
    "categories:accessibility": ["warn", { minScore: 0.8 }],
    "categories:best-practices": ["warn", { minScore: 0.8 }],
    "categories:seo": ["warn", { minScore: 0.8 }]
};

const performanceAssertions = isMobileProfile
    ? {
          // Keep mobile performance visible in CI without failing the build.
          "categories:performance": ["warn", { minScore: 0.5 }],
          "first-contentful-paint": ["warn", { maxNumericValue: 5000 }],
          "largest-contentful-paint": ["warn", { maxNumericValue: 7500 }],
          "cumulative-layout-shift": ["warn", { maxNumericValue: 0.25 }],
          "total-blocking-time": ["warn", { maxNumericValue: 1000 }],
          "speed-index": ["warn", { maxNumericValue: 6500 }]
      }
    : {
          "categories:performance": ["warn", { minScore: 0.5 }],
          "first-contentful-paint": ["warn", { maxNumericValue: 4000 }],
          "largest-contentful-paint": ["warn", { maxNumericValue: 6000 }],
          "cumulative-layout-shift": ["warn", { maxNumericValue: 0.25 }],
          "total-blocking-time": ["warn", { maxNumericValue: 600 }],
          "speed-index": ["warn", { maxNumericValue: 5000 }]
      };

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
                // Local runs stay desktop; CI flips this to mobile when needed.
                ...(isMobileProfile
                    ? {
                          formFactor: "mobile",
                          throttlingMethod: "simulate",
                          screenEmulation: {
                              mobile: true,
                              width: 360,
                              height: 640,
                              deviceScaleFactor: 2,
                              disabled: false
                          }
                      }
                    : { preset: "desktop" }),
                // Set throttling for consistent results
                throttling: isMobileProfile
                    ? {
                          rttMs: 150,
                          throughputKbps: 1638.4,
                          uploadThroughputKbps: 750,
                          cpuSlowdownMultiplier: 4
                      }
                    : {
                          rttMs: 40,
                          throughputKbps: 10240,
                          cpuSlowdownMultiplier: 1
                      }
            }
        },
        assert: {
            assertions: {
                ...sharedAssertions,
                ...performanceAssertions
            }
        },
        upload: {
            // Use temporary public storage for reports (free, no setup required)
            target: "temporary-public-storage"
        }
    }
};
