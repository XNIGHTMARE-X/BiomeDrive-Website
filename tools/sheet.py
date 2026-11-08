# Contact sheet of captured frames, labelled, for picking crops.
# usage: python sheet.py <site> -> cap/<site>-sheet-d.jpg and cap/<site>-sheet-m.jpg
import sys, glob, re
from PIL import Image, ImageDraw
site = sys.argv[1]
for kind, cols, tw in (('d', 4, 480), ('m', 7, 200)):
    files = sorted(glob.glob(f'cap/{site}-{kind}-*.png'), key=lambda f: int(re.findall(r'-(\d+)\.png$', f)[0]))
    if not files: continue
    ims = [Image.open(f).convert('RGB') for f in files]
    th = int(ims[0].height * tw / ims[0].width)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + 8) + 8), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    for i, im in enumerate(ims):
        x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 8)
        sheet.paste(im.resize((tw, th)), (x, y))
        d.rectangle([x, y, x + 26, y + 18], fill=(255, 60, 60)); d.text((x + 6, y + 3), str(i), fill=(255, 255, 255))
    sheet.save(f'cap/{site}-sheet-{kind}.jpg', quality=80)
    print(site, kind, len(ims))
