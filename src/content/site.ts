/**
 * The site's own words: name, navigation, services, stylists, hours, openings,
 * reviews and every page's copy. Edit freely. Every string is plain text
 * (rendered escaped).
 *
 * Anything marked `SAMPLE` was invented for the first version: replace it with
 * the salon's real details before publishing.
 */

export const SITE = {
  /** SAMPLE: the salon's name. `short` is the lowercase wordmark in the header. */
  name: 'Juniper Hair Studio',
  short: 'juniper',
  /** One sentence: the home page's meta description and the footer line. */
  description:
    'Juniper is a calm, light-filled hair salon on Alberta Street in Portland for considered cuts, lived-in colour and curls cut the way they grow.',
  /** `en`, `fr`, … : the page language (screen readers, search engines). */
  lang: 'en',
  /**
   * The site's public address, for canonical URLs and social cards
   * (`https://www.example.com`, no trailing slash). Leave empty until known.
   */
  url: '',
};

export interface NavItem {
  label: string;
  href: string;
}

/** Header and footer navigation: pages of THIS site only, plain links. "Book now" is the button beside it. */
export const NAV: NavItem[] = [
  {label: 'Services', href: '/services/'},
  {label: 'Stylists', href: '/stylists/'},
  {label: 'Gallery', href: '/gallery/'},
  {label: 'Gift cards', href: '/gift-cards/'},
  {label: 'Our story', href: '/about/'},
  {label: 'Journal', href: '/blog/'},
  {label: 'Visit us', href: '/visit/'},
];

export const BOOK = {label: 'Book now', href: '/book/'};

/* ------------------------------------------------------------------ */
/* The salon: contact, address, hours                                 */
/* ------------------------------------------------------------------ */

export const CONTACT = {
  /** SAMPLE: shown as a mailto: link and where the booking and gift card requests go. Use an address you read. */
  email: 'hello@example.com',
  /** SAMPLE: the salon's phone, as shown and as dialled. */
  phone: '(503) 555-0142',
  phoneHref: 'tel:+15035550142',
  /** SAMPLE: can take texts? Say so; leave '' if not. */
  textNote: 'Calls and texts both reach the front desk.',
  /**
   * Optional: an https:// link to a form hosted elsewhere (a form service the
   * owner uses). Empty = the email link only. A static site cannot receive posts.
   */
  formUrl: '',
};

/** SAMPLE: the address and the map pin. Get the latitude/longitude from openstreetmap.org (right-click → Show address). */
export const ADDRESS = {
  street: '2417 NE Alberta Street',
  city: 'Portland, OR 97211',
  neighbourhood: 'Alberta Arts District',
  lat: 45.5590,
  lon: -122.6418,
  directions: [
    {title: 'By bus', body: 'The 72 stops at NE Alberta & 24th, a one-minute walk away.'},
    {title: 'By car', body: 'Free two-hour street parking on NE 24th and 25th Avenue. Alberta Street itself fills up on weekends.'},
    {title: 'By bike', body: 'There is a bike rack right outside the door, and the Alberta greenway runs past it.'},
    {title: 'Step-free', body: 'One level from the street, with a wide door and an accessible washroom.'},
  ],
};

/** SAMPLE: opening hours, Monday first. `open: ''` = closed. Times in 24 h for the page's <time> tags. */
export const HOURS = [
  {day: 'Monday', open: '', close: ''},
  {day: 'Tuesday', open: '10:00', close: '19:00'},
  {day: 'Wednesday', open: '10:00', close: '19:00'},
  {day: 'Thursday', open: '10:00', close: '20:00'},
  {day: 'Friday', open: '10:00', close: '20:00'},
  {day: 'Saturday', open: '09:00', close: '17:00'},
  {day: 'Sunday', open: '11:00', close: '16:00'},
];

/** The deposit and cancellation terms shown on the booking page and services page. */
export const POLICY = {
  /** SAMPLE amount. */
  deposit: '$10',
  points: [
    'Your $10 deposit holds the time and comes off your bill on the day.',
    'Need to move or cancel? Tell us 24 hours ahead and the deposit moves with you or comes back in full.',
    'Missed appointments, or cancellations inside 24 hours, keep the deposit.',
    'Running late? Call or text. Past 15 minutes we may need to shorten the service or rebook.',
  ],
};

