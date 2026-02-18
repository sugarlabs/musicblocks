"""Add Meter Beginner test"""
import json, re
print("Adding Meter palette (Beginner)...")
with open(r'examples\test-suite.html', 'r', encoding='utf-8') as f: content = f.read()
match = re.search(r'<div class="code">(\[\[.*?\]\])</div>', content, re.DOTALL)
blocks = json.loads(match.group(1))
next_id = max([b[0] for b in blocks if isinstance(b[0], int)]) + 1
last_nameddo = max([b[0] for b in blocks if isinstance(b[1], list) and b[1][0] == "nameddo"])

new_blocks = [
    [next_id, ["action", {"collapsed": True}], 1700, 90, [None, next_id+1, next_id+2, None]],
    [next_id+1, ["text", {"value": "Meter palette (Beginner)"}], 1833, 99, [next_id]],
    [next_id+2, "hidden", 1714, 131, [next_id, next_id+3]],
    [next_id+3, ["newnote", {"collapsed": False}], 1714, 131, [next_id+2, next_id+4, next_id+7, next_id+11]],
    [next_id+4, "divide", 1816, 131, [next_id+3, next_id+5, next_id+6]],
    [next_id+5, ["number", {"value": 1}], 1902, 131, [next_id+4]],
    [next_id+6, ["number", {"value": 4}], 1902, 163, [next_id+4]],
    [next_id+7, "vspace", 1728, 163, [next_id+3, next_id+8]],
    [next_id+8, "pitch", 1728, 195, [next_id+7, next_id+9, next_id+10, None]],
    [next_id+9, ["solfege", {"value": "sol"}], 1802, 195, [next_id+8]],
    [next_id+10, ["number", {"value": 4}], 1802, 227, [next_id+8]],
    [next_id+11, "hidden", 1714, 320, [next_id+3, next_id+12]],
    [next_id+12, "doArg", 1714, 320, [next_id+11, next_id+13, next_id+14, next_id+15, None]],
    [next_id+13, ["text", {"value": "compare test"}], 1816, 320, [next_id+12]],
    [next_id+14, ["number", {"value": 1}], 1731, 352, [next_id+12]],
    [next_id+15, ["beatvalue", {"value": 1}], 1731, 383, [next_id+12]],
    [next_id+16, ["nameddo", {"value": "Meter palette (Beginner)"}], 334, 610, [last_nameddo, 190]]
]

for block in blocks:
    if block[0] == last_nameddo: block[4] = [block[4][0], next_id+16]
    elif block[0] == 190: block[4] = [next_id+16, block[4][1]]
blocks.extend(new_blocks)
with open(r'examples\test-suite.html', 'w', encoding='utf-8') as f:
    f.write(content.replace(match.group(1), json.dumps(blocks, separators=(',', ':'))))
print(f"✅ Added! Total: {len(blocks)}")
