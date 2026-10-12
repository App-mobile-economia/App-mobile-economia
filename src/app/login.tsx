import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NOME_APP } from '@/constants/app';
import { cores } from '@/constants/cores';
import { supabase, supabaseConfigurado } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setCarregando(true);
    setMensagem('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setMensagem('Não foi possível entrar: ' + error.message);
    setCarregando(false); // se deu certo, o _layout troca de tela sozinho
  }

  async function criarConta() {
    setCarregando(true);
    setMensagem('');
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) setMensagem('Não foi possível criar a conta: ' + error.message);
    else if (!data.session) setMensagem('Conta criada! Confirme o e-mail que enviamos e depois entre.');
    setCarregando(false);
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.caixa}>
        <Ionicons name="trending-up" size={48} color={cores.destaque} />
        <Text style={estilos.titulo}>{NOME_APP}</Text>
        <Text style={estilos.subtitulo}>Entre para ver e favoritar os indicadores</Text>

        {!supabaseConfigurado && (
          <Text style={estilos.erro}>Supabase não configurado: preencha o arquivo .env (veja o README).</Text>
        )}

        <TextInput
          style={estilos.campo}
          placeholder="E-mail"
          placeholderTextColor={cores.textoSecundario}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="E-mail"
        />
        <TextInput
          style={estilos.campo}
          placeholder="Senha (mínimo 6 caracteres)"
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          accessibilityLabel="Senha"
        />

        {mensagem ? <Text style={estilos.erro}>{mensagem}</Text> : null}

        <Pressable style={estilos.botao} onPress={entrar} disabled={carregando} accessibilityRole="button">
          <Text style={estilos.textoBotao}>{carregando ? 'Aguarde...' : 'Entrar'}</Text>
        </Pressable>
        <Pressable style={estilos.botaoSecundario} onPress={criarConta} disabled={carregando} accessibilityRole="button">
          <Text style={estilos.textoSecundario}>Criar conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  caixa: { width: '100%', maxWidth: 400, padding: 24, gap: 12, alignItems: 'stretch' },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal, textAlign: 'center' },
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
  botaoSecundario: { borderColor: cores.destaque, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  textoSecundario: { color: cores.destaque, fontWeight: '700', fontSize: 16 },
  erro: { color: cores.negativo, fontSize: 13 },
});
