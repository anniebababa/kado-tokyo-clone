// Mark JS as active so reveal animations apply
document.documentElement.classList.add('js');

// ===== HEADER SCROLL =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ===== SERVICES DROPDOWN =====
const navDropdownBtn  = document.getElementById('navDropdownBtn');
const navDropdownMenu = document.getElementById('navDropdownMenu');
const navChevron      = document.getElementById('navChevron');

navDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = navDropdownMenu.classList.toggle('open');
  navDropdownBtn.setAttribute('aria-expanded', String(open));
  navDropdownMenu.setAttribute('aria-hidden', String(!open));
  navChevron.style.transform = open ? 'rotate(180deg)' : '';
});

document.addEventListener('click', () => {
  navDropdownMenu.classList.remove('open');
  navDropdownBtn.setAttribute('aria-expanded', 'false');
  navDropdownMenu.setAttribute('aria-hidden', 'true');
  navChevron.style.transform = '';
});

navDropdownMenu.addEventListener('click', (e) => e.stopPropagation());

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const mobileNav  = document.getElementById('mobileNav');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open', open);
  mobileNav.setAttribute('aria-hidden', String(!open));
});

mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
  });
});

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.10, rootMargin: '0px 0px -32px 0px' });

document.querySelectorAll(
  '.about-text, .about-deco, .svc-item, .fleet-card, .review-card, .blog-card, .cta-text, .cta-img'
).forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  revealObserver.observe(el);
});

// ===== SMOOTH SCROLL (offset for fixed header) =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  });
});
