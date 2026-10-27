/**
 * The menu (`/menu/`). Edit the dishes and prices here; it goes live with the
 * next Publish. Day-to-day dishes belong on TODAY'S SPECIALS instead
 * (`/portal/specials`), which change without a Publish.
 *
 * ⚠ PLACEHOLDER dishes and prices: every price below is made up for the
 * first version. Replace them with your own.
 *
 * Prices are in pence (1450 = £14.50). Tags: `v` vegetarian, `ve` vegan,
 * `gf` gluten-free.
 */

export type DietTag = 'v' | 've' | 'gf';

export interface Dish {
  name: string;
  description: string;
  price: number;
  tags?: DietTag[];
}

export interface MenuSection {
  /** URL anchor: `/menu/#from-the-fire`. */
  id: string;
  title: string;
  note?: string;
  dishes: Dish[];
}

export const MENU_NOTE = 'Autumn menu · from 22 October 2026. A discretionary 12.5% service charge is shared by the whole team.';

export const DIET_LABELS: Record<DietTag, string> = {v: 'Vegetarian', ve: 'Vegan', gf: 'Gluten-free'};

export const MENU: MenuSection[] = [
  {
    id: 'snacks',
    title: 'Snacks',
    dishes: [
      {name: 'House sourdough', description: 'Baked in the wood oven this morning, cultured butter', price: 450, tags: ['v']},
      {name: 'Padrón peppers', description: 'Blistered on the grill, smoked sea salt', price: 600, tags: ['ve', 'gf']},
      {name: 'Cheddar gougères', description: 'Somerset cheddar, warm from the oven', price: 650, tags: ['v']},
      {name: 'Smoked mackerel pâté', description: 'Pickled cucumber, grilled flatbread', price: 750},
    ],
  },
  {
    id: 'to-start',
    title: 'To start',
    dishes: [
      {name: 'Roast delica squash', description: 'Whipped feta, sage brown butter, toasted pumpkin seeds', price: 950, tags: ['v', 'gf']},
      {name: 'Chalk-stream trout tartare', description: 'Dill crème fraîche, apple, rye crisp', price: 1100},
      {name: 'Ham hock terrine', description: 'House piccalilli, toasted sourdough', price: 1000},
      {name: 'Ember-baked beetroot', description: 'Hazelnut, horseradish, bitter leaves', price: 900, tags: ['ve', 'gf']},
    ],
  },
  {
    id: 'from-the-fire',
    title: 'From the fire',
    note: 'Everything here is cooked over oak and apple wood.',
    dishes: [
      {name: 'Cornish hake', description: 'Mussels, leeks, Somerset cider sauce', price: 2400, tags: ['gf']},
      {name: 'Mendip lamb rump', description: 'Smoked aubergine, salsa verde, crispy potatoes', price: 2700, tags: ['gf']},
      {name: 'Half free-range chicken', description: 'Harissa, charred hispi cabbage, garlic yoghurt', price: 2100, tags: ['gf']},
      {name: '35-day aged sirloin, 300g', description: 'Beef-dripping chips, green peppercorn sauce', price: 3200},
      {name: 'Wild mushroom pappardelle', description: 'Hand-rolled pasta, Old Winchester, thyme', price: 1800, tags: ['v']},
    ],
  },
  {
    id: 'sides',
    title: 'On the side',
    dishes: [
      {name: 'Beef-dripping chips', description: 'Rosemary salt', price: 550, tags: ['gf']},
      {name: 'Greens', description: 'Cavolo nero, lemon, chilli', price: 500, tags: ['ve', 'gf']},
      {name: 'Leaf salad', description: 'Mustard dressing', price: 450, tags: ['ve', 'gf']},
    ],
  },
  {
    id: 'puddings',
    title: 'Puddings',
    dishes: [
      {name: 'Fig leaf custard tart', description: 'Wood-roast figs — the one we are named after', price: 850, tags: ['v']},
      {name: 'Dark chocolate mousse', description: 'Honeycomb, crème fraîche', price: 800, tags: ['v', 'gf']},
      {name: 'Baked Bramley apple', description: 'Oat crumble, Cornish clotted cream', price: 800, tags: ['v']},
      {name: 'West Country cheeses', description: 'Three cheeses, oatcakes, quince', price: 1100, tags: ['v']},
    ],
  },
  {
    id: 'sunday',
    title: 'Sunday lunch',
    note: 'Sundays only, 12 – 4pm. Served with roast potatoes, Yorkshire pudding, greens and gravy.',
    dishes: [
      {name: 'Roast sirloin of beef', description: 'Horseradish cream', price: 2600},
      {name: 'Slow-roast pork belly', description: 'Crackling, apple sauce', price: 2300, tags: ['gf']},
      {name: 'Squash, chestnut and sage wellington', description: 'Onion gravy', price: 2000, tags: ['ve']},
    ],
  },
];

/** The drinks, in a few honest lines. PLACEHOLDER prices. */
export const DRINKS = [
  {name: 'Wine', body: 'Around forty bottles, mostly small growers, many low-intervention. Every wine is available by the glass from £6.50.'},
  {name: 'Cider & beer', body: 'Somerset ciders from the orchard, and two Bristol-brewed beers on tap, from £5.50.'},
  {name: 'Without alcohol', body: 'House shrubs, kombucha and an apple and elderflower spritz, from £3.50.'},
];
