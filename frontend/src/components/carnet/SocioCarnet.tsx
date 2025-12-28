import React from 'react';
import { useConfig } from "@/context/ConfigContext";

interface CarnetCuadradoProps {
    socio: {
        nroSocio: string | number;
        nombreCompleto: string;
        tieneVoto: boolean;
        cedula?: string;
    };
    configOverride?: {
        nombreAsamblea: string;
        fechaAsamblea: string;
    };
}

const SocioCarnet: React.FC<CarnetCuadradoProps> = ({ socio, configOverride }) => {
    const config = useConfig();
    const nombreAsamblea = configOverride?.nombreAsamblea || config.nombreAsamblea;
    const fechaAsamblea = configOverride?.fechaAsamblea || config.fechaAsamblea;
    const votingStatus = socio.tieneVoto ? "VOZ Y VOTO" : "SOLO VOZ";
    const year = fechaAsamblea ? new Date(fechaAsamblea).getFullYear() : new Date().getFullYear();

    // Colores base basados en la imagen oficial
    const darkText = "#1a2e26";
    const greyText = "#667a72";
    const lineSecondary = "#d1d5db";

    // Colores condicionales para la pastilla (Pill)
    const pillBg = socio.tieneVoto ? "#22c55e" : "#fedb39";
    const pillShadow = socio.tieneVoto ? "#16a34a" : "#e5c100";
    const pillTextColor = socio.tieneVoto ? "#ffffff" : "#1a2e26";

    return (
        <div id={`carnet-${socio.nroSocio}`} style={{
            width: '100mm',
            height: '100mm',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '5mm',
            boxSizing: 'border-box',
            pageBreakInside: 'avoid',
            margin: '0',
            overflow: 'hidden',
        }}>
            {/* Marco interior fino */}
            <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px 15px',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px' }}>
                    <img
                        src="/images/logo_coop.png"
                        alt="Logo Coop"
                        style={{ width: '65px', height: '65px', objectFit: 'contain' }}
                    />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '900',
                            color: darkText,
                            lineHeight: '1',
                            fontFamily: 'Arial Black, sans-serif'
                        }}>
                            COOPERATIVA<br />REDUCTO LTDA.
                        </div>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: greyText,
                            textTransform: 'uppercase',
                            marginTop: '5px',
                            letterSpacing: '0.5px'
                        }}>
                            {nombreAsamblea.includes(String(year)) ? nombreAsamblea : `${nombreAsamblea} ${year}`}
                        </div>
                    </div>
                </div>

                {/* Section: SOCIO N° con líneas laterales */}
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '10px 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: lineSecondary }}></div>
                    <div style={{
                        padding: '0 15px',
                        fontSize: '16px',
                        fontWeight: '900',
                        color: darkText,
                        letterSpacing: '2px'
                    }}>
                        SOCIO N°
                    </div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: lineSecondary }}></div>
                </div>

                {/* El NÚMERO - Ajustado para evitar desborde */}
                <div style={{
                    fontSize: '85px',
                    fontWeight: '900',
                    color: darkText,
                    lineHeight: '0.8',
                    textAlign: 'center',
                    fontFamily: 'Arial, sans-serif',
                    margin: '0',
                    width: '100%',
                    letterSpacing: '-2px'
                }}>
                    {socio.nroSocio}
                </div>

                {/* Nombre del Socio - Ajustado para nombres largos */}
                <div style={{ width: '100%', textAlign: 'center', margin: '10px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        color: darkText,
                        textTransform: 'uppercase',
                        lineHeight: '1.1',
                        fontFamily: 'Arial Black, sans-serif',
                        wordWrap: 'break-word',
                        width: '100%',
                        maxHeight: '60px',
                        overflow: 'hidden'
                    }}>
                        {socio.nombreCompleto}
                    </div>
                </div>

                {/* Status Button (Verde/Amarillo) - Posicionamiento final */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <div style={{
                        width: '90%',
                        backgroundColor: pillBg,
                        padding: '12px 0',
                        borderRadius: '100px',
                        border: `2px solid ${pillShadow}`,
                        boxShadow: `0 6px 0 ${pillShadow}`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: '1000',
                            color: pillTextColor,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            fontFamily: 'Arial Black, sans-serif',
                            lineHeight: '1'
                        }}>
                            {votingStatus}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocioCarnet;
