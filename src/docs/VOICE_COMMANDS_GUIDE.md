# 🎤 Guía Completa de Comandos de Voz

## 📋 **Comandos de Tablas/Clases**

### ✅ Agregar Tabla
**Comandos válidos:**
- `"Agregar tabla [nombre]"`
- `"Crear tabla [nombre]"`
- `"Agregar clase [nombre]"`

**Ejemplos:**
```
"Agregar tabla Usuario"
"Crear tabla Producto"
"Agregar clase Cliente"
"Agregar tabla categoría"
"Crear tabla mi tabla"
```

**Resultado:** Crea una nueva clase en el diagrama con el nombre normalizado.

---

### 🎯 Seleccionar Tabla
**Comandos válidos:**
- `"Seleccionar tabla [nombre]"`
- `"Seleccionar [nombre]"`
- `"Cambiar a tabla [nombre]"`

**Ejemplos:**
```
"Seleccionar tabla Usuario"
"Seleccionar Producto"
"Cambiar a tabla Cliente"
```

**Resultado:** Selecciona la tabla para operaciones posteriores.

---

### ❌ Eliminar Tabla
**Comandos válidos:**
- `"Eliminar tabla [nombre]"`
- `"Borrar tabla [nombre]"`
- `"Quitar clase [nombre]"`

**Ejemplos:**
```
"Eliminar tabla Usuario"
"Borrar tabla Producto"
"Quitar clase Cliente"
```

**Resultado:** Elimina la tabla y todas sus relaciones.

---

## 🔧 **Comandos de Atributos**

### ➕ Agregar Atributo
**Comandos válidos:**
- `"Agregar atributo [nombre] a [tabla]"`
- `"Agregar campo [nombre] a la tabla [tabla]"`
- `"Agregar atributo [nombre]"` (si hay tabla seleccionada)

**Ejemplos:**
```
"Agregar atributo nombre a Usuario"
"Agregar campo email a la tabla Cliente"
"Agregar atributo precio a Producto"
"Agregar atributo descripción" (si Usuario está seleccionada)
```

**Resultado:** Agrega el atributo a la tabla especificada.

---

## 🔗 **Comandos de Relaciones**

### ➕ Agregar Relación
**Comandos válidos:**
- `"Agregar relación [tipo] entre [tabla1] y [tabla2]"`
- `"Crear [tipo] entre [tabla1] y [tabla2]"`
- `"Agregar [tipo] de [tabla1] a [tabla2]"`

**Tipos de relación soportados:**
- `herencia` → Herencia (--|>)
- `asociacion` → Asociación (--)
- `asociacion_directa` → Asociación Directa (-->)
- `agregacion` → Agregación (o--)
- `composicion` → Composición (*--)
- `dependencia` → Dependencia (..>)
- `realizacion` → Realización (..|>)

**Ejemplos:**
```
"Agregar relación herencia entre Usuario y Cliente"
"Crear asociación entre Producto y Categoria"
"Agregar composición de Orden a Item"
"Agregar relación agregación entre Usuario y Proyecto"
```

**Resultado:** Crea la relación entre las dos tablas especificadas.

---

## 🔄 **Comandos de Asociaciones (Clases Intermedias)**

### ➕ Agregar Asociación
**Comandos válidos:**
- `"Agregar asociación entre [tabla1] y [tabla2] con clase intermedia [nombre]"`
- `"Crear asociación [tabla1] [tabla2] [nombre]"`
- `"Agregar asociación [tabla1] [tabla2] [nombre]"`

**Ejemplos:**
```
"Agregar asociación entre Usuario y Proyecto con clase intermedia Participacion"
"Crear asociación Usuario Proyecto Participacion"
"Agregar asociación entre Cliente y Producto con clase intermedia Compra"
```

**Resultado:** Crea una asociación con clase intermedia entre las dos tablas.

---

## 📤 **Comandos de Utilidades**

### 📄 Exportar Diagrama
**Comandos válidos:**
- `"Exportar diagrama"`
- `"Exportar a XML"`
- `"Generar XML"`

**Resultado:** Exporta el diagrama actual a formato XML.

---

### 🔄 Restaurar Diagrama
**Comandos válidos:**
- `"Restaurar diagrama"`
- `"Volver al estado original"`
- `"Resetear diagrama"`

**Resultado:** Restaura el diagrama a su estado original.

---

## 🎯 **Ejemplos de Flujos Completos**

### 📊 Crear un diagrama de e-commerce:
```
1. "Agregar tabla Usuario"
2. "Agregar atributo nombre a Usuario"
3. "Agregar atributo email a Usuario"
4. "Agregar tabla Producto"
5. "Agregar atributo precio a Producto"
6. "Agregar atributo descripción a Producto"
7. "Agregar tabla Categoria"
8. "Agregar relación asociacion entre Producto y Categoria"
9. "Agregar relación herencia entre Usuario y Cliente"
```

### 🏢 Crear un diagrama de empresa:
```
1. "Agregar tabla Empleado"
2. "Agregar atributo nombre a Empleado"
3. "Agregar atributo salario a Empleado"
4. "Agregar tabla Departamento"
5. "Agregar atributo nombre a Departamento"
6. "Agregar relación composicion entre Departamento y Empleado"
7. "Agregar tabla Proyecto"
8. "Agregar asociación entre Empleado y Proyecto con clase intermedia Asignacion"
```

### 🎓 Crear un diagrama educativo:
```
1. "Agregar tabla Estudiante"
2. "Agregar atributo matricula a Estudiante"
3. "Agregar tabla Curso"
4. "Agregar atributo codigo a Curso"
5. "Agregar tabla Profesor"
6. "Agregar relación asociacion entre Profesor y Curso"
7. "Agregar asociación entre Estudiante y Curso con clase intermedia Inscripcion"
```

---

## ⚠️ **Notas Importantes**

### ✅ **Lo que funciona bien:**
- Nombres con acentos: `"categoría"` → `"Categoria"`
- Nombres con espacios: `"mi tabla"` → `"MiTabla"`
- Múltiples palabras: `"usuario producto"` → `"UsuarioProducto"`
- Validaciones automáticas (no permite "id" como atributo)

### ❌ **Limitaciones:**
- No se pueden editar atributos existentes por voz
- No se pueden modificar relaciones existentes por voz
- Los nombres deben ser descriptivos y claros

### 🎯 **Consejos para mejores resultados:**
1. **Habla claramente** y a un ritmo moderado
2. **Usa nombres descriptivos** para las tablas y atributos
3. **Especifica siempre la tabla** cuando agregues atributos
4. **Verifica en consola** si hay errores de reconocimiento
5. **Usa comandos simples** y directos

---

## 🔧 **Solución de Problemas**

### Si el comando no se reconoce:
- Verifica que el micrófono esté habilitado
- Habla más claramente y despacio
- Usa comandos más simples

### Si aparece error de validación:
- Verifica que el nombre no contenga caracteres especiales
- Asegúrate de que la tabla exista antes de agregar atributos
- No uses "id" como nombre de atributo

### Si la normalización falla:
- Revisa la consola para ver el proceso de normalización
- Usa nombres más simples sin acentos complejos
