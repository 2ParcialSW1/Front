import { useState, useEffect, useRef } from 'react';
import { processCommandWithAI } from '../../services/commandProcessor';

export default function DiagramGenerationListener({ 
  isActive, 
  onDomainDetected, 
  onClose 
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (isActive && !listening && !processing) {
      startListening();
    }
  }, [isActive]);

  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      console.log('🎙️ Reconocimiento iniciado para generación de diagrama');
      setListening(true);
    };

    recognition.onresult = async (event) => {
      const lastResult = event.results[event.results.length - 1];
      
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim();
        setTranscript(text);
        
        console.log("🎤 Dominio reconocido:", text);
        console.log("⏳ Procesando comando de generación...");
        
        setProcessing(true);
        
        try {
          const parsedCommand = await processCommandWithAI(text);
          console.log("🤖 IA respondió:", parsedCommand);
          
          if (parsedCommand && (parsedCommand.action === "generar_diagrama" || parsedCommand.acción === "generar_diagrama")) {
            const domain = parsedCommand.dominio || parsedCommand.domain || parsedCommand.parámetros?.dominio;
            if (domain) {
              console.log(`✅ Dominio detectado: ${domain}`);
              onDomainDetected(domain);
              onClose();
            } else {
              console.warn("❌ No se detectó el dominio en el comando");
              setTranscript("No se detectó el dominio. Intenta decir: 'generar diagrama para [tu dominio]'");
            }
          } else {
            console.warn("❌ Comando no reconocido para generación de diagrama");
            console.log("Comando recibido:", parsedCommand);
            setTranscript("Comando no reconocido. Intenta decir: 'generar diagrama para [tu dominio]'");
          }
        } catch (error) {
          console.error("Error al procesar el comando:", error);
          setTranscript("Error al procesar. Intenta de nuevo.");
        }
        
        setTimeout(() => {
          setProcessing(false);
          setTranscript('');
        }, 2000);
      } else {
        // Mostrar transcripción temporal
        const text = lastResult[0].transcript.trim();
        setTranscript(text);
      }
    };

    recognition.onerror = (event) => {
      console.error('Error en reconocimiento:', event.error);
      setListening(false);
      setProcessing(false);
    };

    recognition.onend = () => {
      console.log('🔚 Reconocimiento terminado');
      setListening(false);
    };

    return recognition;
  };

  const startListening = () => {
    if (isProcessingRef.current) {
      console.log("⏸️ Procesando comando anterior, espera...");
      return;
    }

    console.log("🎙️ Iniciando reconocimiento para generación de diagrama...");
    
    const newRecognition = createRecognition();
    if (!newRecognition) return;
    
    recognitionRef.current = newRecognition;
    
    try {
      setTranscript("");
      setListening(true);
      isProcessingRef.current = false;
      newRecognition.start();
    } catch (error) {
      console.error("Error al iniciar reconocimiento:", error);
      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("🛑 Reconocimiento detenido manualmente");
      } catch (error) {
        console.error("Error al detener reconocimiento:", error);
      }
    }
    setListening(false);
    setProcessing(false);
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">🎙️ Generar Diagrama Base</h3>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Di el dominio para el que quieres generar el diagrama base:
          </p>
          <p className="text-sm text-gray-500 italic">
            Ejemplo: "generar diagrama para sistema de e-commerce"
          </p>
        </div>

        {/* Estado del micrófono */}
        <div className="mb-4 p-3 rounded-lg bg-gray-100">
          {processing ? (
            <div className="flex items-center text-orange-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
              Procesando...
            </div>
          ) : listening ? (
            <div className="flex items-center text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Escuchando... Habla ahora
            </div>
          ) : (
            <div className="flex items-center text-gray-500">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              Iniciando micrófono...
            </div>
          )}
        </div>

        {/* Transcripción */}
        {transcript && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Reconocido:</strong> {transcript}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Detener
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
