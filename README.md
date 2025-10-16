# Editor de Diagramas UML con Comandos de Voz

Una aplicación React para crear y editar diagramas UML con funcionalidad de comandos de voz usando reconocimiento de voz y procesamiento con IA.

## 🎤 Comandos de Voz Disponibles

### 📋 **Gestión de Tablas/Clases**

#### Agregar Tabla
```
"Agregar tabla Usuario"
"Crear tabla Producto"
"Agregar clase Cliente"
"Agregar tabla categoría"
```

#### Seleccionar Tabla
```
"Seleccionar tabla Usuario"
"Seleccionar Usuario"
"Cambiar a tabla Producto"
```

#### Eliminar Tabla
```
"Eliminar tabla Usuario"
"Borrar tabla Producto"
"Quitar clase Cliente"
```

### 🔧 **Gestión de Atributos**

#### Agregar Atributo
```
"Agregar atributo nombre a Usuario"
"Agregar campo email a la tabla Cliente"
"Agregar atributo precio a Producto"
"Agregar atributo descripción a categoría"
```

#### Eliminar Atributo
```
"Eliminar atributo precio de Producto"
"Quitar atributo email de Usuario"
"Eliminar campo descripción de Categoria"
```

**Nota**: Si no especificas tabla, se usará la tabla seleccionada actualmente.

### 🔗 **Gestión de Relaciones**

#### Agregar Relación Simple
```
"Agregar relación herencia entre Usuario y Cliente"
"Crear relación asociacion entre Producto y Categoria"
"Agregar relación composicion entre Orden y Item"
"Agregar relación agregación entre Usuario y Proyecto"

# Con multiplicidades:
"Agregar relación asociacion entre Usuario y Producto con multiplicidad uno a muchos"
"Crear relación asociacion entre Cliente y Orden de uno a muchos"
"Agregar relación composicion entre Orden y Item de uno a muchos"
"Agregar relación asociacion entre Usuario y Proyecto de muchos a muchos"
```

#### Tipos de Relación Soportados:
- `herencia` → Herencia (--|>)
- `asociacion` → Asociación (--)
- `asociacion_directa` → Asociación Directa (-->)
- `agregacion` → Agregación (o--)
- `composicion` → Composición (*--)
- `dependencia` → Dependencia (..>)
- `realizacion` → Realización (..|>)

#### Multiplicidades Soportadas:
- `uno a uno` → 1:1
- `uno a muchos` → 1:*
- `muchos a uno` → *:1
- `muchos a muchos` → *:*
- `cero a uno` → 0:1
- `cero a muchos` → 0:*
- `opcional` → 0:1

### 🔄 **Gestión de Asociaciones (Clases Intermedias)**

#### Agregar Asociación con Clase Intermedia
```
"Agregar asociación entre Usuario y Proyecto con clase intermedia Participacion"
"Crear asociación Usuario Proyecto Participacion"
"Agregar asociación entre Cliente y Producto con clase intermedia Compra"
```

#### Eliminar Asociación con Clase Intermedia
```
"Eliminar asociación con clase intermedia Participacion"
"Eliminar asociación entre Usuario y Proyecto"
"Quitar asociación con clase intermedia Compra"
```

**⚠️ Diferencia importante:**
- **Relación simple**: `"Agregar relación asociacion entre A y B"` → Crea una línea directa
- **Asociación con clase intermedia**: `"Agregar asociación entre A y B con clase intermedia C"` → Crea una clase intermedia

### 📤 **Exportación y Utilidades**

#### Exportar Diagrama
```
"Exportar diagrama"
"Exportar a XML"
"Generar XML"
```

#### Restaurar Diagrama
```
"Restaurar diagrama"
"Volver al estado original"
"Resetear diagrama"
```

#### Limpiar Relaciones
```
"Limpiar relaciones"
"Eliminar todas las relaciones"
```

## 🚀 **Ejemplos de Flujo Completo**

### Crear un diagrama básico de e-commerce:
1. "Agregar tabla Usuario"
2. "Agregar atributo nombre a Usuario"
3. "Agregar atributo email a Usuario"
4. "Agregar tabla Producto"
5. "Agregar atributo precio a Producto"
6. "Agregar atributo descripción a Producto"
7. "Agregar tabla Categoria"
8. "Agregar relación asociacion entre Producto y Categoria"
9. "Agregar relación herencia entre Usuario y Cliente"

### Crear relaciones complejas:
1. "Agregar tabla Orden"
2. "Agregar tabla Item"
3. "Agregar relación composicion entre Orden y Item"
4. "Agregar asociación entre Usuario y Producto con clase intermedia Favorito"

## ⚙️ **Configuración Técnica**

### Requisitos:
- Navegador con soporte para reconocimiento de voz
- Micrófono habilitado
- Clave API de OpenAI configurada en `.env`

### Variables de Entorno:
```env
VITE_OPENAI_API_KEY=tu_clave_api_aqui
```

## 🎯 **Consejos de Uso**

1. **Habla claramente** y a un ritmo moderado
2. **Usa nombres descriptivos** para las tablas y atributos
3. **Especifica la tabla** cuando agregues atributos si no hay una seleccionada
4. **Los nombres se normalizan automáticamente** (espacios se eliminan, primera letra mayúscula)
5. **Los acentos se convierten** automáticamente (categoría → Categoria)

## 🔧 **Desarrollo**

### Instalación:
```bash
npm install
```

### Ejecutar en desarrollo:
```bash
npm run dev
```

### Construir para producción:
```bash
npm run build
```

## 📝 **Notas Técnicas**

- Los comandos de voz se procesan usando OpenAI GPT-4o-mini
- La normalización de nombres maneja acentos y espacios automáticamente
- Todas las validaciones son idénticas a la interfaz manual
- Los comandos reutilizan la lógica existente de los managers
