import React, { useCallback, useState } from "react";
import { useVoiceCommands } from "../../hooks/useVoiceCommands";
import PropTypes from "prop-types";
VoiceCommandListener.propTypes = {
  onCommand: PropTypes.func, // <- aquí defines que debe ser función
};

// Componente para escuchar comandos de voz y mostrar feedback
export default function VoiceCommandListener({ onCommand = () => {} }) {
  const [lastCommand, setLastCommand] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleCommand = useCallback((cmd) => {
    setLastCommand(cmd);
    setProcessing(false); // Comando procesado
    if (onCommand) onCommand(cmd);
  }, [onCommand]);

  const { listening, transcript, startListening, stopListening } = useVoiceCommands({ 
    onCommand: handleCommand,
    onProcessingStart: () => setProcessing(true)
  });

  // Estado visual del micrófono
  const getButtonColor = () => {
    if (processing) return "#ff9800"; // Naranja cuando procesa
    if (listening) return "#f44336";  // Rojo cuando escucha
    return "#4caf50";                 // Verde cuando está listo
  };

  const getButtonText = () => {
    if (processing) return "⏳ Procesando...";
    if (listening) return "🎤 Escuchando... (Click para terminar)";
    return "🎙️ Hablar";
  };

  return (
    <div style={{ 
      position: "fixed", 
      bottom: 20, 
      right: 20, 
      zIndex: 1000, 
      background: "#fff", 
      border: "1px solid #ccc", 
      borderRadius: 8, 
      padding: 16, 
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      minWidth: 250
    }}>
      <button 
        onClick={listening ? stopListening : startListening} 
        disabled={processing}
        style={{ 
          fontSize: 14, 
          padding: "10px 16px", 
          borderRadius: 6, 
          background: getButtonColor(),
          color: "#fff", 
          border: "none",
          width: "100%",
          cursor: processing ? "not-allowed" : "pointer",
          opacity: processing ? 0.7 : 1
        }}
      >
        {getButtonText()}
      </button>
      
      {transcript && (
        <div style={{ marginTop: 8, minHeight: 24, fontSize: 12 }}>
          <strong>📝 Reconocido:</strong> {transcript}
        </div>
      )}
      
      {lastCommand && (
        <div style={{ marginTop: 8, color: "#333", fontSize: 11 }}>
          <strong>✅ Comando:</strong> {lastCommand.acción}
        </div>
      )}
    </div>
  );
}
