-- Crear tabla de funcionarios y directivos
-- Ejecuta este script en phpMyAdmin si el backend no inicia correctamente

USE asamblea_db;

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

SELECT 'Tabla funcionarios_directivos creada exitosamente' AS resultado;
