# Economia Hoje

App feito com Expo (React Native) que mostra indicadores financeiros e criptomoedas, com login, favoritos, histórico e versão web instalável (PWA). Roda no celular (Expo Go) e no navegador, com layout diferente em cada um.

## O que o app tem

**Painel**
- Economia (Banco Central): IPCA do mês e de 12 meses, INPC, IGP-M, Selic, CDI, dólar, euro e desemprego.
- Criptomoedas (CoinGecko): Bitcoin, Ethereum, Solana, XRP, BNB e Dogecoin, com variação em 24 h.
- Busca por nome: acha indicadores por nome ou palavra-chave ("inflação") e procura qualquer criptomoeda.
- Filtros por grupo (Todos, Economia, Criptomoedas).
- Atualiza ao puxar a tela ou **sacudindo o celular**.

**Favoritos**
- Favoritar qualquer cartão (inclusive moedas achadas na busca), escrever nota, editar e apagar.
- Histórico por período (7 dias, 30 dias, 12 meses) e filtro por grupo.

**Conta e segurança**
- Login e cadastro com Supabase; cada pessoa só vê os próprios dados (RLS).
- **Biometria** (digital ou rosto) para abrir Favoritos e Perfil e para **sair da conta**.

**Offline e instalação**
- Aviso "Você está offline. Mostrando dados do cache" e atualização automática quando a internet volta.
- PWA: pode ser instalado pelo navegador e abre sem internet a partir do segundo acesso.

## Possibilidades da Release 5

| Possibilidade | Como foi feito | Onde |
|---|---|---|
| Autenticação real | Login e cadastro com Supabase Auth | `src/app/login.tsx`, `src/lib/supabase.ts` |
| Segurança | Telas protegidas por sessão, RLS no banco e biometria | `src/app/_layout.tsx`, `supabase/schema.sql`, `src/lib/biometria.ts` |
| Persistência + CRUD | Favoritos no Supabase: criar, listar, editar a nota e apagar | `src/services/favoritos.ts`, `src/app/(tabs)/favoritos.tsx` |
| Offline | Últimos dados salvos no aparelho e aviso de rede (`expo-network`) | `src/services/cache.ts`, `src/app/(tabs)/index.tsx` |
| Recursos nativos | Acelerômetro (sacudir) e biometria | `src/hooks/use-sacudir.ts`, `src/lib/biometria.ts` |
| PWA | Manifesto, ícones e service worker | `public/` |
| Publicação | Site estático no Render | `render.yaml` |
| Acessibilidade | `accessibilityLabel` e `accessibilityState` nos botões e campos | telas e componentes |

## Compatibilidade

| Recurso | Android (Expo Go) | iPhone (Expo Go) | Navegador / PWA |
|---|---|---|---|
| Painel, busca, favoritos, histórico | Sim | Sim | Sim |
| Sacudir para atualizar | Sim | Sim | Não |
| Biometria (digital) | Sim | Touch ID | Não (libera direto) |
| Face ID | Não se aplica | Só em *development build* | Não |

Sem biometria cadastrada no aparelho, o app libera o acesso direto para não trancar a pessoa.

## Como funciona

```
src/app/_layout.tsx            decide: logado -> abas | deslogado -> login
src/app/login.tsx              entrar / criar conta
src/app/(tabs)/_layout.tsx     abas (embaixo no celular, na lateral no desktop)
src/app/(tabs)/index.tsx       Painel: busca, filtros e cartões
src/app/(tabs)/favoritos.tsx   lista, edita e apaga favoritos, com histórico
src/app/(tabs)/perfil.tsx      e-mail e botão Sair (pede biometria)
src/components/                cartao, chip, etiqueta-variacao, protegido-por-biometria
src/constants/indicadores.ts   lista dos indicadores (para incluir um, basta uma linha)
src/services/api.ts            preços atuais: Banco Central e CoinGecko
src/services/historico.ts      histórico e variação por período
src/services/busca.ts          busca de moedas por nome
src/services/favoritos.ts      CRUD no Supabase
src/services/cache.ts          modo offline
src/hooks/use-sacudir.ts       acelerômetro
src/lib/                       supabase.ts e biometria.ts
public/                        manifest.json, sw.js e ícones do PWA
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
