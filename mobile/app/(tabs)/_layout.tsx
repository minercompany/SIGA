import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function TabsLayout() {
    const { user, isLoading } = useAuth();

    console.log('Layout user:', user?.username, 'Role:', user?.rol);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/" />;
    }

    // Definir roles y permisos
    const userRole = user?.rol ? user.rol.toUpperCase() : '';
    const userPermisos = user?.permisosEspeciales ? user.permisosEspeciales.toUpperCase().split(',').map(p => p.trim()) : [];

    const checkAccess = (requiredRole: string[], requiredPermiso?: string) => {
        // 1. Acceso por Rol (Super Admin siempre entra)
        if (userRole === 'SUPER_ADMIN') return true;
        if (requiredRole.includes(userRole)) return true;

        // 2. Acceso por Permiso Especial
        if (requiredPermiso && userPermisos.includes(requiredPermiso)) return true;

        return false;
    };

    // Determinar visibilidad por módulo
    const showSocios = checkAccess(['ADMIN', 'DIRECTIVO', 'OPERADOR'], 'SOCIOS');
    const showAsistencia = checkAccess(['ADMIN', 'DIRECTIVO', 'OPERADOR'], 'ASISTENCIA');
    const showAsignacion = checkAccess(['ADMIN', 'DIRECTIVO', 'OPERADOR'], 'ASIGNACION');
    // Mis Listas visible para todos los logueados
    const showMisListas = true;

    console.log('User:', user?.username, 'Role:', userRole, 'Permisos:', userPermisos);
    console.log('Access -> Socios:', showSocios, 'Asistencia:', showAsistencia, 'Asignar:', showAsignacion);

    return (
        <Tabs
            // Forzar re-render si cambian permisos
            key={userRole + (user?.permisosEspeciales || '')}
            screenOptions={{
                tabBarActiveTintColor: '#009900', // emerald-600
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#009900', // emerald-600
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '700',
                },
            }}
        >
            {/* DASHBOARD: Visible para todos */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                    headerTitle: userRole === 'SUPER_ADMIN' ? 'Panel de Control' : 'Mi Resumen',
                }}
            />

            {/* SOCIOS */}
            <Tabs.Screen
                name="socios"
                options={{
                    href: showSocios ? '/socios' : null,
                    title: 'Socios',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                    headerTitle: 'Gestión de Socios',
                }}
            />

            {/* ASISTENCIA */}
            <Tabs.Screen
                name="asistencia"
                options={{
                    href: showAsistencia ? '/asistencia' : null,
                    title: 'Asistencia',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkmark-circle" size={size} color={color} />
                    ),
                    headerTitle: 'Registro de Asistencia',
                }}
            />

            {/* ASIGNACIÓN RÁPIDA */}
            <Tabs.Screen
                name="asignacion-rapida"
                options={{
                    href: showAsignacion ? '/asignacion-rapida' : null,
                    title: 'Asignar',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="qr-code" size={size} color={color} />
                    ),
                    headerTitle: 'Asignación Rápida',
                }}
            />

            {/* MIS LISTAS */}
            <Tabs.Screen
                name="mis-listas"
                options={{
                    title: 'Mis Listas',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                    headerTitle: 'Mis Listas Asignadas',
                }}
            />


            {/* CONFIG: Todos */}
            <Tabs.Screen
                name="config"
                options={{
                    title: 'Config',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                    headerTitle: 'Configuración',
                }}
            />
        </Tabs>
    );
}
