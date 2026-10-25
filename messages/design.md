# Plano de design e acessibilidade: o que falta

Atualizado em 24/10/2026. **Só o que ainda não foi feito.** O que já foi feito
(paleta da Igreja, fundo claro com faixa azul, escala de letra, abas de mês,
estados do dia, aviso no topo, confirmação com agenda do celular, modais com
foco e fundo inerte, erros em caixa) está
documentado em `CLAUDE.md` e `docs/`, que valem como regra.

**Para quem:** irmãs da Sociedade de Socorro, de 45 a 85 anos, pouca
familiaridade com tecnologia, quase sempre no celular; e líderes da mesma faixa
no painel. Visão cansada, mãos com tremor, medo de "estragar algo".

**Princípios para o que falta:**

1. Uma ação principal por tela; texto sempre junto do ícone; cor nunca sozinha.
2. Letra pela escala do `CLAUDE.md` (base 16px, nada abaixo); campo em `text-lg`.
3. Alvos de toque ≥ 48px, com espaço entre eles.
4. Toda resposta aparece onde a pessoa olha e é anunciada ao leitor de tela.
   Aviso no `NoticeBar` (topo): o que confirma some em 3 s, o que explica fica
   até o X.
5. Português simples, sem termo técnico ("owner", "login", "dashboard").
6. Telefone só no painel do líder; a página pública mostra no máximo o nome.

---

## Fase 5: painel e login

| # | O que fazer | Onde |
|---|---|---|
| 5.1 | **"owner" em português:** "· owner" na faixa e "Acesso owner" no cartão viram "Administração geral" (o subtítulo "Acesso a todas as alas" fica) | `dashboard/page.tsx` (122), `WardSwitcher.tsx` (63) |
| 5.2 | **Ligar e WhatsApp** em cada almoço: botões "Ligar" (`tel:`) e "WhatsApp" (`wa.me`), 48px, com texto. **Só no painel**, nunca na página pública | `BookingsCard.tsx` |
| 5.3 | **Mês recolhível mais claro:** seta maior e o texto "Abrir"/"Fechar" ao lado | `CollapsibleMonth.tsx` |
| 5.4 | **Interruptor de notificação:** o desligado (`bg-slate-300`, ~1,5:1) precisa de trilho ou borda ≥ 3:1 (ex.: cinza `#878a8c`); escrever "Ligado"/"Desligado" ao lado; descrição por `aria-describedby` (o nome lido fica curto) | `NotificationsCard.tsx` |
| 5.5 | **Links do login viram botões:** "Esqueci minha senha" e "Não tem conta? Criar conta" têm ~23px de altura (WCAG 2.5.8 pede ≥ 24px; a meta é 48px). Botões secundários de 48px | `LoginForm.tsx` (255–265, 293–302) |
| 5.6 | **Regra da senha antes do erro:** "Mínimo de 6 caracteres" embaixo do campo ao criar conta e na nova senha (hoje só aparece no erro) | `LoginForm.tsx`, `ResetPasswordForm.tsx` |
| 5.7 | **Acesso aguardando diz o que vem depois:** "Você recebe um e-mail quando for aprovado." (o e-mail "Pedido aprovado" já existe) | `acesso/_components/RequestAccess.tsx` |

## Fase 6: toques finais

| # | O que fazer | Onde |
|---|---|---|
| 6.1 | **Letra do sistema no iPhone:** o Safari ignora o tamanho de letra que a pessoa escolheu no iPhone. `font: -apple-system-body` resolve, mas no padrão dá 17px (a base é 16px): aplicar só no iOS (`@supports`), compensar no `body` e reaplicar a fonte. **Precisa de iPhone real** (letra do sistema no mínimo, padrão e máximo) | `globals.css` |
| 6.2 | Lembrar a última ala na home ("Continuar na Ala Ecoville"), no aparelho | `(member)/page.tsx` (**decidir**) |
| 6.3 | Lema "A caridade nunca falha", discreto, em serifa | faixa da home e/ou rodapé (**decidir onde**) |
| 6.4 | Prévia do link no WhatsApp com imagem (nome da ala + flor) | `(member)/[slug]` (Open Graph) (**decidir**) |
| 6.5 | Botão "Letra maior" na faixa, salvo no aparelho; soma ao zoom, não substitui | (**decidir**) |

---

## Fora do código

- **Colar os 6 templates de `supabase/email/`** no Supabase (Authentication →
  Email Templates), se ainda não foi feito: cores e fundo claro novos.
- **Aparelho real:** "Adicionar à agenda" no iPhone (`.ics`) e no Android
  (Google Agenda); Samsung Internet com modo escuro ligado; letra do sistema no
  máximo; TalkBack e VoiceOver agendando um dia só ouvindo.
- **Imagem do mês:** conferir se os nomes continuam legíveis depois que o
  WhatsApp comprime.
- **Teste com 3–5 irmãs** (de preferência acima de 65), sem ajuda: abrir o link,
  agendar um dia livre, descobrir quem agendou um dia ocupado, pôr o almoço na
  agenda. Observar sem explicar; cada hesitação é um ajuste.

**Atenção:** o `.env` local aponta para o banco de **produção**. Agendamento de
teste só combinado com a líder, numa ala combinada, e apagado depois.

## Decisões em aberto

1. Lema: faixa da home, rodapé ou os dois? (6.3)
2. Lembrar a última ala no aparelho? (6.2)
3. Prévia do link com imagem: vale o esforço agora? (6.4)
4. Botão "Letra maior": precisa, com a base de 16px? (6.5)

## Decidido: não fazer

Para não ser proposto de novo:

- Lista de próximos dias livres embaixo do calendário.
- Lembrar nome e telefone de quem agenda (o celular já autopreenche).
- Exemplo de telefone embaixo do rótulo.
- Letra que cresce com a tela e base de 18px (grandes demais; ficou a escala
  com base 16px).
- Tirar o desfoque do fundo dos modais (regra do dono: todo modal desfoca).
- Escrituras na página inicial (removidas pelo dono; `src/lib/scriptures.ts` apagado).

---

## Checklist de cada tela (antes de entregar)

- [ ] Contraste do texto ≥ 4,5:1; ícone, borda de campo, interruptor e foco ≥ 3:1.
- [ ] Nenhum estado só por cor; nada clicável em cor "apagada".
- [ ] Letra pela escala (nada abaixo de 16px), sem MAIÚSCULAS, sem itálico.
- [ ] 320px com letra a 200%: sem rolagem lateral, nada cortado.
- [ ] Alvos ≥ 48px; segundo toque durante o envio não faz nada.
- [ ] Datas por extenso; regra mostrada antes do erro; erro diz o que fazer.
- [ ] `<main>` e um `h1`; botões nativos; texto visível no começo do nome acessível.
- [ ] Modal pelo componente `Modal` (foco entra, fica preso e volta à origem).
- [ ] Mensagens anunciadas (região "ao vivo" sempre montada), uma por vez.
- [ ] axe (Playwright + axe-core, regras WCAG 2.2 AA + boas práticas) sem
      violação séria; medição de letra como em `docs/src_app.md`.
- [ ] `npx tsc --noEmit`, `npm run lint` e `npm run build` (com o `dev` parado,
      ou numa cópia).
