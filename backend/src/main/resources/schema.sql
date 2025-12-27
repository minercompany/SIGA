-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS asamblea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE asamblea_db;

-- 1. Sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Asambleas
CREATE TABLE IF NOT EXISTS asambleas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    horarios VARCHAR(200),
    activo BOOLEAN DEFAULT FALSE,
    fecha_cierre_asignaciones DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(50),
    rol ENUM('SUPER_ADMIN', 'DIRECTIVO', 'OPERADOR', 'USUARIO_SOCIO') NOT NULL,
    id_sucursal INT,
    gohighlevel_contact_id VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL
);

-- 3.5. Funcionarios y Directivos (Tabla Permanente)
-- Esta tabla NO se borra con el reset y define quiénes deben tener login automático
CREATE TABLE IF NOT EXISTS funcionarios_directivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_socio VARCHAR(20) UNIQUE NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    rol ENUM('DIRECTIVO', 'OPERADOR') DEFAULT 'DIRECTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_numero_socio (numero_socio),
    INDEX idx_cedula (cedula)
);

-- 4. Socios
CREATE TABLE IF NOT EXISTS socios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_socio VARCHAR(20) UNIQUE NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    telefono VARCHAR(50),
    id_sucursal INT,
    aporte_al_dia BOOLEAN DEFAULT FALSE,
    solidaridad_al_dia BOOLEAN DEFAULT FALSE,
    fondo_al_dia BOOLEAN DEFAULT FALSE,
    incoop_al_dia BOOLEAN DEFAULT FALSE,
    credito_al_dia BOOLEAN DEFAULT FALSE,
    estado_voz_voto BOOLEAN AS (aporte_al_dia AND solidaridad_al_dia AND fondo_al_dia AND incoop_al_dia) VIRTUAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL
);

-- 5. Asignaciones
CREATE TABLE IF NOT EXISTS asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_asamblea INT NOT NULL,
    id_socio INT NOT NULL,
    id_empleado INT NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(45),
    notificacion_enviada BOOLEAN DEFAULT FALSE,
    respuesta_api TEXT,
    UNIQUE KEY unique_asignacion (id_asamblea, id_socio),
    FOREIGN KEY (id_asamblea) REFERENCES asambleas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_socio) REFERENCES socios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_empleado) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 6. Asistencias (Check-in)
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_asamblea INT NOT NULL,
    id_socio INT NOT NULL,
    id_operador INT NOT NULL,
    fecha_hora_llegada DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_voz_voto BOOLEAN NOT NULL,
    carnet_impreso BOOLEAN DEFAULT FALSE,
    UNIQUE KEY unique_asistencia (id_asamblea, id_socio),
    FOREIGN KEY (id_asamblea) REFERENCES asambleas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_socio) REFERENCES socios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_operador) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 7. Auditoría
CREATE TABLE IF NOT EXISTS auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    modulo VARCHAR(255) NOT NULL,
    accion VARCHAR(255) NOT NULL,
    detalles TEXT,
    usuario VARCHAR(255),
    ip_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Configuración
CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT,
    tipo_dato VARCHAR(20) DEFAULT 'STRING',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos iniciales obligatorios de sucursales según especificación
INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad) VALUES (1, '1', 'Casa Central', 'Asunción');
INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad) VALUES (2, '2', 'Ciudad del Este', 'Ciudad del Este');
INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad) VALUES (3, '3', 'VCA', 'Villarrica');
INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad) VALUES (4, '5', 'San Lorenzo Centro', 'San Lorenzo');
INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad) VALUES (5, '6', 'Hernandarias', 'Hernandarias');
INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad) VALUES (6, '7', 'SUC 5', '(Sin especificar)');

-- Usuario Super Admin por defecto: admin / admin (hash para 'admin')
-- Password: admin -> $2a$12$R9h/lIPzHZ.3PzWz.f2OAu3/i9dY6jYyW.yqQzq9v5o8n.T.y7y.W
INSERT IGNORE INTO usuarios (username, password_hash, nombre_completo, rol, activo) 
VALUES ('admin', '$2a$12$R9h/lIPzHZ.3PzWz.f2OAu3/i9dY6jYyW.yqQzq9v5o8n.T.y7y.W', 'Super Administrador', 'SUPER_ADMIN', TRUE);