/* ------------------------------------------------------------------ */
/* Services                                                           */
/* ------------------------------------------------------------------ */

export interface Service {
  /** Used in booking links (`/book/?service=<id>`). Lowercase, dashes, unique. */
  id: string;
  name: string;
  body: string;
  /** How long to set aside, as shown. */
  length: string;
  /** SAMPLE prices: as shown ("$78", "from $220"). */
  price: string;
}

export interface ServiceGroup {
  id: string;
  title: string;
  intro: string;
  items: Service[];
}

/** SAMPLE: every service, length and price below is a placeholder. */
export const SERVICES: ServiceGroup[] = [
  {
    id: 'cuts',
    title: 'Cuts & styling',
    intro: 'Every cut starts with a proper conversation and ends with a finish you can recreate at home.',
    items: [
      {id: 'signature-cut', name: 'Signature cut & finish', body: 'Consultation, wash, scalp massage, precision cut and blow-dry.', length: '60 min', price: '$78'},
      {id: 'short-cut', name: 'Short cut & refresh', body: 'For crops, pixies and keeping a short shape sharp between full cuts.', length: '45 min', price: '$55'},
      {id: 'curly-cut', name: 'Curly cut', body: 'Cut dry, curl by curl, then washed and diffused so you see how it really sits.', length: '75 min', price: '$95'},
      {id: 'blow-dry', name: 'Blow-dry & style', body: 'Smooth, bouncy or undone. Wash included.', length: '45 min', price: '$50'},
      {id: 'fringe', name: 'Fringe tidy', body: 'A quick trim for bangs between appointments.', length: '15 min', price: '$15'},
    ],
  },
  {
    id: 'colour',
    title: 'Colour',
    intro: 'Soft, lived-in colour that grows out gracefully. New colour clients need a patch test 48 hours before.',
    items: [
      {id: 'root-touch-up', name: 'Root touch-up', body: 'Regrowth up to 3 cm, with a gloss to tie it together.', length: '90 min', price: '$95'},
      {id: 'all-over-colour', name: 'All-over colour', body: 'One rich, even shade from root to tip.', length: '2 hrs', price: '$130'},
      {id: 'partial-highlights', name: 'Partial highlights', body: 'Foils around the face and parting for brightness where it shows.', length: '2 hrs', price: '$150'},
      {id: 'balayage', name: 'Full balayage', body: 'Hand-painted, sun-faded colour with a toner and blow-dry.', length: '3 hrs', price: 'from $220'},
      {id: 'gloss', name: 'Gloss & tone', body: 'Refreshes faded colour and adds shine. Lovely on its own.', length: '45 min', price: '$60'},
    ],
  },
  {
    id: 'treatments',
    title: 'Treatments',
    intro: 'Quiet extras for hair and scalp. Add one to any appointment or book it on its own.',
    items: [
      {id: 'scalp-ritual', name: 'Scalp ritual', body: 'Exfoliating cleanse, warm towel and a ten-minute head massage.', length: '30 min', price: '$45'},
      {id: 'bond-repair', name: 'Bond-repair treatment', body: 'Rebuilds strength in coloured, heat-styled or brittle hair.', length: '30 min', price: '$40'},
      {id: 'keratin', name: 'Keratin smoothing', body: 'Cuts frizz and drying time for up to four months.', length: '2 hrs 30', price: 'from $260'},
    ],
  },
  {
    id: 'occasions',
    title: 'Weddings & events',
    intro: 'Calm hands on a big day. For wedding parties of three or more, call us to plan the morning.',
    items: [
      {id: 'bridal-trial', name: 'Bridal trial', body: 'We try two looks, photograph both and plan the day together.', length: '90 min', price: '$120'},
      {id: 'wedding-day', name: 'Wedding-day styling', body: 'Your chosen look, pinned to last through the last dance.', length: '75 min', price: '$150'},
      {id: 'event-updo', name: 'Updo & event styling', body: 'For parties, galas and anything with a dress code.', length: '60 min', price: '$85'},
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Stylists                                                           */
/* ------------------------------------------------------------------ */

export interface Stylist {
  /** Used in booking links (`/book/?stylist=<id>`) and to pick the photo (src/lib/photos.ts). */
  id: string;
  name: string;
  role: string;
  bio: string;
  /** "Book Maya for…" */
  bestFor: string[];
  /** SAMPLE: shown under the name. */
  since: string;
}

/** SAMPLE: names, bios and photos are placeholders for the real team. */
export const STYLISTS: Stylist[] = [
  {
    id: 'maya',
    name: 'Maya Reyes',
    role: 'Founder & creative director',
    bio: 'Maya opened Juniper after twelve years in busy downtown salons, wanting somewhere slower. She cuts with scissors and patience, and her bobs hold their shape for weeks after.',
    bestFor: ['Precision bobs and lobs', 'Big changes, done gently', 'Fine hair that needs body'],
    since: 'Cutting since 2011',
  },
  {
    id: 'theo',
    name: 'Theo Marsh',
    role: 'Colour specialist',
    bio: 'Theo paints colour by hand and thinks in grow-out: what your hair will look like in ten weeks matters as much as today. Ask him about going lighter without the damage.',
    bestFor: ['Balayage and lived-in blonde', 'Colour correction', 'Blending grey'],
    since: 'Colouring since 2014',
  },
  {
    id: 'lena',
    name: 'Lena Varga',
    role: 'Curl specialist',
    bio: 'Lena cuts curls dry, one at a time, so they spring back exactly where she meant them to. She will also show you a wash-day routine you can do in fifteen minutes.',
    bestFor: ['Curly, coily and wavy cuts', 'Growing out a perm or relaxer', 'Curl care routines'],
    since: 'Cutting since 2016',
  },
  {
    id: 'rosa',
    name: 'Rosa Delgado',
    role: 'Senior stylist',
    bio: 'Rosa is the calm person you want holding the pins on a wedding morning. Her blow-dries are known up and down Alberta Street for lasting the whole weekend.',
    bestFor: ['Bridal and event hair', 'Blow-dries that last', 'Long hair and updos'],
    since: 'Styling since 2013',
  },
];

/* ------------------------------------------------------------------ */
/* Home                                                               */
/* ------------------------------------------------------------------ */

export const HOME = {
  hero: {
    eyebrow: 'Hair salon · Alberta Arts District, Portland',
    title: 'Hair that feels like yours, only better',
    body: 'Considered cuts, soft lived-in colour and curls cut the way they grow, in a quiet, light-filled studio where nobody rushes you.',
  },
  intro: {
    title: 'What we do',
    items: [
      {title: 'Cuts & styling', body: 'Precision cuts, curly cuts and blow-dries, each with a proper consultation first.', from: 'from $50', href: '/services/#cuts'},
      {title: 'Colour', body: 'Balayage, highlights, glosses and grey blending that grow out softly.', from: 'from $60', href: '/services/#colour'},
      {title: 'Treatments', body: 'Scalp rituals, bond repair and smoothing for hair that needs care.', from: 'from $40', href: '/services/#treatments'},
      {title: 'Weddings & events', body: 'Trials, wedding mornings and updos that last until the last dance.', from: 'from $85', href: '/services/#occasions'},
    ],
  },
  cta: {
    title: 'Your chair is waiting',
    body: 'Pick a service, a stylist and a time. A $10 deposit holds it, and we text you a reminder the day before.',
  },
};

/**
 * SAMPLE: "this week's openings". A static site cannot read your diary, so this
 * list is typed in here and goes live at the next Publish. Update it every
 * Monday (or delete the section from src/pages/index.astro).
 */
export const OPENINGS = {
  updated: 'Updated Tuesday 27 October',
  items: [
    {day: 'Wed 28 Oct', time: '2:30 pm', stylist: 'maya', note: 'Good for a cut & finish'},
    {day: 'Thu 29 Oct', time: '10:00 am', stylist: 'theo', note: 'Long enough for balayage'},
    {day: 'Thu 29 Oct', time: '6:00 pm', stylist: 'rosa', note: 'Blow-dry or updo'},
    {day: 'Fri 30 Oct', time: '11:30 am', stylist: 'lena', note: 'Curly cut'},
    {day: 'Sat 31 Oct', time: '9:00 am', stylist: 'rosa', note: 'Any cut or style'},
    {day: 'Sun 1 Nov', time: '1:00 pm', stylist: 'maya', note: 'Cut, gloss or both'},
  ],
};

/** SAMPLE reviews: invented for the first version. Replace with real ones (with permission) and set `sample: false`. */
export const REVIEWS = [
  {
    quote: 'Lena is the first person who has ever cut my curls dry. I walked out and they just… sat right. Three weeks on and they still do.',
    name: 'Danielle K.',
    detail: 'Curly cut with Lena',
    sample: true,
  },
  {
    quote: 'I asked Theo for “expensive-looking blonde that doesn’t need me back in six weeks”. Four months later I am finally booking again because I want to, not because I have to.',
    name: 'Sam O.',
    detail: 'Balayage with Theo',
    sample: true,
  },
  {
    quote: 'The calmest salon I have ever sat in. No blaring music, a proper cup of tea, and Maya actually listened before she picked up the scissors.',
    name: 'Priya M.',
    detail: 'Signature cut with Maya',
    sample: true,
  },
];

/* ------------------------------------------------------------------ */
/* Other pages                                                        */
/* ------------------------------------------------------------------ */

export const SERVICES_PAGE = {
  title: 'Services & prices',
  lede: 'Every service, how long to set aside and what it costs. Prices include a wash and finish unless noted; longer or thicker hair may need a little more time.',
};

export const STYLISTS_PAGE = {
  title: 'Meet the stylists',
  lede: 'Four stylists, each with a speciality. Not sure who to book? Choose “first available” and tell us about your hair; we will match you.',
};

export const GALLERY_PAGE = {
  title: 'Our work',
  lede: 'Cuts, colour and curls from the studio. Photos are shared with each client’s permission.',
};

export const BOOK_PAGE = {
  title: 'Book an appointment',
  lede: 'Choose a service, a stylist and a time that suits you. We confirm by text, take the $10 deposit and send a reminder the day before.',
};

export const VISIT_PAGE = {
  title: 'Visit us',
  lede: 'A bright corner studio on Alberta Street, with big windows, four chairs and a kettle that is always on.',
};

/** SAMPLE amounts and terms: check them against your local gift card rules. */
export const GIFT_CARDS = {
  title: 'Gift cards',
  lede: 'An afternoon of being looked after, in an envelope. Gift cards work for any service or product, with any stylist.',
  amounts: ['$50', '$100', '$150', '$250'],
  custom: 'Or any amount from $25',
  ways: [
    {title: 'In the studio', body: 'Pick one up at the front desk in a linen envelope, ready to give. Takes two minutes.'},
    {title: 'By phone', body: 'Call us during opening hours, pay by card and we post it or email it the same day.'},
    {title: 'By email', body: 'Send the form below. We reply within a day to take payment by phone, then send the card.'},
  ],
  terms: [
    'Valid for three years from the date of purchase.',
    'Use it for any service, treatment or product, in one visit or several.',
    'Lost card? We keep a record of every one we sell, so we can replace it.',
  ],
};

export const ABOUT = {
  title: 'Our story',
  lede: 'Juniper started with a simple idea: a salon where you can hear yourself think.',
  sections: [
    {
      heading: 'Why we opened',
      body: 'After twelve years in busy downtown salons, Maya wanted a place with fewer chairs and longer appointments. In 2021 she found a corner shop on Alberta Street with tall windows and good light, and Juniper opened that spring.',
    },
    {
      heading: 'How we work',
      body: 'Every appointment starts sitting down, with time to talk about your hair, your mornings and what you have liked or hated before. We never double-book a chair, so the person who starts your service finishes it.',
    },
    {
      heading: 'What we use',
      body: 'Low-ammonia colour, vegan care products and refillable bottles at the basin. Foils and colour tubes are recycled through a salon recycling programme, and the towels are washed in-house.',
    },
  ],
};
