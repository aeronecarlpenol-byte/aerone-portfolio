with open('index.html', 'rb') as f:
    raw = f.read()

# Print the bytes around "Pe" to see what's actually there
idx = raw.find(b'Pe')
while idx != -1 and idx < len(raw) - 10:
    chunk = raw[idx:idx+8]
    print(f'Offset {idx}: {chunk.hex()} -> {chunk}')
    idx = raw.find(b'Pe', idx + 1)
    if idx > 500:  # just show first few
        break
