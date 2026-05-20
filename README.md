# OpenBet 🍻

Apuestas entre amigos pagadas en "drinks". Fase prototipo: **sin login**, los usuarios entran como invitados con un nick. Datos compartidos en Supabase Postgres.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind v4 + Prisma + Supabase.

## Cómo funciona

- Entras eligiendo un **nick** (único). Sin contraseña, identidad por cookie.
- Cada invitado empieza con **11 drinks**.
- Cualquiera puede crear apuestas: título, descripción, fecha de caducidad y opciones (mínimo 2).
- Al vencer la apuesta, los **participantes votan** el resultado. Cuando vota la mayoría, se resuelve por opción más votada.
- Los ganadores reclaman drinks **proporcionales** a lo que apostaron sobre el bote total.
- Si tu saldo es 0, el botón **"Pedir 11 drinks"** te recarga.

## Setup paso a paso

### 1) Crear el proyecto Supabase
1. Abre [supabase.com](https://supabase.com/) y entra (con GitHub o email).
2. *New Project* → pon nombre (`openbet`), genera y **guarda la database password** (te hará falta), elige una región cercana (eu-west para España), plan Free.
3. Espera ~2 min a que aprovisione.

### 2) Sacar las connection strings
1. En el proyecto: **Project Settings** (engranaje abajo izquierda) → **Database** → sección **Connection string**.
2. Selecciona **URI**. Verás tres modos:
   - **Transaction (port 6543)** → cópiala a `DATABASE_URL` en `.env`. Es la que usa la app en runtime (pooler, optimizado para serverless/Vercel).
   - **Session (port 5432)** → cópiala a `DIRECT_URL`. La usará Prisma para `db push` / migraciones.
3. En ambas, reemplaza `[YOUR-PASSWORD]` por la password que guardaste en el paso 1.
4. A la `DATABASE_URL` añade `?pgbouncer=true&connection_limit=1` al final (importante con pooler).

Quedará algo así en `.env`:
```
DATABASE_URL="postgresql://postgres.abcdxyz:miPassword@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abcdxyz:miPassword@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

### 3) Instalar y crear las tablas
```bash
npm install
npx prisma db push    # crea Guest, Bet, Option, Wager, Vote en Supabase
npm run dev
```

Abre http://localhost:3000 → te pedirá un nick → a apostar.

Para inspeccionar la BBDD: en Supabase → **Table Editor**, o `npx prisma studio` local.

## Deploy a Vercel

1. Sube el repo a GitHub.
2. En Vercel: *New Project* → importa.
3. Settings → **Environment Variables**: añade `DATABASE_URL` y `DIRECT_URL` (mismos valores que en local).
4. Deploy. El `build` script ya ejecuta `prisma generate`.

## Estructura

```
src/
  app/
    page.tsx              # landing (redirige si hay cookie)
    layout.tsx            # header + GuestGate si no hay cookie
    GuestGate.tsx         # modal pedir nick
    LogoutButton.tsx
    bets/                 # listado, crear, detalle
    api/
      guests/             # POST crea invitado + cookie, DELETE logout
      me/                 # GET datos del invitado
      bets/               # POST crear apuesta
      bets/[id]/wager     # apostar
      bets/[id]/vote      # votar resultado
      bets/[id]/resolve   # resolver si hay quorum
      bets/[id]/claim     # reclamar
      drinks/refill       # +11 si saldo=0
  lib/
    prisma.ts
    guest.ts              # helper getGuest() server-side via cookie
    bets.ts               # listBets/getBet + sync de caducadas
prisma/schema.prisma
```

## Notas del prototipo

- No hay password: cualquiera puede crear nicks. Cuando volvamos a login real (Google OAuth + Auth.js), basta con sustituir `getGuest()` por `auth()` en API routes y páginas.
- La cookie `guest_id` es httpOnly, dura 1 año.
- Borrar la cookie (botón Salir) te deja "fuera" pero el Guest sigue existiendo en BBDD; si vuelves a entrar con el mismo nick, da error de duplicado. Por ahora, usa un nick nuevo o borra la fila en Supabase.
