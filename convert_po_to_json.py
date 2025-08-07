# Copyright (c) 2025 Walter Bender
# Copyright (c) 2025 Aman Chadha, DMP'25
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the The GNU Affero General Public
# License as published by the Free Software Foundation; either
# version 3 of the License, or (at your option) any later version.
#
# You should have received a copy of the GNU Affero General Public
# License along with this library; if not, write to the Free Software
# Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
#
# Note: This script converts .po translation files into JSON format,
# following the i18n infrastructure used in Music Blocks. -- Aman Chadha, July 2025

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
