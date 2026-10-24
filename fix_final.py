import sys, os
sys.stdout.reconfigure(encoding='utf-8')

files = ['index.html', 'pages/project-axiom.html', 'pages/project-solar.html']

for filepath in files:
    if not os.path.exists(filepath):
        print(f'Not found: {filepath}')
        continue

    with open(filepath, 'rb') as f:
        raw = f.read()

    original = raw

    # Fix 1: 4x in title - Peñol [seq] Electronics — should be en-dash –
    # bytes: c3 83 c2 a2 c3 a2 c2 82 c2 ac c3 a2 c2 80 c2 9d
    seq1 = bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x82, 0xC2, 0xAC, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x9D])
    n1 = raw.count(seq1)
    raw = raw.replace(seq1, '–'.encode('utf-8'))

    # Fix 2: 1x - PEÃ\x83â€˜OL -> PEÑOL
    # bytes: c3 83 c2 83 c3 a2 c2 80 c2 98
    seq2 = bytes([0xC3, 0x83, 0xC2, 0x83, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x98])
    n2 = raw.count(seq2)
    raw = raw.replace(seq2, 'Ñ'.encode('utf-8'))

    # Fix 3: 1x - "Back to top" arrow — likely ↑ (U+2191) or ↰ (U+21B0)
    # bytes: c3 83 c2 a2 c3 a2 c2 80 c2 a0 c3 a2 c2 80 c2 98
    # â†' = U+2191 UPWARDS ARROW (e2 86 91), but
    # decoded: Ã¢â€ â€˜ where â€  = U+2020 dagger, and â€˜ = U+2018
    # This is double-encoded. Let's see: original was probably ↑ (U+2191) 
    # which is e2 86 91, double encoded as: C3 A2 E2 86 91... but that doesn't match
    # Our bytes are: c3 83 c2 a2 c3 a2 c2 80 c2 a0 c3 a2 c2 80 c2 98
    # = Ã + â + † + ' 
    # Ã¢ = double-encoded â = C3 A2
    # â€  = U+2020, â€˜ = U+2018
    # So original was two chars? Or one?
    # Context: "Back to top [arrow]" - let's use ↑
    seq3 = bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0xA0, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0x98])
    n3 = raw.count(seq3)
    raw = raw.replace(seq3, '↑'.encode('utf-8'))

    # Fix 4: The long repeating sequences in HTML comments (section separators)
    # These are in <!-- --> comments, so they're invisible to users
    # bytes: c3 83 c2 a2 c3 a2 c2 80 c2 a2 c3 82 c2 90 (repeated)
    seq4 = bytes([0xC3, 0x83, 0xC2, 0xA2, 0xC3, 0xA2, 0xC2, 0x80, 0xC2, 0xA2, 0xC3, 0x82, 0xC2, 0x90])
    n4 = raw.count(seq4)
    raw = raw.replace(seq4, '─'.encode('utf-8'))  # box drawing horizontal line

    if raw != original:
        with open(filepath, 'wb') as f:
            f.write(raw)

    print(f'{filepath}:')
    print(f'  seq1 (em/en-dash in title): {n1} fixes')
    print(f'  seq2 (Ñ in PEÑOL): {n2} fixes')
    print(f'  seq3 (back-to-top arrow): {n3} fixes')
    print(f'  seq4 (comment decorators): {n4} fixes')

    # Verify
    with open(filepath, 'rb') as f:
        data = f.read()
    text = data.decode('utf-8', errors='replace')
    replacement_chars = text.count('\ufffd')
    remaining_ã = text.count('Ã')
    print(f'  replacement chars: {replacement_chars}')
    print(f'  remaining Ã: {remaining_ã}')
    print()

print('Done.')
