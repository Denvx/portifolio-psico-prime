/**
 * Gera o site estático a partir de content/*.json (editado pelo painel /admin).
 * Uso: node scripts/build.mjs        — sem dependências externas.
 *
 * Sintaxe aceita nos textos do painel:
 *   *itálico*   **negrito**   [texto](https://link)   [[provisório]]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(readFileSync(join(root, 'content', `${name}.json`), 'utf8'));
const geral = read('geral');
const contatoSecao = read('contato');
const c = {
  ...geral,
  hero: read('inicio'),
  apresentacao: read('apresentacao'),
  sobre: read('sobre'),
  abordagem: read('abordagem'),
  temas: read('temas'),
  atendimento: read('atendimento'),
  processo: read('processo'),
  formacao: read('formacao'),
  faq: read('faq'),
  contatoSecao,
  rodape: { frase: contatoSecao.fraseRodape }
};

/* ---------- Helpers ---------- */
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const SAFE_URL = /^(https?:\/\/|mailto:|tel:|#|[\w./-]+\.html)/i;
const inline = (s = '') => esc(s)
  .replace(/\[\[(.+?)\]\]/g, '<span class="ph">$1</span>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    const u = url.replace(/&amp;/g, '&');
    if (!SAFE_URL.test(u)) return text;
    const ext = /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${esc(u)}"${ext}>${text}${ext ? '<span class="sr-only"> (abre em nova aba)</span>' : ''}</a>`;
  })
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>');

/* Textos de exemplo: enquanto a profissional não reescrever, aparecem marcados como provisórios */
const EXEMPLOS = new Set(JSON.parse(readFileSync(join(root, 'scripts', 'exemplos.json'), 'utf8')).map((x) => x.trim()));
let previewMode = true;
/** Renderiza um texto do painel. Vazio → rótulo provisório (só no modo apresentação). */
const t = (s, vazio = '') => {
  const raw = String(s ?? '').trim();
  if (!raw) return vazio && previewMode ? `<span class="ph">${esc(vazio)}</span>` : '';
  const html = inline(raw);
  return previewMode && EXEMPLOS.has(raw) ? `<span class="ph">${html}</span>` : html;
};
/** Mantém só itens com valor (no modo apresentação mantém todos, para mostrar o que falta) */
const filled = (items, key = 'valor') => list(items).filter((i) => previewMode || String(i?.[key] ?? '').trim());

