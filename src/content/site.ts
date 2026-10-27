/**
 * The restaurant's own words, in ONE place: name, address, story, team,
 * events, reviews and photos. Edit freely; every page reads from here.
 * Opening hours (and so the booking times) live in `src/lib/booking.ts`;
 * the menu in `src/content/menu.ts`.
 *
 * ⚠ PLACEHOLDERS: "Fennel & Fig", the address, phone, people, events and
 * reviews below are made up for the first version. Replace them with yours
 * before going live. Reviews marked `sample: true` show a small
 * "Sample review" label on the site until you replace them and drop the flag.
 *
 * Photos are from Unsplash (free to use) and sized by Unsplash's CDN through
 * `photo()`. To use your own: put the file in `public/images/` and set the
 * `src` to `/images/your-file.jpg`.
 */

/** Search and social basics. */
export const SITE = {
  description:
    'Fennel & Fig is a neighbourhood restaurant on Stokes Croft, Bristol, cooking seasonal West Country food over a wood fire. Book a table online.',
  lang: 'en-GB',
  /** The canonical address once you have a custom domain (`https://www.example.com`, no trailing slash). */
  url: '',
};

/** PLACEHOLDER: your restaurant's details. */
export const RESTAURANT = {
  name: 'Fennel & Fig',
  /** One line under the name in the masthead. */
  tagline: 'Wood-fire cooking from the West Country',
  neighbourhood: 'Stokes Croft, Bristol',
  street: '41 Stokes Croft',
  city: 'Bristol',
  postcode: 'BS1 3QD',
  country: 'GB',
  /** A fictional number from Ofcom's drama range. Replace it. */
  phone: '0117 496 0123',
  phoneHref: 'tel:+441174960123',
  email: 'hello@example.com',
  /** For the map on /visit/ and the "Directions" link. */
  lat: 51.4632,
  lng: -2.5893,
  instagram: 'https://www.instagram.com/',
  cuisine: 'Modern British',
  priceRange: '££',
};

export interface Photo {
  /** An Unsplash photo id (`1414235077428-338989a2e8c0`) or a `/images/…` path. */
  src: string;
  alt: string;
  /** Small caption: a place, a dish, a moment. */
  caption?: string;
}

/** An image URL at a given width (Unsplash's CDN resizes; local files are served as they are). */
export function photo(src: string, width: number, height?: number): string {
  if (src.startsWith('/')) return src;
  const params = new URLSearchParams({w: String(width), q: '72', auto: 'format', fit: 'crop'});
  if (height) params.set('h', String(height));
  return `https://images.unsplash.com/photo-${src}?${params}`;
}

/** `srcset` for a photo across sensible widths. */
export function photoSet(src: string, widths: number[], ratio?: number): string {
  if (src.startsWith('/')) return '';
  return widths.map(w => `${photo(src, w, ratio ? Math.round(w * ratio) : undefined)} ${w}w`).join(', ');
}

export const PHOTOS = {
  hero: {src: '1414235077428-338989a2e8c0', alt: 'A plated main course on a candle-lit table, glasses of wine behind', caption: 'Friday, 8.40pm. Table six.'},
  fire: {src: '1600565193348-f74bd3c7ccdf', alt: 'A chef working over the flames of the wood-fired grill'},
  pass: {src: '1577219491135-ce391730fb2c', alt: 'A chef plating up at the pass under copper lamps'},
  herbs: {src: '1551218808-94e220e084d2', alt: 'Hands chopping herbs on a wooden board'},
  table: {src: '1424847651672-bf20a4b0982b', alt: 'Shared plates passed across a busy table from above'},
  bread: {src: '1509440159596-0249088772ff', alt: 'Two dark sourdough loaves with ears of wheat'},
  cheers: {src: '1510812431401-41d2bd2722f3', alt: 'Glasses of red wine raised in a toast'},
  bar: {src: '1514933651103-005eec06c04b', alt: 'The bar in the evening, bottles lit along the back wall'},
  longTable: {src: '1528605248644-14dd04022da1', alt: 'A long table of friends sharing dinner'},
  room: {src: '1590846406792-0adc7f938f1d', alt: 'The dining room at night under warm hanging lights'},
  friends: {src: '1592861956120-e524fc739696', alt: 'Friends laughing over plates of food'},
  steak: {src: '1600891964092-4316c288032e', alt: 'Sliced steak with chips on a white plate'},
  plates: {src: '1504674900247-0877df9cc836', alt: 'Plates of grilled meat, greens and sauces from above'},
  hall: {src: '1555396273-367ea4eb4db5', alt: 'The long dining room with timber tables and high windows'},
  board: {src: '1476224203421-9ac39bcb3327', alt: 'A sharing board of grilled bread, dips and pickles'},
  pasta: {src: '1621996346565-e3dbc646d9a9', alt: 'Pasta in a red sauce in a white bowl'},
  whisky: {src: '1470337458703-46ad1756a187', alt: 'A cocktail poured over a single block of ice'},
  dining: {src: '1550966871-3ed3cdb5ed0c', alt: 'A quiet dining room laid for a private party'},
} satisfies Record<string, Photo>;

