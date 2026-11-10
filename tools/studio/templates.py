# The Studio's templates. Run from the repo root:  python tools/studio/templates.py
# Checks every template (category, palette, fonts, hero, sections), gives each one its own photos
# from the library (no photo is used twice anywhere in the Studio), and writes site/studio/data/templates.js.
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, '..', '..', 'site', 'studio')
read = lambda p: io.open(os.path.join(SITE, p), encoding='utf-8').read()

PALETTES = set(re.findall(r'"id": "([^"]+)"', read('data/palettes.js')))
FONTS = set(re.findall(r"\{ id: '([^']+)'", read('data/fonts.js')))
CATS = set(re.findall(r'^  (\w+): \{\n    label:', read('data/content.js'), re.M))
PHOTOS = [json.loads(l.strip().rstrip(',')) for l in read('data/photos.js').splitlines() if l.strip().startswith('{"id"')]
BY_SET = {}
for p in PHOTOS:
    BY_SET.setdefault(p['set'], []).append(p['id'])

HEROES = {'split': 1, 'monument': 1, 'cover': 1, 'poster': 0, 'rescue': 1, 'arch': 1, 'editorial': 1, 'inline': None,
          'collage': 3, 'menu': 1, 'numbers': 1, 'spotlight': 1, 'map': 0, 'compare': 1, 'stack': 1,
          'splitR': 1, 'card': 1, 'ticker': 1, 'index': 3, 'banner': 1,
          'zoom': 1, 'terrain': 0, 'liquid': 1, 'depth': 2, 'slices': 1, 'typewave': 0, 'reel': 3,
          'lens': 1, 'dots': 0, 'doors': 1, 'typewall': 0, 'drum': 0, 'mosaic': 1,
          # signature openings (kit/sig.js): one template each
          'switch': 0, 'gauge': 0, 'blueprint': 0, 'estimator': 0, 'wipe': 1, 'swatches': 0, 'scribble': 1, 'level': 0,
          'route': 0, 'boxes': 0, 'tacho': 0, 'card3d': 0, 'slot': 0, 'clock': 0, 'typewriter': 1, 'deck': 0, 'goo': 0,
          'glitch': 0, 'morph': 1, 'carousel3d': 3, 'flap': 0, 'dock': 0, 'wave': 0, 'breathe': 0, 'bubbles': 0, 'pulse': 0,
          'orbit': 0, 'balance': 0, 'particles': 0, 'chart': 0, 'receipt': 0, 'throughtext': 1, 'horizon': 0, 'shutter': 1,
          'polaroids': 3, 'petals': 0, 'grow': 0}
SECTIONS = {'trust': 0, 'services': 0, 'servicesGrid': 0, 'about': 1, 'stats': 0, 'reviews': 0, 'quote': 0, 'process': 0,
            'area': 0, 'faq': 0, 'cta': 0, 'statement': 0, 'gallery': 3, 'prices': 0, 'menu': 0, 'visit': 0, 'team': 0,
            'book': 0, 'contact': 0, 'feature': 1, 'bigband': 0,
            'hscroll': 0, 'stack': 0, 'pushline': 0, 'odometer': 0, 'accordion': 0, 'follow': 0}

FX = {'loader', 'cursor', 'magnet', 'skew', 'grain', 'velomarquee', 'tilt', 'chars', 'scramble', 'glow', 'curtain', 'progress'}

# which photo sets suit each kind of business, best first
SETS = {
    'plumbing': ['water', 'texture', 'hands-and-making', 'object-still', 'architecture'],
    'electrical': ['city-night', 'sky-and-space', 'architecture', 'object-still'],
    'hvac': ['fog-and-quiet', 'mountain', 'architecture', 'interior-and-table'],
    'roofing': ['architecture', 'city-day', 'sky-and-space', 'mountain'],
    'construction': ['architecture', 'city-day', 'texture', 'hands-and-making'],
    'landscaping': ['plants-and-flowers', 'forest', 'field-and-farm', 'mountain'],
    'cleaning': ['interior-and-table', 'architecture', 'fog-and-quiet', 'plants-and-flowers'],
    'painting': ['architecture', 'texture', 'city-day', 'interior-and-table'],
    'handyman': ['hands-and-making', 'object-still', 'texture', 'interior-and-table'],
    'moving': ['transport', 'desert-and-road', 'city-day', 'architecture'],
    'auto': ['transport', 'desert-and-road', 'city-night', 'city-day'],
    'restaurant': ['interior-and-table', 'field-and-farm', 'city-night', 'hands-and-making'],
    'cafe': ['interior-and-table', 'city-day', 'object-still', 'hands-and-making'],
    'bakery': ['interior-and-table', 'field-and-farm', 'hands-and-making', 'plants-and-flowers'],
    'bar': ['city-night', 'interior-and-table', 'city-day'],
    'salon': ['people', 'plants-and-flowers', 'interior-and-table', 'fog-and-quiet'],
    'barber': ['people', 'city-night', 'object-still', 'city-day'],
    'spa': ['water', 'fog-and-quiet', 'plants-and-flowers', 'forest', 'coast'],
    'dental': ['fog-and-quiet', 'sky-and-space', 'coast', 'plants-and-flowers'],
    'fitness': ['people', 'mountain', 'coast', 'desert-and-road'],
    'law': ['architecture', 'city-day', 'fog-and-quiet', 'object-still'],
    'accounting': ['architecture', 'object-still', 'city-day', 'fog-and-quiet'],
    'realestate': ['architecture', 'coast', 'interior-and-table', 'city-day'],
    'photography': ['people', 'coast', 'mountain', 'animals', 'fog-and-quiet'],
    'florist': ['plants-and-flowers', 'field-and-farm', 'forest', 'animals'],
}
FALLBACK = ['fog-and-quiet', 'coast', 'mountain', 'architecture', 'sky-and-space', 'forest', 'water', 'texture', 'city-day']

T = []
def tpl(**k):
    T.append(k)

# ---------------------------------------------------------------- batch 1: one per kind of business
tpl(id='tidewater', name='Tidewater', cat='plumbing', moods=['warm', 'classic'], pal='copper-slate', font='young-source',
    nav='util', hero='split', secs=['trust', 'services', 'about', 'stats', 'reviews', 'process', 'area', 'faq', 'cta'], foot='cols', r=6, btn='soft',
    biz=dict(name='Tidewater Plumbing', short='Tidewater', city='Portland', area=['South Portland', 'Westbrook', 'Falmouth', 'Cape Elizabeth', 'Scarborough', 'Gorham'], phone='(207) 555-0148', since=1994, owner='Frank Doyle', addr='48 Commercial St, Portland, ME 04101'),
    head=['Pipes fixed right,', '*the first time.*'], sub='Licensed plumbers on call day and night across Greater Portland. One fixed price before we start, and a year’s warranty on every repair.')

