# 02 · Design system

> **Paleta atual: identidade de Jaqueline Gonçalves**, extraída dos posts dela no Instagram. Os nomes dos tokens continuam os mesmos; só os valores mudaram:
> `--linen #F8F2EF` · `--paper #FDF9F8` · `--sand #F2E2E7` · `--ink #2B1621` · `--muted #6A5260` · `--pine` (vinho) `#4A0E2F` · `--pine-deep #300A1F` · `--clay` (magenta) `#A8125A` · `--clay-soft` (rosa) `#F4A6C4` · `--on-dark #FBEFF4`.
> Todas as combinações de texto passam em WCAG AA (ink/linho 15.3:1, magenta/linho 6.5:1, rosa/vinho 8.0:1).
> A paleta original “Linho & Pinho” está documentada abaixo, como referência.

## Paleta original “Linho & Pinho”

Todos os tokens estão definidos em `:root` em [assets/css/styles.css](../assets/css/styles.css).

## Cor

| Token | HEX | Uso | Contraste |
|---|---|---|---|
| `--linen` | #F3EEE6 | Fundo principal | — |
| `--paper` | #FAF7F2 | Cartões, formulário, seção Atendimento | — |
| `--sand` | #E5DACA | Seção de respiro (Abordagem) | evitar texto pequeno em `--muted` |
| `--ink` | #1C2421 | Texto principal | 13.7:1 sobre linho |
| `--ink-soft` | #3A4440 | Texto de corpo secundário | > 9:1 |
| `--muted` | #545C57 | Apoio, legendas | ≥ 5.3:1 sobre linho/papel |
| `--pine` | #22352E | Seções escuras, cartão presencial | — |
| `--pine-deep` | #18241F | Rodapé, barra de apresentação | — |
| `--clay` | #9C4A2D | Acento, CTA, itálicos | 5.3:1 sobre linho; texto papel sobre ele 5.7:1 |
| `--clay-soft` | #E0AE92 | Acento sobre escuro | 6.6:1 sobre pinho |
| `--on-dark` | #EFE9DF | Texto sobre escuro | 10.8:1 |
| `--on-dark-muted` | #B9C2BA | Apoio sobre escuro | 7.1:1 |
| `--error` / `--success` | #A3321C / #2F5D4B | Estados do formulário | AA |

Todas as combinações de texto passam em **WCAG AA**; os valores foram calculados durante o projeto.

## Tipografia

- **Títulos:** Fraunces (variável, eixo óptico 9–144, pesos 300–600, com itálico). Pesos baixos (320–380) nos tamanhos grandes; o itálico em argila é a “voz” emocional.
- **Texto:** Instrument Sans (400–600). Corpo em 17px com entrelinha de 1,65.
- **Rótulos:** Instrument Sans 600, caixa alta, espaçamento de 0,14–0,16em.

| Token | Valor (fluido) | Uso |
|---|---|---|
| `--fs-display` | 42 → 100px | H1 do hero |
| `--fs-h1` | 34 → 72px | Manifesto, contato |
| `--fs-h2` | 34 → 62px | Títulos de seção |
| `--fs-h3` | 21 → 26px | Subtítulos |
| `--fs-lead` | 18 → 22px | Parágrafos de abertura |
| `--fs-body` | 17px | Corpo |
| `--fs-small` / `--fs-xs` | 15 / 12.5px | Apoio / rótulos |

## Espaço, forma e sombra
- **Escala de espaço:** base 4px (`--s-1` … `--s-10`). Seções usam `--section` (80 → 160px); a margem lateral usa `--gutter` (20 → 48px).
- **Raios:** `--r-sm` 6 · `--r-md` 14 · `--r-lg` 28 · `--r-pill` · **`--r-signature`**, a curva de acolhimento usada só nas fotografias.
- **Sombras:** sempre tingidas de pinho, nunca cinza puro (`--shadow-sm/md/lg`).

