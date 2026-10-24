import os

def fix_encoding(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()

    text = raw.decode('latin-1')

    replacements = [
        ('â€"', '\u2013'),   # en dash –
        ('â€™', '\u2019'),   # right single quote '
        ('â€œ', '\u201c'),   # left double quote "
        ('â€\x9d', '\u201d'),# right double quote "
        ('â€', '\u201c'),    # fallback left double quote
        ('Â·', '\u00b7'),    # middle dot ·
        ('Ã±', '\u00f1'),    # ñ
        ('Ã\x91', '\u00d1'), # Ñ
        ('\x00ef\x00bf\x00bd', ''),  # replacement chars
    ]

    for bad, good in replacements:
        text = text.replace(bad, good)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'Fixed: {filepath}')

files = [
    'index.html',
    'pages/project-axiom.html',
    'pages/project-solar.html',
]

for f in files:
    if os.path.exists(f):
        fix_encoding(f)
    else:
        print(f'Not found: {f}')

print('done')
