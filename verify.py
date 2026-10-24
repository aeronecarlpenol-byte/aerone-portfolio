with open('index.html', encoding='utf-8') as f:
    t = f.read()

checks = ['Peñol', 'Philippines', 'Visayas', 'TUP', '\u2013']
for w in checks:
    print(repr(w), t.count(w))

print('mojibake check:')
bad = ['â€"', 'â€\u2122', 'â€']
for w in bad:
    print(repr(w), t.count(w))