export interface NavItem {
  label: string;
  href: string;
  /** `false` for a page rendered on every visit (no prefetch). */
  prefetch?: false;
}

/** The header. Every page also sits in the footer (`FOOTER_NAV`). */
export const NAV: NavItem[] = [
  {label: 'Menu', href: '/menu/'},
  {label: 'About', href: '/about/'},
  {label: 'Events', href: '/events/'},
  {label: 'Gallery', href: '/gallery/'},
  {label: 'Visit', href: '/visit/'},
  {label: 'News', href: '/news/'},
];

export const FOOTER_NAV: NavItem[] = [
  {label: 'Home', href: '/'},
  ...NAV,
  {label: 'Book a table', href: '/book/'},
  {label: 'Work with us', href: '/jobs/', prefetch: false},
];

/** The home page. */
export const HOME = {
  /** One line: who you are. */
  story: 'A forty-cover dining room on Stokes Croft, a wood fire, and whatever the West Country is growing this week.',
  storyMore:
    'Priya cooks; Sam runs the room. The menu changes when the farms change — usually every Thursday — and the bread comes out of the same oven as the hake.',
};

export interface Review {
  quote: string;
  author: string;
  source: string;
  /** Made up for the first version: shows a "Sample review" label. Remove when it is real. */
  sample?: boolean;
}

/** PLACEHOLDER reviews: replace with real ones (with permission) and remove `sample`. */
export const REVIEWS: Review[] = [
  {
    quote: 'The hake came off the fire still smoking, in a cider sauce I would happily drink. We booked again before the bill arrived.',
    author: 'Hannah R.',
    source: 'Google review',
    sample: true,
  },
  {
    quote: 'Proper Sunday lunch — beef the colour of a rose, Yorkshires the size of your head, and nobody hurrying you out.',
    author: 'Tom & Ade',
    source: 'Tripadvisor',
    sample: true,
  },
  {
    quote: 'Small, loud in the best way, and the fig leaf tart is worth crossing the city for.',
    author: 'Bristol food newsletter',
    source: 'Weekend guide',
    sample: true,
  },
];

/** The About page. PLACEHOLDER people and history. */
export const ABOUT = {
  title: 'Our story',
  lede: 'Fennel & Fig opened in a former print shop on Stokes Croft in the spring of 2021, with one oven, twelve tables and a very patient bank manager.',
  chapters: [
    {
      heading: 'One fire, one menu',
      body: [
        'Everything we cook passes through the wood-fired oven or over the grill beside it: bread first thing, then stocks, then the fish and meat at service. Cooking that way makes you choose fewer, better things.',
        'The menu is short on purpose. When the squash is finished, it comes off; when the first Brixham crab lands, it goes on. Ask what came in this morning — we will tell you.',
      ],
    },
    {
      heading: 'Close to home',
      body: [
        'Most of what we serve is grown, reared or caught within sixty miles of the door: lamb from the Mendips, cheddar from Somerset, fish landed in Brixham and Newlyn, apples and cider from orchards an hour north.',
        'We pay our suppliers on time, our team the real Living Wage or better, and we share every tip evenly between the floor and the kitchen.',
      ],
    },
  ],
  team: [
    {name: 'Priya Natarajan', role: 'Chef and co-owner', bio: 'Cooked in London and Lyon before coming home to Bristol. Runs the fire, writes the menu on Thursday mornings.', photo: PHOTOS.pass},
    {name: 'Sam Okafor', role: 'Front of house and co-owner', bio: 'Looks after the room and the wine list — mostly small growers, a lot of it from the Loire and Somerset.', photo: PHOTOS.cheers},
    {name: 'Ellis Hart', role: 'Sous chef', bio: 'Bakes the sourdough at 6am and is responsible for the Sunday Yorkshires. Has opinions about both.', photo: PHOTOS.bread},
  ],
};

