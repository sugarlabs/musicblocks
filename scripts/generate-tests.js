const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

/**
 * Extracts exported function/variable names from a JS source file using AST parsing.
 * @param {string} code - source code string
 * @returns {string[]} list of exported names
 */
function extractExports(code) {
    const exportedNames = [];
    let ast;
    try {
        ast = parser.parse(code, { sourceType: "module", errorRecovery: true });
    } catch (e) {
        // fallback: try as script
        ast = parser.parse(code, { sourceType: "script", errorRecovery: true });
    }

    ast.program.body.forEach(node => {
        if (
            node.type === "ExpressionStatement" &&
            node.expression.type === "AssignmentExpression"
        ) {
            const left = node.expression.left;
            if (
                left.type === "MemberExpression" &&
                left.object.name === "module" &&
                left.property.name === "exports"
            ) {
                if (node.expression.right.type === "ObjectExpression") {
                    node.expression.right.properties.forEach(prop => {
                        if (prop.key && prop.key.name) {
                            exportedNames.push(prop.key.name);
                        }
                    });
                }
            }
        }
    });

    return exportedNames;
}

/**
 * Generates a Jest test stub for the given source file.
 * @param {string} filePath - path to the source file
 */
function generateTest(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const code = fs.readFileSync(filePath, "utf8");
    const exportedNames = extractExports(code);
    const parsed = path.parse(filePath);
    const testDir = path.join(parsed.dir, "__tests__");
    const testPath = path.join(testDir, `${parsed.name}.test.js`);

    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const relPath = path.relative(testDir, filePath).replace(/\\/g, "/");

    const stubs = exportedNames.length
        ? exportedNames
              .map(
                  name => `
    describe("${name}", () => {
        test("should be defined", () => {
            expect(typeof exports.${name}).not.toBe("undefined");
        });
    });`
              )
              .join("\n")
        : `
    test("module loads without errors", () => {
        expect(exports).toBeDefined();
    });`;

    const content = `const exports = require("${relPath}");

describe("${parsed.name}", () => {${stubs}
});
`;

    fs.writeFileSync(testPath, content, "utf8");
    console.log(`Test stub generated at: ${testPath}`);
    console.log("Review and refine the generated tests before committing.");
}

const targetFile = process.argv[2];
if (targetFile) {
    generateTest(targetFile);
} else {
    console.log("Usage: node scripts/generate-tests.js <path-to-source-file>");
    console.log("Example: node scripts/generate-tests.js js/utils/mathutils.js");
}
