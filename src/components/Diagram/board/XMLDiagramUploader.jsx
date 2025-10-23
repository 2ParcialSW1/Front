import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { readXMLFile } from '../../../utils/path-to-utils';
import { importXML } from './ImportFromXML';

XMLDiagramUploader.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDiagramProcessed: PropTypes.func.isRequired,
};

export default function XMLDiagramUploader({ isActive, onClose, onDiagramProcessed }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Manejar selección de archivo
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar extensión
    if (!file.name.endsWith('.xml')) {
      setError('El archivo debe ser un XML (.xml)');
      return;
    }

    // Validar tamaño (máximo 10MB para XML)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      setError('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Leer contenido para preview
    try {
      const content = await readXMLFile(file);
      setFileContent(content);
    } catch (err) {
      console.error('Error al leer el archivo:', err);
      setError('No se pudo leer el archivo XML. Verifica que sea un XML válido.');
    }
  };

  // Procesar el archivo XML
  const handleProcessXML = async () => {
    if (!selectedFile || !fileContent) {
      setError('Por favor selecciona un archivo XML primero.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('📄 Procesando archivo XML...');
      
      // Importar y parsear XML
      const { classes, relationships, associations } = importXML(fileContent);

      console.log('📊 Datos extraídos del XML:', { classes, relationships, associations });

      // Validar que se hayan extraído datos
      if (!classes || classes.length === 0) {
        throw new Error('No se encontraron clases en el archivo XML. Verifica el formato.');
      }

      // Preparar datos para el sistema
      const processedData = {
        classes: classes.map(cls => ({
          name: cls.name,
          attributes: cls.attributes || [],
        })),
        relationships: relationships || [],
        associations: associations || [],
      };

      console.log('✅ Datos procesados:', processedData);

      setResult({
        message: 'Diagrama importado correctamente desde XML',
        data: processedData,
      });

      // Callback con los datos procesados
      onDiagramProcessed(processedData);

    } catch (err) {
      console.error('❌ Error al procesar XML:', err);
      setError(err.message || 'Error al procesar el archivo XML. Verifica el formato.');
    } finally {
      setProcessing(false);
    }
  };

  // Reiniciar
  const handleReset = () => {
    setSelectedFile(null);
    setFileContent(null);
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

  // Obtener preview del XML (primeras líneas)
  const getXMLPreview = () => {
    if (!fileContent) return '';
    const lines = fileContent.split('\n').slice(0, 15); // Primeras 15 líneas
    return lines.join('\n');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            📄 Importar Diagrama desde XML
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
              <li>Sube un archivo XML de un diagrama de clases UML</li>
              <li>Compatible con archivos exportados desde Enterprise Architect</li>
              <li>El XML debe contener clases, atributos y relaciones</li>
              <li>Tamaño máximo: 10MB</li>
            </ul>
          </div>

          {/* Input de archivo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Seleccionar archivo XML:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileSelect}
              disabled={processing}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Preview del XML */}
          {fileContent && (
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Vista previa del XML:</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                <pre className="text-xs text-gray-700 font-mono max-h-48 overflow-y-auto">
                  {getXMLPreview()}
                  {fileContent.split('\n').length > 15 && '\n... (contenido truncado)'}
                </pre>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Archivo:</strong> {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(2)} KB)
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
                <strong>Clases importadas:</strong> {result.data.classes.length}
              </p>
              <p className="text-sm text-green-700">
                <strong>Relaciones importadas:</strong> {result.data.relationships.length}
              </p>
              {result.data.associations.length > 0 && (
                <p className="text-sm text-green-700">
                  <strong>Asociaciones importadas:</strong> {result.data.associations.length}
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
                  <p className="text-yellow-800 font-semibold">⏳ Procesando archivo XML...</p>
                  <p className="text-sm text-yellow-700">
                    Extrayendo clases, atributos y relaciones...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          {selectedFile && !processing && !result && (
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
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Importar otro archivo
            </button>
          )}

          {selectedFile && !processing && !result && (
            <button
              onClick={handleProcessXML}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              🚀 Importar Diagrama
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

