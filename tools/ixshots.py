# NOT USED since v6: the index now shows one home-page cover per site (img/index/shots.js).
# The project index shots (two per project, 16:10), cut from captures the wall does not use:
# other ArshGroup projects, light themes, the command menu and Triptych's exploded panels.
# Writes site/img/index/*.webp and site/img/index/shots.js. usage: python ixshots.py
import os, json
from PIL import Image
OUT = '../site/img/index'
os.makedirs(OUT, exist_ok=True)
SHOTS = [
    ('arsh', 'cap2/arsh-2.png', (160, 100, 1440, 900), 'arsh-terranova'),
    ('arsh', 'cap2/arsh-5.png', (80, 100, 1360, 900), 'arsh-nilgiri'),
    ('triptych', 'cap3/triptych-light.png', (0, 40, 1280, 840), 'triptych-light'),
    ('triptych', 'cap2/triptych-3.png', (160, 40, 1440, 840), 'triptych-panels'),
    ('jgn', 'cap3/jgn-light.png', (80, 60, 1360, 860), 'jgn-light'),
    ('jgn', 'cap3/jgn-cmdk.png', (80, 50, 1360, 850), 'jgn-command'),
    ('naheel', 'cap3/naheel-light.png', (0, 40, 1280, 840), 'naheel-light'),
    ('naheel', 'cap3/naheel-light2.png', (0, 60, 1280, 860), 'naheel-skills-light'),
]
out = []
for site, src, box, name in SHOTS:
    im = Image.open(src).convert('RGB').crop(box).resize((1120, 700), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', quality=80, method=6)
    out.append([site, f'{name}.webp'])
with open(f'{OUT}/shots.js', 'w', encoding='utf-8') as f:
    f.write('/* Project index shots: [site, file], two per project, in project order. Made by tools/ixshots.py. */\n')
    f.write('window.IX_SHOTS = ' + json.dumps(out) + ';\n')
print(len(out), 'shots')
