with open('index.html', 'rb') as f:
    raw = f.read()

import re

# Find all non-ASCII byte sequences and show their context  
matches = list(re.finditer(b'[\x80-\xff]+', raw))

for m in matches:
    seq = m.group()
    pos = m.start()
    context = raw[max(0, pos-30):pos+len(seq)+30]
    try:
        decoded_seq = seq.decode('utf-8')
        decoded_ctx = context.decode('utf-8', errors='replace')
        print(f"Pos {pos}: seq={repr(decoded_seq)} ctx={repr(decoded_ctx)}")
    except:
        print(f"Pos {pos}: raw={seq.hex()} ctx={repr(context)}")
