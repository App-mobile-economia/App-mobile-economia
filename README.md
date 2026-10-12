# Economia Hoje

App feito com Expo (React Native) que mostra indicadores financeiros (IPCA, Selic, dólar, Bitcoin e Ethereum), com login, favoritos e versão web. Roda no celular (Expo Go) e no navegador, com layout diferente em cada um.

## O que o app tem (possibilidades da Release 5)

| Possibilidade | Como foi feito | Onde |
|---|---|---|
| Autenticação real | Login e cadastro com Supabase Auth | `src/app/login.tsx`, `src/lib/supabase.ts` |
| Segurança | Telas protegidas por sessão + RLS no banco (cada pessoa só vê os próprios dados) | `src/app/_layout.tsx`, `supabase/schema.sql` |
| Persistência + CRUD | Favoritos no Supabase: criar, listar, editar a nota e apagar | `src/services/favoritos.ts`, `src/app/(tabs)/favoritos.tsx` |
| Offline | Últimos dados ficam salvos no aparelho (AsyncStorage) | `src/services/cache.ts` |
| PWA | Manifesto, ícones e service worker | `public/` |
| Publicação | Site estático no Render | `render.yaml` |
| Acessibilidade | `accessibilityLabel` nos botões e campos | telas e `cartao.tsx` |

## Como funciona

```
src/app/_layout.tsx          decide: logado -> abas | deslogado -> login
src/app/login.tsx            entrar / criar conta
src/app/(tabs)/_layout.tsx   abas (embaixo no celular, na lateral no desktop)
src/app/(tabs)/index.tsx     Painel com os cartões
src/app/(tabs)/favoritos.tsx lista, edita e apaga favoritos
src/app/(tabs)/perfil.tsx    e-mail e botão Sair
src/components/cartao.tsx    cartão reutilizado (com animação e estrela)
src/services/api.ts          busca Banco Central e CoinGecko
src/services/favoritos.ts    CRUD no Supabase
src/services/cache.ts        modo offline
src/lib/supabase.ts          conexão com o Supabase
```

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. No [Supabase](https://supabase.com), crie um projeto e:
   - **SQL Editor**: cole e execute `supabase/schema.sql` (cria a tabela `favoritos` com RLS).
   - **Authentication > Sign In / Providers > Email**: para testar mais fácil, desligue "Confirm email".
   - **Project Settings > API**: copie a *Project URL* e a chave *anon*.
3. Copie `.env.example` para `.env` e preencha as duas variáveis. Nunca use a chave `service_role`.
4. Inicie:
   ```bash
   npx expo start --web   # navegador
   npx expo start         # celular (Expo Go, leia o QR code)
   ```

## Publicar no Render

1. No Render, crie um **Blueprint** (ou Static Site) apontando para este repositório; ele lê o `render.yaml`.
2. Em **Environment**, preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. No Supabase, em **Authentication > URL Configuration**, coloque o endereço do site do Render em *Site URL*.
