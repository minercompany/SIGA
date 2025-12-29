import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ConfigProvider } from '../context/ConfigContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <ConfigProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                </Stack>
            </ConfigProvider>
        </AuthProvider>
    );
}
