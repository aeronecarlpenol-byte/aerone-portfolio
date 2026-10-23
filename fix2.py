with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

fixes = {
    '\u00e2\u0080\u0093': '\u2013',  # en dash –
    '\u00e2\u0080\u0094': '\u2014',  # em dash —
    '\u00e2\u0080\u0099': '\u2019',  # right single quote '
    '\u00e2\u0080\u009c': '\u201c',  # left double quote "
    '\u00e2\u0080\u009d': '\u201d',  # right double quote "
    '\u00c2\u00b7': '\u00b7',        # middle dot ·
    '\u00c3\u00b1': '\u00f1',        # ñ
    '\u00c3\u0091': '\u00d1',        # Ñ
}

for bad, good in fixes.items():
    text = text.replace(bad, good)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

remaining = [l for l in text.split('\n') if '\u00e2' in l or ('\u00c2' in l and '\u00b7' not in l)]
print('Lines still with issues:', len(remaining))
for l in remaining[:5]:
    print(repr(l[:120]))
