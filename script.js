/* ═══════════════════════════════════════════════════════════
   KAWALI – script.js
   Stack : Vanilla JS · OOP · localStorage · WhatsApp API
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── PRODUCT DATA ─────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 'bloom-intime',
    name: 'Bloom Intime',
    format: '15 sachets de thé',
    price: 17.99,
    image: './bloomint.webp',
    image2: './bloomintt.webp',
    badge: 'Best-seller',
    shortDesc: 'Un mélange floral et apaisant conçu pour les moments de douceur et d\u2019intimité avec soi.',
    description: 'Bloom Intime est une invitation à ralentir. Ce mélange précieux associe les pétales de rose de Damas, la fleur de camomille et l\u2019hibiscus séché pour créer une infusion florale à la fois douce et légèrement acidulée. Chaque sachet est soigneusement dosé pour libérer ses arômes en 4 à 5 minutes d\u2019infusion.',
    benefits: [
      'Apaisement du système nerveux',
      'Favorise un sommeil réparateur',
      'Riche en antioxydants naturels',
      'Zéro caféine – parfait le soir',
    ],
    brewingTips: 'Infuser dans une eau à 90°C pendant 4 à 5 minutes. Ajouter un filet de miel d\u2019acacia pour sublimer les notes florales. Idéal servi dans une grande tasse, avant le coucher.',
    tags: ['Sans caféine', 'Floral', 'Relaxant', 'Bio'],
  },
  {
    id: 'calm-digest',
    name: 'Calm Digest',
    format: 'Thé en vrac 50g',
    price: 16.99,
    image: './calmdig.webp',
    image2: './caalmdig.webp',
    badge: 'Nouveau',
    shortDesc: 'Un allié digestif puissant aux plantes fraîches – idéal après chaque repas pour une digestion en douceur.',
    description: 'Calm Digest est la réponse naturelle aux inconforts digestifs du quotidien. Notre herboriste a sélectionné la menthe poivrée marocaine, le gingembre séché, le fenouil et la mélisse pour composer un mélange synergique aux propriétés digestives reconnues. En vrac pour préserver l\u2019intégrité des plantes.',
    benefits: [
      'Stimule les enzymes digestives',
      'Réduit les ballonnements',
      'Effet antispasmodique naturel',
      'Rafraîchit l\u2019haleine durablement',
    ],
    brewingTips: 'Utiliser 1 c. à café rase (2 à 3g) par tasse. Infuser dans une eau à 95°C pendant 5 minutes, à couvert pour conserver les huiles essentielles. Consommer 15 minutes après le repas.',
    tags: ['Digestif', 'Menthe', 'Sans gluten', 'Vrac'],
  },
  {
    id: 'khamare',
    name: 'Khamaré',
    format: '8 tiges entières',
    price: 13.99,
    image: './khamare.webp',
    badge: 'Édition limitée',
    shortDesc: 'Une expérience sensorielle rare : des tiges entières aux notes boisées et fumées pour les amateurs d\u2019authenticité.',
    description: 'Khamaré est une ode à la tradition. Ces 8 tiges entières sont récoltées à la main dans des régions montagneuses et séchées à l\u2019air libre selon des méthodes ancestrales. L\u2019infusion révèle des notes profondes de bois, de terre et de vanille sauvage, pour une dégustation d\u2019une rare complexité aromatique.',
    benefits: [
      'Riche en minéraux et oligoéléments',
      'Propriétés adaptogènes douces',
      'Soutien naturel de l\u2019immunité',
      'Ancrage & recentrage émotionnel',
    ],
    brewingTips: 'Placer 1 à 2 tiges dans une théière. Verser de l\u2019eau frémissante (80°C) et laisser infuser 7 à 10 minutes. Les tiges peuvent être ré-infusées une seconde fois — la deuxième infusion révèle encore plus de profondeur.',
    tags: ['Boisé', 'Rare', 'Adaptogène', 'Artisanal'],
  },
];

/* ─── WHATSAPP CONFIG ──────────────────────────────────── */
// Remplacez ce numéro par le vôtre (format international sans +)
const WA_PHONE = '33600000000';

/* ─── CART CLASS ───────────────────────────────────────── */
class Cart {
  #items = [];
  #KEY = 'kawali_cart_v2';

