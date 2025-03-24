import os
import json
from googletrans import Translator
from bs4 import BeautifulSoup
import time

translator = Translator()

json_dir = './locales'

base_file = os.path.join(json_dir, 'en.json')

print(f"Checking directory: {os.path.abspath(json_dir)}")
if not os.path.exists(json_dir):
    print(f"Directory does not exist: {json_dir}")
    exit()

if not os.path.exists(base_file):
    print(f"Base file does not exist: {base_file}")
    exit()


def extract_text(html):

    soup = BeautifulSoup(html, "html.parser")
    
    return soup.get_text() if soup.get_text().strip() else html

def rebuild_html(original_html, translated_text):
   
    soup = BeautifulSoup(original_html, "html.parser")
    if soup.string:
        soup.string.replace_with(translated_text)
    return str(soup)


def translate_with_backoff(text, target_lang, max_retries=5):
    delay = 1  
    for attempt in range(max_retries):
        try:
            translation = translator.translate(text, src='en', dest=target_lang)
            if translation and hasattr(translation, 'text') and translation.text.strip():
                return translation.text
            print(f"Attempt {attempt + 1}: Translation failed for text: {text}")
        except Exception as e:
            print(f"Attempt {attempt + 1}: Error for text '{text}': {e}")
        time.sleep(delay)
        delay *= 2  
    return text  


def create_new_language_file(target_lang):
    print(f"Creating new file for language: {target_lang}")
    try:
        with open(base_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading base file: {e}")
        return

    # Translate all keys
    translated_data = {}
    total_keys = len(data.keys())
    failed_translations = []

    for idx, key in enumerate(data.keys(), start=1):
        text = extract_text(key)
        translation = translate_with_backoff(text, target_lang)
        if translation == text:
            failed_translations.append(key)
        translated_data[key] = rebuild_html(key, translation)
        print(f"Progress: {idx}/{total_keys} ({(idx / total_keys) * 100:.2f}%)")

   
    new_file_path = os.path.join(json_dir, f'{target_lang}.json')

    with open(new_file_path, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, indent=4, ensure_ascii=False)

    print(f"Created new language file: {new_file_path}")

    # Report failed translations
    if failed_translations:
        print("\nFailed to translate the following keys:")
        for key in failed_translations:
            print(f"- {key}")
    else:
        print("\nAll keys were translated successfully!")


def translate_missing(file_path, target_lang):
    print(f"Translating missing keys for {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    missing_keys = {
        key: value for key, value in data.items()
        if (not value or key == value or value == extract_text(key)) and key.strip() != ""
    }

    if not missing_keys:
        print(f"No missing translations in {file_path}")
        return

    total_keys = len(missing_keys)
    failed_translations = []

    for idx, key in enumerate(missing_keys.keys(), start=1):
        text = extract_text(key)
        translation = translate_with_backoff(text, target_lang)
        if translation == text:
            failed_translations.append(key)
        data[key] = rebuild_html(key, translation)
        print(f"Progress: {idx}/{total_keys} ({(idx / total_keys) * 100:.2f}%)")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"Updated missing translations in {file_path}")

  
    if failed_translations:
        print("\nFailed to translate the following keys:")
        for key in failed_translations:
            print(f"- {key}")
    else:
        print("\nAll missing keys were translated successfully!")


existing_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
print(f"Existing JSON files: {existing_files}")

if not existing_files:
    print("No JSON files found in the directory.")

language_codes = [f.split('.')[0] for f in existing_files]

print("Prompting for target language...")
target_language = input("Enter the target language code (e.g., 'it', 'ko'): ")

if f"{target_language}.json" not in existing_files:
    create_new_language_file(target_language)
else:
    file_path = os.path.join(json_dir, f"{target_language}.json")
    translate_missing(file_path, target_language)
