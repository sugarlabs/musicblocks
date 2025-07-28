"""
This script converts GNU gettext .po translation files into JSON format.
It extracts only `msgid` and `msgstr` pairs, skipping metadata and comments,
and writes them to language-specific .json files for use in localization.

Usage:
- Place .po files inside a directory (e.g., ./po)
- The script will convert all .po files in that directory into .json
  and save them to the specified output directory (e.g., ./locales)
"""

import os
import json
import re

def convert_po_to_json(po_file, output_dir):
    """Convert a .po file to .json reading only msgid and msgstr lines."""

    json_data = {}
    current_msgid = None
    current_msgstr = None

    with open(po_file, "r", encoding="utf-8") as f:
        for line in f:
            # Ignore all lines except those with msgid or msgstr
            line = line.strip()
            if line.startswith("msgid"):
                current_msgid = re.findall(r'"(.*)"', line)[0]
            elif line.startswith("msgstr"):
                current_msgstr = re.findall(r'"(.*)"', line)[0]
                # Save the pair if msgid is present
                if current_msgid is not None:
                    json_data[current_msgid] = current_msgstr or current_msgid
                    current_msgid = None  # Reset for the next pair

    # Extract language code (e.g., 'fr' from 'fr.po')
    lang_code = os.path.splitext(os.path.basename(po_file))[0]
    output_path = os.path.join(output_dir, f"{lang_code}.json")

    os.makedirs(output_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Converted {po_file} → {output_path}")

def convert_all_po_files(po_dir, output_dir):
    """Convert all .po files in the given directory to .json format."""
    for root, _, files in os.walk(po_dir):
        for file in files:
            if file.endswith(".po"):
                convert_po_to_json(os.path.join(root, file), output_dir)

convert_all_po_files("./po", "./locales")
