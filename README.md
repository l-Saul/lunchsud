# Projeto: Agendamento de Almoço Missionários

## Descrição
```
Sistema simples para agendar almoços por ala.
Permite escolher um dia disponível do mês atual.
Evita conflitos usando regras no banco.
```

## Stack
```
Next.js (App Router)
React + TypeScript
Tailwind CSS
Supabase (PostgreSQL)
Vercel
```

## Funcionalidades
```
- Calendário mensal (mês atual)
- Bloqueio de dias ocupados
- Página inicial com lista de alas
- Página por ala (/[slug])
- Backend como fonte da verdade
```

## APIs
```
GET  /api/alas                  -> lista alas
GET  /api/agendamentos/[slug]   -> dias ocupados da ala
POST /api/agendar               -> cria agendamento
```

## Variáveis de ambiente
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Rodar local
```
npm install
npm run dev
```

## Acessar
```
https://lunchsud.vercel.app
```

## Licença
```
Uso interno
```
