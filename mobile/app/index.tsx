import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    // Redirigir según estado de autenticación
    if (user) {
        return <Redirect href="/(tabs)/dashboard" />;
    }

    return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
});
