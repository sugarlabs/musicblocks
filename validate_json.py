import json
import os

def validate_json(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".json"):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        json.load(f)  # Try parsing
                    print(f"✅ {file} is valid JSON")
                except json.JSONDecodeError as e:
                    print(f"❌ ERROR in {file}: {e}")

# Run validation
validate_json("./locales")
