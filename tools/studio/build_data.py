# Builds the Studio's palette and photo data from the Taste skill library (MIT, Leonxlnx)
# plus BiomeDrive's own palettes. Run from the repo root:  python tools/studio/build_data.py
# Writes site/studio/data/palettes.js and site/studio/data/photos.js, and prints any palette
# whose text or button colours fall below readable contrast.
import json, io, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'site', 'studio', 'data')

# ---------- contrast (WCAG 2) ----------
def lum(hexc):
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def contrast(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

# ---------- moods ----------
# The Studio's mood filters. Library tags map onto them; a few palettes get a hand-set mood.
TAG_MOODS = {
    'light-neutral': ['minimal', 'calm'], 'photographic-neutral': ['calm'], 'earth': ['warm'],
    'dark-neutral': ['dark'], 'mono-accent': ['minimal'], 'two-tone': ['classic'],
    'single-field': ['bold'], 'flat-loud': ['bold', 'playful'], 'pastel-fields': ['playful', 'fresh'],
}
EXTRA = {
    'warm-black-gold': ['luxe'], 'walnut-tan': ['luxe'], 'bottle-green-gold': ['luxe'], 'lunar-grey-bronze': ['luxe'],
    'blush-aubergine': ['luxe'], 'burgundy-bubblegum': ['playful'], 'navy-pink': ['playful'], 'cobalt-field': ['fresh'],
    'sky-field-navy': ['fresh'], 'white-mint-tiles': ['fresh'], 'teal-on-paper': ['calm'], 'cool-white-slate': ['fresh'],
    'white-signal-red': ['bold'], 'graphite-safety-orange': ['bold'], 'black-crimson': ['bold'], 'tobacco-olive': ['classic'],
    'moss-sand': ['calm'], 'green-mat-chocolate': ['classic'], 'oxblood-grey': ['luxe'], 'cobalt-on-sand': ['fresh'],
}

# ---------- BiomeDrive's own palettes (for trades and shops the library doesn't cover) ----------
OWN = [
    dict(id='copper-slate', name='Copper and slate', moods=['warm', 'classic'], bg='#f3f1ee', surface='#e8e4de', ink='#1d2a33', muted='#56616b', accent='#a8502a', accentInk='#ffffff', fields=[dict(bg='#1d2a33', ink='#f3f1ee')]),
    dict(id='hi-vis', name='Hi-vis', moods=['bold'], bg='#f2efe6', surface='#e6e1d4', ink='#121212', muted='#55514a', accent='#ffd400', accentInk='#121212', fields=[dict(bg='#121212', ink='#ffd400'), dict(bg='#ffd400', ink='#121212')]),
    dict(id='clinic-teal', name='Clinic teal', moods=['fresh', 'calm'], bg='#f5f9fb', surface='#e7f0f4', ink='#0e2f45', muted='#4c6373', accent='#0c7f75', accentInk='#ffffff', fields=[dict(bg='#0e2f45', ink='#f5f9fb')]),
    dict(id='linen-sage', name='Linen and sage', moods=['calm', 'warm'], bg='#f1ede4', surface='#e6e0d3', ink='#2c3328', muted='#62675a', accent='#5e6f4c', accentInk='#ffffff', fields=[dict(bg='#2c3328', ink='#f1ede4')]),
    dict(id='terracotta-cream', name='Terracotta and cream', moods=['warm', 'playful'], bg='#f6eee3', surface='#efe2d1', ink='#3a2418', muted='#735848', accent='#b84c26', accentInk='#fff8f0', fields=[dict(bg='#b84c26', ink='#fff8f0'), dict(bg='#3a2418', ink='#f6eee3')]),
    dict(id='midnight-brass', name='Midnight and brass', moods=['dark', 'luxe'], bg='#0f1416', surface='#182023', ink='#ece6d6', muted='#9a9586', accent='#c8a35a', accentInk='#0f1416', fields=[dict(bg='#c8a35a', ink='#0f1416')]),
    dict(id='barber-stripe', name='Barber stripe', moods=['classic', 'bold'], bg='#f4f1ec', surface='#e9e4dc', ink='#14213d', muted='#596173', accent='#b8232a', accentInk='#ffffff', fields=[dict(bg='#14213d', ink='#f4f1ec'), dict(bg='#b8232a', ink='#ffffff')]),
    dict(id='live-wire', name='Live wire', moods=['dark', 'bold'], bg='#101214', surface='#1a1d21', ink='#f4f4f2', muted='#9a9ea3', accent='#f2c200', accentInk='#101214', fields=[dict(bg='#f2c200', ink='#101214')]),
    dict(id='fresh-mint', name='Fresh mint', moods=['fresh', 'minimal'], bg='#f7fbf9', surface='#e7f3ed', ink='#12332a', muted='#4c675e', accent='#1a7a58', accentInk='#ffffff', fields=[dict(bg='#12332a', ink='#e7f3ed'), dict(bg='#bfe8d6', ink='#12332a')]),
    dict(id='slate-sky-rust', name='Slate, sky and rust', moods=['classic', 'fresh'], bg='#eef3f7', surface='#dfe8ef', ink='#1b2733', muted='#526070', accent='#c2551f', accentInk='#ffffff', fields=[dict(bg='#1b2733', ink='#eef3f7')]),
    dict(id='lawn-green', name='Lawn green', moods=['fresh', 'warm'], bg='#f3f2ea', surface='#e7e5d8', ink='#1f2a1c', muted='#5b6254', accent='#3a7029', accentInk='#ffffff', fields=[dict(bg='#22351d', ink='#f3f2ea'), dict(bg='#d9e4b8', ink='#1f2a1c')]),
    dict(id='blush-salon', name='Blush salon', moods=['luxe', 'warm'], bg='#f7ece8', surface='#f0dfd9', ink='#2e1d1f', muted='#76595b', accent='#a8424e', accentInk='#ffffff', fields=[dict(bg='#2e1d1f', ink='#f7ece8')]),
    dict(id='espresso-crema', name='Espresso and crema', moods=['dark', 'warm'], bg='#1e1612', surface='#2a1f19', ink='#f1e6d8', muted='#b09a86', accent='#d9a066', accentInk='#1e1612', fields=[dict(bg='#d9a066', ink='#1e1612')]),
    dict(id='legal-navy', name='Navy and brass', moods=['classic', 'luxe'], bg='#f6f4ef', surface='#ebe7de', ink='#14213d', muted='#575e6d', accent='#7f6434', accentInk='#ffffff', fields=[dict(bg='#14213d', ink='#f6f4ef')]),
    dict(id='ledger-green', name='Ledger green', moods=['minimal', 'calm'], bg='#f4f6f3', surface='#e6ebe4', ink='#10261b', muted='#4f5e57', accent='#1f6b4a', accentInk='#ffffff', fields=[dict(bg='#10261b', ink='#f4f6f3')]),
    dict(id='coral-gym', name='Coral gym', moods=['dark', 'bold'], bg='#0e0e10', surface='#19191c', ink='#fafafa', muted='#95959b', accent='#ff5a36', accentInk='#0e0e10', fields=[dict(bg='#ff5a36', ink='#0e0e10')]),
    dict(id='florist-pink', name='Petal and stem', moods=['playful', 'fresh'], bg='#fbf3f1', surface='#f4e3df', ink='#2b2a20', muted='#6a6553', accent='#c23e64', accentInk='#ffffff', fields=[dict(bg='#2f4a2f', ink='#fbf3f1'), dict(bg='#f6c9d3', ink='#2b2a20')]),
    dict(id='darkroom', name='Darkroom', moods=['dark', 'minimal'], bg='#0d0d0d', surface='#171717', ink='#eaeaea', muted='#8a8a8a', accent='#e8e2d0', accentInk='#0d0d0d', fields=[dict(bg='#e8e2d0', ink='#0d0d0d')]),
    dict(id='garage-red', name='Garage red', moods=['dark', 'bold'], bg='#121212', surface='#1d1d1d', ink='#f0f0f0', muted='#9b9b9b', accent='#cf2a22', accentInk='#ffffff', fields=[dict(bg='#cf2a22', ink='#ffffff')]),
    dict(id='moving-orange', name='Box orange', moods=['bold', 'playful'], bg='#fffaf3', surface='#f5ecdf', ink='#1c1c1c', muted='#625d56', accent='#ff6b1a', accentInk='#1c1c1c', fields=[dict(bg='#1c1c1c', ink='#fffaf3'), dict(bg='#ff6b1a', ink='#1c1c1c')]),
]

def short(p):
    out = {k: p[k] for k in ('id', 'name', 'bg', 'surface', 'ink', 'muted', 'accent', 'accentInk')}
    out['moods'] = p['moods']
    if p.get('fields'):
        out['fields'] = [dict(bg=f['bg'], ink=f['ink']) for f in p['fields'][:4]]
    return out

lib = json.load(io.open(os.path.join(HERE, 'palettes.json'), encoding='utf-8'))
pals = []
for p in lib:
    moods = []
    for t in p['tags']:
        moods += [m for m in TAG_MOODS.get(t, []) if m not in moods]
    moods += [m for m in EXTRA.get(p['id'], []) if m not in moods]
    p = dict(p, moods=moods[:3])
    pals.append(short(p))
pals += [short(p) for p in OWN]

bad = []
for p in pals:
    checks = [('ink', p['ink'], p['bg'], 7), ('muted', p['muted'], p['bg'], 4.5), ('button', p['accentInk'], p['accent'], 4.5)]
    for f in p.get('fields', []):
        checks.append(('field', f['ink'], f['bg'], 4.5))
    for name, a, b, need in checks:
        c = contrast(a, b)
        if c < need:
            bad.append(f"{p['id']}: {name} {a} on {b} = {c:.2f} (want {need})")
print(len(pals), 'palettes')
print('\n'.join(bad) or 'all palettes readable')

with io.open(os.path.join(OUT, 'palettes.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('// Studio palettes. Generated by tools/studio/build_data.py: edit there, not here.\n')
    f.write('// 56 from the Taste skill library (MIT, Leonxlnx), the rest BiomeDrive\'s own.\n')
    f.write('export const PALETTES = [\n')
    for p in pals:
        f.write('  ' + json.dumps(p, ensure_ascii=False) + ',\n')
    f.write('];\n')

# ---------- photos ----------
ph = json.load(io.open(os.path.join(HERE, 'photos.json'), encoding='utf-8'))
seen, rows = set(), []
for set_id, s in ph['sets'].items():
    for p in s['photos']:
        if p['id'] in seen:
            continue
        seen.add(p['id'])
        rows.append(dict(id=p['id'], set=set_id, alt=p.get('alt', '')))
with io.open(os.path.join(OUT, 'photos.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('// Studio photos: Unsplash photographs served by Lorem Picsum (https://picsum.photos), Unsplash licence.\n')
    f.write('// Generated by tools/studio/build_data.py from the Taste skill library. Each template uses its own.\n')
    f.write('export const PHOTO_URL = (id, w, h) => `https://picsum.photos/id/${id}/${w}/${h}`;\n')
    f.write('export const PHOTOS = [\n')
    for r in rows:
        f.write('  ' + json.dumps(r, ensure_ascii=False) + ',\n')
    f.write('];\n')
print(len(rows), 'photos')
