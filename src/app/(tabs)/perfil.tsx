import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProtegidoPorBiometria, { bloquearAbas } from '@/components/protegido-por-biometria';
import { NOME_APP } from '@/constants/app';
import { cores } from '@/constants/cores';
import { confirmarBiometria } from '@/lib/biometria';
import { supabase } from '@/lib/supabase';

// A aba só abre depois da digital ou do rosto.
export default function Perfil() {
  return (
    <ProtegidoPorBiometria>
      <DadosDoPerfil />
    </ProtegidoPorBiometria>
  );
}

function DadosDoPerfil() {
  const [email, setEmail] = useState('');

  // Ao abrir a aba, busca o e-mail da pessoa que está logada.
  useEffect(() => {
    async function buscarEmail() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setEmail(data.session.user.email ?? '');
      }
    }
    buscarEmail();
  }, []);

  // Pede biometria antes de sair da conta.
  async function sair() {
    const confirmou = await confirmarBiometria('Confirme para sair');
    if (!confirmou) {
      return; // a pessoa cancelou: continua logada
    }
    bloquearAbas(); // a próxima pessoa que entrar também passa pela biometria
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <View style={estilos.caixa}>
        <Ionicons name="person-circle" size={96} color={cores.destaque} />
        <Text style={estilos.email}>{email}</Text>
        <Text style={estilos.app}>{NOME_APP}</Text>

        {/* Ao sair, o _layout percebe e volta para a tela de login */}
        <Pressable style={estilos.botao} onPress={sair} accessibilityRole="button">
          <Ionicons name="log-out" size={18} color={cores.fundo} />
          <Text style={estilos.textoBotao}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  caixa: { alignItems: 'center', gap: 8, padding: 24 },
  email: { color: cores.textoPrincipal, fontSize: 18, fontWeight: '700' },
  app: { color: cores.textoSecundario, fontSize: 13 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.destaque,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  textoBotao: { color: cores.fundo, fontWeight: '700', fontSize: 16 },
});
