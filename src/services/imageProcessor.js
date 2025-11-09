/**
 * Servicio para procesar imágenes de diagramas de clases usando OpenAI Vision
 */

/**
 * Procesa una imagen de diagrama de clases y extrae la información usando OpenAI Vision
 * @param {File} imageFile - Archivo de imagen a procesar
 * @returns {Promise<Object>} - Objeto con clases, relaciones y asociaciones extraídas
 */
export async function processDiagramImage(imageFile) {
  try {
    console.log("🖼️ Procesando imagen de diagrama:", imageFile.name);
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        "La clave de API de OpenAI no está definida. Asegúrate de configurar VITE_OPENAI_API_KEY en tu archivo .env."
      );
    }

    // Verificar tipo de imagen
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(imageFile.type)) {
      throw new Error(`Tipo de imagen no válido: ${imageFile.type}. Usa JPG, PNG, GIF o WEBP.`);
    }

    // Convertir imagen a base64
    const base64Image = await convertImageToBase64(imageFile);
    
    console.log("📤 Enviando imagen a OpenAI Vision API...");

    // Llamada a OpenAI Vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Modelo con capacidad de visión
        messages: [
          {
            role: "system",
            content: `Eres un experto en análisis de diagramas UML de clases. Tu tarea es analizar imágenes de diagramas de clases (incluso dibujados a mano) y extraer su información de forma estructurada.

IMPORTANTE: Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin bloques de código markdown, sin explicaciones.

REGLAS DE ANÁLISIS:

1. VERIFICACIÓN INICIAL:
   - Confirma que es un diagrama de clases UML
   - Si no lo es, devuelve: {"valido": false, "mensaje": "No es un diagrama de clases UML"}

2. EXTRACCIÓN DE CLASES:
   - Identifica todas las clases (rectángulos con nombre)
   - Nombre de clase en PascalCase (primera letra mayúscula)
   - Sin espacios, sin acentos (ej: "Categoria" no "Categoría")
   - Atributos: SOLO nombres, sin visibilidad (+,-,#), sin tipos de datos
   - Métodos: OPCIONAL, lista simple de nombres

3. TIPOS DE RELACIONES (IMPORTANTE: SOLO devuelve relaciones que están EXPLÍCITAMENTE visibles en el diagrama):
   - NO inventes relaciones que no existan
   - "herencia" → triángulo o flecha cerrada apuntando a clase padre (solo si está clara)
   - "composicion" → rombo relleno/negro en un extremo (solo si está claro)
   - "agregacion" → rombo vacío/blanco en un extremo (solo si está claro)
   - "asociacion" → línea simple entre clases (si hay líneas entre clases)
   - "asociacion_directa" → línea con flecha abierta (→) (solo si hay flecha visible)
   - Si no puedes identificar claramente el tipo, usa "asociacion" por defecto

4. MULTIPLICIDADES (formato estándar):
   - "1" → uno
   - "*" → muchos/varios
   - "0..1" → cero o uno
   - "1..*" → uno o muchos
   - "0..*" → cero o muchos
   - Si no es legible, dejar vacío ""

5. ASOCIACIONES CON CLASE INTERMEDIA:
   - Si detectas una clase que conecta dos clases con relaciones especiales
   - Crear entrada en "asociaciones" con clase1, clase2, claseIntermedia

6. NORMALIZACIÓN:
   - Nombres en PascalCase: "usuario pedido" → "UsuarioPedido"
   - Sin acentos: "categoría" → "Categoria"
   - Sin espacios: "Nombre Completo" → "NombreCompleto"

FORMATO DE RESPUESTA JSON:
{
  "valido": true,
  "mensaje": "Diagrama procesado correctamente",
  "confianza": "alta|media|baja",
  "tipoImagen": "image/png",
  "clases": [
    {
      "nombre": "Usuario",
      "atributos": ["nombre", "email", "telefono"],
      "metodos": ["login", "logout"]
    }
  ],
  "relaciones": [
    {
      "desde": "Usuario",
      "hacia": "Pedido",
      "tipo": "asociacion",
      "multiplicidad1": "1",
      "multiplicidad2": "*",
      "nombre": ""
    }
  ],
  "asociaciones": [
    {
      "clase1": "Usuario",
      "clase2": "Proyecto",
      "claseIntermedia": "Participacion"
    }
  ]
}

Si la imagen está borrosa o no es clara:
- Prioriza: nombres de clases > atributos > relaciones > multiplicidades
- Indica "confianza": "baja" o "media"
- En el mensaje explica qué no se pudo detectar claramente

CRÍTICO: NO agregues relaciones de "dependencia", "realizacion" u otros tipos complejos si no están EXPLÍCITAMENTE visibles en el diagrama. Si hay dudas, omite la relación completamente o usa "asociacion" genérica. Es preferible tener menos relaciones que inventar relaciones que no existen.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza este diagrama de clases y extrae toda la información según las reglas especificadas. Devuelve SOLO el JSON, sin texto adicional."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                  detail: "high" // Alta resolución para mejor detección
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1, // Baja temperatura para respuestas más consistentes
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en OpenAI API: ${response.status} - ${response.statusText}`);
      console.error(`📄 Respuesta del servidor:`, errorText);
      throw new Error(`Error en la API de OpenAI: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Respuesta de OpenAI Vision:`, data);

    let raw = data.choices[0].message.content.trim();
    console.log(`📝 Contenido extraído:`, raw);

    // Limpiar markdown si lo devuelve con ```json ... ```
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    // Extraer JSON válido
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No se encontró JSON válido en la respuesta:`, raw);
      throw new Error("La IA no devolvió un JSON válido");
    }

    const diagramData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Diagrama parseado exitosamente:`, diagramData);

    // Validación básica
    if (!diagramData.valido) {
      throw new Error(diagramData.mensaje || "La imagen no contiene un diagrama de clases válido");
    }

    // Normalizar estructura para asegurar compatibilidad
    const normalizedData = {
      valido: diagramData.valido,
      mensaje: diagramData.mensaje || "Diagrama procesado",
      confianza: diagramData.confianza || "media",
      clases: diagramData.clases || [],
      relaciones: diagramData.relaciones || [],
      asociaciones: diagramData.asociaciones || []
    };

    console.log(`🎉 Procesamiento completado. Clases: ${normalizedData.clases.length}, Relaciones: ${normalizedData.relaciones.length}, Asociaciones: ${normalizedData.asociaciones.length}`);

    return normalizedData;

  } catch (error) {
    console.error("❌ Error al procesar la imagen:", error);
    throw error;
  }
}

/**
 * Convierte un archivo de imagen a base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - String base64 de la imagen
 */
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // Remover el prefijo "data:image/xxx;base64,"
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    
    reader.onerror = (error) => {
      reject(new Error(`Error al leer la imagen: ${error}`));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Valida el tamaño de la imagen (OpenAI tiene límite de 20MB)
 * @param {File} file - Archivo de imagen
 * @returns {boolean} - true si es válido
 */
export function validateImageSize(file) {
  const maxSizeInBytes = 20 * 1024 * 1024; // 20MB
  return file.size <= maxSizeInBytes;
}

/**
 * Valida el tipo de imagen
 * @param {File} file - Archivo de imagen
 * @returns {boolean} - true si es válido
 */
export function validateImageType(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