tpl(id='voltline', name='Voltline', cat='electrical', moods=['dark', 'bold'], pal='live-wire', font='archivo-compressed',
    nav='util', hero='rescue', secs=['trust', 'servicesGrid', 'stats:fld-2', 'process', 'quote', 'faq', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Voltline Electric', short='Voltline', city='Denver', area=['Aurora', 'Lakewood', 'Englewood', 'Littleton', 'Arvada', 'Wheat Ridge'], phone='(303) 555-0172', since=2006, owner='Marcus Reyes', addr='1210 Larimer St, Denver, CO 80204'),
    head=['Power out?', 'We’re on our way.'], sub='Master electricians on call around the clock. Faults found fast, fixed to code and signed off before we leave.')

tpl(id='northwind', name='Northwind', cat='hvac', moods=['fresh', 'minimal'], pal='cool-white-slate', font='schibsted-heavy',
    nav='bar', hero='numbers', secs=['services', 'about:flip', 'process', 'reviews', 'faq', 'cta'], foot='cols', r=4, btn='sq',
    biz=dict(name='Northwind Heating & Air', short='Northwind', city='Minneapolis', area=['St Paul', 'Edina', 'Bloomington', 'Roseville', 'Plymouth', 'Maple Grove'], phone='(612) 555-0136', since=1988, owner='Karin Lund', addr='300 Washington Ave N, Minneapolis, MN 55401'),
    head=['Warm in January.', 'Cool in July.'], sub='Furnaces, heat pumps and central air, sized properly, fitted in a day and looked after for years.')

tpl(id='ridgeline', pin=[188], name='Ridgeline', cat='roofing', moods=['bold', 'classic'], pal='slate-sky-rust', font='big-shoulders-public',
    nav='bar', hero='cover', secs=['trust', 'services', 'gallery', 'stats', 'quote', 'process', 'faq', 'cta'], foot='big', r=0, btn='sq',
    biz=dict(name='Ridgeline Roofing', short='Ridgeline', city='Charlotte', area=['Matthews', 'Huntersville', 'Concord', 'Gastonia', 'Mint Hill', 'Pineville'], phone='(704) 555-0119', since=1999, owner='Dale Whitaker', addr='2200 South Blvd, Charlotte, NC 28203'),
    head=['Roofs that outlast', 'the storm.'], sub='Free drone inspections, two-day replacements and a 25-year warranty on every new roof we fit.')

tpl(id='foundry', pin=[855], name='Foundry', cat='construction', moods=['bold'], pal='hi-vis', font='anton-work',
    nav='bar', hero='monument', secs=['statement', 'servicesGrid', 'process', 'stats:fld-2', 'gallery', 'quote', 'contact'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Foundry Build Co.', short='Foundry', city='Chicago', area=['Evanston', 'Oak Park', 'Lincoln Park', 'Wicker Park', 'Logan Square', 'Hyde Park'], phone='(312) 555-0184', since=2001, owner='Tom Brennan', addr='1500 W Fulton St, Chicago, IL 60607'),
    head=['Extensions, kitchens and new homes,', 'built on a fixed price.'], sub='One team, one site manager and a programme you can hold us to.')

tpl(id='greenhaven', name='Greenhaven', cat='landscaping', moods=['fresh', 'warm'], pal='lawn-green', font='bricolage-contrast',
    nav='bar', hero='map', secs=['services', 'gallery', 'process', 'reviews', 'faq', 'cta'], foot='cols', r=14, btn='pill',
    biz=dict(name='Greenhaven Gardens', short='Greenhaven', city='Austin', area=['Westlake', 'Round Rock', 'Bee Cave', 'Pflugerville', 'Cedar Park', 'Travis Heights'], phone='(512) 555-0157', since=2009, owner='Rosa Delgado', addr='900 E 6th St, Austin, TX 78702'),
    head=['Gardens that grow', 'better every year.'], sub='Design, planting and care for gardens across Austin, planted for the heat and built to thrive.')

tpl(id='freshly', name='Freshly', cat='cleaning', moods=['fresh', 'playful'], pal='fresh-mint', font='chillax-semibold',
    nav='bar', hero='compare', secs=['trust', 'servicesGrid', 'book', 'reviews', 'process', 'faq', 'cta'], foot='cols', r=18, btn='pill', img='soft',
    biz=dict(name='Freshly Home Cleaning', short='Freshly', city='Seattle', area=['Capitol Hill', 'Ballard', 'Fremont', 'Queen Anne', 'Green Lake', 'West Seattle'], phone='(206) 555-0163', since=2015, owner='Ana Moreau', addr='1400 E Pine St, Seattle, WA 98122'),
    head=['Come home', 'to *clean.*'], sub='Trusted cleaners, eco-friendly products and the same friendly face every visit. Book in under a minute.')

tpl(id='hue', name='Hue', cat='painting', moods=['playful', 'bold'], pal='card-pastels', font='cabinet-grotesk',
    nav='bar', hero='poster', secs=['servicesGrid', 'statement', 'gallery', 'process', 'reviews', 'cta'], foot='big', r=10, btn='pill',
    biz=dict(name='Hue & Co. Decorators', short='Hue & Co.', city='Brooklyn', area=['Park Slope', 'Williamsburg', 'Bed-Stuy', 'Greenpoint', 'Fort Greene', 'Carroll Gardens'], phone='(718) 555-0128', since=2012, owner='Sofia Marchetti', addr='310 Atlantic Ave, Brooklyn, NY 11201'),
    head=['Fresh walls,', 'clean lines,', 'no mess.'], sub='Interior and exterior painting with proper prep, low-odour paints and a three-year finish guarantee.')

tpl(id='fixwell', pin=[491], name='Fixwell', cat='handyman', moods=['minimal', 'calm'], pal='white-navy-tab', font='albert-sans-semibold',
    nav='bar', hero='split', secs=['trust', 'servicesGrid', 'prices', 'process', 'reviews', 'faq', 'cta'], foot='cols', r=8, btn='soft',
    biz=dict(name='Fixwell Handyman', short='Fixwell', city='Columbus', area=['German Village', 'Clintonville', 'Bexley', 'Upper Arlington', 'Worthington', 'Grandview'], phone='(614) 555-0190', since=2011, owner='Dave Kowalski', addr='75 E Gay St, Columbus, OH 43215'),
    head=['Your to-do list,', 'done in one visit.'], sub='Shelves, doors, flat-pack, TV mounting and all the small repairs, by vetted handymen with clear hourly rates.')

tpl(id='carry', name='Carry', cat='moving', moods=['bold', 'playful'], pal='moving-orange', font='general-sans-bold',
    nav='bar', hero='stack', secs=['trust', 'services', 'process', 'stats:fld-1', 'reviews', 'faq', 'cta'], foot='big', r=4, btn='pill',
    biz=dict(name='Carry Movers', short='Carry', city='Phoenix', area=['Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Glendale', 'Gilbert'], phone='(602) 555-0145', since=2004, owner='Luis Ortega', addr='411 N Central Ave, Phoenix, AZ 85004'),
    head=['Moving day,', 'minus the stress.'], sub='Packing, moving and storage with our own crews and one fixed price. Beds built before we leave.')

tpl(id='torque', name='Torque', cat='auto', moods=['dark', 'bold'], pal='garage-red', font='barlow-condensed',
    nav='bar', hero='spotlight', secs=['services', 'book', 'stats:fld-2', 'quote:fld-1', 'faq', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Torque Auto Works', short='Torque', city='Detroit', area=['Dearborn', 'Royal Oak', 'Ferndale', 'Grosse Pointe', 'Livonia', 'Southfield'], phone='(313) 555-0177', since=1997, owner='Andre Wallace', addr='2800 Michigan Ave, Detroit, MI 48216'),
    head=['Honest repairs.', 'Fast turnarounds.'], sub='Servicing, diagnostics and EV care with a video of every check, so you see what we see before you pay.')

tpl(id='ember', name='Ember & Vine', cat='restaurant', moods=['classic', 'warm'], pal='paper-grey-brass', font='newsreader-light',
    nav='center', hero='editorial', secs=['statement', 'menu', 'feature', 'about', 'book', 'visit'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Ember & Vine', short='Ember & Vine', city='Boston', area=['Back Bay', 'South End', 'Beacon Hill', 'Seaport', 'Cambridge', 'Somerville'], phone='(617) 555-0109', since=2013, owner='Lucia Romano', role='Chef and owner', addr='14 Tremont St, Boston, MA 02108'),
    head=['Cooked over fire,', 'served with *care.*'], sub='A short menu that changes every week with what our farmers bring, cooked over wood and served at long tables.', statement='We cook what’s good this week, over fire, for people who like to linger.')

tpl(id='corner', pin=[766, 42, 1060, 63, 192], name='Little Corner', cat='cafe', moods=['warm', 'dark'], pal='espresso-crema', font='gambarino-general',
    nav='bar', hero='menu', secs=['about', 'gallery', 'reviews', 'visit'], foot='big', r=10, btn='pill', img='warm', act='Find us',
    biz=dict(name='Little Corner Coffee', short='Little Corner', city='Amsterdam', area=['De Pijp', 'Jordaan', 'Oud-West', 'Oost', 'Noord', 'Westerpark'], phone='+31 20 555 0193', since=2016, owner='Noor Jansen', addr='Gerard Doustraat 41, Amsterdam', cur='€', uk=True),
    head=['Slow coffee', 'on a fast street.'], sub='Roasted in the back room, poured at the front. Pastries from 7am, Wi-Fi all day.')

tpl(id='proof', name='Proof', cat='bakery', moods=['warm', 'playful'], pal='terracotta-cream', font='erode-sharp',
    nav='center', hero='inline', secs=['menu', 'process', 'about:flip', 'reviews', 'visit'], foot='cols', r=12, btn='pill', img='warm',
    biz=dict(name='Proof Bakehouse', short='Proof', city='London', area=['Hackney', 'Dalston', 'Islington', 'Stoke Newington', 'Clapton', 'Bethnal Green'], phone='020 7946 0321', since=2014, owner='Hattie Clarke', addr='12 Broadway Market, London E8', cur='£', uk=True),
    head=['Bread [] worth', 'getting up [] for.'], sub='Long-fermented sourdough and hand-laminated pastries, baked every morning from 3am. Order by 4pm for tomorrow.')

tpl(id='velvet', pin=[195], name='Velvet Room', cat='bar', moods=['dark', 'luxe'], pal='midnight-brass', font='bodoni-jost',
    nav='center', hero='cover', secs=['menu', 'statement', 'gallery', 'book', 'visit'], foot='big', r=0, btn='sq', img='warm',
    biz=dict(name='The Velvet Room', short='Velvet Room', city='New Orleans', area=['French Quarter', 'Marigny', 'Garden District', 'Bywater', 'Treme', 'Uptown'], phone='(504) 555-0116', since=2017, owner='Jules Thibodeaux', addr='620 Frenchmen St, New Orleans, LA 70116'),
    head=['Low lights,', 'good company.'], sub='Seasonal cocktails, small plates till midnight and jazz on Thursdays.', statement='A bar you can actually talk in: low lights, great drinks and staff who remember your name.')

tpl(id='maison', name='Maison Rose', cat='salon', moods=['luxe', 'warm'], pal='blush-salon', font='boska-italic',
    nav='center', hero='collage', secs=['services', 'team', 'quote', 'book', 'visit'], foot='cols', r=0, btn='pill', img='soft',
    biz=dict(name='Maison Rose Hair', short='Maison Rose', city='Paris', area=['Le Marais', 'Saint-Germain', 'Montmartre', 'Bastille', 'Batignolles'], phone='+33 1 55 50 21 08', since=2011, owner='Camille Laurent', addr='18 rue de Turenne, 75004 Paris', cur='€', uk=True),
    head=['Hair that', 'feels like *you.*'], sub='Unhurried cuts, soft colour and real consultations in a quiet salon in the Marais.')

tpl(id='sharp', name='Sharp & Sons', cat='barber', moods=['classic', 'bold'], pal='barber-stripe', font='rokkitt-literata',
    nav='bar', hero='menu', secs=['about', 'gallery', 'book', 'reviews', 'visit'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Sharp & Sons Barbers', short='Sharp & Sons', city='Manchester', area=['Northern Quarter', 'Ancoats', 'Didsbury', 'Chorlton', 'Salford'], phone='0161 496 0482', since=2008, owner='Callum Reid', addr='22 Oldham St, Manchester M1', cur='£', uk=True),
    head=['Sharp cuts.', 'Hot towels.'], sub='Five chairs, straight razors and time for a proper conversation. Walk in or book your barber.')

tpl(id='stillwater', name='Still Water', cat='spa', moods=['calm', 'luxe'], pal='linen-sage', font='sentient-light',
    nav='center', hero='arch', secs=['statement', 'menu', 'process', 'feature', 'book', 'visit'], foot='cols', r=4, btn='pill', img='soft', motion='calm', mark='lotus', logoRound=True,
    biz=dict(name='Still Water Spa', short='Still Water', city='Santa Barbara', area=['Montecito', 'Goleta', 'Carpinteria', 'Summerland', 'Isla Vista'], phone='(805) 555-0122', since=2010, owner='Elise Hartmann', addr='1120 State St, Santa Barbara, CA 93101'),
    head=['An hour', 'for yourself.'], sub='Massage, facials and a thermal suite, with therapists who listen and products that are kind to skin.')

tpl(id='brightside', name='Brightside', cat='dental', moods=['fresh', 'calm'], pal='clinic-teal', font='hanken-medium',
    nav='bar', hero='split', secs=['trust', 'servicesGrid', 'team', 'quote', 'faq', 'book', 'cta'], foot='cols', r=14, btn='pill', img='soft', logoRound=True,
    biz=dict(name='Brightside Dental', short='Brightside', city='San Diego', area=['North Park', 'La Jolla', 'Hillcrest', 'Pacific Beach', 'Mission Hills', 'Point Loma'], phone='(619) 555-0150', since=2012, owner='Hannah Cho', addr='3900 Fifth Ave, San Diego, CA 92103'),
    lede='New patients welcome in {city}', head=['Gentle dentistry', 'for the *whole family.*'], sub='Calm, modern care with clear prices, same-day emergencies and a team that takes nervous patients seriously.')

tpl(id='forge', name='Forge', cat='fitness', moods=['dark', 'bold'], pal='coral-gym', font='unbounded-onest',
    nav='bar', hero='poster', secs=['servicesGrid', 'prices', 'stats:fld-2', 'team', 'reviews', 'cta'], foot='big', r=6, btn='soft',
    biz=dict(name='Forge Strength Studio', short='Forge', city='Toronto', area=['Leslieville', 'The Annex', 'Liberty Village', 'Riverdale', 'Roncesvalles'], phone='(416) 555-0187', since=2016, owner='Jordan Okafor', addr='88 Queen St E, Toronto, ON'),
    head=['Get strong.', 'Stay strong.', 'Feel *great.*'], sub='Small-group strength classes and personal training with coaches who know your name. First class free.')

tpl(id='harlow', name='Harlow & Finch', cat='law', moods=['classic', 'luxe'], pal='legal-navy', font='eb-garamond',
    nav='bar', hero='editorial', secs=['services', 'statement', 'stats:fld-1', 'team', 'quote:fld-3', 'faq', 'contact'], foot='cols', r=0, btn='sq', mark='scales',
    biz=dict(name='Harlow & Finch Solicitors', short='Harlow & Finch', city='Edinburgh', area=['New Town', 'Leith', 'Stockbridge', 'Morningside', 'Bruntsfield'], phone='0131 496 0715', since=1987, owner='Eleanor Harlow', addr='21 Queen St, Edinburgh EH2', cur='£', uk=True),
    head=['Clear advice,', 'when it matters most.'], sub='Family, property, wills and business law, explained in plain English, with fixed fees wherever we can.', caption='Advising Edinburgh families and businesses since {since}.')

tpl(id='ledger', name='Ledger', cat='accounting', moods=['minimal', 'calm'], pal='ledger-green', font='switzer-semibold',
    nav='bar', hero='numbers', secs=['servicesGrid', 'prices', 'process', 'quote', 'faq', 'cta'], foot='cols', r=6, btn='soft',
    biz=dict(name='Ledger & Co. Accountants', short='Ledger & Co.', city='Dublin', area=['Ranelagh', 'Rathmines', 'Smithfield', 'Ballsbridge', 'Drumcondra'], phone='+353 1 555 0142', since=2003, owner='Aoife Brennan', addr='9 Merrion Square, Dublin 2', cur='€', uk=True),
    head=['Numbers you can', 'actually use.'], sub='Bookkeeping, payroll, tax and year-end accounts for small businesses, on a fixed monthly fee with a named accountant.')

tpl(id='keystone', pin=[946], name='Keystone', cat='realestate', moods=['calm', 'luxe'], pal='three-stones', font='imbue-albert',
    nav='bar', hero='monument', secs=['statement', 'gallery', 'services', 'stats:fld-1', 'reviews', 'contact'], foot='big', r=0, btn='sq',
    biz=dict(name='Keystone Estates', short='Keystone', city='Bath', area=['Larkhall', 'Widcombe', 'Lansdown', 'Bear Flat', 'Combe Down'], phone='01225 960 314', since=1996, owner='Imogen Ashby', addr='4 Milsom St, Bath BA1', cur='£', uk=True),
    head=['Homes in Bath,', 'sold with care.'], sub='Honest valuations, beautiful photography and a team that knows every street in the city.')

tpl(id='lumen', name='Lumen', cat='photography', moods=['dark', 'minimal'], pal='darkroom', font='zodiak-hanken',
    nav='min', hero='stack', secs=['gallery', 'statement', 'prices', 'quote:fld-3', 'book', 'contact'], foot='big', r=0, btn='sq', mark='camera', galleryCount=4,
    biz=dict(name='Lumen Photography', short='Lumen', city='Lisbon', area=['Alfama', 'Chiado', 'Príncipe Real', 'Belém', 'Cascais'], phone='+351 21 555 0174', since=2009, owner='Inês Carvalho', addr='Rua da Rosa 52, Lisboa', cur='€', uk=True),
    head=['The moments', 'between poses.'], sub='Weddings, portraits and brand stories, photographed honestly and delivered within two weeks.')

tpl(id='bloom', name='Bloom Street', cat='florist', moods=['playful', 'fresh'], pal='florist-pink', font='pilcrow-rounded',
    nav='bar', hero='collage', secs=['services', 'menu', 'process', 'reviews', 'visit'], foot='cols', r=16, btn='pill',
    biz=dict(name='Bloom Street Flowers', short='Bloom Street', city='Portland', area=['Pearl District', 'Alberta Arts', 'Hawthorne', 'Sellwood', 'Mississippi'], phone='(503) 555-0134', since=2013, owner='June Takahashi', addr='2335 NW Thurman St, Portland, OR 97210'),
    head=['Flowers picked', 'this *morning.*'], sub='Seasonal bouquets from local growers, wrapped in paper and delivered the same day across Portland.')


# ---------------------------------------------------------------- batch 2: trades and home, three more each
# plumbing
tpl(id='flowline', name='Flowline', cat='plumbing', moods=['bold', 'fresh'], pal='sky-field-navy', font='red-hat-black',
    nav='util', hero='ticker', rot=['leaks.', 'clogs.', 'cold showers.', 'burst pipes.'], secs=['trust', 'servicesGrid', 'stats:fld-1', 'reviews', 'area', 'faq', 'cta'], foot='big', r=12, btn='pill',
    biz=dict(name='Flowline Plumbing', short='Flowline', city='Houston', area=['The Heights', 'Montrose', 'Bellaire', 'Katy', 'Sugar Land', 'Pearland'], phone='(713) 555-0161', since=2010, owner='Javier Ruiz', addr='2100 Washington Ave, Houston, TX 77007'),
    head=['We fix', '{}'], sub='Same-day plumbers across Houston with upfront prices, clean boots and a one-year warranty on every job.')
tpl(id='brasstap', name='Brass Tap', cat='plumbing', moods=['dark', 'classic'], pal='warm-black-gold', font='besley-franklin',
    nav='bar', hero='card', secs=['services', 'about', 'process', 'quote:fld-3', 'faq', 'contact'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Brass Tap Plumbing & Heating', short='Brass Tap', city='Leeds', area=['Headingley', 'Roundhay', 'Chapel Allerton', 'Horsforth', 'Meanwood'], phone='0113 496 0581', since=1979, owner='Graham Whitley', addr='14 Call Lane, Leeds LS1', cur='£', uk=True),
    head=['Three generations', 'of honest plumbing.'], sub='Boilers, bathrooms and the emergencies in between, from a family firm that still answers its own phone.')
tpl(id='clearrun', name='Clear Run', cat='plumbing', moods=['minimal', 'calm'], pal='white-link-blue', font='work-sans-light',
    nav='min', hero='index', secs=['trust', 'process', 'reviews', 'area', 'faq', 'cta'], foot='cols', r=2, btn='sq',
    biz=dict(name='Clear Run Plumbing', short='Clear Run', city='Rotterdam', area=['Kralingen', 'Delfshaven', 'Hillegersberg', 'Noord', 'Feijenoord'], phone='+31 10 555 0147', since=2005, owner='Pieter de Vries', addr='Witte de Withstraat 22, Rotterdam', cur='€', uk=True),
    head=['Plumbing,', 'done quietly.'], sub='Leaks, drains and heaters handled by one calm, careful team, priced before we start.')
# electrical
tpl(id='brightspark', name='Bright Spark', cat='electrical', moods=['playful', 'fresh'], pal='offwhite-bottle-yellow', font='spartan-figtree',
    nav='bar', hero='inline', secs=['servicesGrid', 'statement', 'process', 'reviews', 'faq', 'cta'], foot='big', r=14, btn='pill',
    biz=dict(name='Bright Spark Electrical', short='Bright Spark', city='Bristol', area=['Clifton', 'Bedminster', 'Redland', 'Totterdown', 'Bishopston'], phone='0117 496 0723', since=2014, owner='Priya Shah', addr='31 Gloucester Rd, Bristol BS7', cur='£', uk=True),
    head=['Lights [] on,', 'bills [] down.'], sub='Friendly electricians for rewires, lighting, car chargers and safety checks, with fixed prices and tidy work.')
tpl(id='circuit', name='Circuit & Co.', cat='electrical', moods=['minimal', 'classic'], pal='stone-blueprint', font='franklin-source',
    nav='bar', hero='numbers', secs=['services', 'about', 'process', 'quote', 'faq', 'contact'], foot='cols', r=0, btn='sq', img='mono',
    biz=dict(name='Circuit & Co. Electricians', short='Circuit & Co.', city='Philadelphia', area=['Fishtown', 'Rittenhouse', 'Manayunk', 'Germantown', 'South Philly', 'Northern Liberties'], phone='(215) 555-0139', since=1991, owner='Walt Kaminski', addr='600 N 2nd St, Philadelphia, PA 19123'),
    head=['Wiring you never', 'have to think about.'], sub='Panels, rewires and repairs for Philadelphia’s old houses, done to code and explained in plain English.')
tpl(id='sunline', name='Sunline', cat='electrical', moods=['fresh', 'bold'], pal='forest-pale-lime', font='clash-grotesk',
    nav='bar', hero='banner', secs=['trust', 'servicesGrid', 'stats:fld-2', 'process', 'reviews', 'faq', 'cta'], foot='big', r=8, btn='pill',
    biz=dict(name='Sunline Electric', short='Sunline', city='Sacramento', area=['Midtown', 'East Sac', 'Davis', 'Roseville', 'Elk Grove', 'Folsom'], phone='(916) 555-0154', since=2015, owner='Grace Nakamura', addr='1800 J St, Sacramento, CA 95811'),
    head=['Chargers, panels', 'and clean power.'], sub='EV chargers, panel upgrades and solar-ready wiring for Sacramento homes, with every rebate handled for you.')
# heating and cooling
tpl(id='hearth', name='Hearth', cat='hvac', moods=['warm', 'classic'], pal='post-red-mustard', font='zilla-slab',
    nav='util', hero='split', secs=['trust', 'services', 'about', 'stats:fld-1', 'reviews', 'faq', 'cta'], foot='cols', r=6, btn='soft', img='warm',
    biz=dict(name='Hearth Heating & Cooling', short='Hearth', city='Pittsburgh', area=['Shadyside', 'Lawrenceville', 'Squirrel Hill', 'Mt. Lebanon', 'Bethel Park', 'Oakmont'], phone='(412) 555-0193', since=1972, owner='Joe Petrakis', addr='3500 Butler St, Pittsburgh, PA 15201'),
    head=['Keeping Pittsburgh', 'warm since 1972.'], sub='Furnaces, boilers and central air from a family firm that has seen every kind of Pittsburgh basement.')
tpl(id='polar', name='Polar', cat='hvac', moods=['bold', 'playful'], pal='cobalt-field', font='panchang-switzer',
    nav='bar', hero='poster', secs=['servicesGrid', 'prices', 'process', 'reviews', 'faq', 'cta:fld-1'], foot='big', r=4, btn='pill',
    biz=dict(name='Polar Air Co.', short='Polar', city='Atlanta', area=['Midtown', 'Decatur', 'Buckhead', 'Sandy Springs', 'Marietta', 'Kirkwood'], phone='(404) 555-0118', since=2008, owner='Terrence Hall', addr='675 Ponce de Leon Ave, Atlanta, GA 30308'),
    head=['Stay cool.', 'Stay warm.', 'Stay put.'], sub='AC repairs, new systems and tune-ups across Atlanta. Most fixes done on the first visit.')
tpl(id='stillair', name='Stillair', cat='hvac', moods=['calm', 'minimal'], pal='teal-on-paper', font='archivo-regular',
    nav='min', hero='cover', secs=['statement', 'services', 'process', 'quote', 'faq', 'contact'], foot='cols', r=0, btn='sq', img='soft', motion='calm',
    biz=dict(name='Stillair Heat Pumps', short='Stillair', city='Helsinki', area=['Kallio', 'Töölö', 'Punavuori', 'Lauttasaari', 'Espoo'], phone='+358 9 555 0164', since=2011, owner='Aino Virtanen', addr='Fredrikinkatu 34, Helsinki', cur='€', uk=True),
    head=['Quiet warmth', 'for long winters.'], sub='Heat pumps sized for northern homes, fitted in a day and looked after for years.')
# roofing
tpl(id='slateco', name='Slate & Co.', cat='roofing', moods=['classic', 'luxe'], pal='green-mat-chocolate', font='literata-book',
    nav='center', hero='editorial', secs=['services', 'gallery', 'about', 'quote:fld-1', 'process', 'contact'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Slate & Co. Roofing', short='Slate & Co.', city='York', area=['Bishopthorpe', 'Heworth', 'Acomb', 'Fulford', 'Haxby'], phone='01904 960 238', since=1968, owner='Martin Ashworth', addr='9 Micklegate, York YO1', cur='£', uk=True),
    head=['Heritage roofs,', 'repaired by hand.'], sub='Slate, stone and lead work for listed buildings and old homes, by roofers who learned the trade properly.', caption='Repairing York’s old roofs since {since}.')
tpl(id='topside', name='Topside', cat='roofing', moods=['bold', 'dark'], pal='graphite-safety-orange', font='chivo-black',
    nav='util', hero='rescue', secs=['trust', 'servicesGrid', 'stats:fld-2', 'gallery', 'reviews', 'faq', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Topside Roofing', short='Topside', city='Oklahoma City', area=['Edmond', 'Norman', 'Moore', 'Yukon', 'Midwest City', 'Nichols Hills'], phone='(405) 555-0129', since=2003, owner='Cody Barnes', addr='1 NE 2nd St, Oklahoma City, OK 73104'),
    head=['Storm damage?', 'We’ll tarp it today.'], sub='Emergency tarping, hail repairs and insurance claims handled start to finish, across the metro.')
tpl(id='skyward', name='Skyward', cat='roofing', moods=['fresh', 'calm'], pal='sky-sand', font='jost-caps',
    nav='bar', hero='splitR', secs=['trust', 'services', 'process', 'gallery', 'quote', 'faq', 'cta'], foot='cols', r=14, btn='pill',
    biz=dict(name='Skyward Roofing & Solar', short='Skyward', city='San Jose', area=['Willow Glen', 'Campbell', 'Los Gatos', 'Saratoga', 'Cupertino', 'Santa Clara'], phone='(408) 555-0175', since=2012, owner='Daniel Vu', addr='200 S 1st St, San Jose, CA 95113'),
    head=['A roof that', 'pays you back.'], sub='New roofs built ready for solar, with free inspections and a 25-year warranty.')
# construction
tpl(id='plumbline', name='Plumb Line', cat='construction', moods=['minimal', 'calm'], pal='putty-black-teal', font='hanken-medium',
    nav='min', hero='index', secs=['statement', 'gallery', 'process', 'stats:fld-1', 'quote', 'contact'], foot='big', r=0, btn='sq',
    biz=dict(name='Plumb Line Builders', short='Plumb Line', city='Vancouver', area=['Kitsilano', 'Mount Pleasant', 'Main Street', 'North Van', 'Point Grey'], phone='(604) 555-0149', since=2006, owner='Oliver Grant', addr='1280 W Broadway, Vancouver, BC'),
    head=['Quiet homes,', 'built carefully.'], sub='Renovations and new homes with one team, honest programmes and finishes that last.')
tpl(id='groundwork', name='Groundwork', cat='construction', moods=['warm', 'classic'], pal='tobacco-olive', font='bebas-garamond',
    nav='bar', hero='cover', secs=['trust', 'services', 'gallery', 'about', 'process', 'faq', 'contact'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Groundwork Construction', short='Groundwork', city='Nashville', area=['East Nashville', 'Germantown', '12 South', 'Sylvan Park', 'Franklin', 'Brentwood'], phone='(615) 555-0188', since=1995, owner='Ray Holloway', addr='400 Broadway, Nashville, TN 37203'),
    head=['Built square,', 'built to last.'], sub='Additions, kitchens and custom homes across Middle Tennessee, on a fixed-price contract.')
tpl(id='blockwork', name='Blockwork', cat='construction', moods=['bold', 'playful'], pal='report-blocks', font='epilogue-black',
    nav='bar', hero='ticker', rot=['kitchens.', 'lofts.', 'extensions.', 'new homes.'], secs=['servicesGrid', 'stats:fld-1', 'process', 'gallery', 'reviews', 'contact'], foot='big', r=0, btn='sq',
    biz=dict(name='Blockwork Builders', short='Blockwork', city='Antwerp', area=['Zurenborg', 'Berchem', 'Het Zuid', 'Eilandje', 'Deurne'], phone='+32 3 555 01 62', since=2009, owner='Lotte Peeters', addr='Leopoldstraat 12, Antwerpen', cur='€', uk=True),
    head=['We build', '{}'], sub='Design-and-build for homes in Antwerp: one fixed price, one site manager, one weekly update.')
# landscaping
tpl(id='fernwood', name='Fernwood', cat='landscaping', moods=['calm', 'luxe'], pal='green-black-bone', font='newsreader-light',
    nav='center', hero='arch', secs=['statement', 'services', 'gallery', 'process', 'quote', 'contact'], foot='cols', r=0, btn='sq', img='soft', motion='calm', mark='tree', logoRound=True,
    biz=dict(name='Fernwood Garden Design', short='Fernwood', city='Cheltenham', area=['Montpellier', 'Leckhampton', 'Charlton Kings', 'Prestbury', 'Cirencester'], phone='01242 960 517', since=2001, owner='Harriet Pryce', addr='22 Promenade, Cheltenham GL50', cur='£', uk=True),
    head=['Gardens with', 'a sense of place.'], sub='Garden design and planting for Cotswold homes, from a single border to the whole plot.')
tpl(id='mowtown', name='Mow Town', cat='landscaping', moods=['playful', 'bold'], pal='mint-orange-grey', font='clash-grotesk',
    nav='bar', hero='poster', secs=['servicesGrid', 'prices', 'book', 'reviews', 'faq', 'cta'], foot='big', r=18, btn='pill',
    biz=dict(name='Mow Town Lawn Care', short='Mow Town', city='Kansas City', area=['Brookside', 'Waldo', 'Overland Park', 'Leawood', 'Westport', 'Lee’s Summit'], phone='(816) 555-0127', since=2017, owner='Tyler Jensen', addr='1600 Genessee St, Kansas City, MO 64102'),
    head=['Mow.', 'Feed.', 'Repeat.'], sub='Weekly mowing, feeding and seasonal clean-ups on a schedule that suits your grass.')
tpl(id='terra', name='Terra', cat='landscaping', moods=['warm', 'minimal'], pal='moss-sand', font='erode-sharp',
    nav='bar', hero='stack', secs=['services', 'about:flip', 'gallery', 'process', 'reviews', 'cta'], foot='cols', r=6, btn='soft', img='warm',
    biz=dict(name='Terra Landscapes', short='Terra', city='Santa Fe', area=['Eastside', 'Canyon Road', 'Tesuque', 'Eldorado', 'Las Campanas'], phone='(505) 555-0142', since=2004, owner='Lucia Montoya', addr='200 Canyon Rd, Santa Fe, NM 87501'),
    head=['Water-wise gardens', 'for the high desert.'], sub='Native planting, stone and drip irrigation for gardens that thrive on very little water.')
# cleaning
tpl(id='spotless', name='Spotless', cat='cleaning', moods=['minimal', 'calm'], pal='white-mint-tiles', font='switzer-semibold',
    nav='bar', hero='split', secs=['trust', 'services', 'book', 'process', 'quote', 'faq', 'cta'], foot='cols', r=10, btn='soft', img='soft',
    biz=dict(name='Spotless & Co.', short='Spotless', city='Brighton', area=['Kemptown', 'Hove', 'Hanover', 'Preston Park', 'Seven Dials'], phone='01273 960 145', since=2016, owner='Maria Santos', addr='8 North Rd, Brighton BN1', cur='£', uk=True),
    head=['A cleaner home,', 'every other Friday.'], sub='The same trusted cleaner every visit, eco-friendly products, and a free re-clean if anything’s missed.')
tpl(id='gleam', name='Gleam', cat='cleaning', moods=['bold', 'playful'], pal='candy-chapters', font='red-hat-black',
    nav='bar', hero='ticker', rot=['kitchens.', 'bathrooms.', 'offices.', 'ovens.'], secs=['servicesGrid', 'prices', 'book', 'reviews', 'faq', 'cta'], foot='big', r=20, btn='pill',
    biz=dict(name='Gleam Cleaning Co.', short='Gleam', city='Miami', area=['Brickell', 'Wynwood', 'Coconut Grove', 'Coral Gables', 'Little Havana', 'Miami Beach'], phone='(305) 555-0166', since=2018, owner='Carla Mendes', addr='50 SW 10th St, Miami, FL 33130'),
    head=['Sparkling', '{}'], sub='Deep cleans, regular cleans and move-outs across Miami. See your price and book in a minute.')
tpl(id='whiteglove', name='White Glove', cat='cleaning', moods=['luxe', 'calm'], pal='lunar-grey-bronze', font='bodoni-jost',
    nav='center', hero='card', secs=['statement', 'services', 'team', 'quote:fld-3', 'book', 'contact'], foot='cols', r=0, btn='sq', img='mono',
    biz=dict(name='White Glove Housekeeping', short='White Glove', city='New York', area=['Upper East Side', 'Tribeca', 'West Village', 'Brooklyn Heights', 'Chelsea'], phone='(212) 555-0108', since=2007, owner='Eleanor Vance', addr='10 E 63rd St, New York, NY 10065'),
    head=['Discreet housekeeping', 'for busy homes.'], sub='Trained, vetted housekeepers who look after your home the way you would, week after week.')
# painting
tpl(id='secondcoat', name='Second Coat', cat='painting', moods=['minimal', 'classic'], pal='oxblood-grey', font='besley-franklin',
    nav='bar', hero='splitR', secs=['trust', 'services', 'gallery', 'process', 'quote', 'faq', 'cta'], foot='cols', r=0, btn='sq',
    biz=dict(name='Second Coat Decorators', short='Second Coat', city='Oxford', area=['Jericho', 'Summertown', 'Headington', 'Cowley', 'Iffley'], phone='01865 960 382', since=1999, owner='Tom Fletcher', addr='42 Walton St, Oxford OX2', cur='£', uk=True),
    head=['Careful painters', 'for old houses.'], sub='Lime, oil and modern paints applied with proper prep, by decorators who respect old plaster and wood.')
tpl(id='tint', name='Tint', cat='painting', moods=['playful', 'fresh'], pal='swap-pastels', font='chillax-semibold',
    nav='bar', hero='collage', secs=['servicesGrid', 'statement', 'process', 'reviews', 'faq', 'cta'], foot='big', r=16, btn='pill',
    biz=dict(name='Tint Painting Co.', short='Tint', city='San Francisco', area=['Mission', 'Noe Valley', 'Richmond', 'Sunset', 'Bernal Heights', 'Potrero Hill'], phone='(415) 555-0172', since=2016, owner='Maya Lindqvist', addr='3200 24th St, San Francisco, CA 94110'),
    head=['Color makes', 'the *room.*'], sub='Interior and exterior painting with free color advice, low-odor paints and spotless clean-up.')
tpl(id='weatherline', name='Weatherline', cat='painting', moods=['bold', 'dark'], pal='blue-black-cornflower', font='barlow-condensed',
    nav='bar', hero='compare', secs=['trust', 'services', 'gallery', 'stats:fld-2', 'reviews', 'faq', 'cta'], foot='big', r=4, btn='sq',
    biz=dict(name='Weatherline Exterior Painting', short='Weatherline', city='Spokane', area=['South Hill', 'Browne’s Addition', 'Kendall Yards', 'Spokane Valley', 'Liberty Lake'], phone='(509) 555-0133', since=2002, owner='Brent Hollis', addr='900 W 1st Ave, Spokane, WA 99201'),
    head=['Old paint,', 'new house.'], sub='Exterior painting that stands up to Spokane winters: scraped, primed and painted to last.')
# handyman
tpl(id='oddjobs', name='Odd Jobs', cat='handyman', moods=['playful', 'bold'], pal='mustard-field', font='epilogue-black',
    nav='bar', hero='poster', secs=['servicesGrid', 'prices', 'book', 'reviews', 'faq', 'cta:fld-1'], foot='big', r=6, btn='soft',
    biz=dict(name='Odd Jobs Co.', short='Odd Jobs', city='Glasgow', area=['West End', 'Southside', 'Finnieston', 'Dennistoun', 'Shawlands'], phone='0141 496 0756', since=2013, owner='Stuart McLeod', addr='120 Byres Rd, Glasgow G12', cur='£', uk=True),
    head=['No job', 'too *small.*'], sub='Shelves, doors, flat-pack and all the small repairs, by friendly handymen with clear hourly rates.')
tpl(id='toolbelt', pin=[210], name='Toolbelt', cat='handyman', moods=['warm', 'classic'], pal='rose-grey-green', font='zilla-slab',
    nav='util', hero='numbers', secs=['trust', 'servicesGrid', 'process', 'quote', 'faq', 'contact'], foot='cols', r=4, btn='soft',
    biz=dict(name='Toolbelt Home Repairs', short='Toolbelt', city='Milwaukee', area=['Bay View', 'Shorewood', 'Wauwatosa', 'Riverwest', 'Third Ward', 'Whitefish Bay'], phone='(414) 555-0151', since=2006, owner='Gary Novak', addr='200 N Water St, Milwaukee, WI 53202'),
    head=['Small repairs,', 'done properly.'], sub='One visit for the whole list: doors, floors, fixtures and fixes, by handymen who turn up on time.')
tpl(id='fettle', pin=[954, 276, 32], name='Fettle', cat='handyman', moods=['minimal', 'fresh'], pal='cool-grey-cobalt', font='archivo-regular',
    nav='min', hero='index', secs=['process', 'prices', 'reviews', 'faq', 'cta'], foot='cols', r=0, btn='sq',
    biz=dict(name='Fettle Home Services', short='Fettle', city='Cork', area=['Douglas', 'Ballincollig', 'Blackrock', 'Bishopstown', 'Glanmire'], phone='+353 21 555 0138', since=2015, owner='Ciarán Murphy', addr='18 Oliver Plunkett St, Cork', cur='€', uk=True),
    head=['The little things,', 'fixed.'], sub='Book a handyman for an hour or a day. Clear rates, parts on the van and a 90-day guarantee.')
# removals
tpl(id='nestwell', name='Nestwell', cat='moving', moods=['calm', 'warm'], pal='blush-sage-slate', font='erode-sharp',
    nav='bar', hero='split', secs=['trust', 'services', 'process', 'about', 'quote', 'faq', 'cta'], foot='cols', r=10, btn='pill',
    biz=dict(name='Nestwell Removals', short='Nestwell', city='Cambridge', area=['Mill Road', 'Chesterton', 'Newnham', 'Trumpington', 'Histon'], phone='01223 960 471', since=1998, owner='Sarah Bell', addr='6 Regent St, Cambridge CB2', cur='£', uk=True),
    head=['Moving house,', 'gently.'], sub='Careful packing, careful crews and one fixed price, for moves across town or across the country.')
tpl(id='longhaul', name='Longhaul', cat='moving', moods=['bold', 'dark'], pal='black-crimson', font='big-shoulders-public',
    nav='util', hero='cover', secs=['trust', 'services', 'stats:fld-2', 'process', 'reviews', 'faq', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Longhaul Moving Co.', short='Longhaul', city='Dallas', area=['Uptown', 'Deep Ellum', 'Oak Cliff', 'Plano', 'Frisco', 'Irving'], phone='(214) 555-0186', since=1989, owner='Wade Harmon', addr='1900 Elm St, Dallas, TX 75201'),
    head=['Coast to coast,', 'one crew.'], sub='Long-distance moves with the same crew from your old front door to your new one.')
tpl(id='boxwell', name='Boxwell', cat='moving', moods=['fresh', 'minimal'], pal='mint-pink-accounts', font='spartan-figtree',
    nav='bar', hero='map', secs=['servicesGrid', 'book', 'process', 'reviews', 'faq', 'cta'], foot='cols', r=12, btn='pill',
    biz=dict(name='Boxwell Movers', short='Boxwell', city='Barcelona', area=['Gràcia', 'Eixample', 'Poblenou', 'Sant Antoni', 'Sarrià'], phone='+34 93 555 01 29', since=2014, owner='Marta Puig', addr='Carrer de Verdi 18, Barcelona', cur='€', uk=True),
    head=['Across town', 'by teatime.'], sub='Flat moves around Barcelona with boxes, packing and lifts handled, booked online in minutes.')
# auto
tpl(id='pitlane', name='Pit Lane', cat='auto', moods=['bold', 'playful'], pal='blue-red-black', font='archivo-compressed',
    nav='bar', hero='ticker', rot=['brakes.', 'tyres.', 'servicing.', 'MOTs.'], secs=['servicesGrid', 'book', 'stats:fld-2', 'reviews', 'faq', 'cta'], foot='big', r=0, btn='sq',
    biz=dict(name='Pit Lane Garage', short='Pit Lane', city='Birmingham', area=['Digbeth', 'Moseley', 'Harborne', 'Edgbaston', 'Kings Heath'], phone='0121 496 0815', since=2001, owner='Darren Price', addr='75 Digbeth High St, Birmingham B5', cur='£', uk=True),
    head=['Fast, fair', '{}'], sub='Servicing and repairs with a video of every check, so you see what we see before you pay.')
tpl(id='mirrorfinish', name='Mirror Finish', cat='auto', moods=['luxe', 'dark'], pal='charcoal-room-sage', font='unbounded-onest',
    nav='min', hero='card', secs=['services', 'gallery', 'prices', 'book', 'quote', 'contact'], foot='big', r=0, btn='sq', img='mono', mark='sparkle',
    biz=dict(name='Mirror Finish Detailing', short='Mirror Finish', city='Los Angeles', area=['Santa Monica', 'Silver Lake', 'Pasadena', 'Culver City', 'Venice', 'Beverly Hills'], phone='(310) 555-0163', since=2016, owner='Marco Bellini', addr='1500 Abbot Kinney Blvd, Los Angeles, CA 90291'),
    head=['Better than', 'the showroom.'], sub='Hand washing, machine polishing and ceramic coatings, done at our studio or at your home.')
tpl(id='hollowcreek', name='Hollow Creek', cat='auto', moods=['warm', 'classic'], pal='walnut-tan', font='rokkitt-literata',
    nav='util', hero='splitR', secs=['trust', 'services', 'about', 'book', 'quote:fld-1', 'faq', 'cta'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Hollow Creek Garage', short='Hollow Creek', city='Asheville', area=['West Asheville', 'Montford', 'Black Mountain', 'Weaverville', 'Arden'], phone='(828) 555-0179', since=1984, owner='Earl Whitfield', addr='45 Haywood Rd, Asheville, NC 28806'),
    head=['The garage', 'your dad trusted.'], sub='Honest servicing and repairs from a family garage that explains everything and never upsells.')


# ---------------------------------------------------------------- batch 3: food and drink, health and beauty
# restaurant
tpl(id='trattoria', name='Trattoria Rosa', cat='restaurant', moods=['warm', 'playful'], pal='carmine-field', font='gambarino-general',
    nav='center', hero='inline', secs=['menu', 'statement', 'about', 'book', 'visit'], foot='big', r=12, btn='pill', img='warm',
    biz=dict(name='Trattoria Rosa', short='Trattoria Rosa', city='Providence', area=['Federal Hill', 'Fox Point', 'Wayland Square', 'Downcity', 'College Hill'], phone='(401) 555-0134', since=1997, owner='Rosa Bianchi', role='Chef and owner', addr='300 Atwells Ave, Providence, RI 02903'),
    head=['Pasta [] made', 'every [] morning.'], sub='Family recipes, hand-rolled pasta and a wine list from small Italian growers, on Federal Hill since 1997.', statement='Nonna’s recipes, made fresh every morning and served at tables that are always a little too full.')
tpl(id='kumo', name='Kumo', cat='restaurant', moods=['dark', 'minimal'], pal='soot-pale-lime', font='switzer-semibold',
    nav='bar', hero='spotlight', secs=['menu', 'feature', 'book', 'reviews', 'visit'], foot='big', r=0, btn='sq',
    biz=dict(name='Kumo Izakaya', short='Kumo', city='Berlin', area=['Kreuzberg', 'Mitte', 'Neukölln', 'Prenzlauer Berg', 'Friedrichshain'], phone='+49 30 555 0177', since=2015, owner='Kenji Watanabe', role='Chef and owner', addr='Oranienstraße 34, 10999 Berlin', cur='€', uk=True),
    head=['Small plates,', 'late nights.'], sub='Grilled skewers, cold sake and a counter that stays busy until one. Walk in, or book a booth.')
tpl(id='fieldtable', name='Field & Table', cat='restaurant', moods=['fresh', 'calm'], pal='olive-on-bone', font='literata-book',
    nav='bar', hero='split', secs=['statement', 'menu', 'gallery', 'about', 'book', 'visit'], foot='cols', r=6, btn='soft', img='soft',
    biz=dict(name='Field & Table', short='Field & Table', city='Burlington', area=['Old North End', 'South End', 'Winooski', 'Shelburne', 'Essex'], phone='(802) 555-0157', since=2012, owner='Hannah Pierce', role='Chef and owner', addr='110 Church St, Burlington, VT 05401'),
    lede='Farm-to-table dining in {city}', head=['From our farm', 'to your table.'], sub='Vegetables from our own fields, meat from neighbours, and a menu that changes as the season does.')
# café
tpl(id='daybreak', name='Daybreak', cat='cafe', moods=['fresh', 'playful'], pal='orange-sky-lime', font='pilcrow-rounded',
    nav='bar', hero='ticker', rot=['flat whites.', 'cardamom buns.', 'good mornings.', 'oat lattes.'], secs=['menu', 'gallery', 'visit', 'reviews'], foot='big', r=18, btn='pill', act='Find us',
    biz=dict(name='Daybreak Coffee', short='Daybreak', city='Boulder', area=['Pearl Street', 'North Boulder', 'Chautauqua', 'Louisville', 'Lafayette'], phone='(303) 555-0191', since=2019, owner='Ellie Brooks', addr='1400 Pearl St, Boulder, CO 80302'),
    lede='Coffee on Pearl Street since {since}', head=['Come for', '{}'], sub='Single-origin coffee, pastries baked at dawn and a sunny patio that fills up fast.')
tpl(id='northbound', name='Northbound', cat='cafe', moods=['minimal', 'calm'], pal='studio-grey', font='work-sans-light',
    nav='min', hero='monument', secs=['statement', 'menu', 'about', 'gallery', 'visit'], foot='cols', r=0, btn='sq', img='mono', act='Find us',
    biz=dict(name='Northbound Roasters', short='Northbound', city='Vienna', area=['Neubau', 'Josefstadt', 'Leopoldstadt', 'Wieden', 'Mariahilf'], phone='+43 1 555 0148', since=2013, owner='Lena Gruber', addr='Neubaugasse 21, 1070 Wien', cur='€', uk=True),
    head=['Light roasts,', 'quiet rooms.'], sub='A roastery café with long tables, slow filters and no music before ten.')
tpl(id='copperkettle', name='Copper Kettle', cat='cafe', moods=['classic', 'warm'], pal='cobalt-on-sand', font='young-source',
    nav='center', hero='arch', secs=['menu', 'about', 'reviews', 'visit'], foot='cols', r=8, btn='pill', img='warm', act='Find us', logoRound=True,
    biz=dict(name='The Copper Kettle', short='Copper Kettle', city='Harrogate', area=['Montpellier Quarter', 'Starbeck', 'Knaresborough', 'Pannal', 'Bilton'], phone='01423 960 274', since=1986, owner='Margaret Ellis', addr='3 Montpellier Parade, Harrogate HG1', cur='£', uk=True),
    head=['Tea, cake', 'and a proper chat.'], sub='Loose-leaf tea, scones from the oven and the best window seat in Harrogate.')
# bakery
tpl(id='crumb', name='Crumb', cat='bakery', moods=['minimal', 'fresh'], pal='white-signal-red', font='schibsted-heavy',
    nav='bar', hero='splitR', secs=['menu', 'process', 'gallery', 'reviews', 'visit'], foot='big', r=4, btn='soft',
    biz=dict(name='Crumb Bakery', short='Crumb', city='Montreal', area=['Plateau', 'Mile End', 'Outremont', 'Verdun', 'Griffintown'], phone='(514) 555-0124', since=2015, owner='Élodie Tremblay', addr='5300 Boul. Saint-Laurent, Montréal'),
    lede='Baking in Mile End since {since}', head=['Butter, flour', 'and patience.'], sub='Croissants laminated over three days and sourdough that rests for two. Pre-order and skip the queue.')
tpl(id='oldmill', name='Old Mill', cat='bakery', moods=['classic', 'warm'], pal='green-mat-chocolate', font='bebas-garamond',
    nav='util', hero='editorial', secs=['statement', 'menu', 'process', 'about', 'visit'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Old Mill Bakehouse', short='Old Mill', city='Lancaster', area=['Lititz', 'Strasburg', 'Ephrata', 'Manheim', 'Millersville'], phone='(717) 555-0146', since=1951, owner='Ruth Zimmerman', addr='24 N Queen St, Lancaster, PA 17603'),
    head=['The same bread,', 'since 1951.'], sub='Rye, potato rolls and shoofly pie from a stone oven that has barely cooled in seventy years.', caption='Baking in Lancaster since {since}.')
tpl(id='sugarloaf', name='Sugarloaf', cat='bakery', moods=['playful', 'luxe'], pal='burgundy-bubblegum', font='boska-italic',
    nav='center', hero='collage', secs=['services', 'gallery', 'process', 'quote', 'contact'], foot='big', r=20, btn='pill', act='Order a cake',
    biz=dict(name='Sugarloaf Cakes', short='Sugarloaf', city='Charleston', area=['French Quarter', 'Mount Pleasant', 'West Ashley', 'Daniel Island', 'James Island'], phone='(843) 555-0117', since=2016, owner='Savannah Reed', addr='82 Queen St, Charleston, SC 29401'),
    head=['Cakes for', 'the big *days.*'], sub='Wedding cakes, birthday cakes and everything in between, designed with you and baked to order.')
# bar
tpl(id='nightowl', name='Night Owl', cat='bar', moods=['playful', 'bold'], pal='candy-on-black', font='panchang-switzer',
    nav='bar', hero='poster', secs=['menu', 'statement', 'gallery', 'book', 'visit'], foot='big', r=10, btn='pill',
    biz=dict(name='Night Owl Bar', short='Night Owl', city='Athens', area=['Psyrri', 'Exarchia', 'Koukaki', 'Kolonaki', 'Pangrati'], phone='+30 21 0555 0136', since=2018, owner='Nikos Papadakis', addr='Agias Eirinis 7, Athina', cur='€', uk=True),
    head=['Late nights.', 'Loud tunes.', 'Good drinks.'], sub='Cocktails, vinyl and a rooftop that comes alive after eleven.')
tpl(id='taproom', name='Tap Room', cat='bar', moods=['warm', 'classic'], pal='bottle-green-gold', font='besley-franklin',
    nav='util', hero='menu', secs=['about', 'gallery', 'book', 'reviews', 'visit'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='The Tap Room', short='Tap Room', city='Bend', area=['Old Bend', 'Westside', 'NorthWest Crossing', 'Redmond', 'Sisters'], phone='(541) 555-0198', since=2011, owner='Hank Morrison', addr='900 NW Wall St, Bend, OR 97703'),
    head=['Twelve taps,', 'one long table.'], sub='Local beer, a fire pit and food from the kitchen until late. Dogs welcome on the patio.')
tpl(id='vinea', name='Vinea', cat='bar', moods=['luxe', 'calm'], pal='blush-aubergine', font='eb-garamond',
    nav='center', hero='banner', secs=['statement', 'menu', 'team', 'book', 'visit'], foot='cols', r=0, btn='sq', img='warm', motion='calm',
    biz=dict(name='Vinea Wine Bar', short='Vinea', city='Lyon', area=['Croix-Rousse', 'Presqu’île', 'Vieux Lyon', 'Confluence', 'Brotteaux'], phone='+33 4 55 50 31 72', since=2012, owner='Julien Moreau', addr='14 rue Mercière, 69002 Lyon', cur='€', uk=True),
    head=['Small producers,', 'by the glass.'], sub='Natural and classic wines from growers we know, with cheese, charcuterie and good company.')
# hair salon
tpl(id='fringe', name='Fringe', cat='salon', moods=['bold', 'playful'], pal='pink-field-lime', font='cabinet-grotesk',
    nav='bar', hero='ticker', rot=['cuts.', 'colour.', 'curls.', 'confidence.'], secs=['services', 'team', 'gallery', 'book', 'visit'], foot='big', r=14, btn='pill',
    biz=dict(name='Fringe Hair Studio', short='Fringe', city='Liverpool', area=['Baltic Triangle', 'Ropewalks', 'Lark Lane', 'Allerton', 'Crosby'], phone='0151 496 0293', since=2015, owner='Jade Morgan', addr='41 Bold St, Liverpool L1', cur='£', uk=True),
    head=['Fresh', '{}'], sub='Bold colour, sharp cuts and stylists who actually listen, on Bold Street.')
tpl(id='lune', name='Lune', cat='salon', moods=['minimal', 'calm'], pal='rose-grey-green', font='albert-sans-semibold',
    nav='min', hero='splitR', secs=['menu', 'team', 'quote', 'book', 'visit'], foot='cols', r=0, btn='sq', img='soft',
    biz=dict(name='Lune Salon', short='Lune', city='Munich', area=['Schwabing', 'Glockenbachviertel', 'Haidhausen', 'Maxvorstadt', 'Au'], phone='+49 89 555 0164', since=2017, owner='Sophie Becker', addr='Hans-Sachs-Straße 9, 80469 München', cur='€', uk=True),
    lede='A quiet salon in {city}', head=['Quiet salon,', 'honest colour.'], sub='Unhurried appointments, low-tox colour and advice you can trust.')
tpl(id='coilcrown', name='Coil & Crown', cat='salon', moods=['warm', 'luxe'], pal='tobacco-olive', font='gambarino-general',
    nav='center', hero='cover', secs=['services', 'statement', 'team', 'reviews', 'book', 'visit'], foot='big', r=6, btn='pill', img='warm',
    biz=dict(name='Coil & Crown', short='Coil & Crown', city='Washington', area=['Shaw', 'Capitol Hill', 'Adams Morgan', 'Petworth', 'Navy Yard'], phone='(202) 555-0171', since=2013, owner='Imani Brooks', addr='1700 7th St NW, Washington, DC 20001'),
    head=['Curls, coils', 'and *crowns.*'], sub='Textured hair specialists for cuts, colour, silk presses and protective styles.')
# barber
tpl(id='fadehouse', name='Fadehouse', cat='barber', moods=['dark', 'bold'], pal='charcoal-primaries', font='anton-work',
    nav='bar', hero='spotlight', secs=['menu', 'gallery', 'book', 'reviews', 'visit'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Fadehouse Barbers', short='Fadehouse', city='Chicago', area=['Pilsen', 'Logan Square', 'Bronzeville', 'Wicker Park', 'Hyde Park'], phone='(773) 555-0119', since=2012, owner='Andre Jackson', addr='1800 S Blue Island Ave, Chicago, IL 60608'),
    head=['Clean fades,', 'no waiting.'], sub='Six chairs, online booking and barbers who take their time with every cut.')
tpl(id='albion', name='Albion', cat='barber', moods=['classic', 'luxe'], pal='bottle-green-gold', font='imbue-albert',
    nav='center', hero='editorial', secs=['statement', 'menu', 'about', 'book', 'visit'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Albion Barbers', short='Albion', city='London', area=['Mayfair', 'Soho', 'Marylebone', 'Covent Garden', 'Shoreditch'], phone='020 7946 0718', since=1962, owner='Arthur Penrose', addr='12 Jermyn St, London SW1', cur='£', uk=True),
    head=['A proper shave,', 'since 1962.'], sub='Hot towels, straight razors and traditional cuts on Jermyn Street.', caption='On Jermyn Street since {since}.')
tpl(id='buzz', name='Buzz & Co.', cat='barber', moods=['playful', 'fresh'], pal='sky-sand', font='chillax-semibold',
    nav='bar', hero='split', secs=['menu', 'book', 'team', 'reviews', 'visit'], foot='big', r=16, btn='pill',
    biz=dict(name='Buzz & Co. Barbers', short='Buzz & Co.', city='Salt Lake City', area=['Sugar House', '9th and 9th', 'The Avenues', 'Millcreek', 'Holladay'], phone='(801) 555-0162', since=2018, owner='Danny Pratt', addr='2100 S Highland Dr, Salt Lake City, UT 84106'),
    lede='Family barbers in Sugar House', head=['Cuts for kids,', 'dads and *everyone.*'], sub='Patient barbers, a play corner and online booking, so Saturday haircuts stop being a fight.')
# spa
tpl(id='bathhouse', name='Bathhouse', cat='spa', moods=['dark', 'luxe'], pal='green-black-bone', font='sentient-light',
    nav='center', hero='card', secs=['statement', 'menu', 'feature', 'book', 'visit'], foot='big', r=0, btn='sq', img='warm', motion='calm',
    biz=dict(name='The Bathhouse', short='Bathhouse', city='Tallinn', area=['Kalamaja', 'Old Town', 'Kadriorg', 'Rotermann', 'Pirita'], phone='+372 555 0183', since=2014, owner='Liis Tamm', addr='Telliskivi 60, Tallinn', cur='€', uk=True),
    head=['Heat, steam', 'and stillness.'], sub='Saunas, cold plunges and massage in an old factory by the sea.')
tpl(id='glow', name='Glow', cat='spa', moods=['fresh', 'playful'], pal='navy-pink', font='bricolage-contrast',
    nav='bar', hero='inline', secs=['servicesGrid', 'menu', 'process', 'quote', 'book', 'visit'], foot='big', r=20, btn='pill', mark='sparkle',
    biz=dict(name='Glow Skin Studio', short='Glow', city='Raleigh', area=['Five Points', 'Oakwood', 'Cameron Village', 'Durham', 'Cary'], phone='(919) 555-0135', since=2019, owner='Bianca Torres', addr='400 Glenwood Ave, Raleigh, NC 27603'),
    head=['Good [] skin', 'starts *here.*'], sub='Facials and skin treatments that suit your skin, with products that are kind to it.')
tpl(id='knead', name='Knead', cat='spa', moods=['warm', 'minimal'], pal='three-stones', font='work-sans-light',
    nav='min', hero='stack', secs=['services', 'process', 'about', 'book', 'faq', 'contact'], foot='cols', r=6, btn='soft', img='soft',
    biz=dict(name='Knead Massage Therapy', short='Knead', city='Madison', area=['Willy Street', 'Monona', 'Middleton', 'Fitchburg', 'Near West'], phone='(608) 555-0128', since=2010, owner='Sara Lindgren', addr='1000 Williamson St, Madison, WI 53703'),
    head=['Massage that', 'actually helps.'], sub='Licensed therapists for deep tissue, sports and pregnancy massage, booked online in a minute.')
# dental
tpl(id='northpoint', name='Northpoint', cat='dental', moods=['minimal', 'classic'], pal='white-link-blue', font='franklin-source',
    nav='util', hero='numbers', secs=['trust', 'services', 'team', 'quote', 'faq', 'book', 'contact'], foot='cols', r=6, btn='soft',
    biz=dict(name='Northpoint Dental Care', short='Northpoint', city='Ann Arbor', area=['Kerrytown', 'Burns Park', 'Ypsilanti', 'Saline', 'Dexter'], phone='(734) 555-0144', since=1993, owner='Michael Stein', addr='300 S State St, Ann Arbor, MI 48104'),
    head=['Dentistry,', 'explained clearly.'], sub='Check-ups, implants and aligners with clear prices and no pressure, in the heart of Ann Arbor.')
tpl(id='kindred', name='Kindred', cat='dental', moods=['warm', 'calm'], pal='blush-sage-slate', font='pilcrow-rounded',
    nav='bar', hero='arch', secs=['trust', 'servicesGrid', 'team', 'reviews', 'faq', 'book'], foot='cols', r=18, btn='pill', img='soft', logoRound=True,
    biz=dict(name='Kindred Family Dental', short='Kindred', city='Boise', area=['North End', 'East End', 'Meridian', 'Eagle', 'Garden City'], phone='(208) 555-0155', since=2014, owner='Rachel Kim', addr='800 W Main St, Boise, ID 83702'),
    head=['Dentistry for', 'nervous smiles.'], sub='Gentle care for the whole family, with weighted blankets, headphones and all the time you need.')
tpl(id='dente', name='Studio Dente', cat='dental', moods=['luxe', 'minimal'], pal='lunar-grey-bronze', font='zodiak-hanken',
    nav='center', hero='index', secs=['statement', 'services', 'team', 'quote', 'book', 'contact'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Studio Dente', short='Studio Dente', city='Milan', area=['Brera', 'Navigli', 'Isola', 'Porta Romana', 'Città Studi'], phone='+39 02 5550 1863', since=2008, owner='Giulia Ferrari', addr='Via Solferino 12, Milano', cur='€', uk=True),
    head=['Cosmetic dentistry,', 'quietly done.'], sub='Whitening, aligners and implants in a calm studio in Brera, with every option explained first.')
# fitness
tpl(id='flowyoga', pin=[1051], name='Flow', cat='fitness', moods=['calm', 'fresh'], pal='teal-on-paper', font='newsreader-light',
    nav='center', hero='monument', secs=['services', 'prices', 'team', 'quote', 'book', 'visit'], foot='cols', r=20, btn='pill', img='soft', motion='calm', mark='lotus', logoRound=True,
    biz=dict(name='Flow Yoga Studio', short='Flow', city='Galway', area=['Salthill', 'Claddagh', 'Knocknacarra', 'Oranmore', 'Barna'], phone='+353 91 555 0147', since=2016, owner='Niamh Kelly', addr='12 Quay St, Galway', cur='€', uk=True),
    head=['Breathe in.', 'Slow down.'], sub='Yoga and mobility classes for every body, in a bright studio by the bay. First class free.')
tpl(id='pulse', name='Pulse', cat='fitness', moods=['bold', 'playful'], pal='ultramarine-yellow', font='jost-caps',
    nav='bar', hero='ticker', rot=['ride.', 'sweat.', 'smile.', 'repeat.'], secs=['servicesGrid', 'prices', 'stats:fld-2', 'book', 'reviews', 'cta'], foot='big', r=12, btn='pill',
    biz=dict(name='Pulse Cycle Studio', short='Pulse', city='Scottsdale', area=['Old Town', 'Arcadia', 'Paradise Valley', 'Tempe', 'Fountain Hills'], phone='(480) 555-0122', since=2018, owner='Kayla Morgan', addr='7000 E Camelback Rd, Scottsdale, AZ 85251'),
    head=['Clip in.', 'Then {}'], sub='Forty-five minutes, big music and coaches who push just enough. Your first ride is free.')
tpl(id='ironworks', name='Iron Works', cat='fitness', moods=['classic', 'dark'], pal='graphite-safety-orange', font='big-shoulders-public',
    nav='util', hero='banner', secs=['servicesGrid', 'prices', 'team', 'stats:fld-2', 'reviews', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Iron Works Gym', short='Iron Works', city='Cleveland', area=['Tremont', 'Ohio City', 'Lakewood', 'Shaker Heights', 'Detroit-Shoreway'], phone='(216) 555-0137', since=1999, owner='Mike Kovac', addr='2400 Professor Ave, Cleveland, OH 44113'),
    head=['Lift heavy.', 'Train smart.'], sub='Barbells, coaches and a community that shows up at 6am. No mirrors, no egos.')


# ---------------------------------------------------------------- batch 4: professional, shops and creative
# law
tpl(id='mercer', name='Mercer Law', cat='law', moods=['minimal', 'calm'], pal='cool-white-slate', font='switzer-semibold',
    nav='bar', hero='splitR', secs=['trust', 'services', 'team', 'process', 'quote', 'faq', 'contact'], foot='cols', r=4, btn='soft',
    biz=dict(name='Mercer Family Law', short='Mercer Law', city='Richmond', area=['The Fan', 'Church Hill', 'Museum District', 'Henrico', 'Chesterfield'], phone='(804) 555-0167', since=2005, owner='Catherine Mercer', addr='901 E Byrd St, Richmond, VA 23219'),
    lede='Family lawyers in {city}', head=['Family law,', 'handled with *care.*'], sub='Divorce, custody and separation, with calm advice, clear fees and a lawyer who returns your calls.')
tpl(id='stonereyes', name='Stone & Reyes', cat='law', moods=['bold', 'dark'], pal='blue-black-cornflower', font='chivo-black',
    nav='util', hero='numbers', secs=['services', 'stats:fld-2', 'team', 'reviews', 'faq', 'contact'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Stone & Reyes LLP', short='Stone & Reyes', city='San Antonio', area=['Alamo Heights', 'Southtown', 'Stone Oak', 'Pearl', 'Monte Vista'], phone='(210) 555-0189', since=2002, owner='Daniel Reyes', addr='300 Convent St, San Antonio, TX 78205'),
    head=['Injured?', 'We fight for you.'], sub='Personal injury and employment lawyers who take on the big companies, and only get paid when you do.')
tpl(id='vandijk', name='Van Dijk & Berg', cat='law', moods=['minimal', 'classic'], pal='paper-grey-brass', font='literata-book',
    nav='min', hero='banner', secs=['services', 'statement', 'team', 'quote:fld-1', 'contact'], foot='cols', r=0, btn='sq', img='mono',
    biz=dict(name='Van Dijk & Berg Advocaten', short='Van Dijk & Berg', city='The Hague', area=['Statenkwartier', 'Scheveningen', 'Centrum', 'Benoordenhout', 'Delft'], phone='+31 70 555 0193', since=1994, owner='Anna van Dijk', addr='Lange Voorhout 18, Den Haag', cur='€', uk=True),
    head=['Business law', 'for growing companies.'], sub='Contracts, employment and disputes for Dutch and international businesses, in plain language.')
# accounting
tpl(id='tally', pin=[175], name='Tally', cat='accounting', moods=['playful', 'fresh'], pal='mint-pink-accounts', font='spartan-figtree',
    nav='bar', hero='ticker', rot=['bookkeeping.', 'payroll.', 'tax returns.', 'year-end.'], secs=['servicesGrid', 'prices', 'process', 'reviews', 'faq', 'cta'], foot='big', r=14, btn='pill',
    biz=dict(name='Tally Accounting', short='Tally', city='Oakland', area=['Temescal', 'Rockridge', 'Lake Merritt', 'Uptown', 'Fruitvale', 'Berkeley'], phone='(510) 555-0141', since=2017, owner='Nina Okafor', addr='4900 Telegraph Ave, Oakland, CA 94609'),
    lede='Accountants for small businesses in {city}', head=['We do your', '{}'], sub='Friendly accountants on a fixed monthly fee, so you can get back to running your business.')
tpl(id='hawthorne', name='Hawthorne & Co.', cat='accounting', moods=['classic', 'calm'], pal='olive-on-bone', font='eb-garamond',
    nav='center', hero='editorial', secs=['services', 'prices', 'team', 'quote', 'faq', 'contact'], foot='cols', r=0, btn='sq',
    biz=dict(name='Hawthorne & Co. Chartered Accountants', short='Hawthorne & Co.', city='Chester', area=['Hoole', 'Handbridge', 'Upton', 'Boughton', 'Saltney'], phone='01244 960 362', since=1958, owner='James Hawthorne', addr='17 Eastgate St, Chester CH1', cur='£', uk=True),
    head=['Steady advice,', 'for three generations.'], sub='Accounts, tax and payroll for Cheshire families and businesses, from the same office on Eastgate Street.', caption='On Eastgate Street since {since}.')
tpl(id='figure', name='Figure', cat='accounting', moods=['bold', 'minimal'], pal='cool-grey-cobalt', font='schibsted-heavy',
    nav='bar', hero='poster', secs=['services', 'prices', 'stats:fld-2', 'process', 'reviews', 'cta'], foot='big', r=0, btn='sq',
    biz=dict(name='Figure Accountants', short='Figure', city='Newcastle', area=['Jesmond', 'Heaton', 'Gosforth', 'Ouseburn', 'Tynemouth'], phone='0191 496 0427', since=2012, owner='Laura Dunn', addr='25 Grey St, Newcastle NE1', cur='£', uk=True),
    head=['Numbers,', '*sorted.*'], sub='Cloud bookkeeping, tax and payroll for start-ups and small companies, on one fixed monthly fee.')
# real estate
tpl(id='harbor', name='Harbor', cat='realestate', moods=['fresh', 'calm'], pal='white-navy-tab', font='albert-sans-semibold',
    nav='bar', hero='map', secs=['gallery', 'services', 'stats:fld-1', 'reviews', 'faq', 'contact'], foot='cols', r=10, btn='pill',
    biz=dict(name='Harbor Realty', short='Harbor', city='Annapolis', area=['Eastport', 'Downtown', 'West Annapolis', 'Severna Park', 'Edgewater'], phone='(410) 555-0153', since=2000, owner='Megan Walsh', addr='100 Main St, Annapolis, MD 21401'),
    lede='Real estate around {city}', head=['Homes by', 'the water.'], sub='Buying and selling waterfront homes around Annapolis, with agents who know every creek and cove.')
tpl(id='loftlane', name='Loft & Lane', cat='realestate', moods=['bold', 'minimal'], pal='putty-black-teal', font='archivo-compressed',
    nav='min', hero='cover', secs=['gallery', 'statement', 'services', 'quote', 'contact'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Loft & Lane Property', short='Loft & Lane', city='Hamburg', area=['St. Pauli', 'Ottensen', 'Eimsbüttel', 'HafenCity', 'Winterhude'], phone='+49 40 555 0129', since=2010, owner='Jonas Weber', addr='Große Elbstraße 14, Hamburg', cur='€', uk=True),
    head=['City flats,', 'sold straight.'], sub='Honest valuations and sharp marketing for apartments across Hamburg.')
tpl(id='wideacre', name='Wide Acre', cat='realestate', moods=['warm', 'classic'], pal='moss-sand', font='young-source',
    nav='center', hero='card', secs=['gallery', 'about', 'services', 'reviews', 'contact'], foot='cols', r=6, btn='soft', img='warm',
    biz=dict(name='Wide Acre Land & Homes', short='Wide Acre', city='Bozeman', area=['Gallatin Valley', 'Big Sky', 'Belgrade', 'Livingston', 'Four Corners'], phone='(406) 555-0176', since=1985, owner='Clint Harper', addr='20 E Main St, Bozeman, MT 59715'),
    lede='Land and homes around {city}', head=['Land, ranches', 'and room to *breathe.*'], sub='Ranches, acreage and mountain homes across southwest Montana, sold by people who live here.')
# photography
tpl(id='goldenhour', name='Golden Hour', cat='photography', moods=['warm', 'luxe'], pal='walnut-tan', font='bodoni-jost',
    nav='center', hero='collage', secs=['gallery', 'statement', 'prices', 'quote', 'book', 'contact'], foot='big', r=0, btn='sq', img='warm', galleryCount=4,
    biz=dict(name='Golden Hour Weddings', short='Golden Hour', city='Napa', area=['Sonoma', 'Yountville', 'St Helena', 'Healdsburg', 'Calistoga'], phone='(707) 555-0114', since=2011, owner='Clara Whitman', addr='1300 1st St, Napa, CA 94559'),
    head=['Love stories,', 'told in *light.*'], sub='Wedding photography across wine country: unposed, warm and delivered within two weeks.')
tpl(id='frame', name='Frame', cat='photography', moods=['bold', 'minimal'], pal='report-blocks', font='epilogue-black',
    nav='bar', hero='index', secs=['gallery', 'prices', 'process', 'reviews', 'book', 'contact'], foot='big', r=0, btn='sq',
    biz=dict(name='Frame Studio', short='Frame', city='Eindhoven', area=['Strijp-S', 'Woensel', 'Stratum', 'Gestel', 'Veldhoven'], phone='+31 40 555 0172', since=2014, owner='Sanne Bakker', addr='Torenallee 22, Eindhoven', cur='€', uk=True),
    head=['Pictures that', 'sell things.'], sub='Product and brand photography for online shops and design companies, shot in our daylight studio.')
tpl(id='littlelights', name='Little Lights', cat='photography', moods=['playful', 'fresh'], pal='card-pastels', font='pilcrow-rounded',
    nav='bar', hero='split', secs=['gallery', 'prices', 'process', 'quote', 'book'], foot='cols', r=18, btn='pill', img='soft',
    biz=dict(name='Little Lights Photography', short='Little Lights', city='Des Moines', area=['East Village', 'Sherman Hill', 'Beaverdale', 'West Des Moines', 'Ankeny'], phone='(515) 555-0125', since=2015, owner='Abby Larson', addr='400 E Locust St, Des Moines, IA 50309'),
    lede='Family photographer in {city}', head=['Family photos', 'that feel like *you.*'], sub='Relaxed outdoor sessions for families, newborns and the dog, with no stiff poses.')
# florist
tpl(id='wildstem', name='Wild Stem', cat='florist', moods=['dark', 'luxe'], pal='plum-black-pink', font='boska-italic',
    nav='center', hero='spotlight', secs=['services', 'menu', 'gallery', 'process', 'visit'], foot='big', r=0, btn='sq',
    biz=dict(name='Wild Stem Florist', short='Wild Stem', city='Savannah', area=['Starland', 'Ardsley Park', 'Thomas Square', 'Tybee', 'Midtown'], phone='(912) 555-0168', since=2016, owner='Odette Laurent', addr='2400 Bull St, Savannah, GA 31401'),
    head=['Moody flowers', 'for big *moments.*'], sub='Lush, dark and seasonal arrangements for weddings, dinners and the days that need them.')
tpl(id='petalpost', name='Petal Post', cat='florist', moods=['fresh', 'minimal'], pal='rose-grey-green', font='clash-grotesk',
    nav='bar', hero='ticker', rot=['Mondays.', 'birthdays.', 'no reason.', 'the office.'], secs=['services', 'menu', 'process', 'reviews', 'faq', 'cta'], foot='big', r=12, btn='pill',
    biz=dict(name='Petal Post', short='Petal Post', city='London', area=['Islington', 'Clapham', 'Hackney', 'Peckham', 'Notting Hill'], phone='020 7946 0592', since=2018, owner='Freya Holt', addr='22 Exmouth Market, London EC1', cur='£', uk=True),
    lede='Flower subscriptions across {city}', head=['Fresh flowers', 'for {}'], sub='Seasonal bunches by post or bike courier, weekly, fortnightly or just because.')
tpl(id='meadowsweet', name='Meadowsweet', cat='florist', moods=['classic', 'warm'], pal='olive-on-bone', font='literata-book',
    nav='center', hero='editorial', secs=['statement', 'services', 'gallery', 'about', 'visit'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Meadowsweet Flowers', short='Meadowsweet', city='Ghent', area=['Patershol', 'Gent-Zuid', 'Ledeberg', 'Sint-Amandsberg', 'Mariakerke'], phone='+32 9 555 01 47', since=2004, owner='Hanne Claes', addr='Kraanlei 9, Gent', cur='€', uk=True),
    head=['Country flowers', 'in the city.'], sub='Garden roses, wild grasses and branches from local growers, arranged loosely, the way they grow.', caption='Arranging flowers in Ghent since {since}.')


# ---------------------------------------------------------------- batch 5: interactive templates (Motion, Lenis, WebGL), two per kind of business
# plumbing
tpl(id='undercurrent', name='Undercurrent', cat='plumbing', moods=['dark', 'calm'], pal='blue-black-cornflower', font='clash-grotesk', fx=['cursor', 'magnet', 'skew', 'loader'],
    nav='bar', hero='liquid', secs=['trust', 'follow', 'odometer', 'stack', 'reviews', 'faq', 'cta'], foot='big', r=8, btn='pill', motion='lively',
    biz=dict(name='Undercurrent Plumbing', short='Undercurrent', city='Baltimore', area=['Fells Point', 'Canton', 'Federal Hill', 'Hampden', 'Roland Park', 'Towson'], phone='(410) 555-0182', since=2009, owner='Marcus Bell', addr='1600 Thames St, Baltimore, MD 21231'),
    head=['Water where', 'you want it.'], sub='Leaks, drains and water heaters fixed fast across Baltimore, with one price before we start.')
tpl(id='pipeworks', name='Pipeworks', cat='plumbing', moods=['bold', 'playful'], pal='mustard-field', font='anton-work', fx=['chars', 'tilt', 'velomarquee', 'magnet'],
    nav='util', hero='typewave', secs=['bigband:fld-1', 'hscroll', 'stats', 'reviews', 'area', 'cta'], foot='big', r=4, btn='sq',
    biz=dict(name='Pipeworks Plumbing', short='Pipeworks', city='Cincinnati', area=['Over-the-Rhine', 'Hyde Park', 'Oakley', 'Clifton', 'Mount Adams', 'Covington'], phone='(513) 555-0139', since=2012, owner='Rob Fischer', addr='1200 Vine St, Cincinnati, OH 45202'),
    head=['Plumbers who', 'pick up the phone.'], sub='Same-day repairs, upfront prices and tidy work, across Cincinnati and northern Kentucky.')
# electrical
tpl(id='arc', name='Arc', cat='electrical', moods=['dark', 'minimal'], pal='soot-pale-lime', font='unbounded-onest', fx=['cursor', 'scramble', 'glow', 'progress'],
    nav='bar', hero='terrain', secs=['hscroll', 'odometer', 'process', 'quote', 'faq', 'cta'], foot='big', r=6, btn='pill',
    biz=dict(name='Arc Electric', short='Arc', city='Reno', area=['Midtown', 'Sparks', 'Old Southwest', 'Caughlin Ranch', 'Carson City'], phone='(775) 555-0146', since=2013, owner='Lena Ortiz', addr='50 W Liberty St, Reno, NV 89501'),
    head=['Power,', 'neatly routed.'], sub='Panels, EV chargers and smart lighting, designed and wired by master electricians.')
tpl(id='ohm', name='Ohm & Co.', cat='electrical', moods=['bold', 'minimal'], pal='cool-grey-cobalt', font='archivo-compressed', fx=['magnet', 'tilt', 'progress', 'chars'],
    nav='util', hero='slices', secs=['trust', 'accordion', 'stats:fld-2', 'reviews', 'faq', 'contact'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Ohm & Co. Electrical', short='Ohm & Co.', city='Sheffield', area=['Kelham Island', 'Ecclesall', 'Walkley', 'Nether Edge', 'Crookes'], phone='0114 496 0371', since=2010, owner='Dan Whitworth', addr='15 Division St, Sheffield S1', cur='£', uk=True),
    head=['Rewires, lights', 'and fault finding.'], sub='Electricians who explain the problem, fix it properly and sign it off before they leave.')
# heating and cooling
tpl(id='thermal', name='Thermal', cat='hvac', moods=['fresh', 'calm'], pal='sky-sand', font='general-sans-bold', fx=['chars', 'skew', 'magnet'],
    nav='bar', hero='zoom', secs=['stack', 'odometer', 'reviews', 'faq', 'cta'], foot='cols', r=14, btn='pill',
    biz=dict(name='Thermal Heating & Cooling', short='Thermal', city='Calgary', area=['Kensington', 'Inglewood', 'Mission', 'Bridgeland', 'Marda Loop'], phone='(403) 555-0158', since=2007, owner='Ingrid Solberg', addr='800 Centre St S, Calgary, AB'),
    head=['Comfort,', 'all year round.'], sub='Furnaces, heat pumps and air conditioning, sized properly and looked after for years.')
tpl(id='draft', name='Draft', cat='hvac', moods=['playful', 'warm'], pal='cobalt-on-sand', font='cabinet-grotesk', fx=['cursor', 'tilt', 'velomarquee'],
    nav='bar', hero='depth', secs=['bigband', 'servicesGrid', 'pushline', 'quote', 'faq', 'cta'], foot='big', r=16, btn='pill',
    biz=dict(name='Draft Heating & Air', short='Draft', city='Boston', area=['Jamaica Plain', 'Somerville', 'Brookline', 'Dorchester', 'Cambridge', 'Newton'], phone='(617) 555-0127', since=2014, owner='Nora Fitzgerald', addr='250 Hanover St, Boston, MA 02113'),
    head=['No more', 'cold corners.'], sub='Heat pumps, mini-splits and drafty-room fixes for Boston’s old triple-deckers.')
# roofing
tpl(id='apex', name='Apex', cat='roofing', moods=['bold', 'dark'], pal='black-crimson', font='anton-work', fx=['skew', 'magnet', 'cursor'],
    nav='util', hero='reel', secs=['trust', 'follow', 'odometer', 'quote', 'faq', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Apex Roofing', short='Apex', city='Tulsa', area=['Brookside', 'Midtown', 'Broken Arrow', 'Jenks', 'Owasso', 'Bixby'], phone='(918) 555-0141', since=2001, owner='Garrett Lane', addr='15 E 5th St, Tulsa, OK 74103'),
    head=['Roofs built', 'for big weather.'], sub='Storm repairs, new roofs and insurance claims handled start to finish, with a 25-year warranty.')
tpl(id='gable', name='Gable & Eave', cat='roofing', moods=['classic', 'calm'], pal='three-stones', font='literata-book', fx=['chars', 'progress', 'curtain'],
    nav='center', hero='doors', secs=['services', 'stack', 'reviews', 'contact'], foot='cols', r=4, btn='sq', img='warm',
    biz=dict(name='Gable & Eave Roofing', short='Gable & Eave', city='Durham', area=['Gilesgate', 'Elvet', 'Neville’s Cross', 'Shincliffe', 'Chester-le-Street'], phone='0191 496 0638', since=1983, owner='Peter Raine', addr='22 Saddler St, Durham DH1', cur='£', uk=True),
    head=['Old roofs,', 'cared for.'], sub='Slate, tile and leadwork on period homes, repaired by roofers who take their time.')
# construction
tpl(id='monolith', name='Monolith', cat='construction', moods=['minimal', 'dark'], pal='lunar-grey-bronze', font='chivo-black', fx=['cursor', 'skew', 'scramble', 'loader'],
    nav='min', hero='slices', secs=['pushline', 'hscroll', 'odometer', 'gallery', 'contact'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Monolith Construction', short='Monolith', city='Porto', area=['Ribeira', 'Boavista', 'Foz do Douro', 'Bonfim', 'Matosinhos'], phone='+351 22 555 0193', since=2008, owner='Rui Andrade', addr='Rua das Flores 64, Porto', cur='€', uk=True),
    head=['Concrete, steel', 'and patience.'], sub='Design-and-build for homes and studios across Porto, with one fixed price and one site manager.')
tpl(id='rafter', name='Rafter', cat='construction', moods=['bold', 'warm'], pal='hi-vis', font='red-hat-black', fx=['tilt', 'magnet', 'velomarquee'],
    nav='bar', hero='mosaic', secs=['bigband:fld-1', 'accordion', 'stats', 'quote', 'contact'], foot='big', r=6, btn='soft',
    biz=dict(name='Rafter Builders', short='Rafter', city='Louisville', area=['The Highlands', 'Crescent Hill', 'Germantown', 'St. Matthews', 'NuLu', 'Clifton'], phone='(502) 555-0163', since=1998, owner='Jim Hardesty', addr='700 E Market St, Louisville, KY 40202'),
    head=['Extensions,', 'built right.'], sub='Additions, kitchens and porches built on a fixed-price contract, with weekly photo updates.')
# landscaping
tpl(id='canopy', name='Canopy', cat='landscaping', moods=['fresh', 'dark'], pal='forest-pale-lime', font='bricolage-contrast', fx=['cursor', 'chars', 'glow'],
    nav='bar', hero='terrain', secs=['follow', 'gallery', 'odometer', 'quote', 'cta'], foot='big', r=14, btn='pill',
    biz=dict(name='Canopy Landscapes', short='Canopy', city='Chattanooga', area=['North Shore', 'St. Elmo', 'Lookout Mountain', 'Signal Mountain', 'Highland Park'], phone='(423) 555-0175', since=2011, owner='Will Avery', addr='300 Frazier Ave, Chattanooga, TN 37405'),
    head=['Shape your', 'piece of the land.'], sub='Garden design, stone work and native planting for hillside homes around Chattanooga.')
tpl(id='grove', name='Grove', cat='landscaping', moods=['calm', 'luxe'], pal='linen-sage', font='boska-italic', fx=['skew', 'progress', 'curtain', 'chars'],
    nav='center', hero='lens', secs=['statement', 'stack', 'reviews', 'faq', 'cta'], foot='cols', r=0, btn='pill', img='soft', motion='calm', mark='tree', logoRound=True,
    biz=dict(name='Grove Jardins', short='Grove', city='Bordeaux', area=['Chartrons', 'Saint-Pierre', 'Caudéran', 'Bastide', 'Saint-Émilion'], phone='+33 5 55 50 21 84', since=2005, owner='Claire Dubois', addr='12 rue Notre-Dame, 33000 Bordeaux', cur='€', uk=True),
    head=['Gardens that', 'feel like *home.*'], sub='Courtyards, terraces and country gardens designed and planted around how you live.')
# cleaning
tpl(id='shine', name='Shine', cat='cleaning', moods=['playful', 'fresh'], pal='swap-pastels', font='pilcrow-rounded', fx=['magnet', 'tilt', 'velomarquee'],
    nav='bar', hero='typewall', secs=['bigband:fld-2', 'accordion', 'prices', 'book', 'reviews', 'cta'], foot='big', r=20, btn='pill',
    biz=dict(name='Shine Cleaning Co.', short='Shine', city='Tampa', area=['Hyde Park', 'Seminole Heights', 'Ybor City', 'Davis Islands', 'Westchase'], phone='(813) 555-0152', since=2017, owner='Gabriela Ruiz', addr='1600 W Kennedy Blvd, Tampa, FL 33606'),
    head=['Cleaning that', 'makes you *smile.*'], sub='Friendly cleaners, eco products and a price you see before you book.')
tpl(id='pristine', name='Pristine', cat='cleaning', moods=['luxe', 'calm'], pal='charcoal-room-sage', font='sentient-light', fx=['cursor', 'skew', 'curtain', 'loader'],
    nav='center', hero='lens', secs=['trust', 'follow', 'book', 'quote', 'faq', 'cta'], foot='cols', r=0, btn='sq', img='soft',
    biz=dict(name='Pristine Home Care', short='Pristine', city='Luxembourg', area=['Kirchberg', 'Limpertsberg', 'Belair', 'Grund', 'Strassen'], phone='+352 555 0137', since=2012, owner='Sophie Weber', addr='12 Grand-Rue, Luxembourg', cur='€', uk=True),
    head=['Quietly', 'immaculate.'], sub='Discreet housekeeping and deep cleans by a small, trusted team.')
# painting
tpl(id='pigment', name='Pigment', cat='painting', moods=['playful', 'bold'], pal='poster-chapters', font='epilogue-black', fx=['chars', 'tilt', 'velomarquee', 'magnet'],
    nav='bar', hero='slices', secs=['bigband', 'accordion', 'gallery', 'reviews', 'cta'], foot='big', r=8, btn='pill',
    biz=dict(name='Pigment Painters', short='Pigment', city='Valencia', area=['Ruzafa', 'El Carmen', 'Benimaclet', 'Cabanyal', 'Patraix'], phone='+34 96 555 01 73', since=2015, owner='Lucía Ferrer', addr='Carrer de Sueca 22, València', cur='€', uk=True),
    head=['Colour,', 'boldly applied.'], sub='Interior and exterior painting with colour advice, careful prep and spotless clean-up.')
tpl(id='brushwork', name='Brushwork', cat='painting', moods=['dark', 'luxe'], pal='navy-pink', font='gambarino-general', fx=['cursor', 'magnet', 'grain'],
    nav='bar', hero='lens', secs=['stack', 'odometer', 'quote', 'faq', 'cta'], foot='big', r=4, btn='sq',
    biz=dict(name='Brushwork Decorators', short='Brushwork', city='Hudson', area=['Catskill', 'Kinderhook', 'Rhinebeck', 'Saugerties', 'Germantown'], phone='(518) 555-0144', since=2006, owner='Eli Marsh', addr='500 Warren St, Hudson, NY 12534'),
    head=['Paint, done', 'like *craft.*'], sub='Hand-painted finishes, limewash and cabinetry for old houses in the Hudson Valley.')
# handyman
tpl(id='fixit', name='FixIt', cat='handyman', moods=['bold', 'playful'], pal='white-signal-red', font='spartan-figtree', fx=['magnet', 'tilt', 'scramble'],
    nav='bar', hero='drum', secs=['accordion', 'prices', 'odometer', 'reviews', 'cta'], foot='big', r=10, btn='soft',
    biz=dict(name='FixIt Handyman', short='FixIt', city='St. Louis', area=['Soulard', 'The Hill', 'Tower Grove', 'Clayton', 'Kirkwood', 'Webster Groves'], phone='(314) 555-0128', since=2016, owner='Tony Russo', addr='1900 Park Ave, St. Louis, MO 63104'),
    head=['One visit.', 'The whole list.'], sub='Shelves, doors, TV mounting and small repairs by vetted handymen with clear hourly rates.')
tpl(id='level', name='Level', cat='handyman', moods=['calm', 'classic'], pal='stone-blueprint', font='zilla-slab', fx=['skew', 'cursor', 'progress'],
    nav='bar', hero='drum', secs=['follow', 'process', 'quote', 'faq', 'cta'], foot='cols', r=4, btn='soft',
    biz=dict(name='Level Home Repairs', short='Level', city='Norwich', area=['Golden Triangle', 'Eaton', 'Thorpe St Andrew', 'Hellesdon', 'Wymondham'], phone='01603 960 248', since=2009, owner='Mark Gooch', addr='18 Elm Hill, Norwich NR3', cur='£', uk=True),
    head=['Small jobs,', 'done properly.'], sub='Carpentry, fixes and fitting by careful tradespeople who turn up when they say.')
# removals
tpl(id='transit', name='Transit', cat='moving', moods=['bold', 'dark'], pal='orange-field-black', font='big-shoulders-public', fx=['skew', 'progress', 'velomarquee', 'magnet'],
    nav='util', hero='reel', secs=['bigband:fld-1', 'hscroll', 'odometer', 'reviews', 'cta'], foot='big', r=0, btn='sq',
    biz=dict(name='Transit Movers', short='Transit', city='Denver', area=['LoHi', 'Capitol Hill', 'Wash Park', 'Highlands', 'Aurora', 'Lakewood'], phone='(720) 555-0186', since=2006, owner='Sam Whitaker', addr='1600 Wynkoop St, Denver, CO 80202'),
    head=['Moving day,', 'handled.'], sub='Local and long-distance moves with our own crews, our own trucks and one fixed price.')
tpl(id='nomad', name='Nomad', cat='moving', moods=['calm', 'fresh'], pal='rose-grey-green', font='jost-caps', fx=['cursor', 'chars', 'magnet'],
    nav='bar', hero='dots', secs=['follow', 'book', 'stack', 'quote', 'faq', 'cta'], foot='cols', r=12, btn='pill',
    biz=dict(name='Nomad Removals', short='Nomad', city='Seville', area=['Triana', 'Santa Cruz', 'Nervión', 'Alameda', 'Los Remedios'], phone='+34 95 555 01 62', since=2013, owner='Javier Morales', addr='Calle Feria 40, Sevilla', cur='€', uk=True),
    head=['New city,', 'new home.'], sub='International and local moves with packing, storage and paperwork handled for you.')
# auto
tpl(id='redline', name='Redline', cat='auto', moods=['dark', 'bold'], pal='charcoal-primaries', font='barlow-condensed', fx=['cursor', 'skew', 'scramble', 'velomarquee'],
    nav='bar', hero='liquid', secs=['bigband:fld-2', 'hscroll', 'odometer', 'book', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Redline Performance', short='Redline', city='Indianapolis', area=['Speedway', 'Broad Ripple', 'Fountain Square', 'Carmel', 'Fishers'], phone='(317) 555-0177', since=2004, owner='Kyle Brandt', addr='1400 Main St, Speedway, IN 46224'),
    head=['Tuned,', 'tested, trusted.'], sub='Servicing, diagnostics and performance work by technicians who love cars as much as you do.')
tpl(id='lacquer', name='Lacquer', cat='auto', moods=['luxe', 'minimal'], pal='warm-black-gold', font='bodoni-jost', fx=['chars', 'magnet', 'curtain', 'cursor'],
    nav='center', hero='zoom', secs=['accordion', 'prices', 'gallery', 'book', 'contact'], foot='cols', r=0, btn='sq', img='warm', mark='sparkle',
    biz=dict(name='Lacquer Detailing', short='Lacquer', city='Monte Carlo', area=['Fontvieille', 'La Condamine', 'Larvotto', 'Beausoleil', 'Menton'], phone='+377 93 55 50 18', since=2015, owner='Luca Marchetti', addr='12 Avenue de la Costa, Monaco', cur='€', uk=True),
    head=['A finish', 'like *glass.*'], sub='Paint correction, ceramic coating and concours preparation for cars that deserve it.')
# restaurant
tpl(id='smokesalt', pin=[765], name='Smoke & Salt', cat='restaurant', moods=['dark', 'warm'], pal='espresso-crema', font='young-source', fx=['cursor', 'chars', 'curtain', 'loader'],
    nav='center', hero='zoom', secs=['menu', 'pushline', 'book', 'visit'], foot='big', r=0, btn='sq', img='warm',
    biz=dict(name='Smoke & Salt', short='Smoke & Salt', city='Memphis', area=['Cooper-Young', 'Midtown', 'South Main', 'Overton Square', 'Harbor Town'], phone='(901) 555-0136', since=2010, owner='Earl Jackson', role='Pitmaster and owner', addr='400 S Main St, Memphis, TN 38103'),
    head=['Low and slow,', 'since 2010.'], sub='Hickory-smoked barbecue, cold beer and long tables on South Main.')
tpl(id='verde', name='Verde', cat='restaurant', moods=['playful', 'bold'], pal='pink-field-lime', font='panchang-switzer', fx=['magnet', 'tilt', 'velomarquee'],
    nav='bar', hero='typewave', secs=['bigband:fld-2', 'menu', 'book', 'visit'], foot='big', r=18, btn='pill',
    biz=dict(name='Verde Taqueria', short='Verde', city='Tucson', area=['Barrio Viejo', 'Fourth Avenue', 'Sam Hughes', 'Armory Park', 'Oro Valley'], phone='(520) 555-0119', since=2016, owner='Ana Villalobos', role='Chef and owner', addr='300 E Congress St, Tucson, AZ 85701'),
    head=['Tacos, mezcal', 'and *good times.*'], sub='Handmade tortillas, Sonoran flavours and a patio that stays busy till late.')
# café
tpl(id='drip', name='Drip', cat='cafe', moods=['warm', 'playful'], pal='tobacco-olive', font='chillax-semibold', fx=['cursor', 'tilt', 'glow'],
    nav='bar', hero='depth', secs=['menu', 'pushline', 'visit', 'reviews'], foot='big', r=16, btn='pill', act='Find us',
    biz=dict(name='Drip Coffee Bar', short='Drip', city='Olympia', area=['Downtown', 'Eastside', 'Westside', 'Lacey', 'Tumwater'], phone='(360) 555-0124', since=2017, owner='Riley Chen', addr='400 Capitol Way S, Olympia, WA 98501'),
    head=['Slow drip,', 'good *mornings.*'], sub='Single-origin pour-overs, oat lattes and pastries from the bakery next door.')
tpl(id='ritual', name='Ritual', cat='cafe', moods=['minimal', 'calm'], pal='cobalt-on-sand', font='newsreader-light', fx=['chars', 'magnet', 'curtain'],
    nav='min', hero='slices', secs=['statement', 'menu', 'gallery', 'visit'], foot='cols', r=4, btn='sq', img='warm', act='Find us',
    biz=dict(name='Ritual Caffè', short='Ritual', city='Rome', area=['Monti', 'Trastevere', 'Testaccio', 'Prati', 'Pigneto'], phone='+39 06 5550 1724', since=2011, owner='Marco Rinaldi', addr='Via dei Serpenti 18, Roma', cur='€', uk=True),
    head=['Espresso,', 'the slow way.'], sub='A standing bar, a few tables and coffee roasted every Thursday.')
# bakery
tpl(id='rise', name='Rise', cat='bakery', moods=['playful', 'warm'], pal='post-red-mustard', font='cabinet-grotesk', fx=['magnet', 'tilt', 'velomarquee'],
    nav='bar', hero='typewall', secs=['bigband:fld-2', 'menu', 'process', 'reviews', 'visit'], foot='big', r=14, btn='pill',
    biz=dict(name='Rise Bakery', short='Rise', city='Bologna', area=['Quadrilatero', 'Santo Stefano', 'Bolognina', 'Saragozza', 'Murri'], phone='+39 051 555 0182', since=2014, owner='Giulia Bassi', addr='Via Clavature 9, Bologna', cur='€', uk=True),
    head=['Bread that', 'lifts the *day.*'], sub='Sourdough, focaccia and cornetti baked before sunrise in the heart of Bologna.')
tpl(id='flourfold', name='Flour & Fold', cat='bakery', moods=['fresh', 'calm'], pal='card-pastels', font='erode-sharp', fx=['chars', 'cursor', 'progress'],
    nav='center', hero='mosaic', secs=['statement', 'stack', 'menu', 'visit'], foot='cols', r=10, btn='pill', img='soft',
    biz=dict(name='Flour & Fold', short='Flour & Fold', city='Bruges', area=['Sint-Anna', 'Ezelpoort', 'Sint-Michiels', 'Assebroek', 'Damme'], phone='+32 50 555 01 94', since=2018, owner='Elise Verbeke', addr='Langestraat 41, Brugge', cur='€', uk=True),
    head=['Folded by hand,', 'every morning.'], sub='Croissants, kouign-amann and seasonal tarts from a tiny bakery by the canal.')
# bar
tpl(id='afterhours', name='After Hours', cat='bar', moods=['dark', 'luxe'], pal='burgundy-bubblegum', font='imbue-albert', fx=['cursor', 'glow', 'grain'],
    nav='center', hero='terrain', secs=['menu', 'pushline', 'book', 'visit'], foot='big', r=0, btn='sq', motion='calm',
    biz=dict(name='After Hours', short='After Hours', city='Madrid', area=['Malasaña', 'Chueca', 'La Latina', 'Lavapiés', 'Salamanca'], phone='+34 91 555 01 47', since=2015, owner='Elena Navarro', addr='Calle del Pez 18, Madrid', cur='€', uk=True),
    head=['Cocktails', 'after *midnight.*'], sub='Low lights, slow jazz and a bar that opens when the dinner crowd goes home.')
tpl(id='static', name='Static', cat='bar', moods=['bold', 'dark'], pal='candy-on-black', font='unbounded-onest', fx=['cursor', 'glow', 'scramble', 'velomarquee'],
    nav='bar', hero='typewall', secs=['menu', 'bigband:fld-2', 'gallery', 'book', 'visit'], foot='big', r=8, btn='pill',
    biz=dict(name='Static Bar', short='Static', city='Belfast', area=['Cathedral Quarter', 'Botanic', 'Titanic Quarter', 'Ormeau', 'Lisburn Road'], phone='028 9649 6031', since=2019, owner='Ciara Doyle', addr='12 Hill St, Belfast BT1', cur='£', uk=True),
    head=['Loud music,', 'cold drinks.'], sub='DJs every weekend, a late kitchen and cocktails with a sense of humour.')
# hair salon
tpl(id='muse', name='Muse', cat='salon', moods=['luxe', 'warm'], pal='blush-aubergine', font='gambarino-general', fx=['cursor', 'tilt', 'chars', 'loader'],
    nav='center', hero='depth', secs=['accordion', 'team', 'quote', 'book', 'visit'], foot='cols', r=0, btn='pill', img='soft',
    biz=dict(name='Muse Hair Atelier', short='Muse', city='Florence', area=['Oltrarno', 'Santo Spirito', 'Santa Croce', 'Campo di Marte', 'Fiesole'], phone='+39 055 555 0163', since=2012, owner='Chiara Conti', addr='Via Maggio 22, Firenze', cur='€', uk=True),
    head=['Hair as', 'an *art.*'], sub='Colour and cutting in a quiet atelier across the river, by appointment.')
tpl(id='halo', name='Halo', cat='salon', moods=['playful', 'bold'], pal='navy-pink', font='clash-grotesk', fx=['magnet', 'skew', 'curtain'],
    nav='bar', hero='mosaic', secs=['follow', 'menu', 'book', 'reviews', 'visit'], foot='big', r=16, btn='pill',
    biz=dict(name='Halo Hair Bar', short='Halo', city='Orlando', area=['Thornton Park', 'Winter Park', 'College Park', 'Baldwin Park', 'Mills 50'], phone='(407) 555-0148', since=2018, owner='Destiny Cole', addr='100 E Central Blvd, Orlando, FL 32801'),
    head=['Blowouts,', 'color and *glow.*'], sub='Walk out feeling like the best version of you. Book online in seconds.')
# barber
tpl(id='steel', name='Steel & Strop', cat='barber', moods=['dark', 'classic'], pal='darkroom', font='rokkitt-literata', fx=['cursor', 'scramble', 'skew', 'grain'],
    nav='bar', hero='doors', secs=['menu', 'pushline', 'book', 'visit'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Steel & Strop', short='Steel & Strop', city='Cardiff', area=['Pontcanna', 'Roath', 'Canton', 'Cathays', 'Penarth'], phone='029 2018 0573', since=2011, owner='Rhys Morgan', addr='14 Castle Arcade, Cardiff CF10', cur='£', uk=True),
    head=['Sharp blades,', 'steady hands.'], sub='Traditional cuts, hot towel shaves and beard work in Castle Arcade.')
tpl(id='lineup', name='Line Up', cat='barber', moods=['bold', 'playful'], pal='ultramarine-yellow', font='anton-work', fx=['magnet', 'tilt', 'velomarquee'],
    nav='bar', hero='drum', secs=['bigband:fld-2', 'menu', 'book', 'reviews', 'visit'], foot='big', r=6, btn='soft',
    biz=dict(name='Line Up Barbers', short='Line Up', city='Queens', area=['Astoria', 'Long Island City', 'Jackson Heights', 'Sunnyside', 'Flushing'], phone='(718) 555-0193', since=2015, owner='Luis Peña', addr='31-10 Steinway St, Astoria, NY 11103'),
    head=['Crisp lines,', 'every time.'], sub='Fades, line-ups and beard work, with walk-ins welcome and online booking.')
# spa
tpl(id='salt', name='Salt', cat='spa', moods=['calm', 'fresh'], pal='cool-white-slate', font='zodiak-hanken', fx=['cursor', 'chars', 'curtain'],
    nav='center', hero='liquid', secs=['statement', 'menu', 'stack', 'book', 'visit'], foot='cols', r=4, btn='pill', img='soft', motion='calm', mark='drop', logoRound=True,
    biz=dict(name='Salt Spa', short='Salt', city='Biarritz', area=['Grande Plage', 'Côte des Basques', 'Anglet', 'Bidart', 'Saint-Jean-de-Luz'], phone='+33 5 55 50 41 26', since=2013, owner='Mathilde Etxeberria', addr='8 Place Clemenceau, 64200 Biarritz', cur='€', uk=True),
    head=['Sea air,', 'still water.'], sub='Thalasso, massage and a salt pool above the Atlantic.')
tpl(id='hush', name='Hush', cat='spa', moods=['dark', 'calm'], pal='walnut-tan', font='eb-garamond', fx=['glow', 'tilt', 'magnet'],
    nav='center', hero='lens', secs=['accordion', 'menu', 'process', 'book', 'visit'], foot='big', r=0, btn='pill', motion='calm', mark='lotus',
    biz=dict(name='Hush Retreat', short='Hush', city='Sedona', area=['Uptown', 'West Sedona', 'Oak Creek', 'Village of Oak Creek', 'Cottonwood'], phone='(928) 555-0157', since=2009, owner='Maya Running', addr='200 AZ-179, Sedona, AZ 86336'),
    head=['Let the day', 'go *quiet.*'], sub='Massage, sound baths and desert walks in a retreat among the red rocks.')
# dental
tpl(id='enamel', pin=[847], name='Enamel', cat='dental', moods=['fresh', 'minimal'], pal='clinic-teal', font='hanken-medium', fx=['chars', 'progress', 'magnet'],
    nav='util', hero='dots', secs=['trust', 'stack', 'odometer', 'quote', 'faq', 'book'], foot='cols', r=12, btn='pill', img='soft',
    biz=dict(name='Enamel Dental Studio', short='Enamel', city='Ottawa', area=['The Glebe', 'Westboro', 'ByWard Market', 'Old Ottawa South', 'Kanata'], phone='(613) 555-0172', since=2010, owner='Dr. Sarah Leblanc', addr='800 Bank St, Ottawa, ON'),
    head=['Healthy teeth,', 'calm visits.'], sub='Modern family dentistry with clear prices and same-day emergencies.')
tpl(id='grin', name='Grin', cat='dental', moods=['playful', 'fresh'], pal='white-mint-tiles', font='chillax-semibold', fx=['magnet', 'tilt', 'velomarquee'],
    nav='bar', hero='typewave', secs=['bigband:fld-2', 'accordion', 'team', 'reviews', 'book'], foot='big', r=20, btn='pill', logoRound=True,
    biz=dict(name='Grin Family Dental', short='Grin', city='Albuquerque', area=['Nob Hill', 'Old Town', 'North Valley', 'Rio Rancho', 'Corrales'], phone='(505) 555-0161', since=2016, owner='Dr. Carlos Mendez', addr='3500 Central Ave SE, Albuquerque, NM 87106'),
    head=['Dentistry kids', '*actually* like.'], sub='Gentle check-ups, fun rooms and a team that makes every visit easy.')
# fitness
tpl(id='momentum', name='Momentum', cat='fitness', moods=['bold', 'dark'], pal='coral-gym', font='archivo-compressed', fx=['skew', 'velomarquee', 'magnet', 'progress'],
    nav='bar', hero='typewall', secs=['bigband:fld-2', 'hscroll', 'prices', 'odometer', 'cta'], foot='big', r=0, btn='sq', img='mono',
    biz=dict(name='Momentum Athletics', short='Momentum', city='Austin', area=['East Austin', 'Mueller', 'South Congress', 'Zilker', 'Round Rock'], phone='(512) 555-0198', since=2015, owner='Coach Dre Wallace', addr='1200 E 6th St, Austin, TX 78702'),
    head=['Train hard.', 'Recover smart.'], sub='Strength, conditioning and recovery coaching for people with busy lives.')
tpl(id='core', name='Core', cat='fitness', moods=['calm', 'luxe'], pal='blush-salon', font='albert-sans-semibold', fx=['cursor', 'tilt', 'chars'],
    nav='center', hero='dots', secs=['accordion', 'prices', 'team', 'quote', 'book'], foot='cols', r=18, btn='pill', img='soft',
    biz=dict(name='Core Pilates Studio', short='Core', city='Riga', area=['Old Town', 'Quiet Centre', 'Āgenskalns', 'Mežaparks', 'Jūrmala'], phone='+371 6 555 0184', since=2017, owner='Laura Ozola', addr='Alberta iela 12, Rīga', cur='€', uk=True),
    head=['Strong,', 'from the *core.*'], sub='Reformer and mat Pilates in small classes, for every age and every level.')
# law
tpl(id='grayholt', name='Gray & Holt', cat='law', moods=['classic', 'luxe'], pal='legal-navy', font='literata-book', fx=['chars', 'scramble', 'curtain'],
    nav='center', hero='zoom', secs=['services', 'odometer', 'team', 'quote', 'contact'], foot='cols', r=0, btn='sq', img='mono', mark='scales',
    biz=dict(name='Gray & Holt LLP', short='Gray & Holt', city='Hartford', area=['West Hartford', 'Glastonbury', 'Farmington', 'Avon', 'Wethersfield'], phone='(860) 555-0138', since=1979, owner='Victoria Holt', addr='100 Pearl St, Hartford, CT 06103'),
    head=['Counsel', 'you can trust.'], sub='Business, property and estate law for Connecticut families and companies since 1979.')
tpl(id='atlas', name='Atlas Law', cat='law', moods=['dark', 'minimal'], pal='lunar-grey-bronze', font='switzer-semibold', fx=['cursor', 'glow', 'magnet', 'progress'],
    nav='bar', hero='terrain', secs=['follow', 'stats:fld-1', 'team', 'reviews', 'faq', 'contact'], foot='big', r=4, btn='soft',
    biz=dict(name='Atlas Rechtsanwälte', short='Atlas Law', city='Frankfurt', area=['Westend', 'Sachsenhausen', 'Nordend', 'Bockenheim', 'Bornheim'], phone='+49 69 555 0152', since=2006, owner='Dr. Katrin Vogel', addr='Bockenheimer Landstraße 24, Frankfurt', cur='€', uk=True),
    head=['Steady advice', 'in complex times.'], sub='Corporate, employment and dispute work for growing companies, in German and English.')
# accounting
tpl(id='balance', name='Balance', cat='accounting', moods=['bold', 'fresh'], pal='ledger-green', font='schibsted-heavy', fx=['scramble', 'magnet', 'tilt'],
    nav='bar', hero='typewave', secs=['accordion', 'prices', 'odometer', 'reviews', 'cta'], foot='big', r=10, btn='pill',
    biz=dict(name='Balance Bookkeeping', short='Balance', city='Omaha', area=['Old Market', 'Dundee', 'Benson', 'Midtown', 'Papillion'], phone='(402) 555-0115', since=2013, owner='Erin Kowalczyk', addr='1100 Howard St, Omaha, NE 68102'),
    head=['Books balanced,', 'taxes filed.'], sub='Bookkeeping, payroll and tax for small businesses, on one fixed monthly fee.')
tpl(id='sum', name='Sum', cat='accounting', moods=['minimal', 'calm'], pal='paper-grey-brass', font='franklin-source', fx=['cursor', 'chars', 'progress'],
    nav='bar', hero='drum', secs=['follow', 'prices', 'stack', 'quote', 'faq', 'contact'], foot='cols', r=6, btn='soft',
    biz=dict(name='Sum Accountants', short='Sum', city='Brussels', area=['Ixelles', 'Saint-Gilles', 'Etterbeek', 'Uccle', 'Schaerbeek'], phone='+32 2 555 01 63', since=2008, owner='Thomas Janssens', addr='Avenue Louise 120, Bruxelles', cur='€', uk=True),
    head=['Clear numbers,', 'calm decisions.'], sub='Accounts, VAT and advice for founders and freelancers across Brussels.')
# real estate
tpl(id='vista', name='Vista', cat='realestate', moods=['luxe', 'calm'], pal='putty-black-teal', font='sentient-light', fx=['skew', 'cursor', 'magnet', 'loader'],
    nav='min', hero='reel', secs=['hscroll', 'odometer', 'quote', 'contact'], foot='big', r=0, btn='sq',
    biz=dict(name='Vista Coastal Homes', short='Vista', city='Malibu', area=['Point Dume', 'Broad Beach', 'Carbon Beach', 'Malibu Colony', 'Topanga'], phone='(310) 555-0189', since=1999, owner='Daniela Cruz', addr='23000 Pacific Coast Hwy, Malibu, CA 90265'),
    head=['Homes with', 'a view.'], sub='Buying and selling coastal homes in Malibu, with discretion and local knowledge.')
tpl(id='quarter', name='Quarter', cat='realestate', moods=['minimal', 'classic'], pal='studio-grey', font='besley-franklin', fx=['chars', 'curtain', 'progress'],
    nav='bar', hero='doors', secs=['gallery', 'follow', 'stats:fld-1', 'reviews', 'contact'], foot='cols', r=0, btn='sq', img='mono',
    biz=dict(name='Quarter Immobilier', short='Quarter', city='Nice', area=['Vieux-Nice', 'Cimiez', 'Le Port', 'Mont Boron', 'Villefranche'], phone='+33 4 55 50 72 18', since=2004, owner='Antoine Roux', addr='12 rue de France, 06000 Nice', cur='€', uk=True),
    head=['Apartments', 'by the sea.'], sub='Sales and rentals across Nice, from old-town studios to villas on the hill.')
# photography
tpl(id='exposure', name='Exposure', cat='photography', moods=['dark', 'bold'], pal='darkroom', font='switzer-semibold', fx=['cursor', 'skew', 'scramble', 'grain'],
    nav='min', hero='liquid', secs=['gallery', 'pushline', 'prices', 'book', 'contact'], foot='big', r=0, btn='sq', mark='camera',
    biz=dict(name='Exposure Studio', short='Exposure', city='Naples', area=['Chiaia', 'Vomero', 'Posillipo', 'Spaccanapoli', 'Sorrento'], phone='+39 081 555 0136', since=2012, owner='Alessio Esposito', addr='Via dei Mille 40, Napoli', cur='€', uk=True),
    head=['Light, shadow', 'and *story.*'], sub='Editorial, fashion and brand photography from a daylight studio in Chiaia.')
tpl(id='grainstudio', name='Grain', cat='photography', moods=['warm', 'classic'], pal='green-mat-chocolate', font='bebas-garamond', fx=['cursor', 'velomarquee', 'curtain', 'grain'],
    nav='bar', hero='reel', secs=['statement', 'prices', 'quote', 'book', 'contact'], foot='cols', r=0, btn='sq', img='warm',
    biz=dict(name='Grain Film Photography', short='Grain', city='Marseille', area=['Le Panier', 'Vieux-Port', 'Endoume', 'Cours Julien', 'Cassis'], phone='+33 4 55 50 63 91', since=2010, owner='Inès Laurent', addr='18 rue du Panier, Marseille', cur='€', uk=True),
    head=['Shot on film,', 'kept forever.'], sub='Weddings and portraits on medium-format film, developed and printed by hand.')
# florist
tpl(id='petalfall', name='Petalfall', cat='florist', moods=['playful', 'warm'], pal='florist-pink', font='boska-italic', fx=['cursor', 'tilt', 'chars'],
    nav='center', hero='depth', secs=['accordion', 'menu', 'process', 'reviews', 'visit'], foot='big', r=16, btn='pill',
    biz=dict(name='Petalfall Flowers', short='Petalfall', city='Nantes', area=['Bouffay', 'Graslin', 'Île de Nantes', 'Chantenay', 'Rezé'], phone='+33 2 55 50 84 17', since=2016, owner='Margaux Leroy', addr='8 rue Crébillon, Nantes', cur='€', uk=True),
    head=['Flowers that', 'feel like *spring.*'], sub='Loose, seasonal bouquets delivered across Nantes the same day.')
tpl(id='thicket', name='Thicket', cat='florist', moods=['dark', 'calm'], pal='green-black-bone', font='gambarino-general', fx=['glow', 'magnet', 'curtain', 'cursor'],
    nav='center', hero='mosaic', secs=['follow', 'menu', 'gallery', 'visit'], foot='cols', r=0, btn='sq',
    biz=dict(name='Thicket Botanical', short='Thicket', city='Utrecht', area=['Oudwijk', 'Lombok', 'Wittevrouwen', 'Zuilen', 'Zeist'], phone='+31 30 555 0147', since=2014, owner='Femke de Groot', addr='Oudegracht 112, Utrecht', cur='€', uk=True),
    head=['Wild, green', 'and a little *dark.*'], sub='Plants, dried flowers and moody arrangements from a canal-side shop.')


# ---------------------------------------------------------------- one opening each
# Every interactive template opens with an interaction no other template has, taken from its own trade.
SIGNATURE = {
    'undercurrent': 'liquid', 'pipeworks': 'typewave', 'arc': 'switch', 'ohm': 'slices', 'thermal': 'gauge', 'draft': 'depth',
    'apex': 'reel', 'gable': 'doors', 'monolith': 'blueprint', 'rafter': 'estimator', 'canopy': 'terrain', 'grove': 'lens',
    'shine': 'typewall', 'pristine': 'wipe', 'pigment': 'swatches', 'brushwork': 'scribble', 'fixit': 'drum', 'level': 'level',
    'transit': 'route', 'nomad': 'boxes', 'redline': 'tacho', 'lacquer': 'card3d', 'smokesalt': 'zoom', 'verde': 'slot',
    'drip': 'clock', 'ritual': 'typewriter', 'rise': 'deck', 'flourfold': 'mosaic', 'afterhours': 'goo', 'static': 'glitch',
    'muse': 'morph', 'halo': 'carousel3d', 'steel': 'flap', 'lineup': 'dock', 'salt': 'wave', 'hush': 'breathe',
    'enamel': 'dots', 'grin': 'bubbles', 'momentum': 'pulse', 'core': 'orbit', 'grayholt': 'balance', 'atlas': 'particles',
    'balance': 'chart', 'sum': 'receipt', 'vista': 'throughtext', 'quarter': 'horizon', 'exposure': 'shutter',
    'grainstudio': 'polaroids', 'petalfall': 'petals', 'thicket': 'grow',
}
assert len(set(SIGNATURE.values())) == len(SIGNATURE) == 50
_ids = {t['id'] for t in T}
assert not (set(SIGNATURE) - _ids), set(SIGNATURE) - _ids
for t in T:
    if t['id'] in SIGNATURE: t['hero'] = SIGNATURE[t['id']]
_plain = {t['hero'] for t in T if t['id'] not in SIGNATURE}
assert not (_plain & set(SIGNATURE.values())), _plain & set(SIGNATURE.values())

# ---------------------------------------------------------------- checks and photos
def need(t):
    h = HEROES[t['hero']]
    if h is None:
        h = sum(l.count('[]') for l in t['head'])
    n = h
    for s in t['secs']:
        name = s.split(':')[0]
        n += (t.get('galleryCount', 3) if name == 'gallery' else SECTIONS[name])
    return n

errors, ids = [], set()
for t in T:
    w = t['id']
    if w in ids: errors.append(f'{w}: duplicate id')
    ids.add(w)
    if t['cat'] not in CATS: errors.append(f'{w}: unknown category {t["cat"]}')
    if t['pal'] not in PALETTES: errors.append(f'{w}: unknown palette {t["pal"]}')
    if t['font'] not in FONTS: errors.append(f'{w}: unknown font {t["font"]}')
    if t['hero'] not in HEROES: errors.append(f'{w}: unknown hero {t["hero"]}')
    for s in t['secs']:
        if s.split(':')[0] not in SECTIONS: errors.append(f'{w}: unknown section {s}')
    for f in t.get('fx', []):
        if f not in FX: errors.append(f'{w}: unknown effect {f}')
    for k in ('name', 'short', 'city', 'phone', 'since', 'owner'):
        if k not in t['biz']: errors.append(f'{w}: biz.{k} missing')
if errors:
    print('\n'.join(errors)); sys.exit(1)

# ---------------------------------------------------------------- photos: every template keeps the ones it has
# A template's photos only change if it needs more or fewer, or gets a new pin; new ones come from the unused pool.
prev = {}
try:
    for line in read('data/templates.js').splitlines():
        line = line.strip().rstrip(',')
        if line.startswith('{"id"'):
            o = json.loads(line); prev[o['id']] = o.get('photos', [])
except Exception:
    pass
pinned = [i for t in T for i in t.get('pin', [])]
dupe = {i for i in pinned if pinned.count(i) > 1}
if dupe:
    print('pinned twice:', dupe); sys.exit(1)
used = set(pinned)
for t in T:
    n = need(t)
    pins = list(t.get('pin', []))
    keep = pins + [i for i in prev.get(t['id'], []) if i not in pins and i not in pinned]
    t['photos'] = keep[:n]
    used |= set(t['photos'])
short = []
for t in T:
    n, got = need(t), t['photos']
    for st in t.get('sets') or (SETS[t['cat']] + FALLBACK):
        for pid in BY_SET.get(st, []):
            if len(got) >= n: break
            if pid not in used:
                got.append(pid); used.add(pid)
    if len(got) < n: short.append(f'{t["id"]}: {len(got)}/{n} photos')
    t.pop('pin', None); t.pop('sets', None)

# ---------------------------------------------------------------- motion styles: no two templates move alike
# Each template gets one value per axis (kit/motion.css). Headings, photos, easing and buttons are drawn from
# what suits its moods; every axis is spread evenly, and templates for the same kind of business never share
# a heading or photo style.
import zlib
from collections import Counter
AXES = {
    'h': ['rise', 'drop', 'fade', 'wipe', 'tilt', 'zoom', 'slide', 'flip', 'words', 'chars'],
    'p': ['top', 'down', 'side', 'doors', 'iris', 'fade', 'corner', 'pill'],
    'l': ['up', 'left', 'scale', 'flip', 'fade', 'alt'],
    't': ['up', 'fade', 'right', 'blur'],
    'b': ['arrow', 'fill', 'invert', 'grow', 'hard', 'morph'],
    'r': ['indent', 'wash', 'dim', 'accent', 'line'],
    'g': ['fill', 'lift', 'ring', 'soft'],
    'n': ['line', 'dim', 'pill'],
    'e': ['out', 'spring', 'smooth', 'swift'],
}
SUITS = {
    'h': dict(calm=['fade', 'rise', 'zoom', 'words'], luxe=['fade', 'words', 'wipe', 'zoom', 'chars'], minimal=['rise', 'wipe', 'fade', 'slide'],
              bold=['drop', 'tilt', 'wipe', 'flip', 'chars', 'slide'], playful=['tilt', 'flip', 'words', 'chars', 'drop'], warm=['rise', 'words', 'fade', 'slide'],
              dark=['wipe', 'zoom', 'chars', 'fade'], classic=['rise', 'fade', 'words', 'wipe'], fresh=['slide', 'rise', 'words', 'drop']),
    'p': dict(calm=['fade', 'top', 'pill', 'iris'], luxe=['doors', 'fade', 'iris', 'top'], minimal=['top', 'side', 'down', 'corner'], bold=['side', 'corner', 'down', 'doors'],
              playful=['pill', 'iris', 'corner', 'down'], warm=['top', 'fade', 'pill', 'down'], dark=['iris', 'doors', 'side', 'fade'], classic=['top', 'down', 'fade', 'doors'],
              fresh=['side', 'pill', 'down', 'corner']),
    'e': dict(calm=['smooth', 'out'], luxe=['smooth', 'swift'], minimal=['swift', 'out'], bold=['swift', 'out'], playful=['spring'], warm=['out', 'smooth'],
              dark=['swift', 'smooth'], classic=['out', 'smooth'], fresh=['spring', 'out']),
    'b': dict(calm=['arrow', 'morph', 'fill'], luxe=['fill', 'invert', 'arrow'], minimal=['arrow', 'invert', 'fill'], bold=['hard', 'fill', 'invert'],
              playful=['grow', 'morph', 'hard'], warm=['arrow', 'grow', 'morph'], dark=['invert', 'fill', 'arrow'], classic=['arrow', 'fill', 'invert'],
              fresh=['grow', 'morph', 'arrow']),
}
count = {k: Counter() for k in AXES}
bycat = Counter()
seen = set()
for t in T:
    fx = t.get('fx', [])
    m = {}
    for k, vals in AXES.items():
        pool = vals
        if k in SUITS:
            pool = [v for v in vals if any(v in SUITS[k].get(mood, []) for mood in t['moods'])] or vals
        cost = lambda v: count[k][v] + 100 * bycat[(t['cat'], k, v)] * (k in 'hp') + (zlib.crc32(f"{t['id']}{k}{v}".encode()) % 97) / 1000
        m[k] = min(pool, key=cost)
    # the whole combination must be new: nudge the free axes until it is
    for v in AXES['n'] + AXES['t']:
        if tuple(m.values()) not in seen: break
        m['n' if v in AXES['n'] else 't'] = v
    seen.add(tuple(m.values()))
    for k, v in m.items():
        count[k][v] += 1; bycat[(t['cat'], k, v)] += 1
    t['m'] = m
    if 'chars' in fx: t['fx'] = [f for f in fx if f != 'chars']
# reviews and process sections come in three layouts each
kr = kp = 0
for t in T:
    if 'reviews' in t['secs']:
        v = [None, 'grid', 'drag'][kr % 3]; kr += 1
        if v: t['rv'] = v
    if 'process' in t['secs']:
        v = [None, 'rows', 'cards'][kp % 3]; kp += 1
        if v: t['ps'] = v
if len(seen) != len(T): print('WARNING: repeated motion combinations:', len(T) - len(seen))
print('headings:', dict(count['h'])); print('photos:', dict(count['p']))
live = [(t['hero'], tuple(sorted(t.get('fx', []))), tuple(x.split(':')[0] for x in t['secs'])) for t in T if t.get('fx')]
print('interactive templates:', len(live), '| openings:', dict(Counter(h for h, _, _ in live)), '| identical set-ups:', len(live) - len(set(live)))

with io.open(os.path.join(SITE, 'data', 'templates.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('// Studio templates. Generated by tools/studio/templates.py: edit there, not here.\n')
    f.write('export const TEMPLATES = [\n')
    for t in T:
        f.write('  ' + json.dumps(t, ensure_ascii=False) + ',\n')
    f.write('];\n')

print(len(T), 'templates,', len(used), 'photos used of', len(PHOTOS))
from collections import Counter
print('heroes:', dict(Counter(t['hero'] for t in T)))
print('\n'.join(short) or 'every template has all its photos')
