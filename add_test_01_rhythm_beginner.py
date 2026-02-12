"""Add Rhythm Beginner test to test-suite.html"""
import json
import re

print("Adding Rhythm palette (Beginner) test...")

# Read HTML
with open(r'examples\test-suite.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract JSON
match = re.search(r'<div class="code">(\[\[.*?\]\])</div>', content, re.DOTALL)
if not match:
    print("ERROR: Could not find JSON")
    exit(1)

blocks = json.loads(match.group(1))
next_id = max([b[0] for b in blocks if isinstance(b[0], int)]) + 1

print(f"Current blocks: {len(blocks)}, Next ID: {next_id}")

# Create test blocks
new_blocks = [
    # Action block
    [next_id, ["action", {"collapsed": True}], 1400, 90, [None, next_id+1, next_id+2, None]],
    [next_id+1, ["text", {"value": "Rhythm palette (Beginner)"}], 1533, 99, [next_id]],
    [next_id+2, "hidden", 1414, 131, [next_id, next_id+3]],
    
    # Note block
    [next_id+3, ["newnote", {"collapsed": False}], 1414, 131, [next_id+2, next_id+4, next_id+7, next_id+11]],
    [next_id+4, "divide", 1516, 131, [next_id+3, next_id+5, next_id+6]],
    [next_id+5, ["number", {"value": 1}], 1602, 131, [next_id+4]],
    [next_id+6, ["number", {"value": 4}], 1602, 163, [next_id+4]],
    [next_id+7, "vspace", 1428, 163, [next_id+3, next_id+8]],
    [next_id+8, "pitch", 1428, 195, [next_id+7, next_id+9, next_id+10, None]],
    [next_id+9, ["solfege", {"value": "sol"}], 1502, 195, [next_id+8]],
    [next_id+10, ["number", {"value": 4}], 1502, 227, [next_id+8]],
    [next_id+11, "hidden", 1414, 320, [next_id+3, next_id+12]],
    
    # Compare test
    [next_id+12, "doArg", 1414, 320, [next_id+11, next_id+13, next_id+14, next_id+15, None]],
    [next_id+13, ["text", {"value": "compare test"}], 1516, 320, [next_id+12]],
    [next_id+14, ["number", {"value": 0.25}], 1431, 352, [next_id+12]],
    [next_id+15, ["mynotevalue", {"value": 0.25}], 1431, 383, [next_id+12]],
    
    # Nameddo to call this test
    [next_id+16, ["nameddo", {"value": "Rhythm palette (Beginner)"}], 334, 546, [116, 190]]
]

# Update connections: Graphics Tests (116) -> new test -> showHeap (190)
for block in blocks:
    if block[0] == 116:  # Graphics Tests
        block[4] = [block[4][0], next_id+16]
    elif block[0] == 190:  # showHeap
        block[4] = [next_id+16, block[4][1]]

blocks.extend(new_blocks)

# Save
new_json = json.dumps(blocks, separators=(',', ':'))
new_content = content.replace(match.group(1), new_json)

with open(r'examples\test-suite.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"✅ Added Rhythm Beginner test! Total blocks: {len(blocks)}")
