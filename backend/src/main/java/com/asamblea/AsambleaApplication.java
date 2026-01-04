package com.asamblea;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class AsambleaApplication {

    public static void main(String[] args) {
        // Establecer zona horaria antes de que Spring inicie
        TimeZone.setDefault(TimeZone.getTimeZone("America/Asuncion"));
        SpringApplication.run(AsambleaApplication.class, args);
    }

    @PostConstruct
    public void init() {
        // Reforzar zona horaria de Paraguay después del inicio
        TimeZone.setDefault(TimeZone.getTimeZone("America/Asuncion"));
    }
}
