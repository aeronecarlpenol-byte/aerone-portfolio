with open('index.html', 'rb') as f:
    raw = f.read()

# Search for Philippines followed by non-ASCII
import re
matches = [(m.start(), raw[m.start():m.start()+40]) for m in re.finditer(b'Philippines', raw)]
for pos, chunk in matches[:20]:
    print(pos, repr(chunk))
