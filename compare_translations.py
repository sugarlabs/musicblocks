import polib
import json
import os

def compare_translations(po_file, json_file):
    po_entries = {entry.msgid: entry.msgstr for entry in polib.pofile(po_file)}
    
    with open(json_file, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    missing_in_json = set(po_entries.keys()) - set(json_data.keys())
    missing_in_po = set(json_data.keys()) - set(po_entries.keys())

    if missing_in_json:
        print(f"❌ Missing in JSON: {missing_in_json}")
    if missing_in_po:
        print(f"❌ Extra in JSON (not in .po): {missing_in_po}")
    if not missing_in_json and not missing_in_po:
        print(f"✅ {po_file} fully matches {json_file}")

# Compare all files
def compare_all_translations(po_dir, json_dir):
    for root, _, files in os.walk(po_dir):
        for file in files:
            if file.endswith(".po"):
                po_path = os.path.join(root, file)
                json_path = os.path.join(json_dir, file.replace(".po", ".json"))
                if os.path.exists(json_path):
                    compare_translations(po_path, json_path)
                else:
                    print(f"❌ No JSON file for {po_path}")

# Run comparison
compare_all_translations("./translations", "./locales")
