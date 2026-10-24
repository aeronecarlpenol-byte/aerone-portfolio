import os
import re

def comprehensive_fix(filepath):
    if not os.path.exists(filepath):
        print(f'Not found: {filepath}')
        return

    with open(filepath, 'rb') as f:
        raw = f.read()

    # Known bad byte sequences -> correct UTF-8 bytes
    byte_fixes = [
        # ñ (U+00F1) in Peñol - currently triple-encoded: C3 83 C2 B1
        (bytes([0xC3, 0x83, 0xC2, 0xB1]), 'ñ'.encode('utf-8')),
        # – (en dash, U+2013) - triple encoded: C3 83 C2 A2 C3 A2 C2 80 C2 93
        (bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x93]), '–'.encode('utf-8')),
        # ' (right single quote, U+2019) - triple encoded: C3 83 C2 A2 C3 A2 C2 80 C2 99
        (bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x99]), '\u2019'.encode('utf-8')),
        # ' (left single quote, U+2018) - triple encoded: C3 83 C2 A2 C3 A2 C2 80 C2 98
        (bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x98]), '\u2018'.encode('utf-8')),
        # " (left double quote, U+201C) - triple encoded: C3 83 C2 A2 C3 A2 C2 80 C2 9C
        (bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x9C]), '\u201C'.encode('utf-8')),
        # " (right double quote, U+201D) - triple encoded: C3 83 C2 A2 C3 A2 C2 80 C2 9D
        (bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x9D]), '\u201D'.encode('utf-8')),
        # · (middle dot, U+00B7) - triple encoded: C3 83 C2 C2 B7
        (bytes([0xC3, 0x83, 0xC2, 0xC2, 0xB7]), '·'.encode('utf-8')),
        # The triple-encoded bullet/dot used in comment separators: â€¢ -> •
        # C3 83 C2 A2 C3 A2 C2 80 C2 A2 C3 82 C2 90 (triple-encoded •‐ style)
        (bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0xA2, 0xC3, 0x82, 0xC2, 0x90]), '─'.encode('utf-8')),
        # Also check for double-encoded ñ: C3 83 C2 B1 (handled above)
        # Double encoded en-dash: C3 A2 E2 80 93 
        (bytes([0xC3, 0xA2, 0xE2, 0x80, 0x93]), '–'.encode('utf-8')),
    ]

    original = raw
    for bad, good in byte_fixes:
        count = raw.count(bad)
        if count:
            print(f'  {filepath}: fixing {count}x {bad.hex()} -> {good.decode("utf-8")}')
        raw = raw.replace(bad, good)

    if raw != original:
        with open(filepath, 'wb') as f:
            f.write(raw)
        print(f'  Saved: {filepath}')
    else:
        print(f'  No byte changes: {filepath}')

    # Now verify utf-8 validity
    with open(filepath, 'rb') as f:
        data = f.read()
    try:
        text = data.decode('utf-8')
        # Count replacement chars (shouldn't be any now)
        errors = text.count('\ufffd')
        print(f'  UTF-8 ok, replacement chars: {errors}')
        
        # Check remaining mojibake patterns
        bad_patterns = ['â€"', 'â€™', 'â€œ', 'â€', 'Â·', 'Ã±', 'Ã\x91']
        for p in bad_patterns:
            c = text.count(p)
            if c:
                print(f'  WARNING: still has {c}x {repr(p)}')
    except UnicodeDecodeError as e:
        print(f'  ERROR: still not valid UTF-8: {e}')

files = ['index.html', 'pages/project-axiom.html', 'pages/project-solar.html']
for f in files:
    print(f'\nProcessing {f}...')
    comprehensive_fix(f)

print('\nDone.')
