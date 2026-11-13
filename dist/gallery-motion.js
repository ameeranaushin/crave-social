// Section galleries follow native scrolling; the separate opening reveal plays automatically.
export function createGalleryMotion({ reducedMotion = false } = {}) {
  const { gsap } = window;
  const $ = selector => document.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const listeners = [], observers = [];
  let dead = false;
  const compact = matchMedia('(max-width:760px), (max-height:560px)').matches;
  const mobileReels = !reducedMotion && matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)').matches;
  document.documentElement.classList.toggle('mobile-reels', mobileReels);
  document.documentElement.classList.toggle('galleries-compact', compact);
  document.documentElement.classList.toggle('mobile-gallery-motion', compact && !reducedMotion && innerHeight > 560);
  const on = (el, event, handler, options) => {
    el.addEventListener(event, handler, options);
    listeners.push(() => el.removeEventListener(event, handler, options));
  };
  document.documentElement.classList.add('gallery-motion-ready');
  document.documentElement.classList.toggle('galleries-static', reducedMotion);

  // Ticket tabs remain direct user controls in both motion modes.
  const panels = $$('.programme-panel');
  function selectPanel(index) {
    panels.forEach((panel, i) => {
      const active = i === index;
      panel.classList.toggle('is-active', active);
      panel.querySelector('.programme-tab').setAttribute('aria-expanded', String(active));
      panel.querySelector('.programme-status').textContent = active ? 'Viewing' : 'Open +';
      panel.querySelector('.programme-content').inert = !active;
    });
  }
  panels.forEach((panel, index) => {
    const button = panel.querySelector('.programme-tab');
    on(button, 'click', () => selectPanel(index));
    on(button, 'keydown', event => {
      const actions = { ArrowRight: (index + 1) % 3, ArrowDown: (index + 1) % 3, ArrowLeft: (index + 2) % 3, ArrowUp: (index + 2) % 3, Home: 0, End: 2 };
      if (actions[event.key] !== undefined) {
        event.preventDefault(); selectPanel(actions[event.key]);
        panels[actions[event.key]].querySelector('.programme-tab').focus();
      }
    });
  });

  const films = $('.films'), stage = $('.film-fan-stage'), slots = $$('.film-slot'), videos = $$('.film-card video');
  const orbit = { turn: 0 };
  let filmVisible = false, orbitTrigger, horizontalTrigger;
  const horizontal = { progress: 0, offset: 0 };
  const horizontalMetrics = { distance: 0, hold: 0, travel: 1 };
  function seekFilms() {
    if (!filmVisible || compact || mobileReels || reducedMotion || document.hidden || document.body.classList.contains('modal-open')) return;
    const progress = orbit.turn / 360;
    videos.forEach(video => {
      // Decode only the central previews, never five competing seeks per frame.
      if (Math.abs(Number(video.closest('.film-slot').dataset.offset)) > .75 || video.seeking) return;
      if (video.readyState >= 1 && Number.isFinite(video.duration)) {
        const time = Math.max(0, Math.min(video.duration - .04, progress * video.duration));
        if (Math.abs(video.currentTime - time) > .10) video.currentTime = time;
      }
      video.pause();
    });
  }
  // Return cards at the ends of the arc make a complete cycle seamless.
  // They are decorative stills; the five original cards remain the accessible players.
  const ghosts = reducedMotion || compact || mobileReels ? [] : slots.map(slot => {
    const ghost = document.createElement('div');
    ghost.className = 'film-slot film-ghost';
    ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
    const frame = document.createElement('div'); frame.className = 'film-card';
    const image = slot.querySelector('img').cloneNode(); image.alt = ''; image.loading = 'lazy';
    frame.append(image); ghost.append(frame); slot.parentElement.append(ghost);
    return ghost;
  });
  let paintHaunted = () => {};
  function paintFanSlot(slot, offset, decorative = false) {
    // Follow the same arc, with a close gap sized to the enlarged, rotated cards.
    const angle = Math.abs(offset) * Math.PI / 18, radiansPerCard = Math.PI / 18;
    const gap = Math.max(24, stage.clientWidth * .022);
    const x = Math.sign(offset) * ((slot.offsetWidth * Math.sin(angle) + slot.offsetHeight * (1 - Math.cos(angle))) / radiansPerCard + Math.abs(offset) * gap);
    const y = offset * offset * Math.min(20, stage.clientHeight * .022), rotation = offset * 6;
    if (!decorative) slot.dataset.offset = String(offset);
    const opacity = decorative ? Math.max(0, Math.min(1, (3.7 - Math.abs(offset)) / .7)) : 1;
    slot.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) rotate(${rotation.toFixed(3)}deg)`;
    slot.style.zIndex = String(30 - Math.round(Math.abs(offset) * 5));
    slot.style.opacity = String(opacity);
  }
  function paintOrbit() {
    if (dead || reducedMotion || compact || mobileReels) return;
    slots.forEach((slot, i) => {
      const offset = ((i - 2 - orbit.turn / 72 + 2.5) % 5 + 5) % 5 - 2.5;
      paintFanSlot(slot, offset);
      paintFanSlot(ghosts[i], offset + (offset < 0 ? 5 : -5), true);
    });
    films.dataset.rotation = orbit.turn.toFixed(3);
    $('.orbit-progress i').style.transform = `scaleX(${orbit.turn / 360})`;
    updateFilmControls();
    if (filmVisible) prepareFilms();
  }
  function prepareFilms() {
    if (!filmVisible || compact || mobileReels || reducedMotion || document.hidden || document.body.classList.contains('modal-open')) return;
    videos.forEach(video => {
      if (Math.abs(Number(video.closest('.film-slot').dataset.offset)) > .75) return;
      if (!video.getAttribute('src')) { video.preload = 'auto'; video.src = video.dataset.src; video.load(); }
    });
    seekFilms();
  }
  videos.forEach(video => {
    video.pause();
    on(video, 'loadedmetadata', seekFilms);
    on(video, 'seeked', seekFilms);
    on(video, 'loadeddata', () => { if (!dead && !reducedMotion) { video.closest('.film-card').classList.add('is-previewing'); seekFilms(); } });
  });
  const observer = new IntersectionObserver(entries => { filmVisible = entries[0].isIntersecting; prepareFilms(); }, { threshold: .01 });
  observer.observe(films); observers.push(observer);
  on(document, 'visibilitychange', prepareFilms);
  on(window, 'resize', () => { if (mobileReels) measureHorizontal(); paintOrbit(); paintHaunted(); updateFilmControls(); });
  const track = $('.film-track'), previous = $('.film-prev'), next = $('.film-next');
  let currentFilm = mobileReels ? 0 : 2;
  const setHorizontalX = gsap.quickSetter(track, 'x', 'px');
  function measureHorizontal() {
    horizontalMetrics.distance = Math.max(0, slots.at(-1).offsetLeft - slots[0].offsetLeft);
    horizontalMetrics.hold = Math.min(90, innerHeight * .1);
    horizontalMetrics.travel = horizontalMetrics.distance + horizontalMetrics.hold * 2;
    films.style.setProperty('--reels-travel', horizontalMetrics.travel + 'px');
  }
  function paintHorizontal() {
    if (dead || !mobileReels) return;
    horizontal.offset = Math.max(0, Math.min(horizontalMetrics.distance, horizontal.progress * horizontalMetrics.travel - horizontalMetrics.hold));
    setHorizontalX(-horizontal.offset);
    updateFilmControls();
  }
  function goToHorizontalFilm(index, behavior = 'smooth') {
    if (!horizontalTrigger) return;
    const offset = horizontalMetrics.hold + horizontalMetrics.distance * index / (slots.length - 1);
    window.scrollTo({ top: horizontalTrigger.start + offset, behavior });
  }
  track.tabIndex = mobileReels ? -1 : 0;
  if (mobileReels) { stage.tabIndex = 0; stage.setAttribute('role', 'region'); stage.setAttribute('aria-label', 'Film gallery. Scroll down or use arrow keys to explore all five films.'); }
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', mobileReels ? 'Five event films. Scroll down to browse, or use the arrow controls.' : 'Five event films. Use the film controls or swipe horizontally.');
  function updateFilmControls() {
    if (mobileReels) {
      currentFilm = Math.round(horizontalMetrics.distance ? horizontal.offset / horizontalMetrics.distance * (slots.length - 1) : 0);
      previous.disabled = currentFilm === 0;
      next.disabled = currentFilm === slots.length - 1;
    } else if (compact || reducedMotion) {
      const center = track.scrollLeft + track.clientWidth / 2;
      currentFilm = slots.reduce((closest, slot, i) => Math.abs(slot.offsetLeft + slot.offsetWidth / 2 - center) < Math.abs(slots[closest].offsetLeft + slots[closest].offsetWidth / 2 - center) ? i : closest, 0);
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    } else {
      currentFilm = ((Math.round(2 + orbit.turn / 72) % 5) + 5) % 5;
      previous.disabled = orbit.turn < .1;
      next.disabled = orbit.turn > 359.9;
    }
    const label = String(currentFilm + 1).padStart(2, '0') + ' / 05';
    if ($('.film-current').textContent !== label) $('.film-current').textContent = label;
    if (compact && !reducedMotion && !mobileReels) slots.forEach(slot => {
      const center = slot.offsetLeft + slot.offsetWidth / 2 - track.scrollLeft;
      const distance = Math.max(-1, Math.min(1, (center - track.clientWidth / 2) / track.clientWidth));
      slot.querySelector('.film-card').style.transform = 'rotate(' + (distance * 3).toFixed(2) + 'deg) scale(' + (1 - Math.abs(distance) * .035).toFixed(3) + ')';
    });
  }
  function moveFilm(direction) {
    if (mobileReels) {
      goToHorizontalFilm(Math.max(0, Math.min(slots.length - 1, currentFilm + direction)));
    } else if (compact || reducedMotion) {
      track.scrollBy({ left: direction * (slots[0].offsetWidth + 24), behavior: reducedMotion ? 'instant' : 'smooth' });
    } else if (orbitTrigger) {
      const progress = Math.max(0, Math.min(1, orbit.turn / 360 + direction * .2));
      window.scrollTo({ top: orbitTrigger.start + (orbitTrigger.end - orbitTrigger.start) * progress, behavior: 'smooth' });
    }
  }
  on(previous, 'click', () => moveFilm(-1));
  on(next, 'click', () => moveFilm(1));
  on(track, 'scroll', updateFilmControls, { passive: true });
  on(mobileReels ? stage : track, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : Math.max(0, Math.min(4, currentFilm + (event.key === 'ArrowRight' ? 1 : -1)));
    if (mobileReels) goToHorizontalFilm(index, 'instant');
    slots[index].querySelector('button').focus({ preventScroll: true });
    if (!mobileReels && (compact || reducedMotion)) track.scrollTo({ left: slots[index].offsetLeft - (track.clientWidth - slots[index].offsetWidth) / 2, behavior: reducedMotion ? 'instant' : 'smooth' });
  });
  $('.film-scroll-hint').innerHTML = mobileReels ? 'Scroll down to explore.<br>Tap a film to play.' : compact || reducedMotion ? 'Swipe for more films.<br>Choose a film to play.' : 'Scroll to explore.<br>Choose a film to play.';
  updateFilmControls();
  slots.forEach((slot, index) => on(slot, 'focusin', () => {
    if (mobileReels) {
      if (slot.querySelector('button').matches(':focus-visible')) goToHorizontalFilm(index, 'instant');
      return;
    }
    if (compact || reducedMotion || !slot.querySelector('button').matches(':focus-visible') || !orbitTrigger) return;
    const progress = ((index - 2 + 5) % 5) / 5;
    window.scrollTo({ top: orbitTrigger.start + (orbitTrigger.end - orbitTrigger.start) * progress, behavior: 'instant' });
  }));

  const context = gsap.context(() => {
    if (reducedMotion) return;
    if (!compact || innerHeight > 560) {
    // Two opposing slides for each scroll-controlled change of scene.
    const columns = $$('.duet-column'), groups = columns.map(column => $$('.duet-slide', column));
    groups.forEach(slides => gsap.set(slides, { yPercent: i => i === 0 ? 0 : 100, autoAlpha: 1 }));
    function syncDuet(self) {
      const current = self.progress < .37 ? 0 : self.progress < .79 ? 1 : 2;
      groups.forEach(slides => slides.forEach((slide, i) => { slide.inert = i !== current; }));
      $('.duet-sequence').dataset.pair = String(current + 1);
      $('.duet-scroll-progress i').style.transform = `scaleX(${self.progress})`;
    }
    const duet = gsap.timeline({ scrollTrigger: { id: 'bling-scroll', trigger: '.duet-sequence', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true, onUpdate: syncDuet } });
    groups.forEach((slides, column) => {
      const direction = column ? 1 : -1;
      for (let i = 1; i < 3; i++) {
        duet.to(slides[i - 1], { yPercent: direction * 100, duration: .5, ease: 'power2.inOut' }, i - 1 + .2)
          .fromTo(slides[i], { yPercent: -direction * 100 }, { yPercent: 0, duration: .5, ease: 'power2.inOut', immediateRender: true }, i - 1 + .2)
          .fromTo(slides[i].querySelector('img'), { scale: 1.12 }, { scale: 1, duration: .5, ease: 'none' }, i - 1 + .2);
      }
    });
    duet.to({}, { duration: .4 });
    syncDuet({ progress: 0 });

    // The reference's lifted photo stack opens pair by pair, then columns counter-scroll.
    const cards = $$('.haunted-card'), hauntedStage = $('.haunted-stage'), steps = $$('.haunted-steps>span');
    const layout = { progress: 0 }, ease = gsap.parseEase('power3.inOut');
    const startRotations = [-9, 7, -5, 10, -7, 4], stackX = [0, 5, -4, 3, -3, 4];
    paintHaunted = () => {
      if (dead || reducedMotion) return;
      const progress = layout.progress, drift = Math.min(20, hauntedStage.clientHeight * .025) * progress * progress;
      cards.forEach((card, i) => {
        if (compact) {
          const phase = Math.max(0, Math.min(1, progress * 6 - i));
          const depart = i === cards.length - 1 ? 0 : ease(phase);
          const sign = i % 2 ? 1 : -1;
          const rotation = startRotations[i] * (1 - Math.min(1, progress * 6 / (i + 1))) + sign * depart * 18;
          const x = sign * hauntedStage.clientWidth * 1.12 * depart;
          const y = -55 * depart + (i % 3 - 1) * 4;
          card.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + rotation.toFixed(2) + 'deg) scale(' + (.94 + .06 * depart).toFixed(3) + ')';
          card.style.opacity = String(1 - Math.max(0, depart - .7) / .3);
          card.style.zIndex = String(20 - i);
          card.dataset.arranged = String(phase >= 1);
          return;
        }
        const sign = i % 2 ? 1 : -1, pair = Math.floor(i / 2);
        const raw = Math.max(0, Math.min(1, (progress * 3 - pair - .05) / .84));
        const t = ease(raw), arc = Math.sin(raw * Math.PI);
        const targetX = sign * (hauntedStage.clientWidth * (compact ? .045 : .075) + card.offsetWidth / 2);
        const targetY = (pair - Math.max(0, progress * 3 - 1)) * (card.offsetHeight + (compact ? 20 : 30));
        const x = stackX[i] * (1 - t) + targetX * t;
        const y = (i % 3 - 1) * 3 * (1 - t) + targetY * t + sign * (arc * 22 + drift);
        const rotation = startRotations[i] * (1 - t) + sign * arc * 3;
        const tilt = (1 - t) * 9 + arc * 4, scale = .66 + .34 * t + arc * .018;
        card.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${(-i * 3 * (1 - t)).toFixed(3)}px) rotate(${rotation.toFixed(3)}deg) rotateX(${tilt.toFixed(3)}deg) rotateY(${(sign * arc * 8).toFixed(3)}deg) scale(${scale.toFixed(5)})`;
        card.style.zIndex = String(20 - i);
        card.dataset.arranged = String(raw >= 1);
      });
      $('.haunted-sequence').dataset.stage = String(Math.min(3, Math.floor(progress * 3) + 1));
      steps.forEach((step, i) => step.style.setProperty('--step', Math.max(0, Math.min(1, progress * 3 - i))));
    };
    const haunted = gsap.to(layout, { progress: 1, ease: 'none', onUpdate: paintHaunted, scrollTrigger: { id: 'haunted-scroll', trigger: '.haunted-sequence', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
    paintHaunted();
    cards.forEach((card, i) => on(card, 'focusin', () => {
      if (!card.matches(':focus-visible')) return;
      const trigger = haunted.scrollTrigger;
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (compact ? (i + .03) / 6 : (Math.floor(i / 2) + 1) / 3), behavior: 'instant' });
    }));

    } else {
      $$('.duet-photo,.haunted-card').forEach(photo => gsap.from(photo, { y: 22, opacity: .3, ease: 'none', scrollTrigger: { trigger: photo, start: 'top 95%', end: 'top 76%', scrub: true } }));
    }
    if (mobileReels) {
      gsap.set(track, { x: 0 });
      measureHorizontal();
      const horizontalTween = gsap.fromTo(horizontal, { progress: 0 }, {
        progress: 1, ease: 'none', onUpdate: paintHorizontal,
        scrollTrigger: {
          id: 'reels-mobile-scroll', trigger: films, start: 'top top', end: 'bottom bottom',
          scrub: true, invalidateOnRefresh: true,
          onRefreshInit: measureHorizontal,
          onRefresh: self => { horizontal.progress = self.progress; paintHorizontal(); }
        }
      });
      horizontalTrigger = horizontalTween.scrollTrigger;
      paintHorizontal();
    } else if (!compact) {
    // One full five-card cycle follows the same semicircular fan throughout.
    const orbitTween = gsap.to(orbit, { turn: 360, ease: 'none', onUpdate: paintOrbit, scrollTrigger: { id: 'reels-scroll', trigger: films, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
    orbitTrigger = orbitTween.scrollTrigger; paintOrbit();
    } else {
      gsap.fromTo('.film-track', { y: 34, opacity: .25 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.films', start: 'top 92%', end: 'top 68%', scrub: true } });
    }

    gsap.from('.programme-accordion', { y: 24, rotationX: 2, transformPerspective: 1200, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.programme-accordion', start: 'top 95%', end: 'top 78%', scrub: true } });

    // Feature cards arrive one by one, following the supplied design reference.
    const themeCards = $$('.theme-card');
    if (compact) {
      themeCards.forEach(card => gsap.from(card, { y: 24, opacity: .15, ease: 'none', scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 78%', scrub: true } }));
    } else {
      const worlds = gsap.timeline({ scrollTrigger: { id: 'worlds-scroll', trigger: '.worlds-sequence', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
      themeCards.forEach((card, i) => worlds.fromTo(card, { y: 70, scale: .97, rotation: 6, opacity: .1 }, { y: 0, scale: 1, rotation: [-2, 2, -1][i], opacity: 1, duration: .3, ease: 'power1.out' }, i * .2));
      worlds.to({}, { duration: .3 });
    }
    gsap.from('.people-banner-copy,.people-community-card', { y: 24, opacity: .15, stagger: .2, ease: 'none', scrollTrigger: { trigger: '.people-banner', start: 'top 95%', end: 'top 65%', scrub: true } });
    gsap.from('.tangerine-garden', { yPercent: compact ? 0 : 12, scale: 1.02, rotation: 0, ease: 'none', scrollTrigger: { trigger: '.people-banner', start: 'top 95%', end: 'bottom 75%', scrub: true } });
    $$('.chapter-stamp').forEach(stamp => gsap.from(stamp, { y: compact ? 22 : 45, rotation: i => compact ? 0 : [-3, 3, -2][i], opacity: .15, stagger: .1, ease: 'none', scrollTrigger: { trigger: stamp, start: 'top 95%', end: 'top 76%', scrub: true } }));
  });
  return { destroy() {
    dead = true; context.revert();
    films.style.removeProperty('--reels-travel');
    if (mobileReels) { stage.removeAttribute('tabindex'); stage.removeAttribute('role'); stage.removeAttribute('aria-label'); }
    track.tabIndex = 0;
    listeners.forEach(fn => fn()); observers.forEach(observer => observer.disconnect());
    slots.forEach(slot => { slot.querySelector('.film-card').style.transform = ''; slot.style.transform = ''; slot.style.zIndex = ''; slot.style.opacity = ''; slot.style.filter = ''; });
    ghosts.forEach(ghost => ghost.remove());
    $$('.haunted-card').forEach(card => { card.style.transform = ''; card.style.opacity = ''; card.style.zIndex = ''; delete card.dataset.arranged; });
    videos.forEach(video => { video.pause(); video.closest('.film-card').classList.remove('is-previewing'); });
    $$('.duet-slide').forEach(slide => { slide.inert = false; });
  } };
}
