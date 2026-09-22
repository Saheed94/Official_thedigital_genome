/* =============================================
   THE DIGITAL GENOME — script.js
   ============================================= */

/* ---- Mobile Navigation Toggle ---- */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('mainNav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    const isOpen = nav.classList.contains('open');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      const spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
}

/* ---- Services Scroller ---- */
function scrollServices(distance) {
  const container = document.getElementById('serviceScroll');
  if (container) container.scrollBy({ left: distance, behavior: 'smooth' });
}

/* ---- Tutors Scroller ---- */
function scrollTutors(distance) {
  const container = document.getElementById('tutorScroll');
  if (container) container.scrollBy({ left: distance, behavior: 'smooth' });
}

/* ---- Smooth Scroll for Anchor Links ---- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ---- Training Accordion ---- */
(function () {
  const cards = document.querySelectorAll('.tp-card');
  cards.forEach(card => {
    const btn = card.querySelector('.tp-header');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isAlreadyOpen = card.classList.contains('is-open');
      cards.forEach(c => {
        c.classList.remove('is-open');
        const b = c.querySelector('.tp-header');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isAlreadyOpen) {
        card.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ---- FAQ Accordion ---- */
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-header');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Close all
      items.forEach(i => {
        i.classList.remove('is-open');
        const b = i.querySelector('.faq-header');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ---- Scroll-to-Top Button ---- */
(function () {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ---- Sticky Enroll CTA ---- */
(function () {
  const banner = document.getElementById('stickyEnroll');
  const hero   = document.querySelector('.hero');
  if (!banner || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      banner.classList.toggle('visible', !entry.isIntersecting);
    },
    { threshold: 0 }
  );
  observer.observe(hero);
})();

/* ---- Active Nav Highlight on Scroll ---- */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#mainNav a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'nav-active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach(s => observer.observe(s));
})();

/* ---- Stats Counter Animation ---- */
(function () {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const step = 16; // ~60fps
    const increment = target / (duration / step);
    let current = 0;

    const tick = () => {
      current = Math.min(current + increment, target);
      el.textContent = Math.floor(current);
      if (current < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(c => observer.observe(c));
})();

/* ---- Lazy-Load Map Iframe ---- */
(function () {
  const wrapper = document.querySelector('.map-lazy-wrapper');
  if (!wrapper) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      const iframe = wrapper.querySelector('iframe');
      const placeholder = wrapper.querySelector('.map-placeholder');
      if (iframe && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
        iframe.style.display = 'block';
        iframe.onload = () => {
          if (placeholder) placeholder.style.display = 'none';
        };
      }
      observer.disconnect();
    },
    { rootMargin: '200px' }
  );
  observer.observe(wrapper);
})();



