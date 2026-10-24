with open('index.html', 'rb') as f:
    raw = f.read()

import re

# Find all non-ASCII byte sequences
matches = list(re.finditer(b'[\x80-\xff]+', raw))
print(f"Total non-ASCII runs: {len(matches)}")

# Group by content  
from collections import Counter
seqs = Counter()
for m in matches:
    seqs[m.group()] += 1

print("Top sequences:")
for seq, count in seqs.most_common(20):
    try:
        decoded = seq.decode('utf-8')
        print(f"  {count}x UTF-8: {repr(decoded)}")
    except:
        try:
            decoded = seq.decode('latin-1')
            print(f"  {count}x latin-1: {repr(decoded)} | raw: {seq.hex()}")
        except:
            print(f"  {count}x undecodable: {seq.hex()}")
