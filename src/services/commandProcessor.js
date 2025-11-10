export async function processCommandWithAI(commandText) {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
      if (!apiKey) {
        throw new Error(
          "La clave de API no está definida. Asegúrate de configurar VITE_OPENAI_API_KEY en tu archivo .env."
        );
      }
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // modelo válido
          messages: [
            {
              role: "system",
              content:
                `Eres un parser de comandos de voz para un editor de diagramas UML.
                 Devuelve únicamente un objeto JSON válido, sin texto adicional ni bloques de código.
                 \n\nREGLAS CRÍTICAS:\n1. ATRIBUTOS: 'agregar atributo X a Y' o '
                 'agregar atributo X a tabla Y' → SIEMPRE usar acción 'agregar_atributo'\n2. 
                 RELACIONES SIMPLES: Si dice 'relación X' donde X es (generalizacion, especializacion, composicion, agregacion, dependencia, etc) → usar acción 'agregar_relacion'
                 \n3. ASOCIACIONES CON MULTIPLICIDAD:\n   - 'asociación entre A y B' SIN multiplicidad → agregar parámetro 'falta_multiplicidad: true'\n   - 'asociación entre A y B de uno a muchos/muchos a uno/uno a uno/ y todas las otras conbinaciones' → acción 'agregar_relacion' con multiplicidades\n   - 'asociación entre A y B de muchos a muchos' → acción 'agregar_asociacion' con 'clase_intermedia_nombres' combinar A+B\n   - 'asociación entre A y B con clase intermedia C' → acción 'agregar_asociacion' con 'clase_intermedia_nombre: C'\n4. NUNCA confundir 'agregar atributo' con 'limpiar_relaciones'\n5. NUNCA inferir multiplicidad si no está especificada
                 \n6. ELIMINAR RELACIÓN: 'eliminar relación entre A y B' → acción 'eliminar_relacion' con desde/hacia
                 \n7. LIMPIAR RELACIONES: 'limpiar relaciones' (sin especificar tablas) → acción 'limpiar_relaciones'
                 \n8. NUNCA confundir 'eliminar relación entre X y Y' con 'limpiar relaciones'
                 \n\nLos comandos disponibles son: agregar_tabla, agregar_atributo, eliminar_atributo, 
                 agregar_relacion, eliminar_relacion, agregar_asociacion, eliminar_asociacion, eliminar_tabla, seleccionar, 
                 exportar_diagrama, restaurar_diagrama, limpiar_relaciones, generar_diagrama.`,
            },
            {
              role: "user",
              content: `Interpreta el siguiente comando de voz: "${commandText}" y devuélvelo como un JSON con la estructura: {"acción": "tipo_comando", "parámetros": {"tabla": "nombre", "atributo": "nombre", "desde": "tabla_origen", "hacia": "tabla_destino", "tipo": "tipo_relacion", "nombre": "nombre_relacion", "multiplicidad1": "valor", "multiplicidad2": "valor", "clase_asociacion": "nombre", "falta_multiplicidad": boolean, "clase_intermedia_nombres": boolean, "clase_intermedia_nombre": "nombre"}}. 

Multiplicidades comunes: "1", "0..1", "1..*", "0..*", "*", "1..1", "0..1", "1..n", "m..n"

IMPORTANTE para multiplicidades en relaciones:
- "de muchos a uno" → multiplicidad1: "*", multiplicidad2: "1"
- "de uno a muchos" → multiplicidad1: "1", multiplicidad2: "*"
- "de uno a uno" → multiplicidad1: "1", multiplicidad2: "1"
- "de muchos a muchos" → multiplicidad1: "*", multiplicidad2: "*"

Ejemplos de comandos:

RELACIONES SIMPLES (acción: agregar_relacion):
- "Agregar relación generalizacion entre Usuario y Cliente"
- "Agregar relación composicion entre Orden y Item"
- "Agregar relación herencia entre Animal y Perro"

ASOCIACIONES CON MULTIPLICIDAD (acción: agregar_relacion o agregar_asociacion según caso):
- "Agregar asociación entre Usuario y Producto" 
  → {"acción": "agregar_relacion", "parámetros": {"desde": "Usuario", "hacia": "Producto", "tipo": "asociacion", "falta_multiplicidad": true}}
- "Agregar asociación entre Usuario y Producto de uno a muchos"
  → {"acción": "agregar_relacion", "parámetros": {"desde": "Usuario", "hacia": "Producto", "tipo": "asociacion", "multiplicidad1": "1", "multiplicidad2": "*"}}
- "Agregar asociación entre Usuario y Producto de muchos a muchos"
  → {"acción": "agregar_asociacion", "parámetros": {"desde": "Usuario", "hacia": "Producto", "clase_intermedia_nombres": true}}
- "Agregar asociación entre Usuario y Producto con clase intermedia Participacion"
  → {"acción": "agregar_asociacion", "parámetros": {"desde": "Usuario", "hacia": "Producto", "clase_intermedia_nombre": "Participacion"}}

GESTIÓN DE ATRIBUTOS:
- "Agregar atributo nombre a Usuario" (acción: agregar_atributo, parámetros: {"tabla": "Usuario", "atributo": "nombre"})
- "Agregar atributo título a tabla proyectos" (acción: agregar_atributo, parámetros: {"tabla": "proyectos", "atributo": "título"})
- "Eliminar atributo precio de Producto" (acción: eliminar_atributo, parámetros: {"tabla": "Producto", "atributo": "precio"})
- "Quitar atributo email de Usuario" (acción: eliminar_atributo, parámetros: {"tabla": "Usuario", "atributo": "email"})

ELIMINAR RELACIONES:
- "Eliminar relación entre Usuario y Producto" (acción: eliminar_relacion, parámetros: {"desde": "Usuario", "hacia": "Producto"})
- "Quitar relación entre tabla melodía y modo género" (acción: eliminar_relacion, parámetros: {"desde": "melodía", "hacia": "modo género"})

ELIMINAR ASOCIACIONES:
- "Eliminar asociación entre Usuario y MétodoDePago" (acción: eliminar_asociacion, parámetros: {"desde": "Usuario", "hacia": "MétodoDePago"})
- "Quitar asociación entre usuarios y método de pago" (acción: eliminar_asociacion, parámetros: {"desde": "usuarios", "hacia": "método de pago"})
- ⚠️ IMPORTANTE: Si el usuario dice "asociación" → usar SIEMPRE acción "eliminar_asociacion"

DIFERENCIA IMPORTANTE:
- "Limpiar relaciones" SIN especificar tablas → acción: limpiar_relaciones (elimina TODAS las relaciones)
- "Eliminar relación entre A y B" → acción: eliminar_relacion (elimina UNA relación específica)
- "Eliminar asociación entre A y B" → acción: eliminar_asociacion (elimina UNA asociación + su clase intermedia)

UTILIDADES:
- "Limpiar relaciones" (acción: limpiar_relaciones)

GENERACIÓN DE DIAGRAMA BASE:
- "generar diagrama para sistema de e-commerce" (acción: generar_diagrama, parámetros: {"dominio": "sistema de e-commerce"})
- "crear diagrama base para biblioteca" (acción: generar_diagrama, parámetros: {"dominio": "biblioteca"})
- "diseñar diagrama para hospital" (acción: generar_diagrama, parámetros: {"dominio": "hospital"})
- "generar diagrama de clases para escuela" (acción: generar_diagrama, parámetros: {"dominio": "escuela"})

Responde únicamente con el JSON.`,
            },
          ],
          max_tokens: 150,
          temperature: 0.2,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }
  
      const data = await response.json();
      let raw = data.choices[0].message.content.trim();
  
      // limpiar markdown si lo devuelve con ```json ... ```
      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  
      // Intentar extraer solo el JSON válido
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("La IA no devolvió JSON válido:", raw);
        return null;
      }

      let command = JSON.parse(jsonMatch[0]);

      // 🔹 Normalización del nombre de la tabla
      if (command.tabla) {
        command.tabla =
          command.tabla.charAt(0).toUpperCase() + command.tabla.slice(1);
      }
  
      return command;
    } catch (error) {
      console.error("Error al procesar el comando con IA:", error);
      return null;
    }

   
  }
  
  export async function generateDiagramForDomain(domain) {
    console.log(`🚀 generateDiagramForDomain iniciado con dominio: "${domain}"`);
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log(`🔑 API Key presente: ${apiKey ? 'Sí' : 'No'}`);
  
      if (!apiKey) {
        throw new Error(
          "La clave de API no está definida. Asegúrate de configurar VITE_OPENAI_API_KEY en tu archivo .env."
        );
      }
  
      console.log(`🌐 Enviando petición a OpenAI API...`);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // modelo válido
          messages: [
            {
              role: "user",
              content: `Genera un diagrama UML para sistema de ${domain}. Devuelve SOLO este JSON:

{"clases":[{"nombre":"Clase1","atributos":["attr1","attr2"]}],"relaciones":[{"desde":"Clase1","hacia":"Clase2","tipo":"asociacion","multiplicidad1":"1","multiplicidad2":"*"}],"asociaciones":[]}

Incluye 3-4 clases con 2-3 atributos cada una. Solo relaciones simples.`,
            },
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });
      
      console.log(`📡 Respuesta recibida. Status: ${response.status}`);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en la API: ${response.status} - ${response.statusText}`);
        console.error(`📄 Respuesta del servidor:`, errorText);
        throw new Error(`Error en la API: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log(`📊 Datos recibidos de OpenAI:`, data);
      
      let raw = data.choices[0].message.content.trim();
      console.log(`📝 Contenido crudo de la IA:`, raw);
  
      // limpiar markdown
      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      console.log(`🧹 Contenido limpio:`, raw);
  
      // Extraer solo JSON válido
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`❌ No se encontró JSON válido en:`, raw);
        throw new Error("La IA no devolvió un JSON válido");
      }
  
      let diagram = JSON.parse(jsonMatch[0]);
      console.log(`✅ JSON parseado exitosamente:`, diagram);

    // 🔹 Normalizar nombres de clases/tablas
    if (diagram.clases && Array.isArray(diagram.clases)) {
      diagram.clases = diagram.clases.map((clase) => ({
        ...clase,
        nombre:
          clase.nombre.charAt(0).toUpperCase() + clase.nombre.slice(1),
      }));
    }

      return diagram;
    } catch (error) {
      console.error("Error al generar el diagrama con IA:", error);
      console.error("Detalles del error:", error.message);
      console.error("Stack trace:", error.stack);
      return null;
    }
  }
  