// Só mostra o conteúdo depois de digital ou rosto (ou a senha do aparelho, como reserva do sistema).
// Se o aparelho não tem biometria, ou está no navegador, o conteúdo é liberado direto.
import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TelaCarregando from '@/components/tela-carregando';
import { cores } from '@/constants/cores';
import { confirmarBiometria } from '@/lib/biometria';

// Vale para todas as abas protegidas: depois de autenticar uma vez, não pede de novo
// até o app ir para segundo plano. Fica fora do componente para ser compartilhada entre as abas.
let jaLiberado = false;

// Usada ao sair da conta, para a próxima pessoa que entrar também passar pela biometria.
export function bloquearAbas() {
  jaLiberado = false;
}

// "verificando" = pedindo a biometria | "bloqueado" = não confirmou | "liberado" = pode ver o conteúdo
type Estado = 'verificando' | 'bloqueado' | 'liberado';

export default function ProtegidoPorBiometria({ children }: { children: ReactNode }) {
  // Se já foi liberado antes, a aba abre direto.
  let estadoInicial: Estado = 'verificando';
  if (jaLiberado) {
    estadoInicial = 'liberado';
  }
  const [estado, setEstado] = useState<Estado>(estadoInicial);

  // Pede a biometria e atualiza o estado conforme a resposta.
  async function pedirBiometria() {
    setEstado('verificando');
    const confirmou = await confirmarBiometria('Confirme que é você');
    jaLiberado = confirmou;
    if (confirmou) {
      setEstado('liberado');
    } else {
      setEstado('bloqueado');
    }
  }

  // Ao abrir a aba pela primeira vez, pede a biometria.
  useEffect(() => {
    if (!jaLiberado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pedirBiometria();
    }
  }, []);

  // Ao mandar o app para segundo plano, bloqueia de novo.
  // (Só "background": no iOS o próprio pedido de Face ID deixa o app "inactive".)
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (novoEstado) => {
      if (novoEstado === 'background') {
        jaLiberado = false;
        setEstado('bloqueado');
      }
    });
    return () => assinatura.remove();
  }, []);

  if (estado === 'liberado') {
    return <>{children}</>;
  }

  if (estado === 'verificando') {
    return <TelaCarregando />;
  }

  // Estado "bloqueado": mostra o botão para tentar de novo.
  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.caixa}>
        <Ionicons name="lock-closed" size={64} color={cores.destaque} />
        <Text style={estilos.titulo}>Conteúdo protegido</Text>
        <Text style={estilos.texto}>Use sua digital ou seu rosto para continuar.</Text>
        <Pressable style={estilos.botao} onPress={pedirBiometria} accessibilityRole="button">
          <Ionicons name="finger-print" size={18} color={cores.fundo} />
          <Text style={estilos.textoBotao}>Desbloquear</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  caixa: { alignItems: 'center', gap: 8, padding: 24 },
  titulo: { color: cores.textoPrincipal, fontSize: 20, fontWeight: '700', marginTop: 8 },
  texto: { color: cores.textoSecundario, fontSize: 14, textAlign: 'center' },
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
