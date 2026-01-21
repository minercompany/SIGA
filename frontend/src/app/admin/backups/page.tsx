'use client';

import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext'; // Comentado temporalmente
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDatabase, FiClock, FiDownload, FiRefreshCw,
  FiLock, FiUnlock, FiAlertTriangle, FiCheck,
  FiSettings, FiArchive, FiTrash2, FiArrowLeft, FiRotateCcw
} from 'react-icons/fi';

interface ConfiguracionBackup {
  backupAutomaticoActivo: boolean;
  frecuenciaMinutos: number;
  retencionMaxima: number;
  ultimoBackup: string | null;
}

interface BackupHistorial {
  id: number;
  nombreArchivo: string;
  tamanoBytes: number;
  tamanoFormateado: string;
  fechaCreacion: string;
  tipo: 'AUTOMATICO' | 'MANUAL' | 'PRE_RESTAURACION';
  creadoPor: string;
  disponible: boolean;
}

export default function BackupsPage() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null; const user = { rol: "SUPER_ADMIN" }; // Temporal fix
  const [config, setConfig] = useState<ConfiguracionBackup | null>(null);
  const [historial, setHistorial] = useState<BackupHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [creandoBackup, setCreandoBackup] = useState(false);
  const [restaurando, setRestaurando] = useState<number | null>(null);

  // Modal de código
  const [mostrarModalCodigo, setMostrarModalCodigo] = useState(false);
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState('');

  // Modal de confirmación restauración
  const [backupARestaurar, setBackupARestaurar] = useState<BackupHistorial | null>(null);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');

  // Undo info
  const [undoInfo, setUndoInfo] = useState<{ disponible: boolean, backup?: any } | null>(null);
  const [deshaciendo, setDeshaciendo] = useState(false);

  // Mensajes
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

  useEffect(() => {
    if (user?.rol !== 'SUPER_ADMIN') {
      window.location.href = '/dashboard';
      return;
    }
    // No cargar nada hasta que se verifique el código
    setMostrarModalCodigo(true);
  }, []);

  const cargarUndoInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/backups/undo-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUndoInfo(data);
      }
    } catch (error) {
      console.error('Error al cargar info de undo:', error);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/backups/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarConfiguracion = async (nuevoConfig: Partial<ConfiguracionBackup>) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/backups/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoConfig)
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        mostrarMensaje('success', 'Configuración actualizada');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al actualizar configuración');
    }
  };

  const verificarCodigo = async () => {
    try {
      setErrorCodigo('');
      const response = await fetch(`${API_URL}/api/admin/backups/verificar-codigo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: codigoAcceso })
      });
      const data = await response.json();
      if (data.valido) {
        setCodigoVerificado(true);
        setMostrarModalCodigo(false);
        cargarConfiguracion();
        cargarHistorial();
        cargarUndoInfo();
      } else {
        setErrorCodigo('Código incorrecto');
      }
    } catch (error) {
      setErrorCodigo('Error al verificar código');
    }
  };

  const cargarHistorial = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/backups/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistorial(data);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const crearBackupManual = async () => {
    try {
      setCreandoBackup(true);
      const response = await fetch(`${API_URL}/api/admin/backups/crear`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        mostrarMensaje('success', 'Backup creado exitosamente');
        cargarConfiguracion();
        cargarUndoInfo(); // Recargar undo por si acaso
        if (codigoVerificado) cargarHistorial();
      } else {
        const error = await response.json();
        const errorMsg = error.error || 'Error al crear backup';
        // UX Improvement: Friendly error messages
        if (errorMsg.includes('Permission denied') || errorMsg.includes('AccessDenied')) {
          mostrarMensaje('error', 'Error de permisos: No se puede escribir en el directorio de backups.');
        } else {
          mostrarMensaje('error', errorMsg);
        }
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al crear backup');
    } finally {
      setCreandoBackup(false);
    }
  };

  const deshacerRestauracion = async () => {
    if (!confirm('¿Estás seguro de que quieres volver al estado anterior? Se perderán los cambios realizados desde la última restauración.')) return;

    try {
      setDeshaciendo(true);
      const response = await fetch(`${API_URL}/api/admin/backups/undo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        mostrarMensaje('success', 'Se ha deshecho la restauración correctamente.');
        cargarHistorial();
        cargarUndoInfo();
      } else {
        const error = await response.json();
        mostrarMensaje('error', error.error || 'Error al deshacer restauración');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al deshacer restauración');
    } finally {
      setDeshaciendo(false);
    }
  };

  const confirmarRestauracion = async () => {
    if (confirmacionTexto !== 'RESTAURAR' || !backupARestaurar) return;

    try {
      setRestaurando(backupARestaurar.id);
      const response = await fetch(`${API_URL}/api/admin/backups/restaurar/${backupARestaurar.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmacion: 'RESTAURAR' })
      });

      if (response.ok) {
        mostrarMensaje('success', 'Backup restaurado exitosamente. Se recomienda recargar la página.');
        setBackupARestaurar(null);
        setBackupARestaurar(null);
        setConfirmacionTexto('');
        cargarHistorial();
        cargarUndoInfo(); // Actualizar info de undo
      } else {
        const error = await response.json();
        mostrarMensaje('error', error.error || 'Error al restaurar backup');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al restaurar backup');
    } finally {
      setRestaurando(null);
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PY', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (user?.rol !== 'SUPER_ADMIN') {
    return null;
  }

  if (loading && codigoVerificado) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Mostrar pantalla de acceso si no se ha verificado el código
  if (!codigoVerificado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Backups y Recuperación</h1>
            <p className="text-gray-500 mt-2">Ingrese el código de seguridad para acceder</p>
          </div>

          <input
            type="password"
            value={codigoAcceso}
            onChange={(e) => setCodigoAcceso(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verificarCodigo()}
            placeholder="••••••••••••"
            className="w-full p-4 text-center text-2xl tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
            autoFocus
          />

          {errorCodigo && (
            <p className="text-red-500 text-sm text-center mb-4">{errorCodigo}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={verificarCodigo}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              Acceder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => router.back()}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-gray-900"
              title="Volver atrás"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div className="p-3 bg-green-100 rounded-xl">
              <FiDatabase className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Backups y Recuperación</h1>
              <p className="text-gray-500">Gestiona los respaldos del sistema de forma segura</p>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <AnimatePresence>
          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl flex items-center gap-3 ${mensaje.tipo === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
                }`}
            >
              {mensaje.tipo === 'success' ? <FiCheck /> : <FiAlertTriangle />}
              {mensaje.texto}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel de UNDO / Retorno Seguro */}
        {undoInfo?.disponible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <FiRotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900">Restauración Segura Disponible</h3>
                <p className="text-sm text-indigo-700">
                  ¿Algo salió mal? Puedes volver al estado anterior ({undoInfo.backup && formatearFecha(undoInfo.backup.fechaCreacion)}).
                </p>
              </div>
            </div>
            <button
              onClick={deshacerRestauracion}
              disabled={deshaciendo}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {deshaciendo ? 'Revirtiendo...' : 'Deshacer Cambios'}
            </button>
          </motion.div>
        )}

        {/* Configuración de Backup Automático */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiClock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Backup Automático</h2>
            </div>
            <button
              onClick={() => actualizarConfiguracion({
                backupAutomaticoActivo: !config?.backupAutomaticoActivo
              })}
              className={`relative w-14 h-7 rounded-full transition-colors ${config?.backupAutomaticoActivo ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${config?.backupAutomaticoActivo ? 'translate-x-8' : 'translate-x-1'
                }`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Frecuencia</label>
              <select
                value={config?.frecuenciaMinutos || 60}
                onChange={(e) => actualizarConfiguracion({ frecuenciaMinutos: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={60}>Cada hora</option>
                <option value={360}>Cada 6 horas</option>
                <option value={720}>Cada 12 horas</option>
                <option value={1440}>Diario</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Retención</label>
              <select
                value={config?.retencionMaxima || 24}
                onChange={(e) => actualizarConfiguracion({ retencionMaxima: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={12}>Últimos 12 backups</option>
                <option value={24}>Últimos 24 backups</option>
                <option value={48}>Últimos 48 backups</option>
                <option value={72}>Últimos 72 backups</option>
              </select>
            </div>
          </div>

          {config?.ultimoBackup && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              <FiCheck className="inline mr-2 text-green-500" />
              Último backup: {formatearFecha(config.ultimoBackup)}
            </div>
          )}
        </div>

        {/* Backup Manual */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <FiDownload className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Backup Manual</h2>
          </div>
          <button
            onClick={crearBackupManual}
            disabled={creandoBackup}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creandoBackup ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Creando backup...
              </>
            ) : (
              <>
                <FiDatabase />
                Crear Backup Ahora
              </>
            )}
          </button>
        </div>

        {/* Historial de Backups */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiArchive className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Historial de Backups</h2>
            </div>
            {!codigoVerificado ? (
              <button
                onClick={() => setMostrarModalCodigo(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors"
              >
                <FiLock />
                Ingresar
              </button>
            ) : (
              <button
                onClick={cargarHistorial}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors"
              >
                <FiRefreshCw />
                Actualizar
              </button>
            )}
          </div>

          {!codigoVerificado ? (
            <div className="text-center py-8 text-gray-500">
              <FiLock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Ingrese el código de seguridad para ver el historial</p>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiDatabase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay backups disponibles</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historial.map((backup) => (
                <motion.div
                  key={backup.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">
                        {formatearFecha(backup.fechaCreacion)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>💾 {backup.tamanoFormateado}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${backup.tipo === 'AUTOMATICO' ? 'bg-blue-100 text-blue-700' :
                          backup.tipo === 'MANUAL' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {backup.tipo === 'AUTOMATICO' ? '⏱️ Auto' :
                            backup.tipo === 'MANUAL' ? '👤 Manual' : '🔒 Pre-restauración'}
                        </span>
                        {backup.creadoPor && <span>por {backup.creadoPor}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setBackupARestaurar(backup)}
                      disabled={restaurando === backup.id}
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {restaurando === backup.id ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : (
                        <>🔄 Restaurar</>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Código */}
      <AnimatePresence>
        {mostrarModalCodigo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setMostrarModalCodigo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiLock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Acceso Restringido</h3>
                <p className="text-gray-500 text-sm mt-1">Ingrese el código de seguridad</p>
              </div>

              <input
                type="password"
                value={codigoAcceso}
                onChange={(e) => setCodigoAcceso(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verificarCodigo()}
                placeholder="••••••"
                className="w-full p-4 text-center text-2xl tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />

              {errorCodigo && (
                <p className="text-red-500 text-sm text-center mt-2">{errorCodigo}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setMostrarModalCodigo(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={verificarCodigo}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                  Verificar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Restauración */}
      <AnimatePresence>
        {backupARestaurar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setBackupARestaurar(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Confirmar Restauración</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {formatearFecha(backupARestaurar.fechaCreacion)}
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-orange-800 text-sm">
                  <strong>⚠️ IMPORTANTE:</strong>
                </p>
                <ul className="text-orange-700 text-sm mt-2 space-y-1">
                  <li>• Se reemplazarán TODOS los datos actuales</li>
                  <li>• Los cambios después de esta fecha se perderán</li>
                  <li>• Se creará un backup de seguridad antes</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">
                  Para confirmar, escriba <strong>RESTAURAR</strong>:
                </label>
                <input
                  type="text"
                  value={confirmacionTexto}
                  onChange={(e) => setConfirmacionTexto(e.target.value.toUpperCase())}
                  placeholder="RESTAURAR"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBackupARestaurar(null);
                    setConfirmacionTexto('');
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRestauracion}
                  disabled={confirmacionTexto !== 'RESTAURAR' || restaurando !== null}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restaurando ? 'Restaurando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
