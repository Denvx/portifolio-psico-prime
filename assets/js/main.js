/* ==========================================================================
   Interações do site — JavaScript puro, sem dependências.
   Tudo funciona sem JS (conteúdo visível, âncoras, FAQ nativo);
   o script apenas refina a experiência.
   ========================================================================== */
(() => {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Canais de contato (só cria links com dados reais) ---------- */
  const waNumber = String(cfg.whatsapp || '').replace(/\D/g, '');
  const waUrl = (text) =>
    waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(text || cfg.whatsappMessage || '')}` : null;
  const email = String(cfg.email || '').trim();
  const insta = String(cfg.instagram || '').replace(/^@/, '').trim();

  const externalLink = (href, text, label) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    if (label) a.setAttribute('aria-label', label);
    return a;
  };

  if (waNumber) {
    $$('[data-contact="whatsapp"]').forEach((a) => {
      a.href = waUrl();
      a.target = '_blank';
      a.rel = 'noopener';
    });
    const waText = cfg.whatsappDisplay || `+${waNumber}`;
    $$('[data-fill="whatsapp"]').forEach((el) => el.replaceChildren(externalLink(waUrl(), waText, `WhatsApp ${waText} (abre em nova aba)`)));
    $$('[data-fill="whatsapp-link"]').forEach((el) => el.replaceChildren(externalLink(waUrl(), 'WhatsApp')));
  }
  if (email) {
    $$('[data-fill="email"]').forEach((el) => el.replaceChildren(externalLink(`mailto:${email}`, email)));
    $$('[data-fill="email-link"]').forEach((el) => el.replaceChildren(externalLink(`mailto:${email}`, 'E-mail')));
  }
  if (insta) {
    $$('[data-fill="instagram-link"]').forEach((el) =>
      el.replaceChildren(externalLink(`https://www.instagram.com/${insta}/`, `Instagram @${insta}`)));
  }

  /* ---------- Ano no rodapé ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Header: estado ao rolar ---------- */
  const header = $('[data-header]');
  const onScrollHeader = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Rolagem suave (Lenis) ----------
     Só com roda do mouse/trackpad; no toque o celular mantém a rolagem nativa.
     Desligada para quem pede movimento reduzido. */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95
    });
    const loop = (time) => { lenis.raf(time); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  // Âncoras internas: rolagem suave com compensação do header e foco acessível
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    const go = () => {
      const offset = -((header && header.offsetHeight) || 0) - 8;
      if (lenis) {
        lenis.scrollTo(target, { offset, force: true, duration: 1.3 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      history.pushState(null, '', id);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    // Link dentro do menu móvel: o menu fecha primeiro (e libera a rolagem);
    // só depois disso a página rola — senão o fechamento cancela a rolagem.
    const dialog = a.closest('dialog');
    if (dialog) {
      dialog.addEventListener('close', () => requestAnimationFrame(go), { once: true });
      if (dialog.open) dialog.close();
    } else {
      go();
    }
  });

  /* ---------- Menu móvel (dialog nativo) ---------- */
  const menu = $('#menu-mobile');
  const openBtn = $('[data-menu-open]');
  if (menu && openBtn && typeof menu.showModal === 'function') {
    const close = () => menu.open && menu.close();
    openBtn.addEventListener('click', () => {
      menu.showModal();
      lenis && lenis.stop();
      document.documentElement.style.overflow = 'hidden';
    });
    menu.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      lenis && lenis.start();
      openBtn.focus({ preventScroll: true });
    });
    $('[data-menu-close]', menu)?.addEventListener('click', close);
    menu.addEventListener('click', (e) => { if (e.target === menu) close(); });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) close(); });
  } else if (openBtn) {
    // Fallback raro (navegadores sem <dialog>): leva direto ao conteúdo
    openBtn.addEventListener('click', () => { location.hash = '#apresentacao'; });
  }

  /* ---------- Revelação ao rolar ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Link ativo na navegação ---------- */
  const navLinks = $$('.nav__list a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          const active = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Linha de progresso em "Como funciona" ---------- */
  const steps = $('[data-steps]');
  if (steps) {
    const items = $$('.step', steps);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = steps.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (anchor - r.top) / r.height));
      steps.style.setProperty('--p', p.toFixed(3));
      items.forEach((li) => li.classList.toggle('is-active', li.getBoundingClientRect().top < anchor));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ---------- Efeitos ligados à rolagem (um único laço rAF) ---------- */
  // Divide o texto em palavras preservando <em> e outros elementos
  const splitWords = (root) => {
    [...root.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.appendChild(s);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        splitWords(node);
      }
    });
  };
  const wordBlocks = $$('[data-words]').map((el) => {
    splitWords(el);
    return { el, words: $$('.w', el) };
  });

  const progressBar = $('[data-scroll-progress]');
  const seal = $('[data-seal]');
  const parallax = [
    ...$$('.frame--hero, .frame--about').map((frame) => ({ box: frame, el: frame.firstElementChild, speed: 0.12, inner: true })),
    ...$$('.frame--detail').map((frame) => ({ box: frame, el: frame, speed: -0.06, inner: false }))
  ].filter((p) => p.el);

  let fxTicking = false;
  const renderFx = () => {
    fxTicking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;

    if (progressBar) progressBar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    if (reduceMotion) return;

    if (seal) seal.style.transform = `rotate(${(y * 0.12).toFixed(2)}deg)`;

    parallax.forEach(({ box, el, speed, inner }) => {
      const r = box.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      // a imagem é 12% maior que a moldura: nunca deslocar mais que a sobra (6% de cada lado)
      const limit = inner ? r.height * 0.055 : 40;
      const offset = Math.max(-limit, Math.min(limit, (r.top + r.height / 2 - vh / 2) * speed));
      el.style.transform = inner
        ? `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.12)`
        : `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });

    wordBlocks.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      // acende do momento em que o bloco entra até ele chegar a ~35% da tela
      const p = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.57 + r.height * 0.5)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    });
  };
  const requestFx = () => { if (!fxTicking) { fxTicking = true; requestAnimationFrame(renderFx); } };
  renderFx();
  window.addEventListener('scroll', requestFx, { passive: true });
  window.addEventListener('resize', requestFx, { passive: true });

  /* ---------- Botões magnéticos (somente mouse) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.hero .btn--primary, .header__cta, .process__cta, .footer__top .btn').forEach((btn) => {
      btn.setAttribute('data-magnetic', '');
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${(dx * 10).toFixed(1)}px, ${(dy * 8).toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), background .2s, box-shadow .45s';
        btn.style.transform = '';
        setTimeout(() => { btn.style.transition = ''; }, 600);
      });
    });
  }

  /* ---------- CTA fixo no celular ---------- */
  const mobileCta = $('[data-mobile-cta]');
  const hero = $('#inicio');
  const contact = $('#contato');
  const footer = $('.site-footer');
  if (mobileCta && hero && 'IntersectionObserver' in window) {
    const ctaLink = $('a', mobileCta);
    const state = { hero: true, end: false };
    const render = () => {
      const show = !state.hero && !state.end;
      mobileCta.classList.toggle('is-visible', show);
      mobileCta.setAttribute('aria-hidden', String(!show));
      ctaLink.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { state.hero = e.isIntersecting; render(); }).observe(hero);
    const endObs = new IntersectionObserver((entries) => {
      state.end = entries.some((e) => e.isIntersecting) ||
        [contact, footer].some((el) => el && el.getBoundingClientRect().top < window.innerHeight);
      render();
    });
    [contact, footer].forEach((el) => el && endObs.observe(el));
  }

  /* ---------- Formulário de contato ---------- */
  const form = $('[data-contact-form]');
  if (form) {
    const status = $('[data-form-status]', form);
    const messages = {
      nome: 'Conte como posso te chamar.',
      contato: 'Informe um telefone ou e-mail para que eu possa responder.',
      consentimento: 'Para enviar, é preciso concordar com o uso dos dados para retorno.'
    };
    const looksLikeContact = (v) => /\S+@\S+\.\S+/.test(v) || v.replace(/\D/g, '').length >= 10;

    const validateField = (input) => {
      const field = input.closest('.field');
      const err = field && $('.field__error', field);
      let msg = '';
      if (input.type === 'checkbox') {
        if (!input.checked) msg = messages[input.name];
      } else if (!input.value.trim()) {
        msg = messages[input.name];
      } else if (input.name === 'contato' && !looksLikeContact(input.value)) {
        msg = 'Parece incompleto. Use um telefone com DDD ou um e-mail válido.';
      }
      if (field) field.classList.toggle('is-invalid', Boolean(msg));
      input.setAttribute('aria-invalid', String(Boolean(msg)));
      if (err) err.textContent = msg;
      return !msg;
    };

    const required = $$('[required]', form);
    required.forEach((input) => {
      input.addEventListener('blur', () => { if (input.type !== 'checkbox') validateField(input); });
      input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
      input.addEventListener('change', () => { if (input.type === 'checkbox') validateField(input); });
    });

    const setStatus = (text, type) => {
      status.textContent = text;
      status.className = `form__status${type ? ` is-${type}` : ''}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('', '');
      const results = required.map(validateField);
      if (results.includes(false)) {
        required[results.indexOf(false)].focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      if (data.site) return; // honeypot preenchido: provável robô

      const btn = $('button[type="submit"]', form);
      const summary = [
        `Olá! Meu nome é ${data.nome}. Gostaria de saber mais sobre o atendimento (${data.modalidade}).`,
        (data.mensagem || '').trim(),
        `Prefiro retorno por ${data.retorno}: ${data.contato}`
      ].filter(Boolean).join('\n\n');

      if (cfg.formEndpoint) {
        btn.disabled = true;
        setStatus('Enviando…', '');
        try {
          const res = await fetch(cfg.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              nome: data.nome, contato: data.contato, retorno: data.retorno,
              modalidade: data.modalidade, mensagem: data.mensagem || '', consentimento: true
            })
          });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          setStatus('Mensagem enviada. Obrigada pelo contato — responderei em breve.', 'success');
        } catch {
          setStatus(waNumber
            ? 'Não foi possível enviar agora. Você pode tentar novamente ou falar pelo WhatsApp.'
            : 'Não foi possível enviar agora. Por favor, tente novamente em instantes.', 'error');
        } finally {
          btn.disabled = false;
        }
        return;
      }

      if (waNumber) {
        window.open(waUrl(summary), '_blank', 'noopener');
        setStatus('Abrimos o WhatsApp com sua mensagem pronta. É só confirmar o envio por lá.', 'success');
        return;
      }

      setStatus('O canal de envio ainda não foi configurado nesta versão de apresentação. Os dados não foram enviados.', 'error');
    });
  }
})();
