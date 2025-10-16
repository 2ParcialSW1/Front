import { useEffect, useRef, useState, useCallback } from "react";
import { processCommandWithAI } from "../services/commandProcessor";

export function useVoiceCommands({ onCommand = () => {}, onProcessingStart = () => {} }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Función para crear un nuevo reconocimiento
  const createRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Tu navegador no soporta reconocimiento de voz");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es";
    recognition.interimResults = true;
    recognition.continuous = false; // Cambio a false para mejor control
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      if (isProcessingRef.current) return; // Evitar procesamiento múltiple

      const lastResult = event.results[event.results.length - 1];
      
      if (lastResult.isFinal && !isProcessingRef.current) {
        isProcessingRef.current = true;
        const text = lastResult[0].transcript.trim();
        setTranscript(text);
        
        console.log("🎤 Reconocido:", text);
        console.log("⏳ Procesando comando...");
        
        // Detener inmediatamente
        try {
          recognition.stop();
        } catch (e) {
          console.log("Error deteniendo reconocimiento:", e);
        }
        
        // Notificar que está procesando
        onProcessingStart();
        
        try {
          const parsedCommand = await processCommandWithAI(text);
          console.log("🤖 IA respondió:", parsedCommand);
          console.log("🔧 Parámetros completos:", JSON.stringify(parsedCommand, null, 2));
          
          if (parsedCommand && onCommand) {
            console.log("✅ Ejecutando comando:", parsedCommand);
            onCommand(parsedCommand);
          } else {
            console.warn("❌ Comando inválido o función onCommand no definida");
          }
        } catch (error) {
          console.error("Error al procesar el comando de voz:", error);
        }
        
        // Resetear estados
        setTimeout(() => {
          setListening(false);
          isProcessingRef.current = false;
          console.log("🔄 Listo para nuevo comando");
        }, 500);
      } else if (!lastResult.isFinal) {
        // Mostrar transcripción temporal
        const text = lastResult[0].transcript.trim();
        setTranscript(text);
        console.log("🔄 Escuchando:", text);
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
      setListening(false);
      isProcessingRef.current = false;
    };

    recognition.onend = () => {
      console.log("🔚 Reconocimiento terminado");
      if (!isProcessingRef.current) {
        setListening(false);
      }
    };

    return recognition;
  }, [onCommand, onProcessingStart]);

  useEffect(() => {
    // Crear el primer reconocimiento
    const recognition = createRecognition();
    recognitionRef.current = recognition;
  }, [createRecognition]);

  const startListening = () => {
    if (isProcessingRef.current) {
      console.log("⏸️ Procesando comando anterior, espera...");
      return;
    }

    console.log("🎙️ Iniciando nuevo reconocimiento...");
    
    // Crear un reconocimiento completamente nuevo cada vez
    const newRecognition = createRecognition();
    if (!newRecognition) return;
    
    recognitionRef.current = newRecognition;
    
    try {
      setTranscript("");
      setListening(true);
      isProcessingRef.current = false;
      newRecognition.start();
      console.log("✅ Reconocimiento iniciado");
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
      setListening(false);
      isProcessingRef.current = false;
    }
  };

  return { listening, transcript, startListening, stopListening };
}
