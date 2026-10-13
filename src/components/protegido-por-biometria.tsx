// Só mostra o conteúdo depois de digital ou rosto (ou a senha do aparelho, como reserva do sistema).
// Se o aparelho não tem biometria, ou está no navegador, o conteúdo é liberado direto.
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TelaCarregando from '@/components/tela-carregando';
import { cores } from '@/constants/cores';

// Vale para todas as abas protegidas: autenticou uma vez, não pede de novo até o app ir para segundo plano.
let liberado = false;

type Estado = 'verificando' | 'bloqueado' | 'liberado';

export default function ProtegidoPorBiometria({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(liberado ? 'liberado' : 'verificando');

  const autenticar = useCallback(async () => {
    if (Platform.OS === 'web') return true;
    const temSensor = await LocalAuthentication.hasHardwareAsync();
    const cadastrada = await LocalAuthentication.isEnrolledAsync();
    if (!temSensor || !cadastrada) return true;

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirme que é você',
      cancelLabel: 'Cancelar',
    });
    return resultado.success;
  }, []);

  const tentar = useCallback(async () => {
    setEstado('verificando');
    const ok = await autenticar();
    liberado = ok;
    setEstado(ok ? 'liberado' : 'bloqueado');
  }, [autenticar]);

  useEffect(() => {
    if (!liberado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      tentar();
    }
  }, [tentar]);

  // Ao mandar o app para segundo plano, bloqueia de novo.
  // (Só "background": no iOS o próprio pedido de Face ID deixa o app "inactive".)
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (novo) => {
      if (novo === 'background') {
        liberado = false;
        setEstado('bloqueado');
      }
    });
    return () => assinatura.remove();
  }, []);

  if (estado === 'liberado') return <>{children}</>;
  if (estado === 'verificando') return <TelaCarregando />;

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.caixa}>
        <Ionicons name="lock-closed" size={64} color={cores.destaque} />
        <Text style={estilos.titulo}>Conteúdo protegido</Text>
        <Text style={estilos.texto}>Use sua digital ou seu rosto para continuar.</Text>
        <Pressable style={estilos.botao} onPress={tentar} accessibilityRole="button">
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
