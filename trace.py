import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'rb') as f:
    raw = f.read()

import re

# The 4 occurrences of 'Ã¢â\x82¬â\x80\x9d'
# bytes: C3 A2 E2 82 AC E2 80 9D
seq1 = bytes([0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0x9D])
print(f"seq1 count: {raw.count(seq1)}")
print(f"seq1 decoded: {repr(seq1.decode('utf-8'))}")
# This is: Ã¢ + â€¬ + â€ = triple encoding of some char
# â€¬ = euro sign €? No...
# Let's decode step by step:
# seq1.decode('utf-8') = 'Ã¢' + chr(0x20AC) + chr(0x201D)
# 'Ã¢' is C3 A2 = latin-1 double-encoded 'â'
# So this is double-encoded: originally 'â€"' -> e2 80 93 (en dash)
# But we have e2 82 ac e2 80 9d = €" 
# Hmm, let me check: e2 82 ac = € (euro), e2 80 9d = " (right double quote)
# So the original intent might be: — (em dash) or – (en dash)?
# Let me look at context more carefully

idx = raw.find(seq1)
ctx_bytes = raw[max(0,idx-60):idx+len(seq1)+60]
print(f"context bytes: {ctx_bytes}")
print(f"context decoded: {repr(ctx_bytes.decode('utf-8', errors='replace'))}")

# The 1 occurrence of 'Ã\x83â\x80\x98' 
# bytes: C3 83 E2 80 98
seq2 = bytes([0xC3, 0x83, 0xE2, 0x80, 0x98])
print(f"\nseq2 count: {raw.count(seq2)}")
print(f"seq2 decoded: {repr(seq2.decode('utf-8'))}")
idx2 = raw.find(seq2)
ctx2 = raw[max(0,idx2-60):idx2+len(seq2)+60]
print(f"context decoded: {repr(ctx2.decode('utf-8', errors='replace'))}")
# C3 83 = Ã, E2 80 98 = '
# So this is "Ã'" which in latin-1 is Ã + ' where Ã = C3 = latin encoding start
# The original char was Ñ (U+00D1) which in UTF-8 is C3 91
# But here we have C3 83 E2 80 98 instead of C3 91
# C3 83 = Ã (double-encoded C3 = 195 in latin-1 = Ã)
# E2 80 98 = left single quote '
# This might be: Ñ was originally encoded as C3 91, then C3->Ã (C3 83), 91->0x91->?
# Not clear. But context is "PEÃ\x83â€˜OL" - should be "PEÑOL"
# So this Ã\x83â€˜ = Ñ  

# The 1 occurrence of 'Ã¢â\x80\xa0â\x80\x98'
# bytes: C3 A2 E2 80 A0 E2 80 98
seq3 = bytes([0xC3, 0xA2, 0xE2, 0x80, 0xA0, 0xE2, 0x80, 0x98])
print(f"\nseq3 count: {raw.count(seq3)}")
print(f"seq3 decoded: {repr(seq3.decode('utf-8'))}")
idx3 = raw.find(seq3)
ctx3 = raw[max(0,idx3-60):idx3+len(seq3)+60]
print(f"context decoded: {repr(ctx3.decode('utf-8', errors='replace'))}")
# C3 A2 = â, E2 80 A0 = †(dagger), E2 80 98 = '
# Context: "Back to top" - so this might be ↑ or ↖ or ↰ arrow
# â†˜ etc. The original was probably an arrow character like ↑
