import re

# Read raw bytes
with open('index.html', 'rb') as f:
    raw = f.read()

# The file is UTF-8 but ñ (U+00F1 = 0xC3 0xB1 in UTF-8) got corrupted.
# Find all the broken patterns and fix them at byte level.

# Pattern: "Pe" followed by one or two replacement-char bytes then "ol" or "OL"
# U+FFFD in UTF-8 = 0xEF 0xBF 0xBD
fffd = bytes([0xEF, 0xBF, 0xBD])
n_tilde_lower = bytes([0xC3, 0xB1])  # ñ in UTF-8
N_tilde_upper = bytes([0xC3, 0x91])  # Ñ in UTF-8

# Replace Pe<fffd>ol -> Peñol
raw = raw.replace(b'Pe' + fffd + b'ol', b'Pe\xc3\xb1ol')
raw = raw.replace(b'Pe' + fffd + fffd + b'ol', b'Pe\xc3\xb1ol')

# Replace PE<fffd>OL -> PEÑOL  
raw = raw.replace(b'PE' + fffd + b'OL', b'PE\xc3\x91OL')
raw = raw.replace(b'PE' + fffd + fffd + b'OL', b'PE\xc3\x91OL')

# Replace A. PE<fffd>OL -> A. PEÑOL
raw = raw.replace(b'A. PE' + fffd + b'OL', b'A. PE\xc3\x91OL')

with open('index.html', 'wb') as f:
    f.write(raw)

# Verify
with open('index.html', encoding='utf-8') as f:
    text = f.read()

for check in ['Peñol', 'PEÑOL', 'A. PEÑOL']:
    print(f'{check}: {text.count(check)} occurrences')