/** Texto puro (para meta tags, JSON-LD, atributos) */
const plain = (s = '') => String(s).replace(/\[\[(.+?)\]\]/g, '$1').replace(/\*\*?(.+?)\*\*?/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const list = (a) => (Array.isArray(a) ? a : []).filter((x) => x !== null && x !== undefined && x !== '');
const show = (sec) => sec && sec.mostrar !== false;

const P = c.profissional || {};
const K = c.contato || {};
const cfg = c.config || {};
const preview = cfg.modoApresentacao !== false;
previewMode = preview;
const domain = String(cfg.dominio || '').replace(/\/+$/, '');
const crp = t(P.crp, '00/00000');
const iniciais = esc(String(P.iniciais || '').trim() || plain(P.nome).split(/\s+/).map((w) => w[0]).slice(0, 2).join(''));

/* Título e descrição: se ficarem vazios no painel, são gerados a partir dos dados da profissional */
const modalidades = [
  c.atendimento?.online?.mostrar !== false && 'on-line',
  c.atendimento?.presencial?.mostrar !== false && 'presencial'
].filter(Boolean).join(' e ');
const seoTitulo = plain(cfg.seoTitulo).trim()
  || `${plain(P.nome)} — ${plain(P.titulo)} | Psicoterapia ${modalidades}`;
const seoDescricao = plain(cfg.seoDescricao).trim()
  || `${plain(P.nome)}, ${plain(P.titulo).toLowerCase()}${P.crp ? ` (CRP ${plain(P.crp)})` : ''}. Psicoterapia individual ${modalidades}${P.cidade ? ` em ${plain(P.cidade)}` : ''}. Conheça a abordagem, como funciona o atendimento e agende uma primeira conversa.`;

/* Ícone da aba: imagem enviada no painel ou monograma gerado com as iniciais */
const faviconHref = cfg.favicon ? esc(String(cfg.favicon).replace(/^\/+/, '')) : 'assets/img/favicon.svg';
const faviconType = /\.svg$/i.test(faviconHref) ? 'image/svg+xml' : /\.ico$/i.test(faviconHref) ? 'image/x-icon' : 'image/png';
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#4A0E2F"/><text x="32" y="${iniciais.length > 2 ? 40 : 42}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${iniciais.length > 2 ? 21 : 27}" fill="#F4A6C4">${iniciais}</text></svg>\n`;

/* ---------- Numeração dinâmica dos capítulos ---------- */
const sections = [
  { id: 'apresentacao', label: 'Apresentação', on: true },
  { id: 'sobre', label: 'Sobre mim', on: true, nav: 'Sobre' },
  { id: 'abordagem', label: 'Abordagem', on: true, nav: 'Abordagem' },
  { id: 'temas', label: 'Temas', on: show(c.temas) },
  { id: 'atendimento', label: 'Atendimento', on: true, nav: 'Atendimento' },
  { id: 'como-funciona', label: 'Como funciona', on: true },
  { id: 'formacao', label: 'Formação', on: show(c.formacao) },
  { id: 'duvidas', label: 'Dúvidas', on: show(c.faq), nav: 'Dúvidas' },
  { id: 'contato', label: 'Contato', on: true }
].filter((s) => s.on);
sections.forEach((s, i) => { s.n = String(i + 1).padStart(2, '0'); });
const num = (id) => sections.find((s) => s.id === id)?.n || '';
const chapter = (id, label) => `<p class="chapter" data-reveal><span class="chapter__n">${num(id)}</span>${label}</p>`;

/* ---------- Fotografias ---------- */
const photo = (src, alt, placeholder, priority = false) => src
  ? `<img src="${esc(src)}" alt="${esc(plain(alt))}" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
  : placeholder;

const ARROW = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

/* ---------- Seções ---------- */
const H = c.hero || {};
const heroTitleLines = String(H.titulo || '').split(/\n+/).filter(Boolean)
  .map((l) => `<span class="line"><span>${t(l)}</span></span>`).join('\n            ');

const A = c.apresentacao || {};
const S = c.sobre || {};
const AB = c.abordagem || {};
const T = c.temas || {};
const AT = c.atendimento || {};
const PR = c.processo || {};
const F = c.formacao || {};
const FQ = c.faq || {};
const CS = c.contatoSecao || {};
const R = c.rodape || {};

/* Canais de contato gerados a partir dos dados (sem depender de JavaScript) */
const waDigits = String(K.whatsapp || '').replace(/\D/g, '');
const waNum = waDigits.length === 10 || waDigits.length === 11 ? '55' + waDigits : waDigits;
const waHref = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(K.whatsappMensagem || '')}` : '';
const igUser = String(K.instagram || '').replace(/^@/, '').trim();
const extLink = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}<span class="sr-only"> (abre em nova aba)</span></a>`;
const channel = (icon, label, html) => html ? `
            <li><svg class="icon" aria-hidden="true"><use href="#i-${icon}"/></svg><span class="channels__k">${label}</span><span class="channels__v">${html}</span></li>` : '';
const phOr = (html, label) => html || (previewMode ? `<span class="ph">${esc(label)}</span>` : '');

const kvList = (items) => filled(items).map((i) => `<div><dt>${t(i.rotulo)}</dt><dd>${t(i.valor, 'A definir')}</dd></div>`).join('\n            ');

const mode = (m, kind) => {
  if (!m || m.mostrar === false) return '';
  const dark = kind === 'presencial';
  return `
          <article class="mode${dark ? ' mode--dark' : ''}" data-reveal style="--i:${dark ? 1 : 0}">
            <div class="mode__icon"><svg class="icon" aria-hidden="true"><use href="#i-${dark ? 'door' : 'video'}"/></svg></div>
            <p class="mode__tag">Modalidade</p>
            <h3 class="mode__title">${dark ? 'Presencial' : 'On-line'}</h3>
            <p>${t(m.texto)}</p>
            <ul class="mode__meta">
              ${list(m.detalhes).map((d) => `<li>${t(d)}</li>`).join('\n              ')}
            </ul>
          </article>`;
};

const crisisFaq = `
          <details name="faq">
            <summary>E se eu estiver passando por uma crise agora?<span class="accordion__icon" aria-hidden="true"></span></summary>
            <div class="accordion__body"><p>Este site e o agendamento não são canais de emergência. Se você estiver em sofrimento intenso ou em risco, procure ajuda imediata: <strong>CVV — ligue 188</strong> (gratuito, 24 horas, ou <a href="https://cvv.org.br/" target="_blank" rel="noopener">cvv.org.br<span class="sr-only"> (abre em nova aba)</span></a>), <strong>SAMU — 192</strong>, ou o pronto-socorro mais próximo.</p></div>
          </details>`;

const ogImage = H.foto && domain ? `\n  <meta property="og:image" content="${esc(domain + '/' + String(H.foto).replace(/^\/+/, ''))}">` : '';

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: `${plain(P.nome)} — ${plain(P.titulo)}`,
  description: seoDescricao,
  url: domain + '/',
  areaServed: 'BR',
  address: { '@type': 'PostalAddress', ...(P.cidade ? { addressLocality: plain(P.cidade) } : {}), addressCountry: 'BR' },
  founder: { '@type': 'Person', name: plain(P.nome), jobTitle: plain(P.titulo), ...(P.crp ? { identifier: `CRP ${plain(P.crp)}` } : {}) }
}, null, 2).replace(/</g, '\\u003c');

/* ---------- Partes compartilhadas ---------- */
const head = ({ title, description, canonical, extra = '' }) => `<!doctype html>
<html lang="pt-BR" data-preview="${preview}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>document.documentElement.classList.add('js')</script>
  <!-- Arquivo GERADO por scripts/build.mjs a partir de content/*.json. Edite pelo painel /admin. -->
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta name="theme-color" content="#4A0E2F">${preview ? '\n  <meta name="robots" content="noindex">' : ''}
  <link rel="icon" href="${faviconHref}" type="${faviconType}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:wght@400..600&display=swap">
  <link rel="stylesheet" href="assets/css/styles.css">${extra}
</head>`;

const brand = (href) => `<a class="brand" href="${href}" aria-label="${esc(plain(P.nome))}, psicóloga — voltar ao início">
        <span class="brand__mark" aria-hidden="true">${iniciais}</span>
        <span class="brand__text">
          <span class="brand__name">${esc(plain(P.nome))}</span>
          <span class="brand__role">Psicóloga · CRP ${crp}</span>
        </span>
      </a>`;

const previewBar = `<div class="preview-bar" role="note">
    <div class="container">
      <span class="preview-bar__tag">Versão de apresentação</span>
      Trechos <mark class="ph">sublinhados assim</mark> são provisórios e aguardam os dados reais da profissional.
    </div>
  </div>`;

/* ---------- index.html ---------- */
const index = `${head({
  title: seoTitulo,
  description: seoDescricao,
  canonical: domain + '/',
  extra: `

  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="${esc(plain(P.nome))} — Psicóloga">
  <meta property="og:title" content="${esc(plain(P.nome))} — ${esc(plain(P.titulo))}">
  <meta property="og:description" content="${esc(seoDescricao)}">
  <meta property="og:url" content="${esc(domain + '/')}">${ogImage}
  <meta name="twitter:card" content="summary_large_image">
  <script>/* convites e recuperação de senha do painel */if(/(invite|recovery|confirmation|email_change)_token=/.test(location.hash))location.replace('/admin/'+location.hash)</script>

  <script src="assets/js/config.js" defer></script>
  <script src="assets/js/vendor/lenis.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>

  <script type="application/ld+json">
