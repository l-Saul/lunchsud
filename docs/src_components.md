# `src/components/`: componentes compartilhados

Só entra aqui o que **2 ou mais páginas** usam. Componente de uma página só fica
na pasta dela, em `_components/`.

| Componente | Usado em |
|---|---|
| `Flower` | página da ala, home, 404, erro da ala, login, acesso, redefinir senha, imagem do mês |
| `Footer` | layout raiz (todas as páginas) |
| `LoadingOverlay` | `WardSwitcher` (painel) |
| `Spinner` | todos os botões de ação, `LoadingOverlay`, home |

## `Flower.tsx`

Florzinha decorativa (5 pétalas em elipse girando de 72 em 72 graus), em SVG:
pétalas rosa `#ed3a65` e miolo dourado `#ffb81c`, da paleta da Igreja.

- Prop: `size` (padrão 18).
- Sempre `aria-hidden="true"`: é enfeite.
- Cor em **hex**, não token do tema: ela também é desenhada na imagem do mês,
  e o `html-to-image` captura estilos resolvidos. As pétalas são um rosa mais
  claro que o `accent` (`#bd0057`) de propósito: parecem flor, e enfeite não
  precisa de contraste de texto.
- Aparece nas divisórias ("linha · flor · linha") e nos cantos do cabeçalho da
  página da ala. É o toque feminino e delicado do site.

## `Footer.tsx`

Rodapé global, renderizado pelo layout em todas as páginas:

1. Aviso: "Site independente, sem vínculo institucional ou oficial com a Igreja
   de Jesus Cristo dos Santos dos Últimos Dias."
2. Crédito: "Desenvolvido por **Luis Henrique Engel Saul**". O nome, sublinhado e
   com ícone de link externo (indica que abre em outra página), abre o portfólio
   **numa nova aba, já na seção de contato**: `https://luishsaul.com.br/#contato`.
   `target="_blank"` sempre com `rel="noopener noreferrer"` (segurança).

## `LoadingOverlay.tsx`

Carregamento **na tela toda**: fundo azul translúcido desfocado, Spinner grande
(`h-12 w-12 border-4`) e um texto (padrão "Carregando…").

- Para transições que demoram um instante, como o owner trocando de ala
  ("Trocando de ala…", "Abrindo a ala…"): deixa claro que algo está acontecendo.
- `role="status"`, `aria-live="polite"`, `z-80` (acima dos modais).
- Trava a página atrás enquanto aparece (`useScrollLock`), como todo modal; por
  isso é `'use client'`.
- Aparece com fade curto e some na hora: **renderize condicionalmente**
  (`{texto && <LoadingOverlay texto={texto} />}`).

## `Spinner.tsx`

O "estou trabalhando" dos botões. Um círculo com a borda de cima transparente,
girando com `animate-spin` (só CSS, sem JavaScript).

- Prop: `className` (padrão `h-5 w-5`; nos botões pequenos `h-4 w-4`).
- Usa a **cor do texto do botão** (`border-current`): branco no botão azul, rosa
  no botão de remover.
- `aria-hidden`: fica **sempre ao lado de um verbo** ("Confirmando…",
  "Salvando…"). É o texto que diz o que acontece; o círculo é só visual.
- Com `prefers-reduced-motion` ele **continua girando, só que devagar** (1,5 s):
  parado, a pessoa acha que travou e toca de novo (ver [src_app.md](src_app.md)).

Padrão de todo botão de ação enquanto espera: `disabled` + `aria-busy` +
`<Spinner />` + verbo no gerúndio. Assim tocar de novo não faz nada e a pessoa
sabe que está indo.