## Componentes
| Componente | Classe | Estados |
|---|---|---|
| Botão primário | `.btn.btn--primary` | hover escurece, sombra argila e seta desliza; active desce 1px; foco com contorno de 2px |
| Botão claro (sobre escuro) | `.btn.btn--light` | hover em branco |
| Botão fantasma | `.btn.btn--ghost` | borda escurece |
| Link com seta | `.link-arrow` | sublinhado recolhe e muda de cor |
| Capítulo | `.chapter` + `.chapter__n` | — |
| Moldura de foto | `.frame` (`--hero`, `--about`, `--detail`) + `.frame__ph` (placeholder) | — |
| Selo | `.seal` | rotação de 48s (desligada com movimento reduzido) |
| Fatos / especificações | `.facts`, `.specs`, `.kv` | grade com fios |
| Pilar | `.pillar` | — |
| Cartão de modalidade | `.mode`, `.mode--dark` | sobe 4px no hover (apenas dispositivos com ponteiro) |
| Linha do tempo | `.steps` + `.step` | `.is-active` preenche o círculo; progresso por `--p` |
| Ledger de formação | `.ledger__row` | — |
| Accordion | `details[name="faq"]` | nativo, abre um por vez, altura animada onde suportado |
| Campo / chips / checkbox | `.field`, `.chip`, `.field--check` | hover, foco com anel argila, `.is-invalid` e mensagem em `aria-live` |
| Conteúdo provisório | `.ph` | visível só com `html[data-preview="true"]` |

## Ícones
SVG próprios em traço de 1.5px com cantos arredondados, num sprite inline no topo do `index.html` (`#i-arrow`, `#i-chat`, `#i-mail`, `#i-insta`, `#i-pin`, `#i-clock`, `#i-video`, `#i-door`, `#i-shield`, `#i-check`, `#i-minus`, `#i-external`). Não há biblioteca externa.

## Movimento
- Curva `--ease` (0.2, 0.7, 0.1, 1). Revelação: opacidade + 24px em 0,9s, com escalonamento de 80ms (`--i`).
- Hero: as linhas do título sobem por máscara e os demais elementos entram em seguida.
- **Rolagem suave:** Lenis 1.1.13, guardado localmente em `assets/js/vendor/` (13 KB). Age só na roda do mouse e no trackpad; no celular a rolagem continua nativa. As âncoras rolam com compensação do header e movem o foco para a seção.
- **Efeitos de rolagem** (um único laço de animação, com `requestAnimationFrame`):
  - barra de progresso de leitura sob o header;
  - parallax interno nas fotos do hero e do "Sobre", em que a imagem desliza dentro da moldura;
  - a foto de detalhe do "Sobre" com profundidade inversa;
  - o selo gira conforme a rolagem;
  - o manifesto e a frase do rodapé acendem palavra por palavra (`data-words`).
- **Cortina:** as fotos aparecem de baixo para cima.
- **Botões magnéticos:** seguem levemente o cursor, só em dispositivos com mouse.
- Apenas `transform`/`opacity`/`clip-path` (via GPU). Com `prefers-reduced-motion`, tudo é desligado, incluindo o Lenis.
- Sem JavaScript, todo o conteúdo fica visível, porque as animações dependem da classe `.js`.

## Responsividade
| Faixa | Comportamento |
|---|---|
| > 960px | Navegação completa + CTA no header; grades assimétricas 7/5, 5/7 e 4/8; cabeçalhos laterais fixos (sticky) em Temas, Como funciona e Dúvidas |
| ≤ 960px | Menu em tela cheia (`<dialog>` nativo, com foco preso e Esc); **CTA fixo no rodapé da tela**, que aparece depois do hero e some no contato |
| ≤ 900px | Uma coluna; o texto vem antes da foto; fatos e especificações em 2×2 |
| ≤ 560px | Botões do hero em largura total; ficha técnica em 1 coluna; canais de contato reorganizados |
