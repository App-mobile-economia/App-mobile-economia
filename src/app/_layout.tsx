import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import TelaCarregando from '@/components/tela-carregando';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  // undefined = ainda verificando | null = deslogado | Session = logado
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    // Avisa sempre que a pessoa entra ou sai da conta.
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSessao(nova));
    return () => data.subscription.unsubscribe();
  }, []);

  if (sessao === undefined) return <TelaCarregando />;

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
