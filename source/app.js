/* Birthday surprise — plain JavaScript, no packages or server required. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const BASE = Object.freeze({ ...window.BIRTHDAY_CONFIG });
  const STORAGE_KEY = 'birthday-surprise-personal:v2';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fields = ['recipient', 'passcode', 'specialDate', 'question', 'giftLine', 'loveHeading', 'birthdayNote', 'signature'];
  const photoFields = ['kittenPhoto', 'mainPhoto', 'secondPhoto', 'leftPhoto', 'rightPhoto'];
  const form = $('#personalise-form');
  const dialog = $('#personalise-dialog');
  const audio = $('#birthday-audio');
  let custom = readSaved();
  // An exported card carries its own settings and never picks up another card's saved settings.
  if (window.BIRTHDAY_PERSONAL) custom = { ...window.BIRTHDAY_PERSONAL };
  // Update the old defaults even when they were saved in this browser earlier.
  if (typeof custom.recipient === 'string' && custom.recipient.trim().toLowerCase() === 'baby') {
    custom.recipient = BASE.recipient;
  }
  if (custom.passcode === '1906') custom.passcode = BASE.passcode;
  if (custom.specialDate === '19.06.2026') custom.specialDate = BASE.specialDate;
  let config = { ...BASE, ...custom };
  let pin = '';
  let currentScreen = 'lock';
  let submitting = false;
  let musicEnabled = true;
  let typingTimer = 0;
  let submitTimer = 0;
  let advanceTimer = 0;
  let animationTimer = 0;
  let confettiTimer = 0;
  let photoJobs = new Map();

  function readSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
      const clean = {};
      for (const key of [...fields, ...photoFields]) {
        if (typeof saved[key] === 'string') clean[key] = saved[key];
      }
      if (!/^\d{4}$/.test(clean.passcode || '')) delete clean.passcode;
      return clean;
    } catch (_) { return {}; }
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(custom)); return true; }
    catch (_) { return false; }
  }

  function announce(message) { $('#announcement').textContent = message; }

  function asset(path) {
    return (window.BIRTHDAY_ASSETS && window.BIRTHDAY_ASSETS[path]) || path || '';
  }

  function hydrateAssets() {
    // The offline build stores each image and music file once, then resolves
    // these references locally. The source version uses ordinary relative URLs.
    $$('[data-asset]').forEach(element => {
      element.src = asset(element.getAttribute('data-asset'));
    });
  }

  function applyConfig() {
    config = { ...BASE, ...custom };
    if (!/^\d{4}$/.test(config.passcode)) config.passcode = '2026';
    $('#kitten-photo').src = asset(config.kittenPhoto);
    $('#kitten-photo').closest('.kitten-frame').classList.toggle('framed-cover', Boolean(config.coverIsFramed && !custom.kittenPhoto));
    $('#reference-collage').src = asset(config.collagePhoto);
    $('#main-photo').src = asset(config.mainPhoto);
    $('#second-photo').src = asset(config.secondPhoto);
    $('#second-photo').hidden = !config.secondPhoto;
    $('#main-heart').classList.toggle('single-photo', !config.secondPhoto);
    $('#left-photo').src = asset(config.leftPhoto);
    $('#right-photo').src = asset(config.rightPhoto);
    const useCustomPhotos = config.useReferenceCollage === false || ['mainPhoto', 'secondPhoto', 'leftPhoto', 'rightPhoto'].some(key => custom[key]);
    $('#reference-collage').hidden = useCustomPhotos;
    $('#custom-collage').hidden = !useCustomPhotos;
    $('#birthday-heading').textContent = `HAPPY BIRTHDAY ${config.recipient || BASE.recipient}`;
    $('#birthday-title').setAttribute('aria-label', `Happy birthday ${config.recipient || BASE.recipient}`);
    // Fit longer names inside the same arch instead of cutting off the text.
    $('#birthday-heading').parentNode.style.fontSize = (config.recipient || '').length > 12 ? '43px' : '';
    $('#love-heading').textContent = config.loveHeading;
    $('#love-title').setAttribute('aria-label', config.loveHeading);
    $('#love-heading').parentNode.style.fontSize = config.loveHeading.length > 23 ? '46px' : '';
    $('#special-date').textContent = config.specialDate;
    $('#gift-line').textContent = config.giftLine;
    $('#ask-title').textContent = config.question;
    $('#letter-greeting').textContent = `Happy birthday, ${config.recipient || BASE.recipient}!`;
    $('#birthday-note').textContent = config.birthdayNote || BASE.birthdayNote;
    $('#letter-signature').textContent = config.signature || BASE.signature;
    for (const [id, key] of [['memory-main', 'mainPhoto'], ['memory-second', 'secondPhoto'], ['memory-left', 'leftPhoto'], ['memory-right', 'rightPhoto']]) {
      const image = $(`#${id}`);
      image.src = asset(config[key]);
      image.closest('figure').hidden = !config[key];
    }
    const dateDigits = config.specialDate.replace(/\D/g, '').slice(0, 4);
    $('#pin-hint').textContent = dateDigits === config.passcode
      ? `Our special date: ${config.specialDate}, in DDMM ♡`
      : 'Ask the person who made this little surprise for your secret code ♡';
    document.title = `A birthday surprise for ${config.recipient || 'you'} ♡`;
    const musicSource = asset(config.music);
    if (audio.getAttribute('src') !== musicSource) audio.src = musicSource;
    audio.volume = 0.42;
  }

  function drawDecorations() {
    const ns = 'http://www.w3.org/2000/svg';
    const ring = $('#oval-hearts');
    const stars = $('#lock-stars');
    ring.replaceChildren();
    stars.replaceChildren();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const heart = document.createElementNS(ns, 'use');
      heart.setAttribute('href', '#tiny-heart');
      const x = 160 + Math.sin(a) * 137;
      const y = 235 - Math.cos(a) * 211;
      heart.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(-Math.sin(a) * 28).toFixed(1)}) scale(${i % 3 === 0 ? 1.13 : .93})`);
      ring.appendChild(heart);
    }
    const positions = [[88,78,1.05],[283,30,1],[491,79,.9],[533,216,1.05],[548,406,.92],[78,435,1.1],[110,635,.95],[383,657,1.08],[535,629,1.02],[45,247,.75],[450,494,.75],[390,110,.6]];
    positions.forEach(([x, y, scale], i) => {
      const star = document.createElementNS(ns, 'use');
      star.setAttribute('href', '#star');
      star.setAttribute('transform', `translate(${x} ${y}) rotate(${i % 2 ? -12 : 12}) scale(${scale})`);
      stars.appendChild(star);
    });
  }

  function typeText(element, text, speed = 34) {
    clearTimeout(typingTimer);
    if (reducedMotion) { element.textContent = text; return; }
    element.textContent = '';
    const characters = Array.from(text);
    let count = 0;
    function tick() {
      element.textContent = characters.slice(0, ++count).join('');
      if (count < characters.length) typingTimer = setTimeout(tick, speed);
    }
    tick();
  }

  function showScreen(name, focus = true) {
    clearTimeout(typingTimer);
    clearTimeout(submitTimer);
    clearTimeout(advanceTimer);
    clearTimeout(animationTimer);
    currentScreen = name;
    $$('.screen').forEach(section => {
      section.hidden = section.id !== `screen-${name}`;
      section.classList.remove('entering');
    });
    const screen = $(`#screen-${name}`);
    screen.classList.add('entering');
    $('#replay-button').hidden = name === 'lock';
    if (name === 'ask') {
      $('#ask-title').setAttribute('aria-label', config.question);
      typeText($('#ask-title'), config.question, 32);
    }
    const curved = $('[data-type]', screen);
    if (curved) typeText(curved, curved.dataset.type, 47);
    if (name === 'birthday') {
      screen.classList.remove('wish-made');
      $('#cake-button').setAttribute('aria-label', 'Make a wish and blow out the candle');
      burstConfetti(40);
      if (config.autoAdvanceMs > 0 && !reducedMotion) advanceTimer = setTimeout(() => {
        if (currentScreen === 'birthday' && !dialog.open) showScreen('love');
      }, config.autoAdvanceMs);
    }
    if (name === 'love') burstConfetti(18);
    if (name === 'letter') {
      $('#envelope-intro').hidden = false;
      $('#letter-opened').hidden = true;
      $('#open-letter').setAttribute('aria-expanded', 'false');
    }
    if (focus) {
      const title = $('h1', screen);
      if (title) title.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    animationTimer = setTimeout(() => screen.classList.remove('entering'), 700);
  }

  function updatePin() {
    $$('.pin-box').forEach((box, index) => {
      const filled = index < pin.length;
      box.textContent = filled ? '*' : '';
      box.classList.toggle('filled', filled);
    });
    $('#pin-display').setAttribute('aria-label', `${pin.length} of 4 digits entered`);
  }

  function resetPin() {
    clearTimeout(submitTimer);
    submitting = false;
    pin = '';
    updatePin();
    showScreen('lock');
  }

  function tryMusic() {
    if (!musicEnabled) return;
    const result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(() => {
      // Autoplay can be blocked until the next deliberate click. The card still works.
    });
  }

  function submitPin() {
    if (pin.length !== 4) { announce('Enter all four digits first.'); return; }
    if (submitting) return;
    submitting = true;
    submitTimer = setTimeout(() => {
      const correct = pin === config.passcode;
      pin = '';
      submitting = false;
      updatePin();
      showScreen(correct ? 'ask' : 'wrong');
      announce(correct ? 'Your surprise is unlocked.' : 'Wrong passcode. Try again.');
    }, reducedMotion ? 0 : 170);
  }

  function inputKey(key) {
    if (currentScreen !== 'lock' || dialog.open) return;
    tryMusic();
    if (key === '*') {
      clearTimeout(submitTimer); submitting = false; pin = ''; updatePin(); return;
    }
    if (key === 'Backspace' || key === 'Delete') {
      clearTimeout(submitTimer); submitting = false; pin = pin.slice(0, -1); updatePin(); return;
    }
    if (key === '#' || key === 'Enter') { submitPin(); return; }
    if (submitting || !/^\d$/.test(key) || pin.length === 4) return;
    pin += key;
    updatePin();
    if (pin.length === 4) submitPin();
  }

  function burstConfetti(count) {
    if (reducedMotion) return;
    const root = $('#confetti');
    clearTimeout(confettiTimer);
    root.replaceChildren();
    const palette = ['#d39eaf', '#aabd9f', '#dfc475', '#beddd4', '#ca7a78'];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = `confetti-piece${i % 5 === 0 ? ' heart-piece' : ''}`;
      if (i % 5 === 0) piece.textContent = '♡';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty('--confetti-color', palette[i % palette.length]);
      piece.style.setProperty('--duration', `${4 + Math.random() * 3}s`);
      piece.style.setProperty('--delay', `${Math.random() * 1.5}s`);
      piece.style.setProperty('--drift', `${Math.random() * 220 - 110}px`);
      piece.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);
      root.appendChild(piece);
    }
    confettiTimer = setTimeout(() => root.replaceChildren(), 9000);
  }

  function fillForm() {
    fields.forEach(key => { form.elements.namedItem(key).value = config[key] || ''; });
    photoFields.forEach(key => {
      const input = form.elements.namedItem(key);
      input.value = '';
      input.closest('label').classList.toggle('has-image', Boolean(custom[key]));
    });
    photoJobs = new Map();
    $('#customise-status').textContent = '';
  }

  function optimisePhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { reject(new Error('Choose a photo file.')); return; }
      if (file.size > 20 * 1024 * 1024) { reject(new Error('Please choose a photo smaller than 20 MB.')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('This photo could not be read. Please choose another.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('This photo format could not be opened. Try JPG, PNG, or WebP.'));
        image.onload = () => {
          try {
            const ratio = Math.min(1, 1200 / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * ratio));
            canvas.height = Math.max(1, Math.round(image.height * ratio));
            const context = canvas.getContext('2d');
            context.fillStyle = '#fbf8f3';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', .84));
          } catch (_) { reject(new Error('This photo could not be prepared. Please choose another.')); }
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function saveForm(closeAfter) {
    if (!form.reportValidity()) return false;
    const saveButton = $('button[type="submit"]', form);
    saveButton.disabled = true;
    $('#export-button').disabled = true;
    try {
      const next = { ...custom };
      for (const key of fields) next[key] = form.elements.namedItem(key).value.trim();
      if (!next.recipient) next.recipient = BASE.recipient;
      if (!next.question) next.question = BASE.question;
      if (!next.loveHeading) next.loveHeading = BASE.loveHeading;
      if (!next.birthdayNote) next.birthdayNote = BASE.birthdayNote;
      const jobs = [...photoJobs.entries()];
      const results = await Promise.all(jobs.map(async ([key, job]) => [key, await job]));
      for (const [key, data] of results) next[key] = data;
      custom = next;
      const saved = persist();
      applyConfig();
      $('#customise-status').textContent = saved ? 'Your surprise is ready ♡' : 'Your changes are ready for this visit. Download your page to keep them.';
      if (closeAfter) { dialog.close(); resetPin(); announce('Your changes have been saved.'); }
      return true;
    } catch (error) {
      $('#customise-status').textContent = error.message || 'Please try another photo.';
      return false;
    } finally {
      saveButton.disabled = false;
      $('#export-button').disabled = false;
    }
  }

  async function downloadPersonalisedPage() {
    if (!(await saveForm(false))) return;
    $('#customise-status').textContent = 'Preparing your personalised page…';
    try {
      if (document.documentElement.dataset.standalone !== 'true') throw new Error('For an offline download, open the main index.html in your project folder.');
      const copy = document.documentElement.cloneNode(true);
      // All scripts, photos, music and styles are already embedded in the delivered page.
      // Remove hydrated image URLs: the asset table and personal settings restore
      // them on opening, without duplicating large photographs in the download.
      copy.querySelectorAll('[data-asset]').forEach(element => element.removeAttribute('src'));
      const personalScript = copy.querySelector('#personalised-config');
      const payload = JSON.stringify(custom).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
      personalScript.textContent = `window.BIRTHDAY_PERSONAL = ${payload};`;
      copy.querySelector('#personalise-dialog').removeAttribute('open');
      copy.querySelector('#confetti').replaceChildren();
      copy.querySelectorAll('.screen').forEach(section => { section.hidden = section.id !== 'screen-lock'; section.classList.remove('entering'); });
      copy.querySelector('#replay-button').hidden = true;
      copy.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
      copy.querySelector('#announcement').textContent = '';
      copy.querySelector('#customise-status').textContent = '';
      const blob = new Blob(['<!doctype html>\n', copy.outerHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `birthday-for-${(config.recipient || 'you').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40) || 'you'}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      $('#customise-status').textContent = 'Downloaded ♡ Send the HTML file, or upload it to your web host.';
    } catch (error) { $('#customise-status').textContent = error.message; }
  }

  $('#keypad').addEventListener('click', event => {
    const button = event.target.closest('button[data-key]');
    if (button) inputKey(button.dataset.key);
  });
  document.addEventListener('keydown', event => {
    if (dialog.open || currentScreen !== 'lock' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key) || ['Backspace', 'Delete', 'Enter', '*', '#'].includes(event.key)) {
      // Preserve normal keyboard activation of a focused keypad button.
      if (event.key === 'Enter' && event.target.closest('button')) return;
      event.preventDefault(); inputKey(event.key);
    }
  });
  $('[data-action="retry-pin"]').addEventListener('click', resetPin);
  $('#retry-question').addEventListener('click', () => showScreen('ask'));
  $('#yes-button').addEventListener('click', () => { tryMusic(); showScreen('birthday'); });
  $('#no-button').addEventListener('click', () => showScreen('no'));
  $('#gift-next').addEventListener('click', () => showScreen('love'));
  $('#letter-next').addEventListener('click', () => showScreen('letter'));
  $('#back-to-hearts').addEventListener('click', () => showScreen('love'));
  $('#open-letter').addEventListener('click', () => {
    $('#envelope-intro').hidden = true;
    $('#letter-opened').hidden = false;
    $('#open-letter').setAttribute('aria-expanded', 'true');
    $('#letter-greeting').focus({ preventScroll: true });
    burstConfetti(48);
    announce(`A birthday wish for ${config.recipient || 'you'}.`);
  });
  $('#cake-button').addEventListener('click', () => {
    $('#screen-birthday').classList.add('wish-made');
    $('#cake-button').setAttribute('aria-label', 'Your wish is made. Happy birthday!');
    burstConfetti(55); announce('Make a wish. Happy birthday!');
  });
  $('#replay-button').addEventListener('click', resetPin);
  $('#hint-button').addEventListener('click', () => {
    const hint = $('#pin-hint'); hint.hidden = !hint.hidden;
    $('#hint-button').setAttribute('aria-expanded', String(!hint.hidden));
  });
  $('#music-button').addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    $('#music-button').classList.toggle('music-muted', !musicEnabled);
    $('#music-button').setAttribute('aria-pressed', String(musicEnabled));
    const label = musicEnabled ? 'Turn music off' : 'Turn music on';
    $('#music-button').setAttribute('aria-label', label); $('#music-button').title = label;
    if (musicEnabled) tryMusic(); else audio.pause();
  });
  $('#edit-button').addEventListener('click', () => {
    clearTimeout(advanceTimer); clearTimeout(submitTimer); submitting = false;
    pin = ''; updatePin();
    fillForm(); dialog.showModal();
  });
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  } });
  form.addEventListener('submit', event => { event.preventDefault(); saveForm(true); });
  photoFields.forEach(key => {
    const input = form.elements.namedItem(key);
    input.addEventListener('change', () => {
      const file = input.files[0]; if (!file) { photoJobs.delete(key); return; }
      const job = optimisePhoto(file);
      // Attach a rejection handler immediately, including when Save has not been pressed yet.
      job.catch(error => { $('#customise-status').textContent = error.message; input.closest('label').classList.remove('has-image'); });
      photoJobs.set(key, job);
      job.then(() => input.closest('label').classList.add('has-image'), () => {});
    });
  });
  $('#export-button').addEventListener('click', downloadPersonalisedPage);
  $('#reset-button').addEventListener('click', () => {
    custom = {}; try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    applyConfig(); fillForm(); $('#customise-status').textContent = 'Your birthday version is restored ♡';
  });

  hydrateAssets(); drawDecorations(); applyConfig(); updatePin(); showScreen('lock', false);
})();