${jsonLd}
  </script>`
})}

<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  ${preview ? previewBar : ''}

  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.8 7.05L4 20l1.45-4.2A8 8 0 1 1 20 11.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-insta" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-video" viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m16 10.5 5-3v9l-5-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
    <symbol id="i-door" viewBox="0 0 24 24"><path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="14.5" cy="12.5" r="1" fill="currentColor"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-minus" viewBox="0 0 24 24"><path d="M6 12h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
    <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  </svg>

  <header class="site-header" data-header>
    <div class="container header__inner">
      ${brand('#inicio')}

      <nav class="nav" aria-label="Principal">
        <ul class="nav__list">
          ${sections.filter((s) => s.nav).map((s) => `<li><a href="#${s.id}">${s.nav}</a></li>`).join('\n          ')}
        </ul>
      </nav>

      <a class="btn btn--primary btn--sm header__cta" href="#contato">Agendar conversa</a>

      <button class="menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu-mobile" data-menu-open>
        <span class="menu-toggle__label">Menu</span>
        <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
      </button>
    </div>
    <span class="scroll-progress" aria-hidden="true" data-scroll-progress></span>
  </header>

  <dialog class="mobile-menu" id="menu-mobile" aria-label="Menu de navegação">
    <div class="mobile-menu__top">
      <span class="brand__name">${esc(plain(P.nome))}</span>
      <button class="mobile-menu__close" type="button" data-menu-close>Fechar</button>
    </div>
    <nav aria-label="Menu móvel">
      <ol class="mobile-menu__list">
        ${sections.map((s) => `<li><a href="#${s.id}"><span>${s.n}</span>${s.label}</a></li>`).join('\n        ')}
      </ol>
    </nav>
    <div class="mobile-menu__foot">
      <a class="btn btn--light btn--block" href="#contato">Agendar uma conversa ${ARROW}</a>
      <p>Psicoterapia ${modalidades} · CRP ${crp}</p>
    </div>
  </dialog>

  <main id="conteudo">

    <section class="hero" id="inicio" aria-labelledby="hero-title">
      <div class="container hero__grid">
        <div class="hero__copy">
          <p class="eyebrow hero__eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span>${t(H.eyebrow)}</p>

          <h1 class="hero__title" id="hero-title">
            ${heroTitleLines}
          </h1>

          <p class="hero__lead">${t(H.texto)}</p>

          <div class="hero__actions">
            <a class="btn btn--primary" href="#contato" data-contact="whatsapp">${esc(H.botao || 'Agendar uma conversa')} ${ARROW}</a>
            <a class="link-arrow" href="#como-funciona">Entender como funciona</a>
          </div>
        </div>

        <div class="hero__media">
          <figure class="frame frame--hero">
            ${photo(H.foto, H.fotoAlt, `<div class="frame__ph" role="img" aria-label="Espaço reservado para o retrato profissional da psicóloga">
              <span class="frame__ph-mono" aria-hidden="true">${esc(iniciais.charAt(0))}</span>
              <span class="frame__ph-label">Retrato profissional</span>
              <span class="frame__ph-spec">4:5 · luz natural · olhar para a câmera</span>
            </div>`, true)}
          </figure>

          <div class="seal" aria-hidden="true">
            <span class="seal__spin">
              <svg viewBox="0 0 200 200" class="seal__ring" data-seal>
                <defs><path id="seal-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/></defs>
                <text><textPath href="#seal-path" textLength="458" lengthAdjust="spacing">Psicoterapia · Escuta · Ética · Sigilo ·</textPath></text>
              </svg>
            </span>
            <span class="seal__center">${(() => { const [first, ...rest] = plain(P.nome).trim().split(/\s+/); return rest.length ? `${esc(first)}<br><em>${esc(rest.join(' '))}</em>` : `<em>${esc(first)}</em>`; })()}</span>
          </div>

          <p class="hero__caption"><span>${esc(plain(P.nome))}</span><span>Psicóloga · CRP ${crp}</span></p>
        </div>
      </div>

      <div class="container">
        <ul class="facts" aria-label="Resumo do atendimento">
          ${filled(H.resumo).map((f) => `<li><span class="facts__k">${t(f.rotulo)}</span><span class="facts__v">${t(f.valor, 'A definir')}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section class="manifesto section section--dark" id="apresentacao" aria-labelledby="manifesto-title">
      <div class="container manifesto__grid">
        ${chapter('apresentacao', 'Apresentação')}
        <h2 class="manifesto__quote" id="manifesto-title" data-words>${t(A.frase)}</h2>
        <div class="manifesto__body" data-reveal>
          ${list(A.paragrafos).map((p) => `<p>${t(p)}</p>`).join('\n          ')}
        </div>${A.nota ? `
        <aside class="marginalia" data-reveal>
          <span class="marginalia__rule" aria-hidden="true"></span>
          ${t(A.nota)}
        </aside>` : ''}
      </div>
    </section>

    <section class="about section" id="sobre" aria-labelledby="sobre-title">
      <div class="container about__grid">
        <div class="about__media" data-reveal>
          <figure class="frame frame--about">
            ${photo(S.foto, S.fotoAlt, `<div class="frame__ph frame__ph--light" role="img" aria-label="Espaço reservado para retrato da psicóloga em ambiente de trabalho">
              <span class="frame__ph-label">Retrato em ambiente</span>
              <span class="frame__ph-spec">3:4 · consultório ou luz de janela</span>
            </div>`)}
          </figure>
          <figure class="frame frame--detail">
            ${photo(S.fotoDetalhe, S.fotoDetalheAlt, `<div class="frame__ph frame__ph--sand" role="img" aria-label="Espaço reservado para foto de detalhe do consultório">
              <span class="frame__ph-label">Detalhe do consultório</span>
            </div>`)}
          </figure>
        </div>

        <div class="about__copy">
          ${chapter('sobre', 'Sobre mim')}
          <h2 class="h2" id="sobre-title" data-reveal>${t(S.titulo)}</h2>

          <div class="prose" data-reveal>
            ${list(S.paragrafos).map((p, i) => `<p${i === 0 ? ' class="dropcap"' : ''}>${t(p)}</p>`).join('\n            ')}
          </div>${S.citacao ? `

          <blockquote class="pullquote" data-reveal>
            <p>${t(S.citacao)}</p>
          </blockquote>` : ''}

          <dl class="kv" data-reveal>
            ${kvList(S.ficha)}
            <div><dt>Registro</dt><dd>CRP ${crp}</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section class="approach section section--sand" id="abordagem" aria-labelledby="abordagem-title">
      <div class="container">
        <header class="section-head section-head--split">
          <div>
            ${chapter('abordagem', 'Abordagem')}
            <h2 class="h2" id="abordagem-title" data-reveal>${t(AB.titulo)}</h2>
          </div>
          <p class="lead" data-reveal>${t(AB.intro)}</p>
        </header>

        <ol class="pillars">
          ${list(AB.pilares).map((p, i) => `<li class="pillar" data-reveal style="--i:${i}">
            <span class="pillar__n">${['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.'][i] || `${i + 1}.`}</span>
            <h3 class="h3">${t(p.titulo)}</h3>
            <p>${t(p.texto)}</p>
          </li>`).join('\n          ')}
        </ol>

        <div class="contrast" data-reveal>
          <div class="contrast__col">
            <h3 class="contrast__title">A terapia <em>é</em></h3>
            <ul class="contrast__list">
              ${list(AB.terapiaE).map((item) => `<li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${t(item)}</li>`).join('\n              ')}
            </ul>
          </div>
          <div class="contrast__col contrast__col--muted">
            <h3 class="contrast__title">A terapia <em>não é</em></h3>
            <ul class="contrast__list">
              ${list(AB.terapiaNaoE).map((item) => `<li><svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg>${t(item)}</li>`).join('\n              ')}
            </ul>
          </div>
        </div>
      </div>
    </section>
