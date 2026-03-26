/* ============================================
   SCRIPT.JS - KAWĀLI TRADITIONS INTERACTIVITY
   ============================================ */

(function() {
  'use strict';

  const app = {
    // Configuration
    config: {
      popupDelayTime: 30000, // 30 seconds
      popupScrollTrigger: 0.7, // 70% scroll down
      exitIntentThreshold: 100, // pixels from top
      localStorageKey: 'kawali_user_data'
    },

    // State Management
    state: {
      cartCount: 0,
      cartItems: [],
      newsletterShown: false,
      scrolledToTrigger: false,
      userEmail: '',
      userVisited: false
    },

    // Initialize all features
    init() {
      console.log('🌿 KAWĀLI Traditions - InitializingApp');
      
      this.loadState();
      this.setupEventListeners();
      this.setupPopupTriggers();
      this.setupMenuToggle();
      this.setupStickyAddToCart();
      this.setupLazyLoading();
      this.setupAnalytics();
      
      console.log('✓ App initialized successfully');
    },

    // ====== STATE MANAGEMENT ======
    loadState() {
      const saved = localStorage.getItem(this.config.localStorageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.state = { ...this.state, ...data };
        this.updateCartUI();
      }
      this.state.userVisited = true;
      this.saveState();
    },

    saveState() {
      const stateToSave = {
        cartCount: this.state.cartCount,
        cartItems: this.state.cartItems,
        userEmail: this.state.userEmail,
        userVisited: this.state.userVisited
      };
      localStorage.setItem(this.config.localStorageKey, JSON.stringify(stateToSave));
    },

    // ====== EVENT LISTENERS ======
    setupEventListeners() {
      // Add to cart buttons
      document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => this.handleAddToCart(e));
      });

      // Newsletter form submission
      const newsletterForm = document.getElementById('newsletter-form');
      if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
      }

      // Popup form submission
      const popupForm = document.getElementById('popup-form');
      if (popupForm) {
        popupForm.addEventListener('submit', (e) => this.handlePopupFormSubmit(e));
      }

      // Popup close button
      const popupClose = document.getElementById('popup-close-btn');
      if (popupClose) {
        popupClose.addEventListener('click', () => this.closeNewsletter());
      }

      // Popup overlay click (close on overlay)
      document.addEventListener('click', (e) => {
        if (e.target.id === 'newsletter-popup') {
          this.closeNewsletter();
        }
      });

      // Mobile menu links close menu
      document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
          this.toggleMobileMenu();
        });
      });
    },

    // ====== CART FUNCTIONALITY ======
    handleAddToCart(event) {
      const btn = event.target;
      const productCard = btn.closest('.product-card');
      
      if (!productCard) return;

      const productName = productCard.querySelector('h3').textContent;
      const price = productCard.querySelector('.price').textContent;
      const productId = Math.random().toString(36).substr(2, 9);

      // Add item
      this.state.cartItems.push({ id: productId, name: productName, price: price });
      this.state.cartCount++;

      // Visual feedback
      this.showButtonFeedback(btn);

      // Update UI
      this.updateCartUI();
      this.saveState();

      // Track event
      this.trackEvent('add_to_cart', { item: productName, count: this.state.cartCount });

      // Show confirmation
      this.showNotification(`${productName} added to cart! (${this.state.cartCount} items)`);
    },

    showButtonFeedback(btn) {
      const originalText = btn.textContent;
      btn.textContent = '✓ Added!';
      btn.disabled = true;
      btn.style.background = '#27ae60';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.background = '';
      }, 2000);
    },

    updateCartUI() {
      const cartCount = document.querySelector('.cart-count');
      if (cartCount) {
        cartCount.textContent = this.state.cartCount;
        cartCount.style.display = this.state.cartCount > 0 ? 'flex' : 'none';
      }
    },

    // ====== CART BUTTON CLICK ======
    setupEventListeners_cartButton() {
      const cartBtn = document.querySelector('.cart-btn');
      if (cartBtn) {
        cartBtn.addEventListener('click', () => {
          this.handleCartClick();
        });
      }
    },

    handleCartClick() {
      if (this.state.cartCount === 0) {
        this.showNotification('Your cart is empty. Add items to get started!');
        return;
      }
      
      // In production, this would navigate to cart/checkout
      this.showNotification(`You have ${this.state.cartCount} items in cart. Checkout would start here.`);
      this.trackEvent('cart_opened', { items: this.state.cartCount });
    },

    // ====== MOBILE MENU ======
    setupMenuToggle() {
      const hamburger = document.querySelector('.hamburger-toggle');
      if (hamburger) {
        hamburger.addEventListener('click', () => this.toggleMobileMenu());
      }
    },

    toggleMobileMenu() {
      const hamburger = document.querySelector('.hamburger-toggle');
      const menu = document.getElementById('mobile-menu');

      if (!menu) return;

      const isOpen = menu.getAttribute('aria-hidden') === 'false';
      
      hamburger.classList.toggle('active');
      menu.setAttribute('aria-hidden', isOpen);

      // Manage scroll lock
      document.body.style.overflow = isOpen ? 'auto' : 'hidden';

      // Trap focus in menu when open
      if (!isOpen) {
        setTimeout(() => {
          const firstLink = menu.querySelector('a');
          if (firstLink) firstLink.focus();
        }, 100);
      }
    },

    // ====== NEWSLETTER POPUP ======
    setupPopupTriggers() {
      // Check if already shown
      const shown = sessionStorage.getItem('kawali_popup_shown');
      if (shown && this.state.userVisited) {
        return; // Don't show if already shown this session
      }

      // Trigger 1: After 30 seconds
      setTimeout(() => {
        if (!this.state.newsletterShown) {
          this.showNewsletter();
        }
      }, this.config.popupDelayTime);

      // Trigger 2: On scroll past 70%
      window.addEventListener('scroll', () => this.handleScrollTrigger());

      // Trigger 3: Exit intent detection
      document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= this.config.exitIntentThreshold && !this.state.newsletterShown) {
          this.showNewsletter();
          this.trackEvent('popup_triggered_exit_intent');
        }
      });
    },

    handleScrollTrigger() {
      if (this.state.scrolledToTrigger || this.state.newsletterShown) return;

      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;

      if (scrollPercent >= this.config.popupScrollTrigger) {
        this.state.scrolledToTrigger = true;
        this.showNewsletter();
        this.trackEvent('popup_triggered_scroll');
      }
    },

    showNewsletter() {
      const popup = document.getElementById('newsletter-popup');
      if (!popup) return;

      popup.classList.add('active');
      this.state.newsletterShown = true;
      sessionStorage.setItem('kawali_popup_shown', 'true');

      // Track impression
      this.trackEvent('popup_impression');

      // Set up close timers
      this.setupPopupAutoClose();
    },

    closeNewsletter() {
      const popup = document.getElementById('newsletter-popup');
      if (popup) {
        popup.classList.remove('active');
      }
      this.trackEvent('popup_closed');
    },

    setupPopupAutoClose() {
      // Auto-close after 10 minutes of inactivity
      setTimeout(() => {
        if (this.state.newsletterShown) {
          this.closeNewsletter();
        }
      }, 600000);
    },

    handlePopupFormSubmit(event) {
      event.preventDefault();

      const form = event.target;
      const emailInput = form.querySelector('input[type="email"]');
      
      if (!emailInput || !this.validateEmail(emailInput.value)) {
        this.showNotification('❌ Please enter a valid email address');
        return;
      }

      const email = emailInput.value;

      // Simulate API call
      this.submitNewsletterSubscription(email);

      // Update state
      this.state.userEmail = email;
      this.saveState();

      // Show success
      this.showNotification('✓ Welcome to KAWĀLI! Check your email for your 10% discount code.');
      
      // Close popup
      setTimeout(() => {
        this.closeNewsletter();
      }, 2000);

      // Track conversion
      this.trackEvent('newsletter_signup', { email: this.maskEmail(email) });
    },

    submitNewsletterSubscription(email) {
      // In production, send to email service (Mailchimp, Klaviyo, etc.)
      console.log('📧 Newsletter signup:', email);
      
      // Simulate API request
      fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: 'popup' })
      }).catch(err => {
        // Silently fail in demo (endpoint doesn't exist)
        console.log('Note: Demo mode - no actual endpoint');
      });
    },

    // ====== MAIN NEWSLETTER FORM ======
    handleNewsletterSubmit(event) {
      event.preventDefault();

      const form = event.target;
      const emailInput = form.querySelector('input[type="email"]');

      if (!emailInput || !this.validateEmail(emailInput.value)) {
        this.showNotification('❌ Email invalide');
        return;
      }

      const email = emailInput.value;
      this.submitNewsletterSubscription(email);
      this.state.userEmail = email;
      this.saveState();

      // Clear form
      form.reset();
      this.showNotification('✓ Merci! Vérifiez votre email.');
      this.trackEvent('newsletter_signup_footer', { email: this.maskEmail(email) });
    },

    validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    maskEmail(email) {
      const [localPart, domain] = email.split('@');
      const masked = localPart.substring(0, 2) + '*'.repeat(Math.max(0, localPart.length - 4)) + localPart.slice(-2);
      return `${masked}@${domain}`;
    },

    // ====== STICKY ADD TO CART (MOBILE) ======
    setupStickyAddToCart() {
      const elements = document.querySelector('.product-card');
      if (!elements) return;

      window.addEventListener('scroll', () => this.handleStickyAddToCartVisibility());
      window.addEventListener('resize', () => this.handleStickyAddToCartVisibility());

      // Show button if scrolled past products
      this.handleStickyAddToCartVisibility();
    },

    handleStickyAddToCartVisibility() {
      // Show sticky ATC button after scrolling past hero
      const productsSection = document.querySelector('.products-section');
      if (!productsSection) return;

      const rect = productsSection.getBoundingClientRect();
      const stickyBtn = document.querySelector('.sticky-add-to-cart');

      if (rect.bottom < window.innerHeight && stickyBtn) {
        stickyBtn.classList.remove('visible');
      } else if (stickyBtn) {
        stickyBtn.classList.add('visible');
      }
    },

    // ====== LAZY LOADING IMAGES ======
    setupLazyLoading() {
      // Use Intersection Observer for lazy loading
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              
              // Load the actual image
              if (img.dataset.src) {
                img.src = img.dataset.src;
              }
              if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
              }

              img.classList.add('loaded');
              observer.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });

        // Observe all lazy images
        document.querySelectorAll('img[data-src], picture img').forEach(img => {
          imageObserver.observe(img);
        });
      }
    },

    // ====== ANALYTICS ======
    setupAnalytics() {
      // Track page views
      this.trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
      });

      // Track time on page
      let timeOnPage = 0;
      setInterval(() => {
        timeOnPage += 10;
      }, 10000);

      window.addEventListener('beforeunload', () => {
        if (timeOnPage > 10000) { // Only track if > 10 seconds
          this.trackEvent('page_engagement', {
            engagement_time_msec: timeOnPage
          });
        }
      });
    },

    trackEvent(eventName, eventData = {}) {
      // Google Analytics 4 tracking
      if (window.gtag) {
        gtag('event', eventName, {
          event_category: 'engagement',
          event_label: JSON.stringify(eventData),
          ...eventData
        });
      }

      // Console logging for development
      console.log('📊 Event tracked:', eventName, eventData);
    },

    // ====== NOTIFICATIONS ======
    showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #333;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
      `;

      document.body.appendChild(notification);

      // Auto remove
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    },

    // ====== KEYBOARD ACCESSIBILITY ======
    setupAccessibility() {
      // Skip to main content
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'sr-only';
      skipLink.textContent = 'Skip to main content';
      document.body.insertBefore(skipLink, document.body.firstChild);

      // Focus visible indication
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          document.body.classList.add('show-focus-ring');
        }
      });

      document.addEventListener('mousedown', () => {
        document.body.classList.remove('show-focus-ring');
      });
    },

    // ====== PERFORMANCE MONITORING ======
    setupPerformanceMonitoring() {
      if (!window.performance) return;

      // Check performance metrics
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

        console.log('⚡ Page Load Time:', pageLoadTime + 'ms');

        // Log to analytics
        this.trackEvent('page_load_time', { time_ms: pageLoadTime });
      });

      // Monitor LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('⚡ LCP:', lastEntry.renderTime || lastEntry.loadTime);
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.log('LCP monitoring not available');
        }
      }
    }
  };

  // ====== INITIALIZATION ======
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      app.init();
      app.setupAccessibility();
      app.setupPerformanceMonitoring();
      app.setupEventListeners_cartButton();
    });
  } else {
    // DOM already loaded
    app.init();
    app.setupAccessibility();
    app.setupPerformanceMonitoring();
    app.setupEventListeners_cartButton();
  }

  // ====== ANIMATION STYLES (RUNTIME) ======
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .notification {
      font-weight: 500;
    }

    body.show-focus-ring *:focus {
      outline: 2px solid #8b6f47 !important;
      outline-offset: 2px !important;
    }

    img.lazy-loading {
      background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 50%, #f0f0f0 50%, #f0f0f0 75%, transparent 75%, transparent);
      background-size: 20px 20px;
      animation: loading 0.6s linear infinite;
    }

    @keyframes loading {
      0% { background-position: 0 0; }
      100% { background-position: 20px 20px; }
    }
  `;
  document.head.appendChild(style);

  // Expose app for debugging (optional)
  window.kawaliApp = app;

})();
