# Site — Nome Sobrenome, Psicóloga

Site institucional de uma página, gerado a partir de arquivos de conteúdo e editável pela própria profissional no painel `/admin` (Decap CMS + Netlify).

- **Editar conteúdo:** pelo painel `/admin` → veja [docs/03-painel-admin.md](docs/03-painel-admin.md)
- **Gerar o site localmente:** `node scripts/build.mjs` (Node 18+, sem dependências)
- **Publicar:** Netlify (configurada em `netlify.toml`)

## Estrutura
```
content/*.json                FONTE do conteúdo (editada pelo painel)
admin/index.html, config.yml  painel de administração (Decap CMS)
scripts/build.mjs             gerador: content/*.json → HTML
assets/css/styles.css         design system + componentes
assets/js/main.js             interações e efeitos de rolagem
assets/js/vendor/lenis.min.js rolagem suave (Lenis 1.1.13, MIT)
assets/img/uploads/           fotos enviadas pelo painel
netlify.toml                  build e cabeçalhos de hospedagem
docs/                         pesquisa, design system, painel

GERADOS (não editar à mão — são sobrescritos):
index.html · politica-de-privacidade.html · assets/js/config.js · robots.txt · sitemap.xml
```

## Formulário
- Com “Endereço de envio do formulário” (ex.: Formspree) preenchido no painel, as mensagens são enviadas por POST em JSON.
- Sem esse endereço e com WhatsApp preenchido, o formulário abre o WhatsApp com a mensagem pronta.
- Sem nenhum dos dois, o formulário informa que o canal ainda não foi configurado e nada é enviado.

## Checklist de informações da profissional
Tudo pode ser preenchido por ela mesma no painel. Trechos provisórios aparecem sublinhados no site.

- [ ] Nome, iniciais, CRP, cidade e endereço do consultório
- [ ] Abordagem, público atendido e temas que de fato acompanha
- [ ] Atende no exterior? Tem cadastro e-Psi? Duração e frequência das sessões; emite recibo?
- [ ] Formação (instituições e anos, só o que puder ser comprovado)
- [ ] Texto “Sobre” e frase pessoal
- [ ] WhatsApp, e-mail, Instagram e prazo de resposta
- [ ] Fotografias: retrato principal 4:5, retrato em ambiente 3:4 e detalhe do consultório
- [ ] Domínio → por fim, desligar o **Modo apresentação**
