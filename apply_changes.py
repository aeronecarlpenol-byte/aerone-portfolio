import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', encoding='utf-8') as f:
    content = f.read()

# Task 2: Update location to "Isabela, Philippines"
# Only standalone "Philippines" in location contexts, NOT in institution names

# 1. hero-location
old1 = '<p class="hero-location">Philippines</p>'
new1 = '<p class="hero-location">Isabela, Philippines</p>'
count1 = content.count(old1)
content = content.replace(old1, new1)

# 2. About sidebar <span>Philippines</span>  
# Need to find the specific one in About sidebar (near a location SVG icon)
# Let's find the one with the location pin SVG context
old2 = '<span>Philippines</span>'
new2 = '<span>Isabela, Philippines</span>'
count2 = content.count(old2)
content = content.replace(old2, new2)

# 3. contact-location
old3 = '<span class="contact-location">Philippines</span>'
new3 = '<span class="contact-location">Isabela, Philippines</span>'
count3 = content.count(old3)
content = content.replace(old3, new3)

print(f"Task 2 - Location updates:")
print(f"  hero-location: {count1} replaced")
print(f"  About sidebar <span>Philippines</span>: {count2} replaced")
print(f"  contact-location: {count3} replaced")

# Task 3: Add EasyEDA after SketchUp
old4 = '<span class="tag">SketchUp</span>'
new4 = '<span class="tag">SketchUp</span>\n          <span class="tag">EasyEDA</span>'
count4 = content.count(old4)
content = content.replace(old4, new4)
print(f"\nTask 3 - EasyEDA added: {count4} replacement(s)")

# Verify no institution names were touched
for check in ['Technological University of the Philippines–Visayas', 
              'The Philippines Artisan',
              'Isabela, Philippines–Visayas']:
    c = content.count(check)
    if 'Isabela' in check and c > 0:
        print(f"WARNING: found '{check}' - this is wrong!")
    elif 'Isabela' not in check:
        print(f"  Institution check '{check[:40]}...': {c} occurrences (ok)")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nindex.html saved.")
