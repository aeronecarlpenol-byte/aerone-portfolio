with open('index.html', 'rb') as f:
    raw = f.read()

# The triple-encoded en dash sequence (bytes):
# c3 83 c2 a2  c3 a2 c2 82 c2 ac  c3 a2 c2 80 c2 9c
triple_en_dash = bytes([0xc3, 0x83, 0xc2, 0xa2, 0xc3, 0xa2, 0xc2, 0x82, 0xc2, 0xac, 0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x9c])
en_dash_utf8 = '\u2013'.encode('utf-8')  # e2 80 93

print("Occurrences to fix:", raw.count(triple_en_dash))
raw2 = raw.replace(triple_en_dash, en_dash_utf8)

with open('index.html', 'wb') as f:
    f.write(raw2)
print("Done")
