import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f766e' },
        headerTintColor: '#fff',
      }}
    />
  );
}