export interface EventItem {
  date: string;
  title: string;
  body: string;
  price: string;
}

/** The Events page. PLACEHOLDER dates and prices: keep this list current. */
export const EVENTS = {
  title: 'Events & private dining',
  lede: 'Birthdays, work dinners, rehearsal suppers, wakes and long Sunday lunches. Tell us what you have in mind.',
  spaces: [
    {
      name: 'The Larder Room',
      seats: 'Up to 18 seated',
      body: 'Our private room behind the kitchen, with its own long oak table and a window onto the pass. A set sharing menu from £48 a head.',
      photo: PHOTOS.dining,
    },
    {
      name: 'The whole restaurant',
      seats: 'Up to 60 seated, 120 standing',
      body: 'Take over the dining room and bar for the evening, Monday or Tuesday when we are usually closed, or any day at lunch. We will build the menu with you.',
      photo: PHOTOS.longTable,
    },
  ],
  /** Ticketed nights. Remove past ones; add new ones at the top. */
  upcoming: [
    {date: 'Thursday 13 November 2026', title: 'Harvest supper club', body: 'Five courses from the last of the autumn produce, with cider pairings from a Somerset orchard. One long table, 7pm.', price: '£65 a head'},
    {date: 'Friday 28 November 2026', title: 'Wild game night', body: 'Partridge, venison and hare from the fire, with a short list of Rhône reds. A dinner for the adventurous.', price: '£58 a head'},
    {date: 'From 1 December 2026', title: 'Christmas set menus', body: 'Three courses for groups of eight and more, lunch and dinner, through to 23 December. Book the Larder Room early.', price: 'From £45 a head'},
  ] satisfies EventItem[],
};

/** The Gallery page, in order. */
export const GALLERY: Photo[] = [
  {...PHOTOS.room, caption: 'The dining room, after dark'},
  {...PHOTOS.fire, caption: 'The grill, Saturday service'},
  {...PHOTOS.table, caption: 'Plates for the middle'},
  {...PHOTOS.bread, caption: 'Sourdough, 6am'},
  {...PHOTOS.bar, caption: 'The bar'},
  {...PHOTOS.herbs, caption: 'Prep'},
  {...PHOTOS.steak, caption: 'Sirloin, dripping chips'},
  {...PHOTOS.friends, caption: 'Friday night'},
  {...PHOTOS.pass, caption: 'At the pass'},
  {...PHOTOS.board, caption: 'Something to start'},
  {...PHOTOS.whisky, caption: 'Before dinner'},
  {...PHOTOS.hall, caption: 'Lunch light'},
];

/** The Visit page. */
export const VISIT = {
  title: 'Visit us',
  lede: 'Halfway up Stokes Croft, between the bike shop and the record shop, with a fig tree painted on the window.',
  gettingHere: [
    {heading: 'On foot', body: 'Ten minutes from Cabot Circus and Broadmead; fifteen from Temple Meads.'},
    {heading: 'By bus', body: 'The 70, 71, 72, 73, 75 and 76 stop at Stokes Croft, a minute from the door.'},
    {heading: 'By car', body: 'Pay-and-display on Cheltenham Road and the NCP at Cabot Circus. There is no parking at the restaurant.'},
    {heading: 'Access', body: 'Step-free entrance and a step-free accessible toilet. Tell us when you book and we will keep a table near the door.'},
  ],
};

/** The booking page. */
export const BOOK = {
  title: 'Book a table',
  lede: 'Tables for up to eight, up to ninety days ahead. We keep a few seats at the bar every night for walk-ins.',
  policy: [
    'Your booking is a request until we confirm it by email or phone, usually within a few hours.',
    'We hold tables for fifteen minutes. Running late? Call us.',
    'For nine or more, or the Larder Room, send a private dining enquiry instead.',
  ],
};
