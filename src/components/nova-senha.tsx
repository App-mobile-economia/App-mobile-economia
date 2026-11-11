// Tela para escolher a senha nova. Aparece quando a pessoa abre o link do e-mail de recuperar senha.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '@/constants/cores';
import { supabase } from '@/lib/supabase';

export default function NovaSenha({ aoTerminar }: { aoTerminar: () => void }) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function salvar() {
    if (senha.length < 6) {
      setMensagem('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setMensagem('As senhas não são iguais.');
      return;
    }
    setCarregando(true);
    setMensagem('');
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) {
      setMensagem('Não foi possível alterar a senha: ' + error.message);
      return;
    }
    aoTerminar(); // senha trocada: a pessoa segue para o app
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.caixa}>
        <Ionicons name="lock-closed" size={48} color={cores.destaque} />
        <Text style={estilos.titulo}>Nova senha</Text>
        <Text style={estilos.subtitulo}>Escolha uma senha nova para a sua conta</Text>

        <TextInput
          style={estilos.campo}
          placeholder="Nova senha (mínimo 6 caracteres)"
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          accessibilityLabel="Nova senha"
        />
        <TextInput
          style={estilos.campo}
          placeholder="Repita a nova senha"
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry
          value={confirmacao}
          onChangeText={setConfirmacao}
          accessibilityLabel="Repetir nova senha"
        />

        {mensagem ? <Text style={estilos.erro}>{mensagem}</Text> : null}

        <Pressable style={estilos.botao} onPress={salvar} disabled={carregando} accessibilityRole="button">
          <Text style={estilos.textoBotao}>{carregando ? 'Aguarde...' : 'Salvar senha'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  caixa: { width: '100%', maxWidth: 400, padding: 24, gap: 12, alignItems: 'stretch' },
  titulo: { fontSize: 28, fontWeight: '800', color: cores.textoPrincipal, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: cores.textoSecundario, textAlign: 'center', marginBottom: 12 },
  campo: {
    backgroundColor: cores.card,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: cores.textoPrincipal,
    fontSize: 16,
  },
  botao: { backgroundColor: cores.destaque, borderRadius: 12, padding: 14, alignItems: 'center' },
  textoBotao: { color: cores.fundo, fontWeight: '700', fontSize: 16 },
  erro: { color: cores.negativo, fontSize: 13 },
});
