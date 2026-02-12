"""Add Rhythm Advanced test to test-suite.html"""
import json, re

print("Adding Rhythm palette (Advanced) test...")
with open(r'examples\test-suite.html', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<div class="code">(\[\[.*?\]\])</div>', content, re.DOTALL)
blocks = json.loads(match.group(1))
next_id = max([b[0] for b in blocks if isinstance(b[0], int)]) + 1

# Find the last nameddo block to insert after
last_nameddo = None
for block in blocks:
    if isinstance(block[1], list) and block[1][0] == "nameddo":
        last_nameddo = block[0]

new_blocks = [
    [next_id, ["action", {"collapsed": True}], 1550, 90, [None, next_id+1, next_id+2, None]],
    [next_id+1, ["text", {"value": "Rhythm palette (Advanced)"}], 1683, 99, [next_id]],
    [next_id+2, "hidden", 1564, 131, [next_id, next_id+3]],
    [next_id+3, ["newnote", {"collapsed": False}], 1564, 131, [next_id+2, next_id+4, next_id+7, next_id+11]],
    [next_id+4, "divide", 1666, 131, [next_id+3, next_id+5, next_id+6]],
    [next_id+5, ["number", {"value": 1}], 1752, 131, [next_id+4]],
    [next_id+6, ["number", {"value": 4}], 1752, 163, [next_id+4]],
    [next_id+7, "vspace", 1578, 163, [next_id+3, next_id+8]],
    [next_id+8, "pitch", 1578, 195, [next_id+7, next_id+9, next_id+10, None]],
    [next_id+9, ["solfege", {"value": "sol"}], 1652, 195, [next_id+8]],
    [next_id+10, ["number", {"value": 4}], 1652, 227, [next_id+8]],
    [next_id+11, "hidden", 1564, 320, [next_id+3, next_id+12]],
    [next_id+12, "doArg", 1564, 320, [next_id+11, next_id+13, next_id+14, next_id+15, None]],
    [next_id+13, ["text", {"value": "compare test"}], 1666, 320, [next_id+12]],
    [next_id+14, ["number", {"value": 0.125}], 1581, 352, [next_id+12]],
    [next_id+15, ["multiplybeatfactor", {"value": 0.125}], 1581, 383, [next_id+12]],
    [next_id+16, ["nameddo", {"value": "Rhythm palette (Advanced)"}], 334, 578, [last_nameddo, 190]]
]

for block in blocks:
    if block[0] == last_nameddo:
        block[4] = [block[4][0], next_id+16]
    elif block[0] == 190:
        block[4] = [next_id+16, block[4][1]]

blocks.extend(new_blocks)
new_content = content.replace(match.group(1), json.dumps(blocks, separators=(',', ':')))
with open(r'examples\test-suite.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"✅ Added! Total blocks: {len(blocks)}")
