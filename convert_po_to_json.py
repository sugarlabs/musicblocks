import polib
import os
import json

def preprocess_po_file(po_file):
    """Creates a temporary cleaned-up PO file with comments removed."""
    temp_file = po_file + ".tmp"

    with open(po_file, "r", encoding="utf-8") as f, open(temp_file, "w", encoding="utf-8") as temp:
        for line_number, line in enumerate(f, start=1):
            if '"' in line and not line.strip().startswith("#"):  # Check for unescaped double quotes
                stripped_line = line.strip()
                if stripped_line.count('"') % 2 != 0:  # Odd number of quotes = Unescaped issue
                    print(f"❌ Error in {po_file} (Line {line_number}): {stripped_line}")
                    return None  # Stop processing this file
            if not line.strip().startswith("#"):  # Ignore comment lines
                temp.write(line)

    return temp_file

def convert_po_to_json(po_file, output_dir):
    """Convert a .po file to .json while ignoring comments."""
    cleaned_po_file = preprocess_po_file(po_file)  # Remove comment lines
    if cleaned_po_file is None:
        return  # Skip this file due to errors

    try:
        po = polib.pofile(cleaned_po_file, wrap=True)  # Load the cleaned file
        os.remove(cleaned_po_file)  # Delete temp file after parsing
    except OSError as e:
        print(f"❌ Error in {po_file}: {e}")
        return  # Skip this file

    json_data = {entry.msgid: entry.msgstr.strip() or entry.msgid for entry in po}

    # Extract language code (e.g., 'fr' from 'fr.po')
    lang_code = os.path.splitext(os.path.basename(po_file))[0]
    output_path = os.path.join(output_dir, f"{lang_code}.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Converted {po_file} → {output_path}")

def convert_all_po_files(po_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    for root, _, files in os.walk(po_dir):
        for file in files:
            if file.endswith(".po"):
                convert_po_to_json(os.path.join(root, file), output_dir)

convert_all_po_files("./po", "./locales")
