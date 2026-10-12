import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { cores, LARGURA_DESKTOP } from '@/constants/cores';

export default function AbasLayout() {
  const { width } = useWindowDimensions();
  const desktop = width >= LARGURA_DESKTOP;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Celular: abas embaixo. Desktop: menu na lateral esquerda.
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarActiveTintColor: cores.destaque,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: { backgroundColor: cores.fundoLateral, borderColor: cores.borda },
        sceneStyle: { backgroundColor: cores.fundo },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
