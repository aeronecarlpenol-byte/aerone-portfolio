import re

with open('index.html', 'rb') as f:
    raw = f.read()

# These are triple-encoded sequences still remaining in the file.
# The sequence \xc3\x83\xc2\xa2\xc3\xa2\xc2\x82\xc2\xac\xc3\xa2\xc2\x80\xc2\x9c is triple-encoded en dash (–)
# Let's decode as UTF-8 first, then fix remaining mojibake

text = raw.decode('utf-8', errors='replace')

print("Before fixes:")
print("  â€" count:", text.count('â€"'))
print("  Ã¢â‚¬â€œ count:", text.count('Ã¢â‚¬â€œ'))
# Check what the problematic sequence decodes to
import binascii
seq = bytes([0xc3, 0x83, 0xc2, 0xa2, 0xc3, 0xa2, 0xc2, 0x82, 0xc2, 0xac, 0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x9c])
decoded = seq.decode('utf-8')
print("  decoded seq:", repr(decoded))
