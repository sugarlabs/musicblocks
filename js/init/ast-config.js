// js/init/ast-config.js
// Loads the AST-to-blocks configuration JSON used by the JS export feature.
// Extracted from inline script in index.html for CSP compliance.
window.ast2blocklist_config_failed = false;
window.ast2blocklist_config_ready = fetch("js/js-export/ast2blocks.min.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load AST block config: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        window.ast2blocklist_config = data;
        return data;
    })
    .catch(() => {
        window.ast2blocklist_config_failed = true;
        return null;
    });
