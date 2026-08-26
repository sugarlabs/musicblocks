#!/usr/bin/env python3
import re
import os
import json
import subprocess
from pathlib import Path
from collections import Counter

def parse_header_comments(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract exported
    exports = []
    for match in re.findall(r'/\*\s*exported\s*(.*?)\*/', content, re.DOTALL):
        exports.extend([e.strip() for e in re.split(r'[,\s]+', match) if e.strip()])

    # Extract global/globals combined
    globals_used = []
    for match in re.findall(r'/\*\s*globals?\s*(.*?)\*/', content, re.DOTALL):
        globals_used.extend([g.strip() for g in re.split(r'[,\s]+', match) if g.strip()])
    
    return exports, globals_used

def main():
    js_dir = 'js'
    module_data = {}
    symbol_to_module = {}
    symbol_usage = Counter()
    
    output_dir = Path("Docs/architecture")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    dot_output = output_dir / "dependency-graph.dot"
    svg_output = output_dir / "dependency-graph.svg"
    report_output = output_dir / "dependency-analysis-report.json"

    # 1. Map symbols to modules
    for root, dirs, files in os.walk(js_dir):
        if '__tests__' in root:
            continue
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                exports, globals_used = parse_header_comments(path)
                module_data[path] = {
                    'exports': exports,
                    'globals': globals_used,
                    'file': file
                }
                for e in exports:
                    symbol_to_module[e] = path

    # 2. Build dependency graph
    dependencies = []
    for path, data in module_data.items():
        for g in data['globals']:
            if g in symbol_to_module:
                target = symbol_to_module[g]
                if target != path:
                    dependencies.append((path, target, g))
                    symbol_usage[g] += 1

    # 3. Generate DOT file
    with open(dot_output, 'w') as f:
        f.write('digraph G {\n')
        f.write('  rankdir=LR;\n')
        f.write('  overlap=false;\n')
        f.write('  splines=true;\n')
        f.write('  concentrate=true;\n')
        f.write('\n')
        f.write('  node [shape=box, style=filled, fillcolor=lightyellow, fontsize=10];\n')
        f.write('  edge [arrowsize=0.6, fontsize=8];\n')
        f.write('\n')
        for path, data in module_data.items():
            node_id = f'"{path}"'
            label = data['file']
            f.write(f'  {node_id} [label="{label}"];\n')
        
        for source, target, symbol in dependencies:
            f.write(f'  "{source}" -> "{target}" [label="{symbol}"];\n')
        
        f.write('}\n')

    # 4. Generate SVG if Graphviz is installed
    try:
        subprocess.run(['dot', '-Tsvg', str(dot_output), '-o', str(svg_output)], check=True)
        print(f"Generated {svg_output}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Note: Graphviz 'dot' command not found. SVG generation skipped.")

    print(f"Processed {len(module_data)} modules.")
    print(f"Found {len(dependencies)} implicit dependencies via globals.")
    print(f"Generated {dot_output}")

    # 5. Summary Report
    with open(report_output, 'w') as f:
        summary = {
            "modules_total": len(module_data),
            "dependencies_total": len(dependencies),
            "symbol_mapping_total": len(symbol_to_module),
            "top_exported_symbols": [sym for sym, count in symbol_usage.most_common(20)]
        }
        json.dump(summary, f, indent=2)
    print(f"Generated {report_output}")

if __name__ == "__main__":
    main()