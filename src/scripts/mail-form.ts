/**
 * Forms that "send" by email. A static site cannot receive a form, so a
 * `<form data-mail-form action="mailto:…">` opens the visitor's email app with
 * the answers written out, ready to send. Without JavaScript the browser's
 * own mailto: post still works (rougher, but nothing is lost).
 *
 * With it: required fields are checked in words under each field
 * (`<p class="error" id="<name>-error" hidden>`), the email gets a readable
 * body ("Service: Curly cut"), and a status line says what happens next.
 * Labels come from `data-label` on each named control.
 *
 * Saving requests, taking the deposit online or texting reminders needs a
 * backend: the Astro app template.
 */

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function controls(form: HTMLFormElement): Control[] {
  return Array.from(form.elements).filter((el): el is Control => 'name' in el && Boolean((el as Control).name) && !(el as Control).disabled);
}

function problem(form: HTMLFormElement, name: string): string | null {
  const group = controls(form).filter(c => c.name === name);
  const first = group[0];
  if (!first) return null;
  if (first instanceof HTMLInputElement && (first.type === 'radio' || first.type === 'checkbox')) {
    const required = group.some(c => c.required);
    return required && !group.some(c => (c as HTMLInputElement).checked) ? 'missing' : null;
  }
  const value = first.value.trim();
  if (first.required && !value) return 'missing';
  if (value && first instanceof HTMLInputElement && first.type === 'email' && !EMAIL.test(value)) return 'format';
  if (value && first instanceof HTMLInputElement && first.type === 'tel' && value.replace(/\D/g, '').length < 7) return 'format';
  return null;
}

function setError(form: HTMLFormElement, name: string, kind: string | null) {
  const message = form.querySelector<HTMLElement>(`#${name}-error`);
  const group = controls(form).filter(c => c.name === name);
  for (const c of group) {
    if (kind) c.setAttribute('aria-invalid', 'true');
    else c.removeAttribute('aria-invalid');
  }
  if (!message) return;
  message.hidden = !kind;
  if (kind) message.textContent = (kind === 'format' && message.dataset.format) || message.dataset.missing || 'Please fill this in.';
}

function body(form: HTMLFormElement): string {
  const lines: string[] = [];
  for (const c of controls(form)) {
    if (c instanceof HTMLInputElement && (c.type === 'radio' || c.type === 'checkbox') && !c.checked) continue;
    if (c instanceof HTMLInputElement && c.type === 'hidden' && !c.value) continue;
    const value = c instanceof HTMLSelectElement ? (c.selectedOptions[0]?.textContent ?? '') : c instanceof HTMLInputElement && c.type === 'checkbox' ? 'Yes' : c.value;
    if (!value.trim()) continue;
    lines.push(`${c.dataset.label ?? c.name}: ${value.trim()}`);
  }
  return lines.join('\n');
}

export function setUpMailForms() {
  for (const form of document.querySelectorAll<HTMLFormElement>('form[data-mail-form]')) {
    if (form.dataset.ready) continue;
    form.dataset.ready = 'true';
    const status = form.querySelector<HTMLElement>('[data-status]');
    const names = () => [...new Set(controls(form).map(c => c.name))];

    // Clear a field's error as soon as it is fixed.
    form.addEventListener('change', event => {
      const name = (event.target as Control).name;
      if (name && form.querySelector(`#${name}-error:not([hidden])`)) setError(form, name, problem(form, name));
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const wrong = names()
        .map(name => [name, problem(form, name)] as const)
        .filter(([, kind]) => kind);
      for (const name of names()) setError(form, name, null);
      for (const [name, kind] of wrong) setError(form, name, kind);
      if (wrong.length) {
        controls(form)
          .find(c => c.name === wrong[0][0])
          ?.focus();
        if (status) {
          status.dataset.tone = 'error';
          status.textContent = wrong.length === 1 ? 'One thing still needs filling in (marked above).' : `${wrong.length} things still need filling in (marked above).`;
        }
        return;
      }
      const to = form.getAttribute('action')?.replace(/^mailto:/, '').split('?')[0] ?? '';
      const subject = form.dataset.subject ?? 'Website enquiry';
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body(form))}`;
      if (status) {
        status.dataset.tone = 'ok';
        status.textContent = form.dataset.sent ?? 'Your email app should now open with everything filled in. Press send to finish.';
      }
    });
  }
}
