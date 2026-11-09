# Gives every Studio script import the same version (?v=N) so browsers and Cloudflare fetch the new
# files after a change. Run from the repo root:  python tools/studio/bump.py   (adds 1)
#                                         or:    python tools/studio/bump.py 7 (sets 7)
import io, os, re, sys

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'site', 'studio')
FILES = ['index.html', 'view/index.html', 'studio.js', 'kit/kit.js']
VER = re.compile(r"""((?:studio|kit|data)/[\w./-]*?\.(?:js|css)|\./[\w./-]+\.js|\.\./data/[\w.-]+\.js)(\?v=(\d+))?(['"])""")

cur = 0
for f in FILES:
    s = io.open(os.path.join(SITE, f), encoding='utf-8').read()
    cur = max([cur] + [int(m.group(3)) for m in VER.finditer(s) if m.group(3)])
new = int(sys.argv[1]) if len(sys.argv) > 1 else cur + 1
for f in FILES:
    p = os.path.join(SITE, f)
    s = io.open(p, encoding='utf-8').read()
    s2 = VER.sub(lambda m: f'{m.group(1)}?v={new}{m.group(4)}', s)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s2)
    print(f, len(VER.findall(s2)), 'references')
print('studio version', new)
