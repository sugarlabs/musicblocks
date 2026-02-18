"""
Simple, safe script to add ONE test at a time to test-suite.html
Run this script multiple times, it will add the next test each time.
"""
import json
import re

# Define all 14 tests
TESTS = [
    ("Rhythm palette (Beginner)", "mynotevalue", 0.25),
    ("Rhythm palette (Advanced)", "multiplybeatfactor", 0.125),
    ("Meter palette (Beginner)", "beatvalue", 1),
    ("Meter palette (Advanced)", "bpmfactor", 90),
    ("Pitch palette (Beginner)", "mypitch", 7),
    ("Pitch palette (Advanced)", "number2pitch", "G"),
    ("Intervals palette (Beginner)", "steppitch", 9),
    ("Intervals palette (Advanced)", "deltapitch2", -1),
    ("Tone palette (Beginner)", "settimbre", "guitar"),
    ("Tone palette (Advanced)", "dis", 40),
    ("Ornament palette (Beginner)", "neighbor2", 4),
    ("Ornament palette (Advanced)", "newslur", 4),
    ("Drum palette (Beginner)", "playdrum", "kick drum"),
    ("Drum palette (Advanced)", "setdrum", "snare drum"),
]

def add_next_test():
    # Read file
    with open(r'examples\test-suite.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JSON
    match = re.search(r'<div class="code">(\[\[.*?\]\])</div>', content, re.DOTALL)
    if not match:
        print("❌ ERROR: Could not find JSON in HTML")
        return False
    
    blocks = json.loads(match.group(1))
    
    # Find which tests already exist
    existing_tests = set()
    for block in blocks:
        if isinstance(block[1], list) and block[1][0] == "nameddo":
            if "palette" in block[1][1].get("value", ""):
                existing_tests.add(block[1][1]["value"])
    
    # Find next test to add
    next_test = None
    for test_name, block_name, expected_value in TESTS:
        if test_name not in existing_tests:
            next_test = (test_name, block_name, expected_value)
            break
    
    if not next_test:
        print("✅ All 14 tests already added!")
        return True
    
    test_name, block_name, expected_value = next_test
    print(f"\n📝 Adding test {len(existing_tests) + 1}/14: {test_name}")
    
    # Get next ID
    next_id = max([b[0] for b in blocks if isinstance(b[0], int)]) + 1
    x_pos = 1400 + (len(existing_tests) * 150)
    
    # Create new blocks
    new_blocks = [
        # Action
        [next_id, ["action", {"collapsed": True}], x_pos, 90, [None, next_id+1, next_id+2, None]],
        [next_id+1, ["text", {"value": test_name}], x_pos+133, 99, [next_id]],
        [next_id+2, "hidden", x_pos+14, 131, [next_id, next_id+3]],
        
        # Note
        [next_id+3, ["newnote", {"collapsed": False}], x_pos+14, 131, [next_id+2, next_id+4, next_id+7, next_id+11]],
        [next_id+4, "divide", x_pos+116, 131, [next_id+3, next_id+5, next_id+6]],
        [next_id+5, ["number", {"value": 1}], x_pos+202, 131, [next_id+4]],
        [next_id+6, ["number", {"value": 4}], x_pos+202, 163, [next_id+4]],
        [next_id+7, "vspace", x_pos+28, 163, [next_id+3, next_id+8]],
        [next_id+8, "pitch", x_pos+28, 195, [next_id+7, next_id+9, next_id+10, None]],
        [next_id+9, ["solfege", {"value": "sol"}], x_pos+102, 195, [next_id+8]],
        [next_id+10, ["number", {"value": 4}], x_pos+102, 227, [next_id+8]],
        [next_id+11, "hidden", x_pos+14, 320, [next_id+3, next_id+12]],
        
        # Compare test
        [next_id+12, "doArg", x_pos+14, 320, [next_id+11, next_id+13, next_id+14, next_id+15, None]],
        [next_id+13, ["text", {"value": "compare test"}], x_pos+116, 320, [next_id+12]],
    ]
    
    # Add expected and actual value blocks
    if isinstance(expected_value, str):
        new_blocks.append([next_id+14, ["text", {"value": expected_value}], x_pos+31, 352, [next_id+12]])
        new_blocks.append([next_id+15, [block_name, {"value": expected_value}], x_pos+31, 383, [next_id+12]])
    else:
        new_blocks.append([next_id+14, ["number", {"value": expected_value}], x_pos+31, 352, [next_id+12]])
        new_blocks.append([next_id+15, [block_name, {"value": expected_value}], x_pos+31, 383, [next_id+12]])
    
    # Find last nameddo and showHeap
    last_nameddo = None
    for block in blocks:
        if isinstance(block[1], list) and block[1][0] == "nameddo":
            if "palette" in block[1][1].get("value", ""):
                last_nameddo = block[0]
    
    if last_nameddo is None:
        # First test - connect after Graphics Tests (116)
        last_nameddo = 116
    
    # Create nameddo block
    y_pos = 546 + (len(existing_tests) * 32)
    new_blocks.append([next_id+16, ["nameddo", {"value": test_name}], 334, y_pos, [last_nameddo, 190]])
    
    # Update connections
    for block in blocks:
        if block[0] == last_nameddo:
            block[4] = [block[4][0], next_id+16]
        elif block[0] == 190:  # showHeap
            block[4] = [next_id+16, block[4][1]]
    
    # Add new blocks
    blocks.extend(new_blocks)
    
    # Save
    new_json = json.dumps(blocks, separators=(',', ':'))
    new_content = content.replace(match.group(1), new_json)
    
    with open(r'examples\test-suite.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ SUCCESS! Added {test_name}")
    print(f"   Total blocks: {len(blocks)}")
    print(f"   Tests added: {len(existing_tests) + 1}/14")
    print(f"\n💡 Run this script again to add the next test")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("MUSIC BLOCKS TEST ADDITION (ONE AT A TIME)")
    print("=" * 60)
    add_next_test()
