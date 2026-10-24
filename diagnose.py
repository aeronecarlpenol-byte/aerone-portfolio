import os
import sys
import re

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def comprehensive_fix(filepath):
    if not os.path.exists(filepath):
        print(f'Not found: {filepath}')
        return

    with open(filepath, 'rb') as f:
        raw = f.read()

    # Known bad byte sequences -> correct UTF-8 bytes
    # triple-encoded ñ (n-tilde): C3 83 C2 B1
    byte_fixes = [
        (bytes([0xC3, 0x83, 0xC2, 0xB1]), 'n\u0303'.encode('utf-8')),  # won't use this
    ]

    # Actually let's approach differently:
    # The file is now valid UTF-8. Let's do text-level fixes.
    text = raw.decode('utf-8', errors='replace')
    
    original_text = text
    
    # Fix remaining mojibake (double-encoded sequences that survive)
    # These appear as multi-char sequences that look like Latin-1 read as UTF-8
    text_fixes = [
        # Double-encoded en-dash: Ã¢â‚¬â€œ should be em-dash
        # or â€" -> – etc. These should already be fixed.
        # Check for any remaining 'Ã' patterns
        ('Ã±', 'n\u0303'),    # won't use - this would break ñ 
    ]
    
    # What characters are currently wrong?
    # From analysis: Pe\ufffdol (replacement char) means ñ bytes are bad
    # \ufffd means the UTF-8 bytes are truly invalid/broken
    
    # Let me check specific replacement chars
    import re
    replacement_positions = [m.start() for m in re.finditer('\ufffd', text)]
    for pos in replacement_positions[:20]:
        print(f'Replacement char at text pos {pos}: context = {repr(text[max(0,pos-20):pos+20])}')
    
    print(f'\nTotal replacement chars: {len(replacement_positions)}')
    
    # Count en-dashes
    print(f'En-dashes (correct): {text.count(chr(0x2013))}')
    print(f'Philippines-Visayas (correct): {text.count("Philippines\u2013Visayas")}')

files = ['index.html', 'pages/project-axiom.html', 'pages/project-solar.html']
for f in files:
    print(f'\n=== {f} ===')
    comprehensive_fix(f)
