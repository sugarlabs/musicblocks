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
import sys
from typing import Dict

def parse_po_file(po_file: str) -> Dict[str, str]:
    """
    Parse a .po file and return a dict of {msgid: msgstr}.
    
    Args:
        po_file: Path to the .po file
        
    Returns:
        Dictionary mapping message IDs to translated strings
        
    Raises:
        FileNotFoundError: If the PO file doesn't exist
        UnicodeDecodeError: If the file encoding is invalid
        ValueError: If the PO file format is malformed
    """
    if not os.path.exists(po_file):
        raise FileNotFoundError(f"PO file not found: {po_file}")
    
    if not po_file.endswith('.po'):
        raise ValueError(f"Invalid file extension. Expected .po, got: {po_file}")
    
    data = {}
    current_msgid = None
    current_msgstr = None
    line_num = 0

    try:
        with open(po_file, "r", encoding="utf-8") as f:
            for line in f:
                line_num += 1
                line = line.strip()
                
                if line.startswith("msgid"):
                    matches = re.findall(r'"(.*)"', line)
                    if not matches:
                        print(f"⚠️  Warning: Malformed msgid at line {line_num} in {po_file}", file=sys.stderr)
                        continue
                    current_msgid = matches[0]
                    
                elif line.startswith("msgstr"):
                    matches = re.findall(r'"(.*)"', line)
                    if not matches:
                        print(f"⚠️  Warning: Malformed msgstr at line {line_num} in {po_file}", file=sys.stderr)
                        continue
                    current_msgstr = matches[0]
                    
                    if current_msgid is not None:
                        data[current_msgid] = current_msgstr or current_msgid
                        current_msgid = None
                        
    except UnicodeDecodeError as e:
        raise UnicodeDecodeError(
            e.encoding, e.object, e.start, e.end,
            f"Invalid encoding in {po_file}. Expected UTF-8."
        )
    except OSError as e:
        # Propagate file access and other OS-related errors unchanged
        raise
    except Exception as e:
        raise ValueError(f"Error parsing {po_file}: {str(e)}")
    
    if not data:
        print(f"⚠️  Warning: No translations found in {po_file}", file=sys.stderr)
    
    return data

def validate_json_output(json_path: str) -> bool:
    """
    Validate that the generated JSON file is properly formatted.
    
    Args:
        json_path: Path to the JSON file to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if not isinstance(data, dict):
            print(f"❌ Invalid JSON structure in {json_path}: Expected dict, got {type(data).__name__}", file=sys.stderr)
            return False
            
        if not data:
            print(f"⚠️  Warning: Empty JSON object in {json_path}", file=sys.stderr)
            
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON validation failed for {json_path}: {str(e)}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"❌ Error validating {json_path}: {str(e)}", file=sys.stderr)
        return False

def convert_po_to_json(po_file: str, output_dir: str) -> bool:
    """
    Convert a .po file to .json. Special case: ja.po + ja-kana.po -> merged ja.json.
    
    Args:
        po_file: Path to the .po file
        output_dir: Directory to write the JSON output
        
    Returns:
        True if conversion successful, False otherwise
    """
    try:
        lang_code = os.path.splitext(os.path.basename(po_file))[0]

        # Special handling for Japanese
        if lang_code in ["ja", "ja-kana"]:
            ja_file = os.path.join(os.path.dirname(po_file), "ja.po")
            kana_file = os.path.join(os.path.dirname(po_file), "ja-kana.po")

            if os.path.exists(ja_file) and os.path.exists(kana_file):
                try:
                    ja_dict = parse_po_file(ja_file)
                    kana_dict = parse_po_file(kana_file)

                    combined = {}
                    all_keys = set(ja_dict.keys()) | set(kana_dict.keys())
                    for key in all_keys:
                        combined[key] = {
                            "kanji": ja_dict.get(key, key),
                            "kana": kana_dict.get(key, key),
                        }

                    output_path = os.path.join(output_dir, "ja.json")
                    os.makedirs(output_dir, exist_ok=True)
                    
                    with open(output_path, "w", encoding="utf-8") as f:
                        json.dump(combined, f, indent=2, ensure_ascii=False)
                    
                    # Validate the output
                    if not validate_json_output(output_path):
                        return False
                        
                    print(f"✅ Combined ja.po + ja-kana.po → {output_path}")
                    return True
                    
                except Exception as e:
                    print(f"❌ Error processing Japanese files: {str(e)}", file=sys.stderr)
                    return False

        # Default for all other langs
        json_data = parse_po_file(po_file)
        output_path = os.path.join(output_dir, f"{lang_code}.json")
        os.makedirs(output_dir, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        # Validate the output
        if not validate_json_output(output_path):
            return False
            
        print(f"✅ Converted {po_file} → {output_path}")
        return True
        
    except FileNotFoundError as e:
        print(f"❌ File not found: {str(e)}", file=sys.stderr)
        return False
    except ValueError as e:
        print(f"❌ Invalid format: {str(e)}", file=sys.stderr)
        return False
    except PermissionError as e:
        print(f"❌ Permission denied: {str(e)}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"❌ Unexpected error converting {po_file}: {str(e)}", file=sys.stderr)
        return False

def convert_all_po_files(po_dir: str, output_dir: str) -> tuple[int, int]:
    """
    Convert all .po files in the given directory to .json format.
    
    Args:
        po_dir: Directory containing .po files
        output_dir: Directory to write JSON output
        
    Returns:
        Tuple of (success_count, failure_count)
    """
    if not os.path.exists(po_dir):
        print(f"❌ PO directory not found: {po_dir}", file=sys.stderr)
        return (0, 0)
        
    success_count = 0
    failure_count = 0
    
    for root, _, files in os.walk(po_dir):
        for file in files:
            if file.endswith(".po"):
                po_path = os.path.join(root, file)
                if convert_po_to_json(po_path, output_dir):
                    success_count += 1
                else:
                    failure_count += 1
                    
    return (success_count, failure_count)

# Main execution
if __name__ == "__main__":
    # Support command-line arguments for CI/CD
    if len(sys.argv) == 3:
        # Single file conversion: python convert_po_to_json.py <po_file> <output_dir>
        po_file = sys.argv[1]
        output_dir = sys.argv[2]
        
        success = convert_po_to_json(po_file, output_dir)
        sys.exit(0 if success else 1)
        
    elif len(sys.argv) == 1:
        # Batch conversion: python convert_po_to_json.py
        print("🔄 Converting all PO files...")
        success_count, failure_count = convert_all_po_files("./po", "./locales")
        
        print(f"\n📊 Conversion Summary:")
        print(f"   ✅ Success: {success_count}")
        print(f"   ❌ Failed: {failure_count}")
        
        sys.exit(0 if failure_count == 0 else 1)
        
    else:
        print("Usage:", file=sys.stderr)
        print("  Batch conversion:  python convert_po_to_json.py", file=sys.stderr)
        print("  Single file:       python convert_po_to_json.py <po_file> <output_dir>", file=sys.stderr)
        sys.exit(1)
