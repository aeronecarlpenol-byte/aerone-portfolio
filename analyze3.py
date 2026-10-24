import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'rb') as f:
    raw = f.read()

import re
# Find all non-ASCII runs and show them
matches = list(re.finditer(b'[\x80-\xff]+', raw))
print(f"Total non-ASCII runs: {len(matches)}")

from collections import Counter
seqs = Counter()
for m in matches:
    seqs[m.group()] += 1

print("\nUnique sequences:")
for seq, count in seqs.most_common():
    try:
        decoded = seq.decode('utf-8')
        print(f"  {count}x: {repr(decoded)}")
    except:
        print(f"  {count}x: RAW {seq.hex()}")
