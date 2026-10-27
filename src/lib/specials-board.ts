import {formatPrice} from './booking';
import type {Special} from './types';
import {siteFetch} from '../platform/browser';

/**
 * BROWSER: fills a "Today's specials" block (home page, menu page) from
 * `/site-api/specials`. The block holds a `[data-list]` list and three notes,
 * `[data-state="loading" | "empty" | "error"]`; exactly one of the four shows.
 * Text only (`textContent`): nothing from the answer is parsed as HTML.
 */
export async function fillSpecials(section: HTMLElement): Promise<void> {
  const list = section.querySelector<HTMLElement>('[data-list]');
  if (!list) return;
  const show = (state: 'loading' | 'empty' | 'error' | 'list') => {
    for (const note of section.querySelectorAll<HTMLElement>('[data-state]')) note.hidden = note.dataset.state !== state;
    list.hidden = state !== 'list';
  };
  try {
    const res = await siteFetch('/site-api/specials', {headers: {accept: 'application/json'}});
    if (!res.ok) return show('error');
    const {specials} = (await res.json()) as {specials: Special[]};
    if (!specials.length) return show('empty');
    list.replaceChildren(
      ...specials.map(dish => {
        const item = el('li', 'dish');
        item.append(el('p', 'dish-name', dish.title), el('span', 'dish-price', formatPrice(dish.priceCents)));
        if (dish.description) item.append(el('p', 'dish-desc', dish.description));
        return item;
      })
    );
    show('list');
  } catch {
    show('error');
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
