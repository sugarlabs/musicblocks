import os
import json
from googletrans import Translator
from bs4 import BeautifulSoup
import time

translator = Translator()

json_dir = './locales' 

base_language_map = {
    "quz": "es.json",  
    "ayc": "es.json",  
    "gug": "es.json",  
    "bn": "hi.json",   
    "ne": "hi.json",   
    "pa": "hi.json",   
    "ht": "fr.json",   
    "wo": "fr.json",   
    "ln": "fr.json",   
    "pt_br": "pt.json", 
    "pt_ao": "pt.json", 
    "so": "ar.json",   
    "ha": "ar.json",   
    "ps": "ar.json",   
    "fa": "ar.json",   
    "zh_cn": "zh-cn.json", 
    "zh_tw": "zh-tw.json" 
}

source_language_map = {
    "quz": "es",
    "ayc": "es",
    "gug": "es",
    "bn": "hi",
    "ne": "hi",
    "pa": "hi",
    "ht": "fr",
    "wo": "fr",
    "ln": "fr",
    "pt_br": "pt",
    "pt_ao": "pt",
    "so": "ar",
    "ha": "ar",
    "ps": "ar",
    "fa": "ar",
    "zh_cn": "zh-cn",
    "zh_tw": "zh-tw"
}


def get_base_file(target_lang):
    return os.path.join(json_dir, base_language_map.get(target_lang, 'en.json'))

print(f"Checking directory: {os.path.abspath(json_dir)}")
if not os.path.exists(json_dir):
    print(f"Directory does not exist: {json_dir}")
    exit()


def extract_text(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text() if soup.get_text().strip() else html


def rebuild_html(original_html, translated_text):
    soup = BeautifulSoup(original_html, "html.parser")
    if soup.string:
        soup.string.replace_with(translated_text)
    return str(soup)


def translate_with_backoff(text, source_lang, target_lang, max_retries=5):
    delay = 1
    for attempt in range(max_retries):
        try:
            translation = translator.translate(text, src=source_lang, dest=target_lang)
            if translation and hasattr(translation, 'text') and translation.text.strip():
                return translation.text
            print(f"Attempt {attempt + 1}: Translation failed for text: {text}")
        except Exception as e:
            print(f"Attempt {attempt + 1}: Error for text '{text}': {e}")
        time.sleep(delay)
        delay *= 2  
    print(f"Final attempt failed for: {text}")
    return text 


def create_new_language_file(target_lang):
    base_file = get_base_file(target_lang)
    source_lang = source_language_map.get(target_lang, 'en')
    print(f"Creating new file for language: {target_lang} using base file: {base_file}")
    try:
        with open(base_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading base file: {e}")
        return

    translated_data = {}
    total_keys = len(data.keys())
    failed_translations = []

    for idx, (key, value) in enumerate(data.items(), start=1):
        text_to_translate = value if value and value != key else key
        translation = translate_with_backoff(text_to_translate, source_lang, target_lang)
        print(f"Original: {text_to_translate} -> Translated: {translation}")  # Debug print
        if translation == text_to_translate:
            failed_translations.append(key)
        translated_data[key] = rebuild_html(text_to_translate, translation)
        progress = (idx / total_keys) * 100
        print(f"Progress: {progress:.2f}%")

    new_file_path = os.path.join(json_dir, f'{target_lang}.json')

    with open(new_file_path, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, indent=4, ensure_ascii=False)

    print(f"Created new language file: {new_file_path}")

    if failed_translations:
        print("\nFailed to translate the following keys:")
        for key in failed_translations:
            print(f"- {key}")
    else:
        print("\nAll keys were translated successfully!")


existing_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
print(f"Existing JSON files: {existing_files}")

if not existing_files:
    print("No JSON files found in the directory.")

language_codes = [f.split('.')[0] for f in existing_files]

print("Prompting for target language...")
target_language = input("Enter the target language code (e.g., 'it', 'ko'): ").replace("_", "-")

if f"{target_language}.json" not in existing_files:
    create_new_language_file(target_language)
