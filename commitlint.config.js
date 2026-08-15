// Commit message linting for Music Blocks.
// Enforces the Conventional Commits spec:  type(scope): subject
// e.g.  fix(palette): correct drag offset on touch devices
//       feat(blocks): add new pitch-quantize block
//
// Used by:
//   - .husky/commit-msg   (local, on every `git commit`)
//   - .github/workflows/ci.yml  (commitlint job, on every PR)

module.exports = {
    extends: ["@commitlint/config-conventional"],
    rules: {
        // Allowed commit types. Extend this list if the project needs more.
        "type-enum": [
            2,
            "always",
            [
                "build", // build system / dependencies (npm, webpack, etc.)
                "chore", // tooling / housekeeping, no src or test change
                "ci", // CI configuration and scripts
                "docs", // documentation only
                "feat", // a new feature
                "fix", // a bug fix
                "perf", // performance improvement
                "refactor", // neither fixes a bug nor adds a feature
                "revert", // reverts a previous commit
                "style", // formatting only (whitespace, semicolons, etc.)
                "test" // adding or correcting tests
            ]
        ],
        "type-case": [2, "always", "lower-case"],
        "type-empty": [2, "never"],
        "subject-empty": [2, "never"],
        "subject-full-stop": [2, "never", "."],
        // Keep the summary line readable in `git log --oneline`.
        "header-max-length": [2, "always", 100],
        "body-leading-blank": [2, "always"],
        "footer-leading-blank": [1, "always"]
    }
};
