/**
 * Utilidades para generar y descargar PDFs de guías de ayuda
 */

/**
 * Genera y descarga un PDF con la guía completa de comandos por voz
 * para el editor UML colaborativo
 */
export const downloadVoiceCommandsPDF = () => {
    // Crear contenido de texto simple para el PDF
    const textContent = `
GUÍA DE COMANDOS POR VOZ - EDITOR UML

===============================================
GESTIÓN DE CLASES
===============================================

CREAR CLASE:
- agregar tabla Usuario
- agregar tabla Producto
- agregar tabla Cliente

SELECCIONAR CLASE:
- seleccionar Usuario
- seleccionar Producto
- seleccionar Cliente

ELIMINAR CLASE:
- eliminar tabla Usuario
- eliminar tabla Producto
- eliminar tabla Cliente

===============================================
GESTIÓN DE ATRIBUTOS
===============================================

AGREGAR ATRIBUTO (a clase seleccionada):
- agregar atributo nombre
- agregar atributo email
- agregar atributo precio

AGREGAR ATRIBUTO (a clase específica):
- agregar atributo email a tabla Usuario
- agregar atributo precio a tabla Producto
- agregar atributo telefono a tabla Cliente

ELIMINAR ATRIBUTO:
- eliminar atributo nombre de tabla Usuario
- eliminar atributo precio de tabla Producto
- eliminar atributo telefono de tabla Cliente

===============================================
RELACIONES
===============================================

HERENCIA:
- agregar relación de herencia de Estudiante a Persona
- agregar relación de herencia de Administrador a Usuario

COMPOSICIÓN:
- agregar relación de composición de Casa a Habitación
- agregar relación de composición de Pedido a DetallePedido

AGREGACIÓN:
- agregar relación de agregación de Departamento a Empleado
- agregar relación de agregación de Equipo a Jugador

ASOCIACIÓN (OBLIGATORIO especificar multiplicidad):
- agregar relación de Usuario a Pedido de uno a muchos
- agregar relación de Cliente a Factura de uno a muchos
- agregar relación de Estudiante a Curso de muchos a muchos

ELIMINAR RELACIÓN:
- eliminar relación entre Usuario y Pedido
- eliminar relación entre Cliente y Factura

===============================================
ASOCIACIONES
===============================================

CON CLASE INTERMEDIA ESPECÍFICA:
- agregar asociación entre Estudiante y Curso con clase Matricula
- agregar asociación entre Doctor y Paciente con clase Cita

MUCHOS A MUCHOS (automática):
- agregar muchos a muchos entre Producto y Proveedor
- agregar muchos a muchos entre Usuario y Rol

ELIMINAR ASOCIACIÓN:
- eliminar asociación Matricula
- eliminar asociación ProductoProveedor
- eliminar asociación entre Estudiante y Curso

===============================================
OPERACIONES DE DIAGRAMA
===============================================

LIMPIAR:
- limpiar diagrama
- limpiar relaciones
- restaurar diagrama

EXPORTAR:
- exportar diagrama

===============================================
MULTIPLICIDADES DISPONIBLES
===============================================

- uno (→ 1)
- muchos (→ *)
- cero a muchos (→ 0..*)
- uno a muchos (→ 1..*)
- cero a uno (→ 0..1)
- muchos a muchos (→ *..)

Ejemplos:
- "de uno a muchos"
- "de muchos a muchos"
- "de cero a uno"

===============================================
REGLAS IMPORTANTES
===============================================

1. Para ASOCIACIONES: DEBES especificar multiplicidad
   ✓ Correcto: "agregar relación de Usuario a Pedido de uno a muchos"
   ✗ Incorrecto: "agregar relación de Usuario a Pedido"

2. Los nombres se normalizan automáticamente:
   "Clase Usuario" → "Claseusuario"
   "mi tabla" → "Mitabla"

3. Selecciona una clase antes de agregar atributos

4. Habla claramente y pausado

5. Puedes usar sinónimos: "tabla" = "clase"

===============================================
EJEMPLOS COMPLETOS
===============================================

CREAR UN DIAGRAMA BÁSICO:
1. "agregar tabla Usuario"
2. "agregar atributo nombre"
3. "agregar atributo email"
4. "agregar tabla Pedido"
5. "agregar relación de Usuario a Pedido de uno a muchos"

CREAR ASOCIACIÓN:
1. "agregar tabla Estudiante"
2. "agregar tabla Curso"
3. "agregar asociación entre Estudiante y Curso con clase Matricula"

LIMPIAR Y REINICIAR:
1. "limpiar diagrama"
2. "restaurar diagrama"

===============================================
Editor UML Colaborativo - Comandos por Voz
Versión 1.0 | Generado automáticamente
===============================================
    `;

    // Crear blob con el texto
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comandos-por-voz-uml.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Guía de comandos descargada como archivo de texto');
};