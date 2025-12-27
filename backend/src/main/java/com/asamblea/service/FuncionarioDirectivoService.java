package com.asamblea.service;

import com.asamblea.model.FuncionarioDirectivo;
import com.asamblea.model.Usuario;
import com.asamblea.repository.FuncionarioDirectivoRepository;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.repository.ListaAsignacionRepository;
import com.asamblea.model.ListaAsignacion;
import com.github.pjfanning.xlsx.StreamingReader;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FuncionarioDirectivoService {

    private final FuncionarioDirectivoRepository funcionarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final ListaAsignacionRepository listaAsignacionRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Importa el Excel de funcionarios y directivos
     * Columnas esperadas: NRO_SOCIO, NOMBRE, CI, ROL (opcional)
     */
    // Quitamos @Transactional global para permitir éxitos parciales
    public Map<String, Object> importarFuncionarios(MultipartFile file) throws Exception {
        // Guardar archivo temporal
        File tempFile = File.createTempFile("funcionarios_", ".xlsx");
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }

        int importados = 0;
        int actualizados = 0;
        int errores = 0;
        List<String> mensajesError = new ArrayList<>();

        try (InputStream is = file.getInputStream();
                Workbook workbook = StreamingReader.builder()
                        .rowCacheSize(100)
                        .bufferSize(4096)
                        .open(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            // Saltar encabezado
            if (rowIterator.hasNext()) {
                rowIterator.next();
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                try {
                    String numeroSocio = getCellValue(row, 0); // NRO_SOCIO
                    String nombre = getCellValue(row, 1); // NOMBRE
                    String cedula = getCellValue(row, 2); // CI

                    if (numeroSocio == null || numeroSocio.trim().isEmpty()) {
                        continue; // Saltar filas vacías
                    }

                    // Validar Datos Requeridos (Nombre es obligatorio, Cédula opcional si se
                    // recuperará del padrón)
                    if (nombre == null || nombre.trim().isEmpty()) {
                        throw new IllegalArgumentException("Falta NOMBRE");
                    }

                    // Si no trae cédula, usamos "PENDIENTE" o null para llenarla luego con el
                    // padrón
                    if (cedula == null || cedula.trim().isEmpty()) {
                        cedula = "PENDIENTE";
                    }

                    // Determinar rol: POR DEFECTO TODOS SON OPERADOR (Funcionario básico)
                    // El usuario pidió que no sean Directivos por defecto.
                    FuncionarioDirectivo.RolFuncionario rol = FuncionarioDirectivo.RolFuncionario.OPERADOR;

                    // Si explícitamente quieren marcar alguien como directivo en el Excel, podrían,
                    // pero la orden fue "que todos sean rol funcionario".
                    // Dejamos OPERADOR como default.

                    // Buscar si ya existe
                    Optional<FuncionarioDirectivo> existente = funcionarioRepository.findByNumeroSocio(numeroSocio);

                    if (existente.isPresent()) {
                        // Actualizar
                        FuncionarioDirectivo func = existente.get();
                        func.setNombreCompleto(nombre);
                        // Solo actualizamos cédula si viene una válida en el Excel
                        if (!"PENDIENTE".equals(cedula)) {
                            func.setCedula(cedula);
                        }
                        func.setRol(rol);
                        funcionarioRepository.save(func);
                        actualizados++;
                    } else {
                        // Crear nuevo
                        FuncionarioDirectivo func = new FuncionarioDirectivo();
                        func.setNumeroSocio(numeroSocio);
                        func.setNombreCompleto(nombre);
                        func.setCedula(cedula);
                        func.setRol(rol);
                        funcionarioRepository.save(func);
                        importados++;
                    }

                } catch (Exception e) {
                    errores++;
                    mensajesError.add("Fila " + (row.getRowNum() + 1) + ": " + e.getMessage());
                    System.err.println("Error importando fila: " + e.getMessage());
                }
            }

        } finally {
            tempFile.delete();
        }

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("importados", importados);
        resultado.put("actualizados", actualizados);
        resultado.put("errores", errores);
        resultado.put("total", importados + actualizados);
        if (!mensajesError.isEmpty()) {
            resultado.put("mensajesError", mensajesError);
        }

        return resultado;
    }

    /**
     * Verifica si un socio es funcionario/directivo y crea su usuario
     * automáticamente
     * Retorna true si se creó o actualizó el usuario
     * IMPORTANTE: Usa la cédula que viene del PADRÓN para asegurar que sea la
     * correcta.
     */
    @Transactional
    public boolean crearUsuarioSiFuncionario(String numeroSocio, String cedulaDelPadron, String nombreCompleto) {
        // Buscar en la tabla de funcionarios por Nro de Socio
        Optional<FuncionarioDirectivo> funcionarioOpt = funcionarioRepository.findByNumeroSocio(numeroSocio);

        if (funcionarioOpt.isEmpty()) {
            return false;
        }

        FuncionarioDirectivo funcionario = funcionarioOpt.get();

        // Limpiar cédula
        String cedulaSanitized = cedulaDelPadron.replaceAll("[^0-9]", "");
        if (cedulaSanitized.isEmpty())
            return false;

        // 1. NORMALIZAR DATOS EN TABLA FUNCIONARIOS
        if (!cedulaSanitized.equals(funcionario.getCedula().replaceAll("[^0-9]", ""))
                || "PENDIENTE".equals(funcionario.getCedula())) {
            funcionario.setCedula(cedulaDelPadron);
            funcionario.setRol(FuncionarioDirectivo.RolFuncionario.OPERADOR); // Asegurar rol OPERADOR
            funcionarioRepository.save(funcionario);
        }

        // 2. BUSCAR O CREAR USUARIO
        // Estrategia: Usuario = Cédula, Password = Cédula
        Usuario usuario = null;

        // A) Verificar si ya existe por Cédula (Login nuevo)
        Optional<Usuario> byCedula = usuarioRepository.findByUsername(cedulaSanitized);
        if (byCedula.isPresent()) {
            usuario = byCedula.get();
        }
        // B) Si no, verificar si existe por NroSocio (Login viejo) para migrarlo
        else {
            Optional<Usuario> bySocio = usuarioRepository.findByUsername(numeroSocio);
            if (bySocio.isPresent()) {
                usuario = bySocio.get();
            }
        }

        if (usuario == null) {
            usuario = new Usuario();
            usuario.setActivo(true);
        }

        // 3. ACTUALIZAR CREDENCIALES (Siempre forzamos Cédula/Cédula)
        usuario.setUsername(cedulaSanitized); // Usuario es la Cédula
        usuario.setPassword(passwordEncoder.encode(cedulaSanitized)); // Password es la Cédula
        usuario.setNombreCompleto(nombreCompleto);

        // Asignar rol
        // CAMBIO SOLICITADO: Todos nacen como USUARIO_SOCIO (Perfil bajo por seguridad)
        usuario.setRol(Usuario.Rol.USUARIO_SOCIO);

        usuario.setActivo(true);

        usuarioRepository.save(usuario);

        // 4. CREAR LISTA POR DEFECTO AUTOMÁTICAMENTE
        // Si no tiene lista, le creamos una activa
        if (listaAsignacionRepository.findByUsuarioId(usuario.getId()).isEmpty()) {
            ListaAsignacion lista = new ListaAsignacion();
            lista.setNombre("Lista de " + usuario.getNombreCompleto());
            lista.setUsuario(usuario);
            lista.setActiva(true);
            lista.setDescripcion("Lista generada automáticamente");
            listaAsignacionRepository.save(lista);
        }

        return true;
    }

    /**
     * Obtiene todos los funcionarios registrados
     */
    public List<FuncionarioDirectivo> listarTodos() {
        return funcionarioRepository.findAll();
    }

    /**
     * Elimina un funcionario (esto NO elimina su usuario si ya fue creado)
     */
    @Transactional
    public void eliminar(Long id) {
        if (id != null) {
            funcionarioRepository.deleteById(id);
        }
    }

    public long contarTotal() {
        return funcionarioRepository.count();
    }

    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null)
            return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return null;
        }
    }
}
