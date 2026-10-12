// Conexão com o Supabase (login e banco de dados).
// A URL e a chave "anon" vêm do arquivo .env (veja .env.example).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Serve para avisar na tela de login quando o .env não foi preenchido.
export const supabaseConfigurado = Boolean(url && chave);

export const supabase = createClient(url ?? 'https://exemplo.supabase.co', chave ?? 'sem-chave', {
  auth: {
    storage: AsyncStorage, // guarda a sessão no aparelho (ou no navegador)
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
