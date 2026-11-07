// Phone machinery shared by the mobile_* modules (phones: up to 767px, Frappe's own
// mobile width).
export const PHONE = 767;

const query = window.matchMedia(`(max-width: ${PHONE}px)`);

export function isPhone() {
  return query.matches;
}

export function onPhoneChange(fn) {
  if (query.addEventListener) query.addEventListener("change", fn);
  else query.addListener(fn);
}

// Sets or clears a class only when that changes the element: classList.add and remove
// rewrite the class attribute every time, which wakes every observer watching it.
export function setClass(el, name, on) {
  if (el && el.classList.contains(name) !== !!on) el.classList.toggle(name, !!on);
}

// A MutationObserver that is connected only on phones, to the elements `targets()`
// returns as [element, options] pairs. On a computer it is not connected at all; crossing
// the phone width connects or disconnects it. Call sync() when the targets change.
export class PhoneObserver {
  constructor(callback, targets) {
    this.targets = targets;
    this.observer = new MutationObserver(callback);
    onPhoneChange(() => this.sync());
  }

  sync() {
    this.observer.disconnect();
    if (!query.matches) return;
    for (const [el, options] of this.targets() || []) {
      if (el && el.isConnected) this.observer.observe(el, options);
    }
  }

  stop() {
    this.observer.disconnect();
  }
}
