import os

files = ['index.html', 'pages/project-axiom.html', 'pages/project-solar.html']

triple_en_dash = bytes([0xc3, 0x83, 0xc2, 0xa2, 0xc3, 0xa2, 0xc2, 0x82, 0xc2, 0xac, 0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x9c])
en_dash_utf8 = '\u2013'.encode('utf-8')

for filepath in files:
    if not os.path.exists(filepath):
        print(f'Not found: {filepath}')
        continue
    with open(filepath, 'rb') as f:
        raw = f.read()
    count = raw.count(triple_en_dash)
    print(f'{filepath}: {count} triple en-dash remaining')
    raw = raw.replace(triple_en_dash, en_dash_utf8)
    with open(filepath, 'wb') as f:
        f.write(raw)
    
    with open(filepath, encoding='utf-8', errors='replace') as f:
        text = f.read()
    errors = text.count('\ufffd')
    print(f'  replacement chars after fix: {errors}')
    print(f'  en-dash count: {text.count(chr(0x2013))}')

print('All done')
