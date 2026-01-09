package com.asamblea.repository;

import com.asamblea.model.BackupHistorial;
import com.asamblea.model.BackupHistorial.TipoBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BackupHistorialRepository extends JpaRepository<BackupHistorial, Long> {
    
    // Obtener historial ordenado por fecha descendente
    List<BackupHistorial> findAllByOrderByFechaCreacionDesc();
    
    // Obtener backups disponibles
    List<BackupHistorial> findByDisponibleTrueOrderByFechaCreacionDesc();
    
    // Contar backups por tipo
    long countByTipo(TipoBackup tipo);
    
    // Obtener backups más antiguos que cierta cantidad (para limpieza)
    @Query("SELECT b FROM BackupHistorial b WHERE b.tipo = :tipo ORDER BY b.fechaCreacion DESC")
    List<BackupHistorial> findByTipoOrderByFechaCreacionDesc(TipoBackup tipo);
    
    // Obtener último backup automático
    BackupHistorial findFirstByTipoOrderByFechaCreacionDesc(TipoBackup tipo);
    
    // Buscar backups entre fechas
    List<BackupHistorial> findByFechaCreacionBetweenOrderByFechaCreacionDesc(
        LocalDateTime inicio, LocalDateTime fin);
}
