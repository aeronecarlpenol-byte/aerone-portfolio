with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

# Replace all known broken sequences with correct chars
fixes = [
    ('\u00e2\u0080\u0093', '\u2013'),   # en dash
    ('\u00e2\u0080\u0094', '\u2014'),   # em dash
    ('\u00e2\u0080\u0099', '\u2019'),   # right single quote
    ('\u00e2\u0080\u009c', '\u201c'),   # left double quote
    ('\u00e2\u0080\u009d', '\u201d'),   # right double quote
    ('\u00c2\u00b7', '\u00b7'),         # middle dot
    ('\u00c3\u00b1', '\u00f1'),         # n-tilde
    ('\u00c3\u0091', '\u00d1'),         # N-tilde
    # replacement char sequences for n-tilde
    ('\ufffd\ufffd', ''),
    # Direct bad latin text patterns still present
    ('Pe\ufffdol', 'Pe\u00f1ol'),
    ('PE\ufffdOL', 'PE\u00d1OL'),
    ('A. PE\ufffdOL', 'A. PE\u00d1OL'),
]

for bad, good in fixes:
    text = text.replace(bad, good)

# Final targeted fixes for any remaining literal broken text
import re
text = re.sub(r'Pe.ol', lambda m: 'Peñol' if 'Pe' in m.group() else m.group(), text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done - checking remaining issues:')
for i, line in enumerate(text.split('\n'), 1):
    if '\ufffd' in line or 'Pe ol' in line:
        print(f'  Line {i}: {repr(line[:100])}')
