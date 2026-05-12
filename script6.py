with open('js/widgets/__tests__/phrasemaker.test.js', 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """                    {
                        style: { backgroundColor: "black" },
                        getAttribute: jest.fn(() => "white")
                    }"""

new_str = """                    {
                        classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn(cls => cls === "pm-black-cell") },
                        style: { backgroundColor: "black" },
                        getAttribute: jest.fn(() => "white")
                    }"""

text = text.replace(old_str, new_str)

# For makeClickable:
old_str2 = """        const mockCell = {
                classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn(() => false) },
                style: {},
                getAttribute: jest.fn(() => "white"),
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };"""

new_str2 = """        const mockCell = {
                classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn(cls => cls === "pm-black-cell") },
                style: {},
                getAttribute: jest.fn(() => "white"),
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };"""

text = text.replace(old_str2, new_str2)

with open('js/widgets/__tests__/phrasemaker.test.js', 'w', encoding='utf-8') as f:
    f.write(text)
