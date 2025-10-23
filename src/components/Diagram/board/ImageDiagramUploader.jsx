import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { processDiagramImage, validateImageSize, validateImageType } from '../../../services/imageProcessor';
import { mapRelationshipType } from '../../../utils/voiceCommandHelpers';

ImageDiagramUploader.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDiagramProcessed: PropTypes.func.isRequired,
};

export default function ImageDiagramUploader({ isActive, onClose, onDiagramProcessed }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de imagen
    if (!validateImageType(file)) {
      setError('Tipo de archivo no válido. Usa JPG, PNG, GIF o WEBP.');
      return;
    }

    // Validar tamaño (20MB máximo para OpenAI)
    if (!validateImageSize(file)) {
      setError('La imagen es demasiado grande. Máximo 20MB.');
      return;
    }

    setError(null);
    setSelectedImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Procesar la imagen
  const handleProcessImage = async () => {
    if (!selectedImage) {
      setError('Por favor selecciona una imagen primero.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🖼️ Iniciando procesamiento de imagen...');
      const diagramData = await processDiagramImage(selectedImage);

      console.log('📊 Datos extraídos:', diagramData);

      // Mapear tipos de relaciones a símbolos PlantUML
      const mappedRelationships = diagramData.relaciones.map(rel => ({
        from: rel.desde,
        to: rel.hacia,
        type: mapRelationshipType(rel.tipo), // Convierte "composicion" → "*--", etc.
        name: rel.nombre || '',
        class1Multiplicity: rel.multiplicidad1 || '',
        class2Multiplicity: rel.multiplicidad2 || '',
      }));

      // Preparar datos en el formato del sistema
      const processedData = {
        classes: diagramData.clases.map(cls => ({
          name: cls.nombre,
          attributes: cls.atributos || [],
        })),
        relationships: mappedRelationships,
        associations: diagramData.asociaciones.map(assoc => ({
          class1: assoc.clase1,
          class2: assoc.clase2,
          associationClass: assoc.claseIntermedia,
        })),
      };

      console.log('✅ Datos procesados para el sistema:', processedData);

      setResult({
        message: diagramData.mensaje,
        confidence: diagramData.confianza,
        data: processedData,
      });

      // Callback con los datos procesados
      onDiagramProcessed(processedData);

    } catch (err) {
      console.error('❌ Error al procesar imagen:', err);
      setError(err.message || 'Error al procesar la imagen. Intenta con otra imagen.');
    } finally {
      setProcessing(false);
    }
  };

  // Reiniciar
  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cerrar y limpiar
  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            🖼️ Importar Diagrama desde Imagen
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Sube una imagen de un diagrama de clases UML (puede ser dibujado a mano)</li>
              <li>Formatos soportados: JPG, PNG, GIF, WEBP (máximo 20MB)</li>
              <li>Asegúrate de que la imagen sea clara y legible</li>
              <li>La IA extraerá clases, atributos, relaciones y multiplicidades</li>
            </ul>
          </div>

          {/* Input de archivo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Seleccionar imagen del diagrama:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={processing}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Preview de la imagen */}
          {imagePreview && (
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Vista previa:</h3>
              <img
                src={imagePreview}
                alt="Preview del diagrama"
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
              />
              <div className="mt-2 text-sm text-gray-600">
                <strong>Archivo:</strong> {selectedImage?.name} ({(selectedImage?.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">❌ Error:</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Resultado del procesamiento */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-green-800 font-semibold">✅ {result.message}</p>
              <p className="text-sm text-green-700">
                <strong>Confianza:</strong> {result.confidence}
              </p>
              <p className="text-sm text-green-700">
                <strong>Clases encontradas:</strong> {result.data.classes.length}
              </p>
              <p className="text-sm text-green-700">
                <strong>Relaciones encontradas:</strong> {result.data.relationships.length}
              </p>
              {result.data.associations.length > 0 && (
                <p className="text-sm text-green-700">
                  <strong>Asociaciones encontradas:</strong> {result.data.associations.length}
                </p>
              )}
              <p className="text-xs text-green-600 mt-2">
                El diagrama ha sido cargado en el editor. Puedes cerrarlo y ver los resultados.
              </p>
            </div>
          )}

          {/* Estado de procesamiento */}
          {processing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                <div>
                  <p className="text-yellow-800 font-semibold">⏳ Procesando imagen...</p>
                  <p className="text-sm text-yellow-700">
                    La IA está analizando el diagrama. Esto puede tardar unos segundos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          {selectedImage && !processing && !result && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Limpiar
            </button>
          )}
          
          {result && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Procesar otra imagen
            </button>
          )}

          {selectedImage && !processing && !result && (
            <button
              onClick={handleProcessImage}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              🚀 Procesar Diagrama
            </button>
          )}

          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

