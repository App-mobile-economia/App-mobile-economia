// Conexão com o Supabase (login e banco de dados).
// A URL e a chave "anon" vêm do arquivo .env (veja .env.example).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Serve para avisar na tela de login quando o .env não foi preenchido.
export const supabaseConfigurado = Boolean(url && chave);

// Na web, o link do e-mail de recuperar senha chega com "type=recovery" no endereço.
// Guardamos isso ANTES de criar o cliente, porque ele apaga o endereço ao ler a sessão e o aviso
// "PASSWORD_RECOVERY" pode sair antes de a tela começar a escutar.
export const abriuLinkDeRecuperacao =
  Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

export const supabase = createClient(url ?? 'https://exemplo.supabase.co', chave ?? 'sem-chave', {
  auth: {
    storage: AsyncStorage, // guarda a sessão no aparelho (ou no navegador)
    persistSession: true,
    autoRefreshToken: true,
    // Na web, o link do e-mail de recuperar senha traz a sessão no endereço; o Supabase precisa lê-la.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