${show(T) ? `
    <section class="themes section" id="temas" aria-labelledby="temas-title">
      <div class="container themes__grid">
        <header class="themes__head">
          ${chapter('temas', 'Temas')}
          <h2 class="h2" id="temas-title" data-reveal>${t(T.titulo)}</h2>
          <p class="muted" data-reveal>${t(T.intro)}</p>${T.nota ? `
          <p class="note" data-reveal>${t(T.nota)}</p>` : ''}
        </header>

        <ol class="themes__list">
          ${list(T.itens).map((tema, i) => `<li data-reveal style="--i:${i}"><span class="themes__n">${String(i + 1).padStart(2, '0')}</span><div><h3>${t(tema.titulo)}</h3><p>${t(tema.texto)}</p></div></li>`).join('\n          ')}
        </ol>
      </div>
    </section>
` : ''}
    <section class="services section section--paper" id="atendimento" aria-labelledby="atendimento-title">
      <div class="container">
        <header class="section-head section-head--split">
          <div>
            ${chapter('atendimento', 'Atendimento')}
            <h2 class="h2" id="atendimento-title" data-reveal>${t(AT.titulo)}</h2>
          </div>
          <p class="lead" data-reveal>${t(AT.intro)}</p>
        </header>

        <div class="modes">${mode(AT.online, 'online')}${mode(AT.presencial, 'presencial')}
        </div>

        <ul class="specs" data-reveal>
          ${filled(AT.especificacoes).map((s) => `<li><span class="specs__k">${t(s.rotulo)}</span><span class="specs__v">${t(s.valor, 'A definir')}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section class="process section" id="como-funciona" aria-labelledby="processo-title">
      <div class="container process__grid">
        <header class="process__head">
          ${chapter('como-funciona', 'Como funciona')}
          <h2 class="h2" id="processo-title" data-reveal>${t(PR.titulo)}</h2>
          <p class="muted" data-reveal>${t(PR.intro)}</p>
          <a class="btn btn--primary process__cta" href="#contato" data-reveal>Dar o primeiro passo ${ARROW}</a>
        </header>

        <div class="steps" data-steps>
        <span class="steps__track" aria-hidden="true"><span class="steps__fill"></span></span>
        <ol class="steps__list">
          ${list(PR.passos).map((p, i) => `<li class="step">
            <span class="step__n">${String(i + 1).padStart(2, '0')}</span>
            <h3 class="h3">${t(p.titulo)}</h3>
            <p>${t(p.texto)}</p>
          </li>`).join('\n          ')}
        </ol>
        </div>
      </div>
    </section>
${show(F) ? `
    <section class="credentials section section--dark" id="formacao" aria-labelledby="formacao-title">
      <div class="container credentials__grid">
        <header>
          ${chapter('formacao', 'Formação')}
          <h2 class="h2" id="formacao-title" data-reveal>${t(F.titulo)}</h2>
          <p class="muted" data-reveal>${t(F.intro)}</p>

          <div class="crp-card" data-reveal>
            <svg class="icon crp-card__icon" aria-hidden="true"><use href="#i-shield"/></svg>
            <div>
              <p class="crp-card__k">Registro profissional</p>
              <p class="crp-card__v">CRP ${crp}</p>
              <ul class="crp-card__links">
                <li><a href="https://cadastro.cfp.org.br/" target="_blank" rel="noopener">Consultar no Cadastro Nacional <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg><span class="sr-only">(abre em nova aba)</span></a></li>
                <li><a href="https://e-psi.cfp.org.br/" target="_blank" rel="noopener">Cadastro e-Psi para atendimento on-line <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg><span class="sr-only">(abre em nova aba)</span></a></li>
              </ul>
            </div>
          </div>
        </header>

        <ol class="ledger">
          ${list(F.itens).map((f, i) => `<li class="ledger__row" data-reveal style="--i:${i}">
            <span class="ledger__year">${t(f.ano, 'Ano')}</span>
            <div><h3 class="ledger__title">${t(f.titulo)}</h3><p class="ledger__place">${t(f.local, 'Instituição')}</p></div>
          </li>`).join('\n          ')}
        </ol>
      </div>
    </section>
` : ''}${show(FQ) ? `
    <section class="faq section" id="duvidas" aria-labelledby="duvidas-title">
      <div class="container faq__grid">
        <header class="faq__head">
          ${chapter('duvidas', 'Dúvidas')}
          <h2 class="h2" id="duvidas-title" data-reveal>${t(FQ.titulo)}</h2>
          <p class="muted" data-reveal>Não encontrou o que procurava? <a href="#contato">Escreva para mim</a> — dúvidas também são bem-vindas.</p>
        </header>

        <div class="accordion" data-reveal>
          ${list(FQ.perguntas).map((q) => `<details name="faq">
            <summary>${t(q.pergunta)}<span class="accordion__icon" aria-hidden="true"></span></summary>
            <div class="accordion__body">${String(q.resposta || '').split(/\n{2,}/).map((p) => `<p>${t(p)}</p>`).join('')}</div>
          </details>`).join('\n          ')}${crisisFaq}
        </div>
      </div>
    </section>
` : ''}
    <section class="contact section section--dark" id="contato" aria-labelledby="contato-title">
      <div class="container contact__grid">
        <div class="contact__intro">
          ${chapter('contato', 'Contato')}
          <h2 class="contact__title" id="contato-title" data-reveal>${t(CS.titulo)}</h2>
          <p class="contact__lead" data-reveal>${t(CS.texto)}</p>

          <a class="btn btn--light contact__wa" href="#formulario" data-contact="whatsapp" data-reveal>
            <svg class="icon" aria-hidden="true"><use href="#i-chat"/></svg>
            Conversar pelo WhatsApp
          </a>

          <ul class="channels" data-reveal>
${channel('chat', 'WhatsApp', phOr(waHref && extLink(waHref, K.whatsappExibicao || K.whatsapp), '(00) 00000-0000'))}${channel('mail', 'E-mail', phOr(K.email && `<a href="mailto:${esc(K.email)}">${esc(K.email)}</a>`, 'seu e-mail'))}${channel('insta', 'Instagram', igUser && extLink(`https://www.instagram.com/${igUser}/`, '@' + igUser))}${(K.endereco || preview) ? `
            <li><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg><span class="channels__k">Consultório</span><span class="channels__v">${t(K.endereco, 'Endereço do consultório')}</span></li>` : ''}${(K.horarios || preview) ? `
            <li><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg><span class="channels__k">Horários</span><span class="channels__v">${t(K.horarios, 'Dias e horários de atendimento')}</span></li>` : ''}
          </ul>
        </div>

        <div class="form-card" id="formulario" data-reveal>
          <h3 class="form-card__title">Envie uma mensagem</h3>
          <p class="form-card__hint">Respondo pessoalmente${(K.prazoResposta || preview) ? `, em até ${t(K.prazoResposta, 'x dias úteis')}` : ''}.</p>

          <form class="form" data-contact-form novalidate>
            <div class="field">
              <label for="f-nome">Como posso te chamar?</label>
              <input id="f-nome" name="nome" type="text" autocomplete="given-name" required maxlength="80" aria-describedby="e-nome">
              <p class="field__error" id="e-nome" aria-live="polite"></p>
            </div>

            <fieldset class="field">
              <legend>Prefere retorno por</legend>
              <div class="chips">
                <label class="chip"><input type="radio" name="retorno" value="WhatsApp" checked><span>WhatsApp</span></label>
                <label class="chip"><input type="radio" name="retorno" value="E-mail"><span>E-mail</span></label>
                <label class="chip"><input type="radio" name="retorno" value="Ligação"><span>Ligação</span></label>
              </div>
            </fieldset>

            <div class="field">
              <label for="f-contato">Telefone ou e-mail para retorno</label>
              <input id="f-contato" name="contato" type="text" autocomplete="on" required maxlength="120" aria-describedby="e-contato">
              <p class="field__error" id="e-contato" aria-live="polite"></p>
            </div>

            <fieldset class="field">
              <legend>Modalidade de interesse</legend>
              <div class="chips">
                <label class="chip"><input type="radio" name="modalidade" value="On-line"><span>On-line</span></label>
                <label class="chip"><input type="radio" name="modalidade" value="Presencial"><span>Presencial</span></label>
                <label class="chip"><input type="radio" name="modalidade" value="Ainda não sei" checked><span>Ainda não sei</span></label>
              </div>
            </fieldset>

            <div class="field">
              <label for="f-msg">Mensagem <span class="field__opt">(opcional)</span></label>
              <textarea id="f-msg" name="mensagem" rows="4" maxlength="800" aria-describedby="h-msg"></textarea>
              <p class="field__hint" id="h-msg">Se preferir, deixe só uma saudação. Evite compartilhar informações sensíveis por aqui.</p>
            </div>

            <div class="hp" aria-hidden="true">
              <label for="f-site">Não preencha este campo</label>
              <input id="f-site" name="site" type="text" tabindex="-1" autocomplete="off">
            </div>

            <div class="field field--check">
              <input id="f-lgpd" name="consentimento" type="checkbox" required aria-describedby="e-lgpd">
              <label for="f-lgpd">Concordo com o uso destes dados apenas para retorno do contato, conforme a <a href="politica-de-privacidade.html">Política de Privacidade</a>.</label>
              <p class="field__error" id="e-lgpd" aria-live="polite"></p>
            </div>

            <button class="btn btn--primary btn--block" type="submit">Enviar mensagem ${ARROW}</button>
            <p class="form__status" role="status" aria-live="polite" data-form-status></p>
          </form>
        </div>
      </div>

      <div class="container">
        <p class="emergency" data-reveal>
          <strong>Em situação de crise ou emergência</strong>, não aguarde retorno: ligue para o <strong>CVV (188)</strong>, gratuito e disponível 24 horas, para o <strong>SAMU (192)</strong> ou procure o pronto-socorro mais próximo.
        </p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer__top">
        <p class="footer__statement" data-words>${t(R.frase)}</p>
        <a class="btn btn--primary" href="#contato">Agendar uma conversa ${ARROW}</a>
      </div>

      <div class="footer__grid">
        <div>
          <p class="footer__name">${esc(plain(P.nome))}</p>
          <p class="footer__muted">${t(P.titulo)}<br>CRP ${crp}</p>
        </div>
        <nav aria-label="Rodapé">
          <p class="footer__k">Navegação</p>
          <ul class="footer__list">
            ${sections.filter((s) => s.nav).map((s) => `<li><a href="#${s.id}">${s.label}</a></li>`).join('\n            ')}
          </ul>
        </nav>
        <div>
          <p class="footer__k">Contato</p>
          <ul class="footer__list">
            ${waHref ? `<li>${extLink(waHref, 'WhatsApp')}</li>` : ''}
            ${K.email ? `<li><a href="mailto:${esc(K.email)}">E-mail</a></li>` : ''}
            ${igUser ? `<li>${extLink(`https://www.instagram.com/${igUser}/`, 'Instagram')}</li>` : ''}
            <li><a href="#formulario">Formulário de contato</a></li>
          </ul>
        </div>${(K.endereco || preview) ? `
        <div>
          <p class="footer__k">Consultório</p>
          <p class="footer__muted">${t(K.endereco, 'Endereço do consultório')}</p>
        </div>` : ''}
      </div>

      <div class="footer__bottom">
        <p>© <span data-year>${new Date().getFullYear()}</span> ${esc(plain(P.nome))}. Este site tem caráter informativo e não substitui atendimento de emergência.</p>
        <p><a href="politica-de-privacidade.html">Política de Privacidade</a> · <a href="https://site.cfp.org.br/legislacao/codigo-de-etica/" target="_blank" rel="noopener">Código de Ética do Psicólogo<span class="sr-only"> (abre em nova aba)</span></a></p>
      </div>
    </div>
  </footer>

  <div class="mobile-cta" data-mobile-cta aria-hidden="true">
    <a class="btn btn--primary btn--block" href="#contato" data-contact="whatsapp" tabindex="-1">
      <svg class="icon" aria-hidden="true"><use href="#i-chat"/></svg>
      Agendar uma conversa
    </a>
  </div>
</body>
</html>
`;

/* ---------- politica-de-privacidade.html ---------- */
const contactLine = K.email ? `<a href="mailto:${esc(K.email)}">${esc(K.email)}</a>` : '<span class="ph">e-mail da profissional</span>';
const privacy = `${head({
  title: `Política de Privacidade — ${plain(P.nome)}, Psicóloga`,
  description: 'Como os dados enviados pelo formulário de contato são tratados, conforme a LGPD.',
  canonical: domain + '/politica-de-privacidade.html'
})}
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  ${preview ? previewBar : ''}
  <header class="site-header is-scrolled">
    <div class="container header__inner">
      ${brand('index.html')}
      <a class="link-arrow" href="index.html">Voltar ao site</a>
    </div>
  </header>

  <main id="conteudo" class="page">
    <div class="container">
      <article class="page__inner">
        <p class="chapter"><span class="chapter__n">—</span>Privacidade</p>
        <h1>Política de Privacidade</h1>
        ${preview ? '<p><mark class="ph">Texto-base a ser revisado pela profissional (e, se possível, por assessoria jurídica) antes da publicação.</mark></p>' : ''}

        <h2>Quem é responsável pelos dados</h2>
        <p>${esc(plain(P.nome))}, psicóloga, CRP ${crp}, é a responsável pelo tratamento dos dados enviados por meio deste site. Contato: ${contactLine}.</p>

        <h2>Quais dados são coletados</h2>
        <p>Apenas as informações que você escolhe enviar no formulário de contato:</p>
        <ul>
          <li>nome ou como prefere ser chamado(a);</li>
          <li>telefone ou e-mail para retorno;</li>
          <li>preferência de canal e de modalidade de atendimento;</li>
          <li>mensagem opcional.</li>
        </ul>
        <p>O site não utiliza cookies de rastreamento nem ferramentas de publicidade.</p>

        <h2>Para que os dados são usados</h2>
        <p>Exclusivamente para responder ao seu contato e combinar um possível atendimento. Os dados não são vendidos, compartilhados para fins comerciais nem usados para envio de propaganda.</p>

        <h2>Por quanto tempo ficam guardados</h2>
        <p>Pelo tempo necessário para o retorno do contato. Caso o atendimento não se inicie, os dados são excluídos. Se o atendimento começar, as informações passam a seguir as regras de guarda de documentos previstas pelo Conselho Federal de Psicologia.</p>

        <h2>Sigilo</h2>
        <p>Todas as informações recebidas são tratadas com o sigilo previsto no Código de Ética Profissional do Psicólogo. Ainda assim, recomendamos não enviar detalhes sensíveis pelo formulário: eles podem ser conversados com segurança em sessão.</p>

        <h2>Seus direitos</h2>
        <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode, a qualquer momento, solicitar acesso, correção ou exclusão dos seus dados, pelo contato indicado acima.</p>

        <p style="margin-top:3rem"><a class="btn btn--primary" href="index.html#contato">Voltar ao contato</a></p>
      </article>
    </div>
  </main>
</body>
</html>
`;

/* ---------- config.js (contatos usados pelo JavaScript) ---------- */
const configJs = `/* Arquivo GERADO por scripts/build.mjs a partir de content/*.json — edite pelo painel /admin. */
window.SITE_CONFIG = ${JSON.stringify({
  whatsapp: waNum,
  whatsappDisplay: K.whatsappExibicao || K.whatsapp || '',
  whatsappMessage: K.whatsappMensagem || '',
  email: K.email || '',
  instagram: String(K.instagram || '').replace(/^@/, ''),
  formEndpoint: K.formEndpoint || ''
}, null, 2)};
`;

const robots = `User-agent: *\n${preview ? 'Disallow: /' : 'Allow: /'}\nDisallow: /admin/\n\nSitemap: ${domain}/sitemap.xml\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(domain)}/</loc><priority>1.0</priority></url>
  <url><loc>${esc(domain)}/politica-de-privacidade.html</loc><priority>0.3</priority></url>
</urlset>
`;

writeFileSync(join(root, 'index.html'), index);
writeFileSync(join(root, 'politica-de-privacidade.html'), privacy);
writeFileSync(join(root, 'assets', 'js', 'config.js'), configJs);
writeFileSync(join(root, 'robots.txt'), robots);
writeFileSync(join(root, 'sitemap.xml'), sitemap);
writeFileSync(join(root, 'assets', 'img', 'favicon.svg'), faviconSvg);
writeFileSync(join(root, 'admin', 'index.html'), `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <!-- Arquivo GERADO por scripts/build.mjs -->
  <title>Painel — ${esc(plain(P.nome))}</title>
  <link rel="icon" href="../${faviconHref}" type="${faviconType}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Instrument+Sans:wght@400..600&display=swap">
  <!-- Tema do painel nas cores da marca (seletores pelos nomes de componentes do Decap) -->
  <style>
    :root { --pine:#4A0E2F; --clay:#A8125A; --linen:#F8F2EF; --paper:#FDF9F8; --ink:#2B1621; --muted:#6A5260; --line:#ECD8E0; }
    body, button, input, textarea, select { font-family: "Instrument Sans", system-ui, sans-serif !important; }
    body { background: var(--linen) !important; color: var(--ink); }
    [class*="-AppHeader-css"], [class*="-AppHeader "] { border-bottom: 3px solid var(--clay) !important; }
    [class*="-cardTopHeading"], [class*="-ListCardTitle"], [class*="-SidebarHeading"] {
      font-family: "Fraunces", Georgia, serif !important; font-weight: 450 !important; letter-spacing: -.01em; color: var(--ink) !important;
    }
    [class*="-cardTopDescription"] { color: var(--muted) !important; line-height: 1.6 !important; }
    [class*="-SidebarContainer-card"], [class*="-CollectionTopContainer-card"], [class*="-ListCard-card"] {
      border-radius: 14px !important; box-shadow: 0 1px 2px rgba(74,14,47,.06), 0 6px 18px -10px rgba(74,14,47,.25) !important;
    }
    [class*="-ListCard-card"] { border: 1px solid var(--line) !important; transition: transform .2s, box-shadow .2s; }
    [class*="-ListCard-card"]:hover { transform: translateY(-2px); }
    [class*="-sidebarNavLinkActive"] { color: var(--clay) !important; border-left-color: var(--clay) !important; }
    [class*="-EditorContainer"], [class*="-ControlPaneContainer"], [class*="-NoPreviewContainer"], [class*="-Editor-"] { background: var(--linen) !important; }
    [class*="-TopBarContainer"] { background: #F3E4EA !important; border-radius: 0 10px 0 0 !important; }
    [class*="-ControlPaneContainer"] { max-width: 820px !important; margin: 0 auto !important; padding-top: 28px !important; }
    [class*="-FieldLabel"] {
      background: var(--pine) !important; color: #FBEFF4 !important; border-color: var(--pine) !important;
      text-transform: none !important; font-size: 13px !important; font-weight: 600 !important; letter-spacing: .02em !important;
      border-radius: 8px 8px 0 0 !important; padding: 5px 12px !important;
    }
    [class*="-ControlContainer"]:focus-within > [class*="-FieldLabel"],
    [class*="-ControlContainer"]:focus-within > [class*="-ControlTopbar"] [class*="-FieldLabel"] { background: var(--clay) !important; border-color: var(--clay) !important; }
    [class*="-ControlContainer"] input[type="text"], [class*="-ControlContainer"] textarea, [class*="-TextControl"], [class*="-StringControl"] {
      border-color: var(--line) !important; border-radius: 0 10px 10px 10px !important; background: #fff !important; font-size: 15px !important;
    }
    [class*="-ControlContainer"]:focus-within input[type="text"], [class*="-ControlContainer"]:focus-within textarea { border-color: var(--clay) !important; }
    [class*="-ControlHint"] { color: var(--muted) !important; font-size: 13px !important; line-height: 1.5 !important; margin-top: 6px !important; }
    [class*="-ControlHint"] code { background: #F3E4EA; padding: 1px 6px; border-radius: 4px; color: var(--ink); font-size: 12.5px; }
    [class*="-ToolbarContainer"] { border-bottom: 1px solid var(--line) !important; }
  </style>
  <!-- Login por e-mail e senha (Netlify Identity) -->
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
  <!-- Decap CMS: painel de edição do conteúdo (configuração em admin/config.yml) -->
  <script src="https://unpkg.com/decap-cms@3.17.3/dist/decap-cms.js"></script>
</body>
</html>
`);
console.log(`✓ Site gerado — ${sections.length} seções, modo apresentação: ${preview ? 'ligado' : 'desligado'}`);
