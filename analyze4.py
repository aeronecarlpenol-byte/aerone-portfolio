import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'rb') as f:
    raw = f.read()

import re

# Focus on the smaller sequences
target_seqs = [
    bytes([0xC3, 0xA2, 0xE2, 0x80, 0x9D]),  # Ã¢â€¬â€
    bytes([0xC3, 0x83, 0xE2, 0x80, 0x98]),   # Ã‚â€˜
    bytes([0xC3, 0xA2, 0xE2, 0x80, 0xA0, 0xE2, 0x80, 0x98]),  # Ã¢â€ â€˜
]

# Let's search for these patterns more carefully
# First let's look at all non-ASCII matches that aren't valid UTF-8 chars we want
bad_runs = []
for m in re.finditer(b'[\x80-\xff]+', raw):
    seq = m.group()
    try:
        decoded = seq.decode('utf-8')
        # Good chars we want to keep
        good = ['\u2013', '·', 'ñ', '\ufeff', '\u2019', '\u2018', '\u201c', '\u201d']
        if any(decoded == g or all(c in decoded for c in decoded if ord(c) > 127) for g in good):
            pass
        # Check if it's purely good chars
        all_good = all(c in ''.join(good) or c in 'Ã¢â€¢Â\x90\x82\x80' for c in decoded)
    except:
        pass
    bad_runs.append((m.start(), seq))

# Show unique non-ASCII sequences with context, skipping the long repeating ones
from collections import Counter
seqs = Counter()
for pos, seq in bad_runs:
    seqs[seq] += 1

for seq, count in sorted(seqs.items(), key=lambda x: len(x[0])):
    if len(seq) < 50:  # skip the long bullet sequences
        try:
            decoded = seq.decode('utf-8')
            # Find first occurrence context
            idx = raw.find(seq)
            ctx = raw[max(0,idx-40):idx+len(seq)+40].decode('utf-8', errors='replace')
            print(f"{count}x {repr(decoded)}")
            print(f"  ctx: {repr(ctx)}")
        except:
            print(f"{count}x RAW: {seq.hex()}")
