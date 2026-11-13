/* Progressive enhancement: content, navigation and forms work without motion. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const config = window.CRAVE_CONFIG || {};
  let userMotionOff = false;
  let motionOff = mediaQuery.matches;
  let introTimeline, motionContext, heroScrollTimeline, heroScene, galleryFactory, galleryController, gallery = [], galleryIndex = 0;
  const galleryReady = import('./gallery-motion.js').then(module => { galleryFactory = module.createGalleryMotion; }).catch(error => { document.documentElement.classList.add('galleries-static'); console.info('Using static galleries.',error.message); });
  const sceneReady = import('./hero-scene.js').then(async ({ createHeroScene }) => {
    heroScene = await createHeroScene($('.hero-canvas'), { reducedMotion: motionOff });
    return heroScene;
  }).catch(error => {
    document.documentElement.classList.add('hero-fallback');
    $('.hero-canvas').dataset.scene = 'fallback';
    console.info('The hero is using its static fallback.', error.message);
  });
  const galleryData = {
    bling: [
      ['06f1e.webp', 'Bling & Scoops / The creator circle'],
      ['242d5.webp', 'Bling & Scoops / Something sweet'],
      ['097dc.webp', 'Bling & Scoops / Make an entrance'],
      ['bling-entrance.webp', 'Bling & Scoops / A very sweet first impression'],
      ['bling-people.webp', 'Bling & Scoops / In good company'],
      ['802d2.webp', 'Bling & Scoops / The little details'],
      ['bling-blooms.webp', 'Bling & Scoops / Flowers for the occasion'],
      ['bling-portrait.webp', 'Bling & Scoops / A moment between conversations'],
      ['bling-room.webp', 'Bling & Scoops / A table worth gathering around'],
      ['bling-table.webp', 'Bling & Scoops / A sweet little spread'],
      ['bling-guest.webp', 'Bling & Scoops / Caught in the moment'],
      ['bling-gifts.webp', 'Bling & Scoops / A little something to take home']
    ],
    haunted: [
      ['1bb58.webp', 'A Haunted Social / Set the scene'],
      ['5791d.webp', 'A Haunted Social / A taste of the unexpected'],
      ['8304d.webp', 'A Haunted Social / In good company'],
      ['haunted-spooky.webp', 'A Haunted Social / After dark'],
      ['haunted-flavours.webp', 'A Haunted Social / A taste of the unexpected'],
      ['haunted-entrance.webp', 'A Haunted Social / You had to be there']
    ]
  };

  $('#year').textContent = new Date().getFullYear();
  // Each word keeps a single accessible name; the animated characters are decorative.
  $$('[data-split="chars"]').forEach(word => {
    const value = word.textContent;
    word.setAttribute('aria-label', value);
    word.replaceChildren(...[...value].map(char => {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = char === ' ' ? '\u00a0' : char;
      return span;
    }));
  });

  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
    $('.site-header').classList.toggle('is-menu-open', open);
    document.body.classList.toggle('modal-open', open);
    if (open) $('a', mobileMenu).focus({ preventScroll: true });
  }
  menuToggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
  $$('a', mobileMenu).forEach(link => link.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width:761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); menuToggle.focus({ preventScroll: true }); }
    if (event.key === 'Tab' && !mobileMenu.hidden) trapFocus(event, mobileMenu, menuToggle);
  });
  function trapFocus(event, root, extra) {
    const elements = $$('a,button,input,textarea,[tabindex="0"]', root).filter(el => !el.disabled && el.offsetParent !== null);
    if (extra) elements.unshift(extra);
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  const dialogOpeners = new WeakMap();
  function openDialog(dialog) {
    if (!mobileMenu.hidden) setMenu(false);
    dialogOpeners.set(dialog, document.activeElement);
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  function releaseDialog(dialog) {
    if (!dialogOpeners.has(dialog)) return;
    const opener = dialogOpeners.get(dialog);
    dialogOpeners.delete(dialog);
    document.body.classList.toggle('modal-open', Boolean($('dialog[open]')) || !mobileMenu.hidden);
    if (dialog === $('#lightbox')) { $('.lightbox-video').pause(); $('.lightbox-video').removeAttribute('src'); }
    opener?.focus({ preventScroll: true });
    window.ScrollTrigger?.update();
  }
  function closeDialog(dialog) { dialog.close(); releaseDialog(dialog); }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('close', () => releaseDialog(dialog));
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom || dialog === $('#lightbox')) closeDialog(dialog);
      }
    });
  });

  const lightbox = $('#lightbox');
  const lightboxImg = $('.lightbox-image');
  const lightboxVideo = $('.lightbox-video');
  function renderGallery() {
    const [file, caption] = gallery[galleryIndex];
    lightboxImg.src = `assets/${file}`;
    lightboxImg.alt = caption;
    $('.lightbox-caption').textContent = caption;
    $('.lightbox-counter').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(gallery.length).padStart(2, '0')}`;
  }
  $$('[data-gallery]').forEach(button => button.addEventListener('click', () => {
    gallery = galleryData[button.dataset.gallery];
    galleryIndex = Number(button.dataset.index || 0);
    lightboxImg.hidden = false;
    lightboxVideo.hidden = true;
    $('.gallery-prev').hidden = $('.gallery-next').hidden = false;
    renderGallery();
    openDialog(lightbox);
  }));
  function moveGallery(direction) { galleryIndex = (galleryIndex + direction + gallery.length) % gallery.length; renderGallery(); }
  $('.gallery-prev').addEventListener('click', () => moveGallery(-1));
  $('.gallery-next').addEventListener('click', () => moveGallery(1));
  $('.lightbox-close').addEventListener('click', () => closeDialog(lightbox));
  lightbox.addEventListener('keydown', event => {
    if (lightboxVideo.hidden) {
      if (event.key === 'ArrowRight') moveGallery(1);
      if (event.key === 'ArrowLeft') moveGallery(-1);
    }
  });

  $$('[data-film]').forEach(card => {
    const video = $('video', card);
    card.addEventListener('click', () => {
      video.pause();
      lightboxImg.hidden = true;
      lightboxVideo.hidden = false;
      lightboxVideo.src = `assets/film-${card.dataset.film}.mp4`;
      lightboxVideo.poster = $('img', card).src;
      $('.gallery-prev').hidden = $('.gallery-next').hidden = true;
      $('.lightbox-caption').textContent = card.getAttribute('aria-label').replace('Play ', 'Halloween / ');
      $('.lightbox-counter').textContent = 'CRAVE SOCIAL / EVENT FILM';
      openDialog(lightbox);
      lightboxVideo.play().catch(() => {});
    });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) $$('video').forEach(v => v.pause()); });

  const enquiry = $('#enquiry-dialog'), form = $('#enquiry-form');
  const enquiryCopy = {
    brand: ['FOR BRANDS / LET’S SET THE SCENE', 'Let’s make<br><em>a little noise.</em>', 'Bring us your brand, your idea, your what-if. We’ll take it from there.'],
    creator: ['FOR CREATORS / FIND YOUR PEOPLE', 'Your next<br><em>invitation.</em>', 'A point of view and a little curiosity. Tell us about yourself and your content.'],
    invite: ['THE BLOOM AFFAIR / REQUEST AN INVITE', 'A seat<br><em>in bloom.</em>', '15 November · 4–6 PM. An intimate evening at Missora Café & Bistro, Kolkata.']
  };
  function openEnquiry(type, theme = '') {
    const copy = enquiryCopy[type] || enquiryCopy.brand;
    $('#enquiry-kicker').textContent = copy[0];
    $('#enquiry-title').innerHTML = copy[1]; // Fixed, author-controlled copy only.
    $('#enquiry-description').textContent = copy[2];
    form.elements.type.value = type;
    $('#form-status').textContent = '';
    if (theme) form.elements.message.value = `I’d love to explore “${theme}” for my brand. `;
    const hasEmail = Boolean(config.enquiryEmail);
    $('#submit-label').textContent = hasEmail ? 'Prepare my email' : 'Save enquiry draft';
    $('#form-note').textContent = hasEmail ? 'We’ll open your email app with your enquiry ready to send.' : 'Direct enquiries open soon. Save your details as a draft for now.';
    openDialog(enquiry);
  }
  $$('[data-enquiry]').forEach(button => button.addEventListener('click', () => openEnquiry(button.dataset.enquiry)));
  $$('[data-theme]').forEach(button => button.addEventListener('click', () => openEnquiry('brand', $('h3', button).textContent)));
  $('.enquiry-close').addEventListener('click', () => closeDialog(enquiry));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const subject = `Crave Social — ${data.type === 'brand' ? 'Brand enquiry' : data.type === 'invite' ? 'The Bloom Affair invitation' : 'Creator circle'}`;
    const body = `Name: ${data.name}\nEmail: ${data.email}\nBrand / Instagram: ${data.brand || '—'}\n\n${data.message || 'I’d love to connect with Crave Social.'}`;
    if (config.enquiryEmail) {
      location.href = `mailto:${encodeURIComponent(config.enquiryEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $('#form-status').textContent = 'Your email draft is ready in your email app. Please send it there to complete your enquiry.';
    } else {
      const blob = new Blob([`${subject}\n\n${body}\n\nThis is a draft. It has not been sent to Crave Social.`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'crave-social-enquiry.txt'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('#form-status').textContent = 'Your draft has been downloaded. It hasn’t been sent — direct enquiries will open here soon.';
    }
  });

  // Static fallback: nothing remains hidden if the animation library cannot load.
  const loader = $('.loader');
  let introDismissed = false, introInput;
  function dismissIntro() {
    introDismissed = true;
    introTimeline?.progress(1).kill();
    if (window.gsap) gsap.set('.hero-interface', { opacity: 1 });
    heroScene?.setEntrance(1);
    finishIntro();
  }
  function listenForIntroIntent() {
    introInput?.abort();
    introInput = new AbortController();
    const options = { passive: true, signal: introInput.signal };
    // Native input always reaches the page; the entrance never owns scrolling.
    window.addEventListener('wheel', dismissIntro, options);
    window.addEventListener('touchmove', dismissIntro, options);
    window.addEventListener('scroll', () => { if (scrollY > 4) dismissIntro(); }, options);
    window.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Tab','Escape'].includes(event.key)) dismissIntro();
    }, { signal: introInput.signal });
  }
  listenForIntroIntent();
  function finishIntro() {
    introInput?.abort();
    loader.style.display = 'none';
    loader.setAttribute('inert', '');
  }
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.add('hero-static', 'galleries-static'); finishIntro(); return; }
  gsap.registerPlugin(ScrollTrigger);
  function playIntro() {
    introTimeline?.scrollTrigger?.kill();
    introTimeline?.kill();
    if (motionOff) { finishIntro(); return; }
    introDismissed = false;
    listenForIntroIntent();
    loader.removeAttribute('inert');
    gsap.set(loader, { display: 'block', yPercent: 0, autoAlpha: 1, borderRadius: 0 });
    const photos = [...document.querySelectorAll('.loader-photo')];
    const counter = { value: 0 }, entrance = { value: 0 };
    gsap.set('.loader-word', { opacity: 0, y: 18 });
    gsap.set('.loader-bottom,.loader-skip', { opacity: 0 });
    gsap.set('.loader-photo-stage', { y: innerHeight * .6, scale: .92, opacity: 1 });
    gsap.set(photos, { autoAlpha: 0 });
    gsap.set(photos[0], { autoAlpha: 1 });
    gsap.set('.hero-interface', { opacity: 0 });
    heroScene?.setEntrance(0);
    introTimeline = gsap.timeline({ onComplete: finishIntro });
    introTimeline.to('.loader-photo-stage', { y: 0, scale: 1, duration: .95, ease: 'power3.out' }, .08)
      .to('.loader-word', { opacity: 1, y: 0, duration: .65, stagger: .18, ease: 'power2.out' }, .2)
      .to('.loader-bottom,.loader-skip', { opacity: 1, duration: .4 }, .45)
      .to(counter, { value: 100, duration: 2.25, ease: 'power1.inOut', onUpdate: () => { $('.loader-count').textContent = String(Math.round(counter.value)).padStart(2, '0'); } }, 0);
    // Swap on a single timeline frame so there is no blank square between photos.
    for (let i = 1; i < 15; i++) {
      const time = .15 * i;
      introTimeline.set(photos[(i - 1) % photos.length], { autoAlpha: 0 }, time)
        .set(photos[i % photos.length], { autoAlpha: 1 }, time);
    }
    introTimeline.to('.loader-photo-stage', { y: -30, opacity: 0, duration: .45, ease: 'power2.in' }, 2.3)
      .to('.loader-word,.loader-bottom,.loader-skip', { y: -12, opacity: 0, duration: .4, ease: 'power2.in' }, 2.35)
      .to(loader, { autoAlpha: 0, duration: .65, ease: 'power2.inOut' }, 2.65)
      .to('.hero-interface', { opacity: 1, duration: .75, ease: 'power2.out' }, 2.65)
      .to(entrance, { value: 1, duration: .9, ease: 'power2.out', onUpdate: () => heroScene?.setEntrance(entrance.value) }, 2.45);
    ScrollTrigger.refresh();
  }
  $('.loader-skip').addEventListener('click', dismissIntro);
  $('.replay-intro').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'instant' }); heroScrollTimeline?.progress(0); playIntro(); });
  $('.hero-journey-scroll').addEventListener('click', event => {
    if (motionOff) return;
    event.preventDefault();
    history.pushState(null, '', '#feeling');
    const hero = $('.hero-experience');
    window.scrollTo({ top: hero.offsetTop + (hero.offsetHeight - innerHeight) * .77, behavior: 'smooth' });
  });

  // Smooth only deliberate anchor navigation; all input and refreshes stay native.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    const target = hash === '#' ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
    if (hash !== '#' && !target) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    window.scrollTo({ top: target ? target.getBoundingClientRect().top + scrollY - 24 : 0, behavior: motionOff ? 'instant' : 'smooth' });
    const focusTarget = target || $('.brand');
    if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  });

  function setupMotion() {
    galleryController?.destroy();
    introTimeline?.scrollTrigger?.kill();
    introTimeline?.kill();
    motionContext?.revert();
    document.documentElement.classList.toggle('hero-static', motionOff);
    heroScene?.setMotion(motionOff);
    heroScene?.setScroll(0);
    if (motionOff) { galleryController = galleryFactory?.({ reducedMotion:true }); return; }
    motionContext = gsap.context(() => {
      const state = { scroll: 0 };
      const characters = $$('.statement-line .char');
      gsap.set('.hero-story', { autoAlpha: 0 });
      gsap.set(characters, { yPercent: 170, rotationX: -85, rotationY: 16, z: -70, opacity: 0 });
      heroScrollTimeline = gsap.timeline({ scrollTrigger: { trigger: '.hero-experience', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
      heroScrollTimeline
        .to(state, { scroll: 1, duration: 1, ease: 'none', onUpdate: () => heroScene?.setScroll(state.scroll) }, 0)
        .fromTo('.hero-interface', { y: 0 }, { y: () => -innerHeight*1.17, duration: .46, ease: 'none' }, 0)
        .fromTo('.hero-scene-fallback', { yPercent: 0 }, { yPercent: -117, duration: .46, ease: 'none' }, 0)
        .fromTo('.hero-journey-scroll', { opacity: 1 }, { opacity: 0, duration: .08, ease: 'none' }, 0)
        .fromTo('.hero-depth-background', { opacity: 0 }, { opacity: 1, duration: .55, ease: 'none' }, .05)
        .set('.hero-story', { autoAlpha: 1 }, .2)
        .to(characters, { yPercent: 0, rotationX: 0, rotationY: 0, z: 0, opacity: 1, duration: .22, stagger: .009, ease: 'power2.out' }, .25)
        .fromTo('.hero-story .statement-script', { opacity: 0, y: 30, rotation: -4 }, { opacity: 1, y: 0, rotation: -8, duration: .16 }, .51)
        .fromTo('.hero-story .feeling-bottom', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .65)
        .fromTo('.hero-canvas', { opacity: 1 }, { opacity: .12, duration: .26, ease: 'none' }, .74);
      $$('.reveal-lines:not(#moments-title)').forEach(title => gsap.from(title, { y: 36, opacity: 0, duration: .85, ease: 'power2.out', scrollTrigger: { trigger: title, start: 'top 94%', end: 'top 76%', scrub: true } }));
      // A restrained keynote-style reveal: each line settles sharply as it enters.
      const momentsReveal = gsap.timeline({ scrollTrigger: { id: 'moments-copy', trigger: '.moments>.section-heading', start: 'top 93%', end: 'top 42%', scrub: true, invalidateOnRefresh: true } });
      momentsReveal.fromTo('#moments-title .moment-line', { y: 42, opacity: .12, filter: 'blur(7px)', scale: .985 }, { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, stagger: .2, duration: .7, ease: 'power2.out' }, 0);
      gsap.fromTo('.footer-wordmark .footer-letters .char', { yPercent: 130, rotationX: -35, opacity: 0 }, { yPercent: 0, rotationX: 0, opacity: 1, stagger: .055, duration: 1, ease: 'power2.out', scrollTrigger: { id: 'footer-scroll', trigger: '.footer', start: 'top 90%', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
    });
    galleryController = galleryFactory?.({ reducedMotion:false });
    ScrollTrigger.refresh();
  }
  function updateMotionButton() {
    const button = $('.motion-toggle');
    button.setAttribute('aria-pressed', String(motionOff));
    button.innerHTML = `MOTION: ${motionOff ? 'OFF' : 'ON'} <span>${motionOff ? '○' : '◉'}</span>`;
    document.body.classList.toggle('motion-disabled', motionOff);
  }
  function changeMotion(off) {
    userMotionOff = off;
    motionOff = mediaQuery.matches || userMotionOff;
    introTimeline?.kill();
    motionContext?.revert();
    gsap.set('.hero-interface', { opacity: 1 });
    finishIntro();
    setupMotion();
    heroScene?.setEntrance(1);
    updateMotionButton();
  }
  $('.motion-toggle').addEventListener('click', () => changeMotion(!motionOff));
  mediaQuery.addEventListener('change', () => changeMotion(userMotionOff));
  let responsiveFrame;
  function refreshResponsiveMotion() {
    cancelAnimationFrame(responsiveFrame);
    responsiveFrame = requestAnimationFrame(() => {
      if (!galleryFactory || !heroScene) return;
      setupMotion();
      gsap.set('.hero-interface', { opacity: 1 });
      heroScene?.setEntrance(1);
      finishIntro();
    });
  }
  matchMedia('(max-width:760px)').addEventListener('change', refreshResponsiveMotion);
  matchMedia('(max-height:560px)').addEventListener('change', refreshResponsiveMotion);
  matchMedia('(max-width:1024px) and (pointer:coarse)').addEventListener('change', refreshResponsiveMotion);
  updateMotionButton();
  // Fonts settle before the first coordinated frame; a slow font never blocks the entrance.
  const loaderPicturesReady = Promise.all([...document.querySelectorAll('.loader-photo img')].map(picture => picture.decode().catch(() => {})));
  Promise.all([sceneReady, galleryReady, Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1800))]), Promise.race([loaderPicturesReady, new Promise(resolve => setTimeout(resolve, 800))])]).then(() => {
    setupMotion();
    if (location.hash === '#feeling' && !motionOff) { const hero = $('.hero-experience'); window.scrollTo({ top: hero.offsetTop + (hero.offsetHeight - innerHeight) * .77, behavior: 'instant' }); }
    if (introDismissed || scrollY > 4 || (location.hash && location.hash !== '#')) dismissIntro();
    else playIntro();
  });
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();
