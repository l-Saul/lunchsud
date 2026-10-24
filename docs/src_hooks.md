# `src/hooks/`: hooks

## `use-bookings-realtime.ts`

Mantém a tela ao vivo pelo **WebSocket do Supabase Realtime** (não é polling).
Assina `INSERT`, `UPDATE` e `DELETE` da tabela `agendamento` de **uma ala** e
entrega a mudança **pronta** para quem usa aplicar na tela, sem ir ao servidor
buscar a lista de novo.

### Uso

```ts
useBookingsRealtime(alaId, onMudanca)
```

| Quem usa | O que faz com a mudança |
|---|---|
| `WardBooking` (página da ala) | aplica direto no estado; só busca a lista quando recebe `null` |
| `DashboardRealtime` (painel) | `router.refresh()` a cada evento (o painel precisa do telefone, que nunca vem no WebSocket) |

### Tipos

```ts
type AgendamentoAoVivo = { id: number; data: string; nome: string }

type MudancaAgendamento =
  | { tipo: 'INSERT' | 'UPDATE'; agendamento: AgendamentoAoVivo }
  | { tipo: 'DELETE'; id: number }
  | null
```

- O payload só traz as colunas que a chave anon pode ler (`id, ala_id, data,
  nome`). **O telefone nunca vem.**
- Em `DELETE`, com RLS ligada, o Realtime manda **só a chave primária**: por
  isso o `DELETE` traz só o `id`.
- **`null` = reconectou** (queda de rede ou volta para a página). Eventos podem
  ter se perdido no intervalo, então quem usa deve **recarregar a lista uma vez**.
  A primeira inscrição não avisa: os dados do servidor acabaram de chegar.

### Como funciona

- Canal `agendamentos-ala-<alaId>`, `postgres_changes` com
  `filter: ala_id=eq.<alaId>`, no cliente de `src/lib/supabase/realtime.ts`.
- O callback mais recente fica num `ref`: trocar a função não re-assina o canal.
  O canal só é refeito quando o `alaId` muda.

### Liberar a conexão quando a página some

O plano Free do Supabase tem **200 conexões Realtime simultâneas** (cada página
de ala aberta = 1). Celular esquecido com a página aberta não deve ocupar a vaga
de quem está agendando.

- Página **escondida** (celular bloqueado, outro app) por **30 s**
  (`LIBERAR_APOS_MS`) → sai do canal (`removeChannel`). Sem canais, o
  realtime-js **fecha o WebSocket sozinho uns 50 s depois** (padrão: 2 ×
  heartbeat) e a conexão volta para o limite do plano.
- Página **volta a aparecer** → cancela o timer e assina de novo. A nova
  inscrição chega em `SUBSCRIBED`, avisa `null` e quem usa ressincroniza.
- Se ficou escondida mais de 30 s, solta o canal antes de assinar de novo,
  mesmo que o timer não tenha rodado: o celular **suspende o JavaScript em segundo
  plano**, então a conexão pode estar morta sem saber. Recomeça do zero.
- Ao desmontar: limpa o timer, o listener de `visibilitychange` e sai do canal.

### O que o banco precisa

- `agendamento` na publication `supabase_realtime`.
- `replica identity full`: o Postgres manda a linha antiga inteira no `DELETE`, e
  é isso que deixa o Realtime casar o filtro `ala_id`. Sem isso só vai a PK, o
  filtro não casa e **remoções não chegam ao vivo**. (O que chega ao navegador
  continua sendo só a PK, porque a RLS está ligada.)
- RLS ligada e a policy de leitura pública com `grant select (id, ala_id, data,
  nome)` para `anon`/`authenticated`. O Realtime checa a permissão por coluna: o
  telefone não vai no payload.

Ver [database.md](database.md).

## `use-scroll-lock.ts`

**Trava a rolagem da página atrás de um modal.** Todo modal e tela por cima
(`BookingModal`, `EditBookingModal`, confirmação de remover acesso, confirmação
de desligar aviso, `LoadingOverlay`) usa este hook; não reescreva a trava à mão.

```ts
useScrollLock()        // trava enquanto o componente estiver na tela
useScrollLock(aberto)  // trava só enquanto `aberto` for true
```

- **Por que não `overflow: hidden`:** o iPhone ignora isso no `body` para o
  toque, e rolar dentro do modal mexia a página atrás. Aqui o `body` vira
  `position: fixed` com `top: -<posição atual>` (a página fica parada onde
  estava) e, ao soltar, volta ao normal e rola de volta para a mesma posição.
- **Volta instantânea** (`behavior: 'instant'`): o site usa `scroll-behavior:
  smooth`, e sem isso a página pulava para o topo e descia animada ao fechar.
- **Contador:** se dois modais travarem ao mesmo tempo (ex.: o `LoadingOverlay`
  sobre outro), só o último a fechar destrava, e a posição guardada é a do
  primeiro.
