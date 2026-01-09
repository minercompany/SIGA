package com.asamblea.repository;

import com.asamblea.model.ConfiguracionBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionBackupRepository extends JpaRepository<ConfiguracionBackup, Long> {
    
    default ConfiguracionBackup getConfiguracion() {
        return findById(1L).orElseGet(() -> {
            ConfiguracionBackup config = new ConfiguracionBackup();
            config.setId(1L);
            return save(config);
        });
    }
}
