package com.asamblea.config;

import com.asamblea.model.Sucursal;
import com.asamblea.model.Usuario;
import com.asamblea.model.Asamblea;
import com.asamblea.repository.AsambleaRepository;
<<<<<<< HEAD
import com.asamblea.model.Sucursal;
=======
>>>>>>> b2237071a1b0d14036c273f7f3041461a5439a52
import com.asamblea.repository.SucursalRepository;
import com.asamblea.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

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
            var existingAdmin = usuarioRepository.findByUsername("admin");

            if (existingAdmin.isEmpty()) {
                // Crear usuario admin si no existe
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
                // Si existe, actualizar la contraseña para asegurar que sea correcta
                Usuario admin = existingAdmin.get();
                String newEncodedPassword = passwordEncoder.encode("admin");
                admin.setPassword(newEncodedPassword);
                admin.setActivo(true);
                admin.setRequiresPasswordChange(false);
                usuarioRepository.save(admin);
                System.out.println("✅ Contraseña del usuario ADMIN actualizada (user: admin / pass: admin)");
            }

            // LIMPIAR sucursales incorrectas/duplicadas
            List<String> codigosValidos = Arrays.asList("1", "2", "3", "5", "6", "7");
            List<Sucursal> todasSucursales = sucursalRepository.findAll();
            for (Sucursal suc : todasSucursales) {
                if (!codigosValidos.contains(suc.getCodigo())) {
                    // Esta sucursal no debería existir, eliminarla
                    sucursalRepository.delete(suc);
                    System.out
                            .println("🗑️ Eliminada sucursal incorrecta: " + suc.getCodigo() + " - " + suc.getNombre());
                }
            }

            // Inicializar/Actualizar sucursales con nombres correctos
            updateOrCreateSucursal("1", "Casa Central", "Asunción");
            updateOrCreateSucursal("2", "Ciudad del Este", "Ciudad del Este");
            updateOrCreateSucursal("3", "Villarrica", "Villarrica");
            updateOrCreateSucursal("5", "Sucursal 5", null);
            updateOrCreateSucursal("6", "Hernandarias", "Hernandarias");
            updateOrCreateSucursal("7", "San Lorenzo", "San Lorenzo");
            System.out.println("✅ Sucursales inicializadas con nombres correctos");

            // Verificar e inicializar Asamblea si no existe
            if (asambleaRepository.count() == 0) {
                Asamblea asamblea = new Asamblea();
                asamblea.setNombre("Asamblea General Ordinaria");
                asamblea.setFecha(LocalDate.now().plusDays(7)); // Una semana en el futuro
                asamblea.setHorarios("08:00 Hs - Primer Llamado");
                asamblea.setActivo(true);
                asambleaRepository.save(asamblea);
                System.out.println("✅ Asamblea inicial creada automáticamente.");
            }

            // Inicializar Sucursales si no existen
            if (sucursalRepository.count() == 0) {
                crearSucursal("001", "CASA MATRIZ", "San Lorenzo");
                crearSucursal("002", "SUCURSAL 1", "Capiatá");
                crearSucursal("003", "SUCURSAL 2", "Itauguá");
                crearSucursal("004", "SUCURSAL 3", "Fernando de la Mora");
                crearSucursal("005", "AGENCIA 1", "Abasto");
                System.out.println("✅ Sucursales iniciales creadas exitosamente.");
            }
        };
    }

<<<<<<< HEAD
    private void updateOrCreateSucursal(String codigo, String nombre, String ciudad) {
        var existing = sucursalRepository.findByCodigo(codigo);
        if (existing.isPresent()) {
            Sucursal suc = existing.get();
            suc.setNombre(nombre);
            suc.setCiudad(ciudad);
            sucursalRepository.save(suc);
        } else {
            Sucursal suc = new Sucursal();
            suc.setCodigo(codigo);
            suc.setNombre(nombre);
            suc.setCiudad(ciudad);
            sucursalRepository.save(suc);
        }
=======
    private void crearSucursal(String codigo, String nombre, String ciudad) {
        Sucursal s = new Sucursal();
        s.setCodigo(codigo);
        s.setNombre(nombre);
        s.setCiudad(ciudad);
        s.setActivo(true);
        sucursalRepository.save(s);
>>>>>>> b2237071a1b0d14036c273f7f3041461a5439a52
    }
}
