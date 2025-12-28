package com.asamblea.config;

import com.asamblea.model.Sucursal;
import com.asamblea.model.Usuario;
import com.asamblea.model.Asamblea;
import com.asamblea.repository.AsambleaRepository;
import com.asamblea.repository.SucursalRepository;
import com.asamblea.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UsuarioRepository usuarioRepository;
    private final AsambleaRepository asambleaRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // ==========================================
            // 1. INICIALIZAR USUARIO ADMIN
            // ==========================================
            var existingAdmin = usuarioRepository.findByUsername("admin");

            if (existingAdmin.isEmpty()) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setNombreCompleto("Super Administrador");
                admin.setRol(Usuario.Rol.SUPER_ADMIN);
                admin.setActivo(true);
                admin.setRequiresPasswordChange(false);
                usuarioRepository.save(admin);
                System.out.println("✅ Usuario ADMIN creado con éxito (user: admin / pass: admin)");
            } else {
                Usuario admin = existingAdmin.get();
                String newEncodedPassword = passwordEncoder.encode("admin");
                admin.setPassword(newEncodedPassword);
                admin.setActivo(true);
                admin.setRequiresPasswordChange(false);
                usuarioRepository.save(admin);
                System.out.println("✅ Contraseña del usuario ADMIN actualizada (user: admin / pass: admin)");
            }

            // ==========================================
            // 2. INICIALIZAR SUCURSALES OFICIALES
            // ==========================================
            try {

                // ==========================================
                // 3. CREAR/ACTUALIZAR SUCURSALES OFICIALES
                // ==========================================
                updateOrCreateSucursal("1", "Casa Central", "Asunción");
                updateOrCreateSucursal("2", "Ciudad del Este", "Ciudad del Este");
                updateOrCreateSucursal("3", "Villarrica", "Villarrica");
                updateOrCreateSucursal("5", "Sucursal 5", "Encarnación"); // Asumiendo ciudad
                updateOrCreateSucursal("6", "Hernandarias", "Hernandarias");
                updateOrCreateSucursal("7", "San Lorenzo", "San Lorenzo");

                System.out.println("✅ Sucursales inicializadas y normalizadas");
            } catch (Exception e) {
                System.err.println("⚠️ Advertencia al inicializar sucursales: " + e.getMessage());
            }

            // ==========================================
            // 4. CREAR ASAMBLEA INICIAL (CRÍTICO PARA ASISTENCIA)
            // ==========================================
            if (asambleaRepository.count() == 0) {
                Asamblea asamblea = new Asamblea();
                asamblea.setNombre("Asamblea General Ordinaria " + LocalDate.now().getYear());
                asamblea.setFecha(LocalDate.now()); // Fecha de HOY para que la consulta >= today funcione
                asamblea.setHorarios("08:00 Hs - Primer Llamado");
                asamblea.setActivo(true); // ¡IMPORTANTE!
                asambleaRepository.save(asamblea);
                System.out.println("✅ Asamblea inicial creada automáticamente y activada.");
            } else {
                // Si ya existen asambleas pero ninguna activa, activar la última
                var activa = asambleaRepository.findTopByActivoTrueOrderByFechaDesc();
                if (activa.isEmpty()) {
                    System.out.println("⚠️ No se encontró asamblea activa. Buscando la última para activar...");
                    // Lógica para activar la más reciente si es necesario, o crear una nueva.
                    // Por seguridad, creemos una nueva si no hay activa.
                    Asamblea asamblea = new Asamblea();
                    asamblea.setNombre("Asamblea de Emergencia (Auto-generada)");
                    asamblea.setFecha(LocalDate.now());
                    asamblea.setHorarios("08:00 Hs");
                    asamblea.setActivo(true);
                    asambleaRepository.save(asamblea);
                    System.out.println("✅ Asamblea de emergencia creada y activada.");
                }
            }
        };
    }

    private void updateOrCreateSucursal(String codigo, String nombre, String ciudad) {
        var existing = sucursalRepository.findByCodigo(codigo);
        if (existing.isPresent()) {
            Sucursal suc = existing.get();
            suc.setNombre(nombre);
            suc.setCiudad(ciudad);
            suc.setActivo(true);
            sucursalRepository.save(suc);
        } else {
            Sucursal suc = new Sucursal();
            suc.setCodigo(codigo);
            suc.setNombre(nombre);
            suc.setCiudad(ciudad);
            suc.setActivo(true);
            sucursalRepository.save(suc);
        }
    }
}
