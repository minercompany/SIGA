import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Definición de menú idéntica a la Web
const menuItems = [
    {
        id: "dashboard",
        name: "Panel de Control", // Dashboard en web
        route: "/(drawer)/dashboard",
        icon: "stats-chart",
        submenu: []
    },
    {
        id: "padrones",
        name: "Gestión de Padrones",
        icon: "people",
        submenu: [
            { id: "socios", name: "Padrón de Socios", route: "/(drawer)/socios", icon: "people-circle" },
            // Importar no se hace desde móvil usualmente, pero lo dejo mapeado
        ]
    },
    {
        id: "operativa",
        name: "Gestión Operativa",
        icon: "briefcase",
        submenu: [
            { id: "asignacion-rapida", name: "Asignación Rápida", route: "/(drawer)/asignacion-rapida", icon: "flash" },
            { id: "asignaciones", name: "Mis Listas", route: "/(drawer)/mis-listas", icon: "list" },
        ]
    },
    {
        id: "asistencia-group",
        name: "Control de Asistencia",
        icon: "checkbox",
        submenu: [
            { id: "asistencia", name: "Asistencia", route: "/(drawer)/asistencia", icon: "qr-code" },
        ]
    },
    {
        id: "admin",
        name: "Administración",
        icon: "settings",
        submenu: [
            // { id: "configuracion", name: "Configuración", route: "/(drawer)/configuracion", icon: "options" }, // Falta pantalla
        ]
    }
];

export function CustomDrawerContent(props: any) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const hasPermission = (itemId: string): boolean => {
        if (!user) return false;
        if (user.rol === "SUPER_ADMIN") return true;

        // Permisos especiales
        if (user.permisosEspeciales) {
            const special = user.permisosEspeciales.split(',');
            if (special.includes(itemId)) return true;
        }

        // Lógica de grupos
        if (itemId === "padrones") return user.rol === "DIRECTIVO" || user.rol === "SUPER_ADMIN";
        if (itemId === "operativa") return true; // Contiene Mis Listas que es para todos
        if (itemId === "asistencia-group") return user.rol === "OPERADOR" || user.rol === "DIRECTIVO" || user.rol === "SUPER_ADMIN";
        if (itemId === "admin") return user.rol === "SUPER_ADMIN";

        // Items específicos
        switch (itemId) {
            case "dashboard": return true;
            case "socios": return user.rol === "DIRECTIVO" || user.rol === "SUPER_ADMIN";
            case "asignacion-rapida": return user.rol === "SUPER_ADMIN";
            case "asignaciones": return true; // Todos (filtro interno en pantalla)
            case "asistencia": return user.rol === "OPERADOR" || user.rol === "DIRECTIVO" || user.rol === "SUPER_ADMIN";
            default: return false;
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    const toggleMenu = (id: string, submenu: any[]) => {
        if (submenu && submenu.length > 0) {
            setExpandedMenu(expandedMenu === id ? null : id);
        } else {
            // Navegar directamente si no tiene submenú y tiene ruta (aunque en nuestro array dashboard tiene ruta)
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#006600', '#009900']}
                style={styles.header}
            >
                <Image
                    source={require('../assets/images/logo-cooperativa.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.appName}>Cooperativa Reducto</Text>
                <Text style={styles.appDesc}>Sistema de Asambleas</Text>

                <View style={styles.userInfo}>
                    <Text style={styles.userRole}>{user?.rol}</Text>
                    <Text style={styles.userName}>{user?.username}</Text>
                </View>
            </LinearGradient>

            <DrawerContentScrollView {...props} style={styles.content}>
                {menuItems.filter(item => hasPermission(item.id)).map((item) => {
                    const visibleSubmenu = item.submenu.filter(sub => hasPermission(sub.id));
                    const isExpanded = expandedMenu === item.id;
                    const isActive = pathname.includes(item.id) || (item.route && pathname === item.route);

                    // Si no tiene submenú valido y tiene ruta, renderizar item simple
                    if (visibleSubmenu.length === 0 && item.route) {
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.menuItem, isActive && styles.activeItem]}
                                onPress={() => router.push(item.route as any)}
                            >
                                <Ionicons name={item.icon as any} size={22} color={isActive ? '#009900' : '#475569'} />
                                <Text style={[styles.menuText, isActive && styles.activeText]}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    }

                    // Si tiene submenú
                    if (visibleSubmenu.length > 0) {
                        return (
                            <View key={item.id}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => toggleMenu(item.id, visibleSubmenu)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name={item.icon as any} size={22} color="#475569" />
                                        <Text style={styles.menuText}>{item.name}</Text>
                                    </View>
                                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
                                </TouchableOpacity>

                                {isExpanded && visibleSubmenu.map(sub => (
                                    <TouchableOpacity
                                        key={sub.id}
                                        style={[styles.submenuItem, pathname === sub.route && styles.activeItem]}
                                        onPress={() => router.push(sub.route as any)}
                                    >
                                        <Ionicons name={sub.icon as any} size={18} color={pathname === sub.route ? '#009900' : '#64748b'} />
                                        <Text style={[styles.submenuText, pathname === sub.route && styles.activeText]}>
                                            {sub.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        );
                    }

                    return null;
                })}
            </DrawerContentScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 60,
        marginBottom: 10,
        backgroundColor: 'white',
        borderRadius: 30,
    },
    appName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    appDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 10,
    },
    userInfo: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 10,
        marginTop: 10,
    },
    userRole: {
        color: '#a7f3d0',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    userName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        backgroundColor: 'white',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    activeItem: {
        backgroundColor: '#f0fdf4',
        borderRightWidth: 3,
        borderRightColor: '#009900',
    },
    menuText: {
        fontSize: 15,
        marginLeft: 15,
        color: '#334155',
        fontWeight: '500',
    },
    activeText: {
        color: '#009900',
        fontWeight: '700',
    },
    submenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 58,
        paddingRight: 20,
        backgroundColor: '#f8fafc',
    },
    submenuText: {
        fontSize: 14,
        marginLeft: 10,
        color: '#64748b',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        padding: 20,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        marginLeft: 10,
        color: '#ef4444',
        fontWeight: '600',
    },
});
