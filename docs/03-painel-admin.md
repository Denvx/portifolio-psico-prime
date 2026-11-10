# 03 · Painel de administração

## Como funciona
```
Ela edita no painel (/admin)
        │  clica em "Publicar"
        ▼
Arquivo em content/*.json é salvo no GitHub
        │  a Netlify percebe a mudança
        ▼
Netlify roda `node scripts/build.mjs`  →  gera index.html etc.
        │  ~1 minuto
        ▼
Site atualizado no ar
```
- **Painel:** Decap CMS 3.17.3 (gratuito, código aberto), em `/admin`.
- **Conteúdo:** um arquivo por seção em `content/`. O gerador `scripts/build.mjs` não tem dependências.
- **Arquivos gerados — não editar à mão:** `index.html`, `politica-de-privacidade.html`, `assets/js/config.js`, `robots.txt` e `sitemap.xml`. Eles são reescritos a cada publicação.
- **Design, layout, animações e regras éticas** ficam fora do painel, de propósito, para ela não quebrar o site sem querer. Exemplos: o aviso de crise (CVV/SAMU), o link de verificação do CRP e o formulário com a LGPD.

## O que ela pode mudar
| Tela | Conteúdo |
|---|---|
| ⚙️ Dados gerais e contato | nome, iniciais, CRP, cidade, WhatsApp, e-mail, Instagram, endereço, horários, **modo apresentação**, título da aba/Google e ícone da aba (os dois são automáticos se ficarem vazios) |
| 01 Início | frase, título principal, texto, botão, **foto principal**, faixa de resumo |
| 02 Apresentação | frase de destaque, parágrafos, nota lateral |
| 03 Sobre mim | título, parágrafos, frase pessoal, **2 fotos**, ficha |
| 04 Abordagem | introdução, princípios, “a terapia é / não é” |
| 05 Temas | lista de temas · **pode ocultar a seção** |
| 06 Atendimento | textos on-line/presencial (**cada um pode ser desligado**), informações práticas |
| 07 Como funciona | passos |
| 08 Formação | trajetória · **pode ocultar** |
| 09 Perguntas frequentes | perguntas e respostas · **pode ocultar** |
| 10 Contato e rodapé | títulos e frase final |

Quando ela oculta uma seção, a numeração dos capítulos, o menu e o rodapé se ajustam sozinhos.

---

## Publicar pela primeira vez (feito uma única vez, por você)

1. **GitHub:** crie uma conta em github.com e um repositório **privado** (ex.: `site-psicologa`). Envie esta pasta para ele (pelo GitHub Desktop é o mais simples). Me peça e eu faço o `git init` e o primeiro commit.
2. **Netlify:** crie uma conta em netlify.com (pode entrar com o GitHub) → *Add new site* → *Import an existing project* → escolha o repositório. A Netlify lê o `netlify.toml` sozinha (build: `node scripts/build.mjs`, publish: `.`). Clique em *Deploy*.
3. **Login do painel:** no site da Netlify → *Project configuration* → **Identity** → *Enable Identity*.
   - Em *Registration*, marque **Invite only**. Sem isso, qualquer pessoa poderia se cadastrar.
   - Em *Services* → **Git Gateway** → *Enable*.
4. **Convidar a psicóloga:** *Identity* → *Invite users* → e-mail dela. Ela recebe o convite, clica, cria a senha e cai direto no painel.
5. **Domínio próprio (opcional):** *Domain management* → *Add a domain*. Depois, atualize o campo “Endereço do site” no painel.

### Se o Netlify Identity não estiver disponível
A Netlify chegou a anunciar a descontinuação do Identity em 2025 e depois voltou atrás. Se a opção não aparecer na sua conta, use o login via GitHub. Para isso:
- troque, em `admin/config.yml`, `name: git-gateway` por `name: github` e adicione a linha `repo: SEU-USUARIO/site-psicologa`;
- na Netlify, em *Access & security → OAuth*, instale o provedor GitHub;
- ela vai precisar de uma conta no GitHub com acesso ao repositório.

## Testar o painel no seu computador
```bash
npx decap-server            # terminal 1 — deixa o painel gravar direto nos arquivos
npx serve .                 # terminal 2 — abre o site em http://localhost:3000
# acesse http://localhost:3000/admin/  → "Entrar"
node scripts/build.mjs      # depois de editar, gera o site atualizado
```

---

## Manual da profissional (pode enviar para ela)

**Entrar:** acesse `seusite.com.br/admin` e entre com seu e-mail e senha.

**Editar:** clique em uma das telas da lista, altere o texto e clique em **Publicar → Publicar agora**. Em cerca de 1 minuto a mudança aparece no site. Se não aparecer, atualize a página com Ctrl+F5.

**Escrever é só escrever.** Não há códigos para aprender. Dois toques opcionais:
- uma palavra entre asteriscos, como `*escuta*`, fica em itálico colorido (o estilo dos títulos do site);
- entre dois asteriscos, como `**seu nome**`, fica em negrito.

**O que ainda falta preencher:** enquanto o modo apresentação estiver ligado, o site destaca com um sublinhado pontilhado:
- os campos que você deixou em branco;
- os textos de exemplo que ainda não foram reescritos.

Quando você preenche ou reescreve, o destaque some sozinho. Depois que o site vai ao ar, campos em branco simplesmente não aparecem.

**Fotos:** em “Escolha uma imagem”, envie fotos em JPG com até ~400 KB.
- Principal: vertical, pelo menos 1000 px de largura.
- Descrição (acessibilidade): preencha sempre, dizendo o que aparece na foto.
- Para reduzir o peso de uma foto, use o site squoosh.app.

**Colocar o site no ar de verdade:** quando todos os dados reais estiverem preenchidos, em ⚙️ *Dados gerais*, **desligue o “Modo apresentação”**. Isso remove a faixa de rascunho e libera o site para aparecer no Google.

**Cuidados éticos:** mantenha o CRP sempre preenchido. Inclua apenas formações que possam ser comprovadas. Não publique depoimentos de pacientes nem promessas de resultado (Código de Ética, art. 20).
