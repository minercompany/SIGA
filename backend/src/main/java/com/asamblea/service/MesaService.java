package com.asamblea.service;

import com.asamblea.model.Socio;
import com.asamblea.model.Sucursal;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MesaService {

    /**
     * Calcula la mesa asignada para un socio según su número y sucursal.
     * Si el socio tiene SOLO VOZ (no tiene derecho a voto), va a la Mesa 11.
     * 
     * @param socio El socio para calcular la mesa
     * @return Información de la mesa (número, rango, ubicación)
     */
    public Map<String, Object> calcularMesa(Socio socio) {
        Map<String, Object> mesaInfo = new HashMap<>();

        if (socio == null) {
            mesaInfo.put("numero", 0);
            mesaInfo.put("mensaje", "Sin mesa asignada");
            return mesaInfo;
        }

        // PRIMERO: Verificar si tiene SOLO VOZ (sin derecho a voto)
        // Si no tiene voz y voto, va a la Mesa 11 independientemente de la sucursal
        boolean tieneVozYVoto = socio.isAporteAlDia() && socio.isSolidaridadAlDia() &&
                socio.isFondoAlDia() && socio.isIncoopAlDia() && socio.isCreditoAlDia();

        if (!tieneVozYVoto) {
            return calcularMesaSoloVoz();
        }

        Sucursal sucursal = socio.getSucursal();
        String numeroSocioStr = socio.getNumeroSocio();

        // Intentar convertir el número de socio a entero
        int numeroSocio;
        try {
            numeroSocio = Integer.parseInt(numeroSocioStr);
        } catch (NumberFormatException e) {
            mesaInfo.put("numero", 0);
            mesaInfo.put("mensaje", "Número de socio inválido");
            return mesaInfo;
        }

        // Verificar si pertenece a Casa Central, Suc 5, San Lorenzo Centro o Centro
        // Médico
        boolean esCentralOAsimilado = false;
        if (sucursal != null) {
            String nombreSucursal = sucursal.getNombre().toLowerCase();
            String codigoSucursal = sucursal.getCodigo();

            esCentralOAsimilado = nombreSucursal.contains("casa central") ||
                    nombreSucursal.contains("san lorenzo centro") ||
                    nombreSucursal.contains("centro médico") ||
                    nombreSucursal.contains("centro medico") ||
                    codigoSucursal.equals("5") ||
                    nombreSucursal.contains("suc 5");
        }

        if (esCentralOAsimilado) {
            return calcularMesaCentral(numeroSocio);
        } else if (sucursal != null && (sucursal.getNombre().toLowerCase().contains("ciudad del este") ||
                sucursal.getCodigo().equals("2") ||
                sucursal.getNombre().toUpperCase().contains("CDE") ||
                sucursal.getNombre().toLowerCase().contains("hernandarias") ||
                sucursal.getCodigo().equals("6"))) {
            return calcularMesaCDE(numeroSocio);
        } else if (sucursal != null && (sucursal.getNombre().toLowerCase().contains("villarrica") ||
                sucursal.getNombre().toUpperCase().contains("VCA") ||
                sucursal.getCodigo().equals("3"))) {
            return calcularMesaVillarrica(numeroSocio);
        } else {
            // Por defecto, todas las demás sucursales van a Casa Central
            return calcularMesaCentral(numeroSocio);
        }
    }

    /**
     * Mesa 11 - Para todos los socios con SOLO VOZ (sin derecho a voto).
     * Independientemente de la sucursal.
     */
    private Map<String, Object> calcularMesaSoloVoz() {
        Map<String, Object> info = new HashMap<>();
        info.put("numero", 11);
        info.put("rango", "Todos los usuarios con Solo Voz");
        info.put("responsables", new String[] { "Trifina Villalba", "Raquel Martinez" });
        info.put("mensaje", "MESA 11 - Solo Voz");
        info.put("ubicacion", "Check-in");
        return info;
    }

    /**
     * Calcula la mesa para socios de Casa Central y sucursales asimiladas.
     */
    private Map<String, Object> calcularMesaCentral(int numeroSocio) {
        Map<String, Object> info = new HashMap<>();

        // Mesas para Casa Central - RANGOS CONTINUOS SIN HUECOS
        // Cualquier número de socio obtiene una mesa (no hay mesa 0)

        if (numeroSocio <= 4756) {
            // Mesa 1: Hasta 4756 (incluye cualquier número menor)
            info.put("numero", 1);
            info.put("rango", "1 al 4.756");
            info.put("responsables", new String[] { "Elizabeth Miño", "Juan González", "Ermelinda Insfran" });
        } else if (numeroSocio <= 12669) {
            // Mesa 2: 4757 al 12669
            info.put("numero", 2);
            info.put("rango", "4.757 al 12.669");
            info.put("responsables", new String[] { "Romina Arevalos", "Natalia Leiva", "David Rojas" });
        } else if (numeroSocio <= 25054) {
            // Mesa 3: 12670 al 25054
            info.put("numero", 3);
            info.put("rango", "12.670 al 25.054");
            info.put("responsables", new String[] { "Dahiana Ocampos", "Cinthia Dominguez", "Lucas Pereira" });
        } else if (numeroSocio <= 32637) {
            // Mesa 4: 25055 al 32637
            info.put("numero", 4);
            info.put("rango", "25.055 al 32.637");
            info.put("responsables", new String[] { "Araceli Carvallo", "Victor Villalba", "Fanny Avila" });
        } else if (numeroSocio <= 41377) {
            // Mesa 5: 32638 al 41377
            info.put("numero", 5);
            info.put("rango", "32.638 al 41.377");
            info.put("responsables", new String[] { "Silvia Vera", "Thiago Aguilera", "Deysi Villagra" });
        } else if (numeroSocio <= 46357) {
            // Mesa 6: 41378 al 46357
            info.put("numero", 6);
            info.put("rango", "41.378 al 46.357");
            info.put("responsables", new String[] { "Magali Arce", "Alejandra Cardozo", "Isaías Valdez" });
        } else if (numeroSocio <= 50897) {
            // Mesa 7: 46358 al 50897
            info.put("numero", 7);
            info.put("rango", "46.358 al 50.897");
            info.put("responsables", new String[] { "Celeste Olmedo", "Mirtha Rolon", "Lucas Gomez" });
        } else if (numeroSocio <= 53924) {
            // Mesa 8: 50898 al 53924
            info.put("numero", 8);
            info.put("rango", "50.898 al 53.924");
            info.put("responsables", new String[] { "Alexis Arce", "Johan Gonzalez", "Gustavo Olmedo" });
        } else if (numeroSocio <= 55993) {
            // Mesa 9: 53925 al 55993
            info.put("numero", 9);
            info.put("rango", "53.925 al 55.993");
            info.put("responsables", new String[] { "Monica Benitez", "Wilson Imlanch", "Miguel Aguero" });
        } else {
            // Mesa 10: 55994 en adelante (cubre cualquier número mayor)
            info.put("numero", 10);
            info.put("rango", "55.994 en adelante");
            info.put("responsables", new String[] { "Aldo Cardozo", "Esequiel Cabrera", "Miquel Quintana" });
        }

        info.put("mensaje", String.format("MESA %d - Casa Central", info.get("numero")));
        info.put("ubicacion", "Casa Central / Auditorio Principal");
        return info;
    }

    /**
     * Calcula la mesa para socios de Ciudad del Este (CDE).
     */
    private Map<String, Object> calcularMesaCDE(int numeroSocio) {
        Map<String, Object> info = new HashMap<>();

        // CDE - RANGOS CONTINUOS SIN HUECOS
        // Todo socio de CDE obtiene una mesa (no hay mesa 0)

        if (numeroSocio <= 34621) {
            // Mesa 1: Hasta 34621 (incluye cualquier número menor)
            info.put("numero", 1);
            info.put("rango", "Hasta 34.621");
            info.put("responsables", new String[] { "Julio Benitez", "Lorena Ferreira", "Fernando Rodriguez" });
        } else if (numeroSocio <= 50198) {
            // Mesa 2: 34622 al 50198
            info.put("numero", 2);
            info.put("rango", "34.622 al 50.198");
            info.put("responsables", new String[] { "Deivis Lopez", "Celia Leiva", "Andres Invernizzi" });
        } else {
            // Mesa 3: 50199 en adelante (cubre cualquier número mayor)
            info.put("numero", 3);
            info.put("rango", "50.199 en adelante");
            info.put("responsables", new String[] { "Juan Jose Rodas", "Maria Ferreira" });
        }

        info.put("mensaje", String.format("MESA %d - Ciudad del Este", info.get("numero")));
        info.put("ubicacion", "Sucursal Ciudad del Este");
        return info;
    }

    /**
     * Calcula la mesa para socios de Villarrica (VCA).
     */
    private Map<String, Object> calcularMesaVillarrica(int numeroSocio) {
        Map<String, Object> info = new HashMap<>();

        // Villarrica - TODOS los socios van a Mesa 4
        // No hay mesa 0 para Villarrica
        info.put("numero", 4);
        info.put("rango", "Todos los socios");
        info.put("responsables", new String[] { "Abner Josué Acosta", "Dalia Elizabeth Guerreros", "David Marecos" });
        info.put("mensaje", "MESA 4 - Villarrica");
        info.put("ubicacion", "Sucursal Villarrica (VCA)");
        return info;
    }
}
