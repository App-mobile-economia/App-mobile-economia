import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import NovaSenha from '@/components/nova-senha';
import TelaCarregando from '@/components/tela-carregando';
import { abriuLinkDeRecuperacao, supabase } from '@/lib/supabase';

export default function RootLayout() {
  // undefined = ainda verificando | null = deslogado | Session = logado
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);

  // true = a pessoa abriu o link do e-mail de recuperar senha e precisa escolher a senha nova
  const [recuperando, setRecuperando] = useState(Boolean(abriuLinkDeRecuperacao));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    // Avisa sempre que a pessoa entra ou sai da conta.
    const { data } = supabase.auth.onAuthStateChange((evento, nova) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true);
      setSessao(nova);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (sessao === undefined) return <TelaCarregando />;

  // Antes de liberar o app, a pessoa escolhe a senha nova.
  if (recuperando && sessao) return <NovaSenha aoTerminar={() => setRecuperando(false)} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Quem está logado vê as abas; quem não está vê só o login */}
        <Stack.Protected guard={!!sessao}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!sessao}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
