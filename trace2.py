import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', encoding='utf-8') as f:
    content = f.read()

# Find each problematic text occurrence
patterns = [
    'Ã¢â\x82¬â\x80\x9d',   # 4x in title
    'Ã\x83â\x80\x98',       # 1x in PEÃ...OL
    'Ã¢â\x80\xa0â\x80\x98', # 1x in Back to top
]

for p in patterns:
    idx = content.find(p)
    count = content.count(p)
    if idx >= 0:
        ctx = content[max(0,idx-50):idx+len(p)+50]
        print(f"{count}x {repr(p)}")
        print(f"  ctx: {repr(ctx)}")
        # Show the raw bytes of this sequence
        raw_seq = p.encode('utf-8')
        print(f"  raw bytes: {raw_seq.hex()}")
    else:
        print(f"0x {repr(p)} - NOT FOUND in text")

# Search more broadly for any 'Ã' in text
import re
found = [(m.start(), content[max(0,m.start()-20):m.start()+30]) for m in re.finditer('Ã', content)]
print(f"\nAll 'Ã' occurrences: {len(found)}")
for pos, ctx in found[:10]:
    print(f"  pos {pos}: {repr(ctx)}")
