// Studio type pairings: display face + text face, with the settings each display face is drawn at.
// Pairings and settings from the Taste skill library (MIT, Leonxlnx). Fonts load from Google Fonts or
// Fontshare (both free for commercial use).
// w: display weight · track: letter-spacing · lead: line-height · upper: capitals · it: italic display
// wdth: font-stretch for variable-width faces · k: size factor (wide faces smaller, condensed larger)
const G = q => `https://fonts.googleapis.com/css2?${q}&display=swap`;
const F = q => `https://api.fontshare.com/v2/css?${q}&display=swap`;

export const FONTS = [
  { id: 'switzer-semibold', name: 'Switzer', cls: 'grotesk', d: 'Switzer', t: 'Switzer', w: 600, track: '-0.04em', lead: 0.95, k: 1, href: [F('f[]=switzer@400,500,600')] },
  { id: 'general-sans-bold', name: 'General Sans', cls: 'grotesk', d: 'General Sans', t: 'General Sans', w: 700, track: '-0.03em', lead: 0.92, k: 1, href: [F('f[]=general-sans@400,500,700')] },
  { id: 'schibsted-heavy', name: 'Schibsted Grotesk', cls: 'grotesk', d: 'Schibsted Grotesk', t: 'Schibsted Grotesk', w: 800, track: '-0.05em', lead: 0.9, k: 1, href: [G('family=Schibsted+Grotesk:wght@400;600;800')] },
  { id: 'hanken-medium', name: 'Hanken Grotesk', cls: 'grotesk', d: 'Hanken Grotesk', t: 'Hanken Grotesk', w: 500, track: '-0.05em', lead: 0.92, k: 1, href: [G('family=Hanken+Grotesk:wght@400;500;600')] },
  { id: 'bricolage-contrast', name: 'Bricolage Grotesque', cls: 'grotesk', d: 'Bricolage Grotesque', t: 'Bricolage Grotesque', w: 600, track: '-0.04em', lead: 0.92, k: 1, href: [G('family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600')] },
  { id: 'franklin-source', name: 'Libre Franklin + Source Serif', cls: 'grotesk', d: 'Libre Franklin', t: 'Source Serif 4', w: 700, track: '-0.035em', lead: 0.92, k: 0.95, href: [G('family=Libre+Franklin:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400')] },
  { id: 'archivo-regular', name: 'Archivo', cls: 'grotesk', d: 'Archivo', t: 'Archivo', w: 400, track: '-0.03em', lead: 1, k: 1, href: [G('family=Archivo:wght@400;500;600')] },
  { id: 'clash-grotesk', name: 'Clash Grotesk', cls: 'grotesk', d: 'Clash Grotesk', t: 'Switzer', w: 500, track: '-0.03em', lead: 0.95, k: 1, href: [F('f[]=clash-grotesk@400,500,600'), F('f[]=switzer@400,500')] },
  { id: 'work-sans-light', name: 'Work Sans', cls: 'grotesk', d: 'Work Sans', t: 'Work Sans', w: 300, track: '-0.035em', lead: 1, k: 1.02, href: [G('family=Work+Sans:wght@300;400;500;600')] },
  { id: 'anton-work', name: 'Anton + Work Sans', cls: 'condensed', d: 'Anton', t: 'Work Sans', w: 400, track: '-0.01em', lead: 0.88, upper: true, k: 1.22, href: [G('family=Anton&family=Work+Sans:wght@400;500;600')] },
  { id: 'big-shoulders-public', name: 'Big Shoulders + Public Sans', cls: 'condensed', d: 'Big Shoulders', t: 'Public Sans', w: 800, track: '0em', lead: 0.88, upper: true, k: 1.25, href: [G('family=Big+Shoulders:wght@800&family=Public+Sans:wght@400;500;600')] },
  { id: 'archivo-compressed', name: 'Archivo Compressed', cls: 'condensed', d: 'Archivo', t: 'Archivo', w: 800, wdth: '62%', track: '-0.01em', lead: 0.88, upper: true, k: 1.3, href: [G('family=Archivo:wdth,wght@62..125,400..800')] },
  { id: 'bebas-garamond', name: 'Bebas Neue + EB Garamond', cls: 'condensed', d: 'Bebas Neue', t: 'EB Garamond', w: 400, track: '-0.02em', lead: 0.86, upper: true, k: 1.3, href: [G('family=Bebas+Neue&family=EB+Garamond:ital,wght@0,400;0,500;1,400')] },
  { id: 'barlow-condensed', name: 'Barlow Condensed', cls: 'condensed', d: 'Barlow Condensed', t: 'Barlow', w: 700, track: '-0.02em', lead: 0.9, upper: true, k: 1.22, href: [G('family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600')] },
  { id: 'panchang-switzer', name: 'Panchang + Switzer', cls: 'extended', d: 'Panchang', t: 'Switzer', w: 700, track: '-0.02em', lead: 1, upper: true, k: 0.66, href: [F('f[]=panchang@700'), F('f[]=switzer@400,500,600')] },
  { id: 'unbounded-onest', name: 'Unbounded + Onest', cls: 'extended', d: 'Unbounded', t: 'Onest', w: 800, track: '-0.03em', lead: 1, upper: true, k: 0.72, href: [G('family=Unbounded:wght@700;800&family=Onest:wght@400;500;600')] },
  { id: 'chivo-black', name: 'Chivo Black', cls: 'heavy', d: 'Chivo', t: 'Chivo', w: 900, track: '-0.05em', lead: 0.88, upper: true, k: 0.92, href: [G('family=Chivo:wght@400;500;700;900')] },
  { id: 'cabinet-grotesk', name: 'Cabinet Grotesk', cls: 'heavy', d: 'Cabinet Grotesk', t: 'Cabinet Grotesk', w: 800, track: '-0.035em', lead: 0.9, k: 1, href: [F('f[]=cabinet-grotesk@400,500,700,800')] },
  { id: 'epilogue-black', name: 'Epilogue Black', cls: 'heavy', d: 'Epilogue', t: 'Epilogue', w: 900, track: '-0.045em', lead: 0.9, k: 0.95, href: [G('family=Epilogue:wght@400;500;600;900')] },
  { id: 'red-hat-black', name: 'Red Hat Display', cls: 'heavy', d: 'Red Hat Display', t: 'Red Hat Text', w: 900, track: '-0.03em', lead: 0.92, upper: true, k: 0.9, href: [G('family=Red+Hat+Display:wght@700;900&family=Red+Hat+Text:wght@400;500;600')] },
  { id: 'jost-caps', name: 'Jost', cls: 'geometric', d: 'Jost', t: 'Jost', w: 700, track: '-0.03em', lead: 0.9, upper: true, k: 0.95, href: [G('family=Jost:wght@400;500;600;700')] },
  { id: 'albert-sans-semibold', name: 'Albert Sans', cls: 'geometric', d: 'Albert Sans', t: 'Albert Sans', w: 600, track: '-0.035em', lead: 1, k: 1, href: [G('family=Albert+Sans:wght@400;500;600')] },
  { id: 'spartan-figtree', name: 'League Spartan + Figtree', cls: 'geometric', d: 'League Spartan', t: 'Figtree', w: 700, track: '-0.04em', lead: 0.9, k: 1, href: [G('family=League+Spartan:wght@700&family=Figtree:wght@400;500;600')] },
  { id: 'pilcrow-rounded', name: 'Pilcrow Rounded', cls: 'rounded', d: 'Pilcrow Rounded', t: 'Pilcrow Rounded', w: 700, track: '-0.045em', lead: 0.92, k: 1, href: [F('f[]=pilcrow-rounded@400,500,700')] },
  { id: 'chillax-semibold', name: 'Chillax', cls: 'rounded', d: 'Chillax', t: 'Chillax', w: 600, track: '-0.03em', lead: 1, k: 1, href: [F('f[]=chillax@400,500,600')] },
  { id: 'gambarino-general', name: 'Gambarino + General Sans', cls: 'serif', d: 'Gambarino', t: 'General Sans', w: 400, track: '-0.02em', lead: 0.94, k: 1.04, href: [F('f[]=gambarino@400'), F('f[]=general-sans@400,500,600')] },
  { id: 'bodoni-jost', name: 'Bodoni Moda + Jost', cls: 'serif', d: 'Bodoni Moda', t: 'Jost', w: 500, track: '-0.02em', lead: 0.96, k: 1, href: [G('family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;1,6..96,500&family=Jost:wght@400;500;600')] },
  { id: 'imbue-albert', name: 'Imbue + Albert Sans', cls: 'serif', d: 'Imbue', t: 'Albert Sans', w: 400, track: '-0.01em', lead: 0.9, upper: true, k: 1.18, href: [G('family=Imbue:opsz,wght@10..100,400&family=Albert+Sans:wght@400;500;600')] },
  { id: 'erode-sharp', name: 'Erode', cls: 'serif', d: 'Erode', t: 'Erode', w: 500, track: '-0.025em', lead: 0.96, k: 1, href: [F('f[]=erode@400,500,600')] },
  { id: 'boska-italic', name: 'Boska', cls: 'serif', d: 'Boska', t: 'General Sans', w: 400, track: '-0.02em', lead: 0.95, it: true, k: 1.05, href: [F('f[]=boska@400,401'), F('f[]=general-sans@400,500,600')] },
  { id: 'newsreader-light', name: 'Newsreader', cls: 'serif', d: 'Newsreader', t: 'Newsreader', w: 300, track: '-0.045em', lead: 0.92, k: 1.08, href: [G('family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400')] },
  { id: 'zodiak-hanken', name: 'Zodiak + Hanken Grotesk', cls: 'serif', d: 'Zodiak', t: 'Hanken Grotesk', w: 300, track: '-0.015em', lead: 1, k: 1, href: [F('f[]=zodiak@300,400'), G('family=Hanken+Grotesk:wght@400;500;600')] },
  { id: 'sentient-light', name: 'Sentient', cls: 'serif', d: 'Sentient', t: 'Sentient', w: 300, track: '-0.02em', lead: 1, k: 1.02, href: [F('f[]=sentient@300,400,500')] },
  { id: 'eb-garamond', name: 'EB Garamond', cls: 'serif', d: 'EB Garamond', t: 'EB Garamond', w: 400, track: '-0.015em', lead: 1.02, k: 1.04, href: [G('family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500')] },
  { id: 'literata-book', name: 'Literata', cls: 'serif', d: 'Literata', t: 'Literata', w: 500, track: '-0.025em', lead: 1.02, k: 0.96, href: [G('family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;1,7..72,400')] },
  { id: 'young-source', name: 'Young Serif + Source Serif', cls: 'serif', d: 'Young Serif', t: 'Source Serif 4', w: 400, track: '-0.025em', lead: 0.98, k: 0.95, href: [G('family=Young+Serif&family=Source+Serif+4:ital,wght@0,400;0,600;1,400')] },
  { id: 'zilla-slab', name: 'Zilla Slab', cls: 'slab', d: 'Zilla Slab', t: 'Zilla Slab', w: 600, track: '-0.025em', lead: 1, k: 1, href: [G('family=Zilla+Slab:ital,wght@0,400;0,500;0,600;1,400')] },
  { id: 'besley-franklin', name: 'Besley + Libre Franklin', cls: 'slab', d: 'Besley', t: 'Libre Franklin', w: 800, track: '-0.025em', lead: 0.95, k: 0.95, href: [G('family=Besley:wght@700;800&family=Libre+Franklin:wght@400;500;600')] },
  { id: 'rokkitt-literata', name: 'Rokkitt + Literata', cls: 'slab', d: 'Rokkitt', t: 'Literata', w: 800, track: '-0.01em', lead: 0.86, upper: true, k: 1.1, href: [G('family=Rokkitt:wght@800&family=Literata:ital,wght@0,400;0,600;1,400')] },
];
