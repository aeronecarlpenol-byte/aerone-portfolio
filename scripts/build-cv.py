"""Build the portfolio's two-page CV. Requires reportlab and Calibri fonts."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/cv/aerone-carl-penol-cv.pdf'
for name, file in [('CV', 'calibri.ttf'), ('CV-Bold', 'calibrib.ttf'), ('CV-Italic', 'calibrii.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / file)))
pdfmetrics.registerFontFamily('CV', normal='CV', bold='CV-Bold', italic='CV-Italic', boldItalic='CV-Bold')
W, H = A4
M = 40
WIDTH = W - M * 2
INK, BLUE, MUTED = '#172B3D', '#2163A0', '#506171'
c = canvas.Canvas(str(OUTPUT), pagesize=A4)
c.setTitle('Aerone Carl P. Peñol - Curriculum Vitae')
c.setAuthor('Aerone Carl P. Peñol')
y = H - M


def text(value, size=10, leading=14, color=INK, font='CV', gap=5):
    global y
    p = Paragraph(value, ParagraphStyle('cv', fontName=font, fontSize=size, leading=leading, textColor=color))
    _, height = p.wrap(WIDTH, H)
    if y - height < 48:
        raise ValueError('CV content exceeds the intended page area')
    p.drawOn(c, M, y - height)
    y -= height + gap


def section(title):
    global y
    y -= 7
    text(title.upper(), 9, 12, BLUE, 'CV-Bold', 4)
    c.setStrokeColorRGB(.68, .79, .88)
    c.setLineWidth(.6)
    c.line(M, y, W-M, y)
    y -= 10


def bullet(value):
    text('&#8226; ' + value, gap=4)


def footer(page):
    c.setFillColorRGB(.32, .38, .44)
    c.setFont('CV', 8)
    c.drawString(M, 28, 'Aerone Carl P. Peñol | Updated November 25, 2026')
    c.drawRightString(W-M, 28, f'{page} / 2')


text('Aerone Carl P. Peñol', 24, 28, INK, 'CV-Bold', 8)
text('Electronics Engineering Student | Programming &amp; Research', 11, 15, BLUE, 'CV-Bold', 5)
text('Isabela, Philippines  |  09076858027  |  <link href="mailto:aeronecarlpenol@gmail.com" color="#2163A0">aeronecarlpenol@gmail.com</link>', 9, 12, gap=3)
text('<link href="https://aerone-carl.vercel.app/" color="#2163A0">aerone-carl.vercel.app</link>  |  <link href="https://github.com/aeronecarlpenol-byte" color="#2163A0">github.com/aeronecarlpenol-byte</link>', 9, 12, gap=3)
text('Open to internship opportunities', 9, 12, MUTED, gap=3)
section('Professional Summary')
text('Second-year Electronics Engineering student at TUP-Visayas, interested in how hardware and software work together. Developing Axiom Studia, a personal academic workspace, while exploring PCB design, programming, and research through coursework and independent projects. Also brings experience in publication layout and student leadership.')
section('Technical Skills')
for value in [
    '<b>Frontend:</b> HTML5, CSS3, JavaScript; responsive interfaces and UI/UX refinement',
    '<b>Backend &amp; local data:</b> Supabase, PostgreSQL, IndexedDB; workspace sync and browser recovery',
    '<b>Development:</b> GitHub, Vercel, PDF.js; automated checks and iterative debugging',
    '<b>AI-assisted tools:</b> ChatGPT, OpenAI Codex, Claude, Google Antigravity',
    '<b>Engineering &amp; design:</b> AutoCAD, SketchUp, EasyEDA',
    '<b>Additional learning:</b> Basic Python and Java',
]:
    text(value, gap=3)
section('Education')
text('Bachelor of Science in Electronics Engineering', font='CV-Bold', gap=2)
text('Technological University of the Philippines-Visayas | Expected graduation: 2029', 9.5, 13, MUTED, gap=7)
text('Senior High School Graduate', font='CV-Bold', gap=2)
text('Isabela National High School | 2024 | With High Honors', 9.5, 13, MUTED)
section('Publication Experience')
text('Junior Layout Artist | The Philippine Artisan - Visayas | 2025', font='CV-Bold', gap=4)
bullet('Contributed to the January-October 2025 tabloid, applying typography, spacing, and visual hierarchy.')
bullet('The publication earned COPRE recognition: Champion, Best Newspaper Layout; 3rd Place, Best News Page; and 5th Place, Best Filipino Page.')
text('Layout Artist | The Glazier | 2024', font='CV-Bold', gap=4)
bullet('Worked on school publication layouts as part of the team that earned 2nd Place at the Division Schools Press Conference (DSPC).')
section('Leadership Experience')
text('Auditor | Supreme Student Government | 2024', font='CV-Bold', gap=4)
bullet('Supported financial oversight and accountability within the student government organization.')
text('Supreme Pupil Government', font='CV-Bold', gap=3)
text('Vice President, 2017-2019 | Public Information Officer, 2016-2017 | Peace Officer, 2015-2016', 9.5, 13, gap=4)
text('Represented student interests, supported school communications, and helped maintain a positive school environment.')
footer(1)
c.showPage()
y = H-M
text('Aerone Carl P. Peñol', 15, 20, INK, 'CV-Bold', 2)
text('Projects &amp; Research', 10, 14, BLUE, gap=4)
section('Selected Projects')
text('Axiom Studia | Personal project | In development', 11, 15, INK, 'CV-Bold')
text('Designed and developed a web-based study workspace around my engineering coursework, using AI-assisted coding, review, and iterative testing.')
for value in [
    'Built a subject Workspace that brings PDF, video, link, and image resources beside an adjustable focus timer and study tasks, with fullscreen and floating timer modes.',
    'Refined resource folders, search, rename and move controls, calendar scheduling, grade tracking and goal planning, and student profile settings.',
    'Added study analytics for focus time, sessions, subject totals, and active-day streaks. Workspace records sync through Supabase with browser recovery; PDF files remain device-local in IndexedDB.',
]:
    bullet(value)
text('HTML / CSS / JavaScript | Supabase / PostgreSQL | IndexedDB | PDF.js', 9, 12, BLUE, gap=3)
text('<link href="https://axiomstudia.vercel.app/" color="#2163A0">axiomstudia.vercel.app</link>', 9, 12, gap=10)
text('Regulated Full-Wave Bridge 5V Power Supply | Coursework', 11, 15, INK, 'CV-Bold')
text('Designed my first EasyEDA PCB layout for Computer-Aided Design: an AC-to-5V DC supply using rectification, filtering, and voltage regulation.')
text('EasyEDA | PCB Design | 5V Power Supply', 9, 12, BLUE, gap=10)
text('Smart Solar-Powered Sensory Anti-Pest Device | Research project', 11, 15, INK, 'CV-Bold')
text('Explored solar power and sensor-based detection as an approach to pest management in residential and office environments, applying technical concepts to a practical sustainability problem.')
section('Research Experience')
text('Selected High School Research Projects', font='CV-Bold', gap=5)
for value in [
    'Foliar Application of Fermented Liquid Fertilizer Formulated from Eggshell Powder and Banana Peels (Musa sapientum) on Eggplants (Solanum melongena).',
    'The Potency of Cassava (Manihot esculenta) Starch and Taro Root (Colocasia esculenta) Starch as Materials for Biodegradable, Non-Toxic Plastic Bags.',
    'Effects of Social Factors on the Academic Achievement of Senior High School Students.',
]:
    bullet(value)
section('Academic Honors & Awards')
bullet('With High Honors | Senior High School Graduation | 2024')
bullet('Class Salutatorian | Elementary School Graduation | 2018')
bullet('Class Rank No. 2 | 2012-2018')
section('Additional Capabilities')
text('UI/UX and layout design; visual communication; critical thinking; research and analysis; organization; time management; adaptability; teamwork; independent learning.')
footer(2)
c.save()
print(OUTPUT)