  constructor() {
    this.#load();
  }

  #load() {
    try {
      const raw = localStorage.getItem(this.#KEY);
      this.#items = raw ? JSON.parse(raw) : [];
    } catch {
      this.#items = [];
    }
  }

  #save() {
    localStorage.setItem(this.#KEY, JSON.stringify(this.#items));
  }

  get items() { return [...this.#items]; }
  get count() { return this.#items.reduce((s, i) => s + i.qty, 0); }
  get total() { return this.#items.reduce((s, i) => s + i.price * i.qty, 0); }

  add(product) {
    const found = this.#items.find(i => i.id === product.id);
    if (found) {
      found.qty += 1;
    } else {
      this.#items.push({ id: product.id, name: product.name, format: product.format, price: product.price, image: product.image, qty: 1 });
    }
    this.#save();
  }

  remove(id) {
    this.#items = this.#items.filter(i => i.id !== id);
    this.#save();
  }

  updateQty(id, delta) {
    const item = this.#items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    this.#save();
  }

  clear() {
    this.#items = [];
    this.#save();
  }
}

/* ─── TOAST ────────────────────────────────────────────── */
const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ─── RENDER PRODUCTS ──────────────────────────────────── */
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="product-card" role="listitem" data-id="${p.id}">
      <div
        class="product-card__img-wrap"
        data-action="detail"
        data-id="${p.id}"
        role="button"
        tabindex="0"
        aria-label="Voir les détails de ${p.name}"
      >
        <img
          class="product-card__img"
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
        />
        ${p.image2 ? `
        <img
          class="product-card__img product-card__img--hover"
          src="${p.image2}"
          alt="${p.name} – vue alternative"
          loading="lazy"
          aria-hidden="true"
        />` : ''}
        ${p.badge ? `<span class="product-card__badge">${p.badge}</span>` : ''}
      </div>
      <div class="product-card__body">
        <p class="product-card__format">${p.format}</p>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__desc">${p.shortDesc}</p>
        <div class="product-card__footer">
          <span class="product-card__price">$${p.price.toFixed(2)}</span>
          <div class="product-card__actions">
            <button
              class="product-card__detail-btn"
              data-action="detail"
              data-id="${p.id}"
              aria-label="Voir les détails de ${p.name}"
            >Détails</button>
            <button
              class="product-card__add-btn"
              data-action="add"
              data-id="${p.id}"
              aria-label="Ajouter ${p.name} au panier"
            >+ Panier</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

/* ─── RENDER CART ──────────────────────────────────────── */
function renderCart(cart) {
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');

  if (cart.count === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty__icon">🍃</span>
        <p class="cart-empty__text">Votre panier est vide.<br/>Découvrez notre collection&nbsp;!</p>
      </div>`;
    footer.innerHTML = '';
    return;
  }

  body.innerHTML = cart.items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item__img" src="${item.image}" alt="${item.name}" loading="lazy" />
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__price">$${item.price.toFixed(2)} / unité</p>
        <div class="cart-item__qty">
          <button class="cart-item__qty-btn" data-action="dec" data-id="${item.id}" aria-label="Diminuer">−</button>
          <span class="cart-item__qty-num" aria-label="Quantité : ${item.qty}">${item.qty}</span>
          <button class="cart-item__qty-btn" data-action="inc" data-id="${item.id}" aria-label="Augmenter">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-action="remove" data-id="${item.id}" aria-label="Supprimer ${item.name}">&times;</button>
    </div>
  `).join('');

  footer.innerHTML = `
    <div class="cart-total">
      <span class="cart-total__label">Total</span>
      <span class="cart-total__amount">$${cart.total.toFixed(2)}</span>
    </div>
    <button class="btn btn--wa" id="waBtn" aria-label="Commander via WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Commander via WhatsApp
    </button>`;

  document.getElementById('waBtn').addEventListener('click', () => sendWhatsApp(cart));
}

/* ─── UPDATE BADGE ─────────────────────────────────────── */
function updateBadge(cart) {
  const badge = document.getElementById('cartBadge');
  const count = cart.count;
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
}

/* ─── WHATSAPP CHECKOUT ────────────────────────────────── */
function sendWhatsApp(cart) {
  const lines = cart.items.map(
    i => `• ${i.name} (${i.format}) × ${i.qty} = $${(i.price * i.qty).toFixed(2)}`
  );
  const msg = [
    '\uD83C\uDF3F *Nouvelle commande KAWALI*',
    '',
    ...lines,
    '',
    `*Total : $${cart.total.toFixed(2)}*`,
    '',
    '---',
    'Merci de m\u2019indiquer :',
    '\uD83D\uDCE6 Nom & Prénom',
    '\uD83D\uDCCD Adresse de livraison',
    '\uD83D\uDCDE Numéro de téléphone',
    '',
    'À très vite ! ✨',
  ].join('\n');

  window.open(
    `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

/* ─── PRODUCT MODAL ────────────────────────────────────── */
function openModal(productId, cart) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const modal   = document.getElementById('productModal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    <div class="modal__img-wrap">
      <img class="modal__img" src="${p.image}" alt="${p.name}" />
    </div>
    <div class="modal__body">
      <p class="modal__kicker">${p.format}</p>
      <h2 class="modal__title" id="modalTitle">${p.name}</h2>
      <p class="modal__price">$${p.price.toFixed(2)}</p>

      <p class="modal__section-title">Description</p>
      <p class="modal__text">${p.description}</p>

      <p class="modal__section-title">Bienfaits</p>
      <p class="modal__text">${p.benefits.map(b => `✓ ${b}`).join('<br/>')}</p>

      <p class="modal__section-title">Conseils de dégustation</p>
      <p class="modal__text">${p.brewingTips}</p>

      <div class="modal__tags">
        ${p.tags.map(t => `<span class="modal__tag">${t}</span>`).join('')}
      </div>

      <button class="modal__add-btn" data-action="add" data-id="${p.id}" aria-label="Ajouter ${p.name} au panier">
        + Ajouter au panier
      </button>
    </div>`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  content.querySelector('.modal__add-btn').addEventListener('click', () => {
    cart.add(p);
    updateBadge(cart);
    renderCart(cart);
    closeModal();
    showToast(`${p.name} ajouté au panier 🍃`);
  });
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── CART DRAWER ──────────────────────────────────────── */
function openCartDrawer() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartBtn').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeCartDrawer() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartBtn').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ─── STICKY HEADER ────────────────────────────────────── */
function initScrollHeader() {
  const header = document.getElementById('header');
  const hero   = document.querySelector('.hero');
  if (!hero) return;
  const observer = new IntersectionObserver(
    ([entry]) => header.classList.toggle('scrolled', !entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(hero);
}

/* ─── MOBILE NAV ───────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.getElementById('menuToggle');
  const nav    = document.getElementById('mobileNav');

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  nav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── EVENT DELEGATION ─────────────────────────────────── */
function initEvents(cart) {
  /* Product grid – click */
  document.getElementById('productsGrid').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    if (action === 'add') {
      cart.add(product);
      updateBadge(cart);
      renderCart(cart);
      showToast(`${product.name} ajouté au panier 🍃`);
    } else if (action === 'detail') {
      openModal(id, cart);
    }
  });

  /* Product grid – keyboard */
  document.getElementById('productsGrid').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const wrap = e.target.closest('[data-action="detail"]');
    if (wrap) { e.preventDefault(); openModal(wrap.dataset.id, cart); }
  });

  /* Cart open */
  document.getElementById('cartBtn').addEventListener('click', openCartDrawer);

  /* Cart close */
  document.getElementById('cartClose').addEventListener('click', closeCartDrawer);
  document.getElementById('cartOverlay').addEventListener('click', closeCartDrawer);

  /* Cart item actions */
  document.getElementById('cartBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'inc')    { cart.updateQty(id, +1); }
    else if (action === 'dec')    { cart.updateQty(id, -1); }
    else if (action === 'remove') { cart.remove(id); showToast('Article retiré du panier'); }
    updateBadge(cart);
    renderCart(cart);
  });

  /* Modal close */
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);

  /* Escape key */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeModal();
    closeCartDrawer();
  });
}

/* ─── INIT ─────────────────────────────────────────────── */
function init() {
  const cart = new Cart();
  renderProducts();
  renderCart(cart);
  updateBadge(cart);
  initScrollHeader();
  initMobileNav();
  initEvents(cart);
}

document.addEventListener('DOMContentLoaded', init);
