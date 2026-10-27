/**
 * Every photo the pages use, imported from `src/assets/salon/` so astro:assets
 * resizes them and makes AVIF/WebP at build. To swap a photo, replace the file
 * with one of the same name (or change the import), and update its `alt`.
 *
 * SAMPLE: all photos are from Unsplash, standing in for the salon's own.
 */
import type {ImageMetadata} from 'astro';

import gift from '../assets/salon/gift.jpg';
import heroBlowDry from '../assets/salon/hero-blow-dry.jpg';
import interiorBright from '../assets/salon/interior-bright.jpg';
import interiorChairs from '../assets/salon/interior-chairs.jpg';
import interiorMono from '../assets/salon/interior-mono.jpg';
import stylistLena from '../assets/salon/stylist-lena.jpg';
import stylistMaya from '../assets/salon/stylist-maya.jpg';
import stylistRosa from '../assets/salon/stylist-rosa.jpg';
import stylistTheo from '../assets/salon/stylist-theo.jpg';
import team from '../assets/salon/team.jpg';
import tools from '../assets/salon/tools.jpg';
import workBalayage from '../assets/salon/work-balayage.jpg';
import workBlowDry from '../assets/salon/work-blow-dry.jpg';
import workBob from '../assets/salon/work-bob.jpg';
import workCurls from '../assets/salon/work-curls.jpg';
import workLavender from '../assets/salon/work-lavender.jpg';
import workPink from '../assets/salon/work-pink.jpg';
import workWash from '../assets/salon/work-wash.jpg';
import workWashDark from '../assets/salon/work-wash-dark.jpg';

export interface Photo {
  src: ImageMetadata;
  alt: string;
}

export const PHOTOS = {
  hero: {src: heroBlowDry, alt: 'A stylist blow-dries a client’s short bob in a bright, white salon'},
  team: {src: team, alt: 'Three stylists laughing together, holding brushes and scissors'},
  interiorBright: {src: interiorBright, alt: 'The salon floor: round mirrors, black chairs and a long, light-filled room'},
  interiorChairs: {src: interiorChairs, alt: 'A row of styling chairs facing a wide mirror under white light'},
  interiorMono: {src: interiorMono, alt: 'Styling stations beside tall factory windows'},
  tools: {src: tools, alt: 'A hairdryer, round brush, paddle brush and combs laid out on white'},
  gift: {src: gift, alt: 'A rolled towel, a pump bottle, a candle and pink tulips on a white table'},
} satisfies Record<string, Photo>;

/** The gallery, in order. `tall` photos take two rows on wide screens. */
export const GALLERY: (Photo & {caption: string; tall?: boolean})[] = [
  {src: workBalayage, alt: 'Long hair with soft, sun-faded caramel balayage, seen from behind', caption: 'Hand-painted balayage'},
  {src: workLavender, alt: 'Long lavender hair in loose waves', caption: 'Pastel lavender, toned and waved', tall: true},
  {src: workCurls, alt: 'A full, rounded shape of natural coily hair', caption: 'Coily cut, shaped dry'},
  {src: workBob, alt: 'A woman by a lake with a glossy copper chin-length bob', caption: 'Copper bob'},
  {src: workBlowDry, alt: 'A stylist blow-dries long hair over a round brush', caption: 'The finish'},
  {src: workWash, alt: 'A stylist washing a client’s hair at a basin', caption: 'Every visit starts at the basin', tall: true},
  {src: workPink, alt: 'Bright pink hair flying in motion', caption: 'Vivid pink, for the brave'},
  {src: workWashDark, alt: 'Hands rinsing blonde hair at a basin in low light', caption: 'The scalp ritual'},
  {src: interiorMono, alt: 'Styling stations beside tall factory windows', caption: 'The studio in the morning'},
];

export const STYLIST_PHOTOS: Record<string, Photo> = {
  maya: {src: stylistMaya, alt: 'Portrait of Maya, smiling, in a white T-shirt'},
  theo: {src: stylistTheo, alt: 'Portrait of Theo in a black roll-neck'},
  lena: {src: stylistLena, alt: 'Portrait of Lena in a striped shirt, outdoors at golden hour'},
  rosa: {src: stylistRosa, alt: 'Portrait of Rosa, smiling, in a red top'},
};
