// Preparação comum a todos os testes: troca o que depende do aparelho por versões simuladas.

// Guarda de dados no aparelho: versão que funciona só na memória.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Áreas seguras da tela: versão de teste que a própria biblioteca oferece.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Ícones: viram um texto simples com o nome do ícone (evita carregar fontes).
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{'icone:' + name}</Text>,
  };
});

// Biometria: o teste de cada arquivo decide o que o aparelho responde.
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

// Acelerômetro: o teste dispara as leituras na mão.
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: jest.fn(),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(),
  },
}));

// Rede: começa online.
jest.mock('expo-network', () => ({
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

// Navegação: useFocusEffect roda a função uma vez, como se a aba tivesse acabado de abrir.
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (funcao: () => void) => React.useEffect(funcao, [funcao]),
    Stack: Object.assign(() => null, { Protected: () => null, Screen: () => null }),
    Tabs: Object.assign(() => null, { Screen: () => null }),
  };
});

// Cada teste começa sem lembranças dos testes anteriores.
beforeEach(() => {
  jest.clearAllMocks();
});
