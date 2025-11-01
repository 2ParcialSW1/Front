import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Función auxiliar para limpiar y dividir atributos
 * Maneja casos como "nombre. apellido" -> ["nombre", "apellido"]
 */
const cleanAndSplitAttributes = (attributes) => {
  if (!attributes || !Array.isArray(attributes)) return [];
  
  const cleanedAttributes = [];
  
  attributes.forEach(attr => {
    if (!attr || typeof attr !== 'string') return;
    
    // Dividir por punto seguido de espacio (ej: "nombre. apellido" -> ["nombre", "apellido"])
    const parts = attr.split(/\.\s+/);
    
    parts.forEach(part => {
      const trimmed = part.trim();
      // Solo agregar si no está vacío y no contiene puntos
      if (trimmed && !trimmed.includes('.')) {
        cleanedAttributes.push(trimmed);
      }
    });
  });
  
  return cleanedAttributes;
};

/**
 * Función principal para generar y descargar el proyecto Flutter como ZIP
 * @param {Array} classes - Clases del diagrama UML
 * @param {Array} relationships - Relaciones entre clases
 * @param {Array} associations - Asociaciones con clases intermedias
 * @param {String} projectName - Nombre del proyecto
 * @param {Object} foreignKeys - Claves foráneas configuradas
 * @param {String} packageName - Nombre del paquete (no usado en Flutter pero se mantiene para compatibilidad)
 * @param {String} backendUrl - URL del backend Spring Boot (por defecto localhost:8080)
 */
export const generateAndDownloadFlutterProject = async (
  classes,
  relationships = [],
  associations = [],
  projectName,
  foreignKeys = {},
  packageName = "com.example.demo",
  backendUrl = "http://localhost:8080"
) => {
  console.log("Generando proyecto Flutter...");
  console.log("Clases originales:", classes);
  
  // Limpiar y dividir atributos de todas las clases
  classes = classes.map(cls => ({
    ...cls,
    attributes: cleanAndSplitAttributes(cls.attributes || [])
  }));
  
  console.log("Clases procesadas:", classes);
  console.log("Relaciones:", relationships);
  console.log("Asociaciones:", associations);
  console.log("Backend URL:", backendUrl);

  const zip = new JSZip();
  const flutterProjectName = projectName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  // Crear estructura de carpetas de Flutter
  const libFolder = zip.folder("lib");
  const modelsFolder = libFolder.folder("models");
  const servicesFolder = libFolder.folder("services");
  const screensFolder = libFolder.folder("screens");
  const widgetsFolder = libFolder.folder("widgets");
  const providersFolder = libFolder.folder("providers");

  // Generar pubspec.yaml
  const pubspecContent = generatePubspecYaml(flutterProjectName);
  zip.file("pubspec.yaml", pubspecContent);

  // Generar README.md
  const readmeContent = generateFlutterReadme(flutterProjectName, backendUrl);
  zip.file("README.md", readmeContent);

  // Generar archivo de configuración
  const configContent = generateConfigFile(backendUrl);
  libFolder.file("config.dart", configContent);

  // Generar modelos para cada clase
  classes.forEach((cls) => {
    const modelContent = generateModelClass(cls, relationships, classes);
    modelsFolder.file(`${cls.name.toLowerCase()}_model.dart`, modelContent);
  });

  // Generar servicios API para cada clase
  classes.forEach((cls) => {
    const serviceContent = generateApiService(cls, backendUrl);
    servicesFolder.file(`${cls.name.toLowerCase()}_service.dart`, serviceContent);
  });

  // Generar providers para cada clase
  classes.forEach((cls) => {
    const providerContent = generateProvider(cls);
    providersFolder.file(`${cls.name.toLowerCase()}_provider.dart`, providerContent);
  });

  // Generar pantallas CRUD para cada clase
  classes.forEach((cls) => {
    const listScreenContent = generateListScreen(cls, relationships);
    const detailScreenContent = generateDetailScreen(cls, relationships, classes);
    const formScreenContent = generateFormScreen(cls, relationships, classes);

    screensFolder.file(`${cls.name.toLowerCase()}_list_screen.dart`, listScreenContent);
    screensFolder.file(`${cls.name.toLowerCase()}_detail_screen.dart`, detailScreenContent);
    screensFolder.file(`${cls.name.toLowerCase()}_form_screen.dart`, formScreenContent);
  });

  // Generar widgets reutilizables
  const customWidgetsContent = generateCustomWidgets();
  widgetsFolder.file("custom_widgets.dart", customWidgetsContent);

  // Generar main.dart
  const mainContent = generateMainDart(classes, flutterProjectName);
  libFolder.file("main.dart", mainContent);

  // Generar home_screen.dart
  const homeScreenContent = generateHomeScreen(classes);
  screensFolder.file("home_screen.dart", homeScreenContent);

  // Generar archivo de análisis (analysis_options.yaml)
  const analysisOptionsContent = generateAnalysisOptions();
  zip.file("analysis_options.yaml", analysisOptionsContent);

  // Descargar el ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${flutterProjectName}_flutter.zip`);

  console.log("Proyecto Flutter generado exitosamente!");
};

/**
 * Genera el archivo pubspec.yaml con todas las dependencias necesarias
 */
const generatePubspecYaml = (projectName) => {
  return `name: ${projectName}
description: Flutter app generated from UML diagram - Consumes Spring Boot REST API
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.1.0
  
  # HTTP Requests
  http: ^1.2.0
  
  # UI Components
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.7
  json_serializable: ^6.7.1

flutter:
  uses-material-design: true
`;
};

/**
 * Genera el README.md con instrucciones de uso
 */
const generateFlutterReadme = (projectName, backendUrl) => {
  return `# ${projectName} - Flutter App

Aplicación Flutter generada automáticamente desde diagrama UML.

## 🚀 Características

- ✅ CRUD completo para todas las entidades
- ✅ Conexión con backend Spring Boot
- ✅ Gestión de estado con Provider
- ✅ Validación de formularios
- ✅ UI Material Design
- ✅ Navegación intuitiva
- ✅ Manejo de errores

## 📋 Requisitos Previos

- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0
- Backend Spring Boot ejecutándose en: \`${backendUrl}\`

## 🔧 Instalación

1. **Extraer el proyecto**
\`\`\`bash
unzip ${projectName}_flutter.zip
cd ${projectName}
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
flutter pub get
\`\`\`

3. **Configurar URL del backend**
Edita \`lib/config.dart\` y cambia la URL si es necesario:
\`\`\`dart
static const String baseUrl = '${backendUrl}';
\`\`\`

4. **Ejecutar la aplicación**
\`\`\`bash
# Android/iOS
flutter run

# Web
flutter run -d chrome

# Windows
flutter run -d windows
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
lib/
├── config.dart                    # Configuración global
├── main.dart                      # Punto de entrada
├── models/                        # Modelos de datos
│   ├── clase1_model.dart
│   ├── clase2_model.dart
│   └── ...
├── services/                      # Servicios API
│   ├── clase1_service.dart
│   ├── clase2_service.dart
│   └── ...
├── providers/                     # Gestión de estado
│   ├── clase1_provider.dart
│   ├── clase2_provider.dart
│   └── ...
├── screens/                       # Pantallas
│   ├── home_screen.dart
│   ├── clase1_list_screen.dart
│   ├── clase1_detail_screen.dart
│   ├── clase1_form_screen.dart
│   └── ...
└── widgets/                       # Widgets reutilizables
    └── custom_widgets.dart
\`\`\`

## 🎯 Uso

### Listar Elementos
Todas las entidades tienen una pantalla de lista con:
- Búsqueda en tiempo real
- Pull to refresh
- Botón flotante para agregar

### Crear/Editar
Formularios con:
- Validación automática
- Campos relacionales (dropdowns)
- Botones de guardar/cancelar

### Ver Detalles
Pantalla de detalles con:
- Información completa
- Botones de editar/eliminar
- Relaciones con otras entidades

## 🔌 Conectividad Backend

La app consume los siguientes endpoints del backend Spring Boot:

\`\`\`
GET    /{entidad}           # Listar todos
GET    /{entidad}/{id}      # Obtener por ID
POST   /{entidad}           # Crear nuevo
PUT    /{entidad}/{id}      # Actualizar
DELETE /{entidad}/{id}      # Eliminar
\`\`\`

## ⚙️ Configuración Adicional

### Cambiar URL del Backend
\`\`\`dart
// lib/config.dart
class AppConfig {
  static const String baseUrl = 'http://TU_IP:8080';
}
\`\`\`

### Ejecutar en Android
\`\`\`bash
# Asegúrate de que el emulador esté corriendo
flutter run
\`\`\`

### Ejecutar en iOS
\`\`\`bash
# Requiere macOS y Xcode
flutter run
\`\`\`

### Ejecutar en Web
\`\`\`bash
flutter run -d chrome --web-renderer html
\`\`\`

## 🐛 Troubleshooting

### Error de conexión
- Verifica que el backend esté corriendo
- Cambia \`localhost\` por tu IP local en Android
- Usa \`10.0.2.2\` para el emulador de Android

### Dependencias
\`\`\`bash
flutter clean
flutter pub get
flutter pub upgrade
\`\`\`

## 📱 Plataformas Soportadas

- ✅ Android
- ✅ iOS
- ✅ Web
- ✅ Windows
- ✅ macOS
- ✅ Linux

## 📄 Licencia

Generado automáticamente desde diagrama UML.
`;
};

/**
 * Genera el archivo de configuración global
 */
const generateConfigFile = (backendUrl) => {
  return `/// Configuración global de la aplicación
class AppConfig {
  // URL del backend Spring Boot
  static const String baseUrl = '${backendUrl}';
  
  // Timeouts
  static const int connectTimeout = 5000;
  static const int receiveTimeout = 3000;
  
  // Configuración de paginación
  static const int pageSize = 20;
  
  // Configuración de UI
  static const String appTitle = 'Generated Flutter App';
  
  // Headers por defecto
  static Map<String, String> getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
}
`;
};

/**
 * Genera una clase modelo Dart desde una clase UML
 */
const generateModelClass = (cls, relationships, allClasses) => {
  const className = cls.name;
  const attributes = cls.attributes || [];
  
  // Detectar relaciones para este modelo
  const relationsForThisClass = relationships.filter(
    rel => rel.from === className || rel.to === className
  );

  // Generar imports
  let imports = `import 'dart:convert';\n\n`;
  
  // Agregar imports de clases relacionadas
  relationsForThisClass.forEach(rel => {
    const relatedClass = rel.from === className ? rel.to : rel.from;
    if (relatedClass !== className) {
      imports += `import '${relatedClass.toLowerCase()}_model.dart';\n`;
    }
  });

  // Generar propiedades
  let properties = '  int? id;\n';
  
  // Convertir atributos a camelCase (primera letra minúscula)
  const normalizedAttributes = attributes.map(attr => {
    if (!attr) return attr;
    // Convertir primera letra a minúscula
    return attr.charAt(0).toLowerCase() + attr.slice(1);
  });
  
  normalizedAttributes.forEach(attr => {
    properties += `  String? ${attr};\n`;
  });

  // Agregar relaciones como propiedades
  relationsForThisClass.forEach(rel => {
    const isSource = rel.from === className;
    const relatedClass = isSource ? rel.to : rel.from;
    const multiplicity = isSource ? rel.class2Multiplicity : rel.class1Multiplicity;
    
    if (multiplicity === '*' || multiplicity === '0..*' || multiplicity === '1..*') {
      properties += `  List<${relatedClass}>? ${relatedClass.toLowerCase()}s;\n`;
    } else if (multiplicity === '1' || multiplicity === '0..1') {
      properties += `  int? ${relatedClass.toLowerCase()}Id;\n`;
      // properties += `  ${relatedClass}? ${relatedClass.toLowerCase()};\n`;
    }
  });

  // Generar constructor
  const constructorParams = ['this.id'];
  normalizedAttributes.forEach(attr => constructorParams.push(`this.${attr}`));
  relationsForThisClass.forEach(rel => {
    const isSource = rel.from === className;
    const relatedClass = isSource ? rel.to : rel.from;
    const multiplicity = isSource ? rel.class2Multiplicity : rel.class1Multiplicity;
    
    if (multiplicity === '*' || multiplicity === '0..*' || multiplicity === '1..*') {
      constructorParams.push(`this.${relatedClass.toLowerCase()}s`);
    } else {
      constructorParams.push(`this.${relatedClass.toLowerCase()}Id`);
    }
  });

  // Generar fromJson
  let fromJsonBody = '    id = json[\'id\'];\n';
  normalizedAttributes.forEach(attr => {
    fromJsonBody += `    ${attr} = json['${attr}'];\n`;
  });
  
  relationsForThisClass.forEach(rel => {
    const isSource = rel.from === className;
    const relatedClass = isSource ? rel.to : rel.from;
    const multiplicity = isSource ? rel.class2Multiplicity : rel.class1Multiplicity;
    
    if (multiplicity === '*' || multiplicity === '0..*' || multiplicity === '1..*') {
      fromJsonBody += `    if (json['${relatedClass.toLowerCase()}s'] != null) {
      ${relatedClass.toLowerCase()}s = <${relatedClass}>[];
      json['${relatedClass.toLowerCase()}s'].forEach((v) {
        ${relatedClass.toLowerCase()}s!.add(${relatedClass}.fromJson(v));
      });
    }\n`;
    } else {
      fromJsonBody += `    ${relatedClass.toLowerCase()}Id = json['${relatedClass.toLowerCase()}Id'];\n`;
    }
  });

  // Generar toJson
  let toJsonBody = '    final Map<String, dynamic> data = <String, dynamic>{};\n';
  toJsonBody += '    data[\'id\'] = id;\n';
  normalizedAttributes.forEach(attr => {
    toJsonBody += `    data['${attr}'] = ${attr};\n`;
  });
  
  relationsForThisClass.forEach(rel => {
    const isSource = rel.from === className;
    const relatedClass = isSource ? rel.to : rel.from;
    const multiplicity = isSource ? rel.class2Multiplicity : rel.class1Multiplicity;
    
    if (multiplicity === '*' || multiplicity === '0..*' || multiplicity === '1..*') {
      toJsonBody += `    if (${relatedClass.toLowerCase()}s != null) {
      data['${relatedClass.toLowerCase()}s'] = ${relatedClass.toLowerCase()}s!.map((v) => v.toJson()).toList();
    }\n`;
    } else {
      toJsonBody += `    data['${relatedClass.toLowerCase()}Id'] = ${relatedClass.toLowerCase()}Id;\n`;
    }
  });
  toJsonBody += '    return data;\n';

  return `${imports}
/// Modelo para ${className}
/// Generado automáticamente desde diagrama UML
class ${className} {
${properties}
  ${className}({
    ${constructorParams.join(',\n    ')}
  });

  ${className}.fromJson(Map<String, dynamic> json) {
${fromJsonBody}
  }

  Map<String, dynamic> toJson() {
${toJsonBody}
  }

  @override
  String toString() {
    return '${className}{id: \$id${normalizedAttributes.map(attr => `, ${attr}: \$${attr}`).join('')}}';
  }

  ${className} copyWith({
    int? id,
${normalizedAttributes.map(attr => `    String? ${attr},`).join('\n')}
  }) {
    return ${className}(
      id: id ?? this.id,
${normalizedAttributes.map(attr => `      ${attr}: ${attr} ?? this.${attr},`).join('\n')}
    );
  }
}
`;
};

/**
 * Genera un servicio API para consumir el backend Spring Boot
 */
const generateApiService = (cls, backendUrl) => {
  const className = cls.name;
  const lowerClassName = className.toLowerCase();

  return `import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/${lowerClassName}_model.dart';

/// Servicio API para ${className}
/// Consume endpoints REST del backend Spring Boot
class ${className}Service {
  final String baseUrl = '\${AppConfig.baseUrl}/${lowerClassName}';

  /// Obtener todos los elementos
  Future<List<${className}>> getAll() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: AppConfig.getHeaders(),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(utf8.decode(response.bodyBytes));
        return jsonData.map((json) => ${className}.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener ${lowerClassName}s: \${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: \$e');
    }
  }

  /// Obtener un elemento por ID
  Future<${className}> getById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('\$baseUrl/\$id'),
        headers: AppConfig.getHeaders(),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return ${className}.fromJson(json.decode(utf8.decode(response.bodyBytes)));
      } else {
        throw Exception('${className} no encontrado');
      }
    } catch (e) {
      throw Exception('Error al obtener ${lowerClassName}: \$e');
    }
  }

  /// Crear un nuevo elemento
  Future<${className}> create(${className} item) async {
    try {
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: AppConfig.getHeaders(),
        body: json.encode(item.toJson()),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return ${className}.fromJson(json.decode(utf8.decode(response.bodyBytes)));
      } else {
        throw Exception('Error al crear ${lowerClassName}: \${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: \$e');
    }
  }

  /// Actualizar un elemento existente
  Future<${className}> update(int id, ${className} item) async {
    try {
      final jsonBody = json.encode(item.toJson());
      print('🔄 Actualizando ${lowerClassName} con ID: \$id');
      print('📤 JSON enviado: \$jsonBody');
      
      final response = await http.put(
        Uri.parse('\$baseUrl/\$id'),
        headers: AppConfig.getHeaders(),
        body: jsonBody,
      ).timeout(const Duration(seconds: 10));

      print('📥 Respuesta del servidor: \${response.statusCode}');
      
      if (response.statusCode == 200) {
        return ${className}.fromJson(json.decode(utf8.decode(response.bodyBytes)));
      } else {
        final errorBody = utf8.decode(response.bodyBytes);
        print('❌ Error del servidor: \$errorBody');
        throw Exception('Error al actualizar ${lowerClassName}: \${response.statusCode}\\nDetalle: \$errorBody');
      }
    } catch (e) {
      print('❌ Error de conexión: \$e');
      throw Exception('Error de conexión: \$e');
    }
  }

  /// Eliminar un elemento
  Future<bool> delete(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('\$baseUrl/\$id'),
        headers: AppConfig.getHeaders(),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      } else {
        throw Exception('Error al eliminar ${lowerClassName}: \${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: \$e');
    }
  }
}
`;
};

/**
 * Genera un Provider para gestión de estado
 */
const generateProvider = (cls) => {
  const className = cls.name;
  const lowerClassName = className.toLowerCase();

  return `import 'package:flutter/foundation.dart';
import '../models/${lowerClassName}_model.dart';
import '../services/${lowerClassName}_service.dart';

/// Provider para gestión de estado de ${className}
class ${className}Provider with ChangeNotifier {
  final ${className}Service _service = ${className}Service();
  
  List<${className}> _items = [];
  ${className}? _selectedItem;
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  List<${className}> get items => _items;
  ${className}? get selectedItem => _selectedItem;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Cargar todos los elementos
  Future<void> loadItems() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _items = await _service.getAll();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Cargar un elemento por ID
  Future<void> loadItemById(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _selectedItem = await _service.getById(id);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Crear un nuevo elemento
  Future<${className}> createItem(${className} item) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newItem = await _service.create(item);
      _items.add(newItem);
      _isLoading = false;
      notifyListeners();
      return newItem;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Actualizar un elemento
  Future<${className}> updateItem(int id, ${className} item) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updatedItem = await _service.update(id, item);
      final index = _items.indexWhere((element) => element.id == id);
      if (index != -1) {
        _items[index] = updatedItem;
      }
      _isLoading = false;
      notifyListeners();
      return updatedItem;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Eliminar un elemento
  Future<void> deleteItem(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _service.delete(id);
      _items.removeWhere((element) => element.id == id);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Limpiar error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Seleccionar un elemento
  void selectItem(${className} item) {
    _selectedItem = item;
    notifyListeners();
  }
}
`;
};

/**
 * Genera la pantalla de lista (List Screen)
 */
const generateListScreen = (cls, relationships) => {
  const className = cls.name;
  const lowerClassName = className.toLowerCase();
  const attributes = cls.attributes || [];
  
  // Normalizar atributos a camelCase
  const normalizedAttributes = attributes.map(attr => {
    if (!attr) return attr;
    return attr.charAt(0).toLowerCase() + attr.slice(1);
  });
  
  const displayAttr = normalizedAttributes[0] || 'id';
  const subtitle = normalizedAttributes.length > 1 ? normalizedAttributes[1] : null;

  return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/${lowerClassName}_provider.dart';
import '../models/${lowerClassName}_model.dart';
import '${lowerClassName}_detail_screen.dart';
import '${lowerClassName}_form_screen.dart';

/// Pantalla de lista de ${className}
class ${className}ListScreen extends StatefulWidget {
  const ${className}ListScreen({Key? key}) : super(key: key);

  @override
  State<${className}ListScreen> createState() => _${className}ListScreenState();
}

class _${className}ListScreenState extends State<${className}ListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadItems();
    });
  }

  Future<void> _loadItems() async {
    try {
      await Provider.of<${className}Provider>(context, listen: false).loadItems();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar: \$e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('${className}s'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadItems,
          ),
        ],
      ),
      body: Consumer<${className}Provider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(provider.errorMessage!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadItems,
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          if (provider.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.inbox, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No hay elementos'),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Agregar ${className}'),
                    onPressed: () => _navigateToForm(context),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadItems,
            child: ListView.builder(
              itemCount: provider.items.length,
              itemBuilder: (context, index) {
                final item = provider.items[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text('\${item.id}'),
                    ),
                    title: Text(item.${displayAttr}?.toString() ?? 'Sin nombre'),
                    ${subtitle ? `subtitle: Text(item.${subtitle}?.toString() ?? ''),` : ''}
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.blue),
                          onPressed: () => _navigateToForm(context, item: item),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _confirmDelete(context, item),
                        ),
                      ],
                    ),
                    onTap: () => _navigateToDetail(context, item),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToForm(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _navigateToDetail(BuildContext context, ${className} item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ${className}DetailScreen(item: item),
      ),
    );
  }

  void _navigateToForm(BuildContext context, {${className}? item}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ${className}FormScreen(item: item),
      ),
    );

    if (result == true) {
      _loadItems();
    }
  }

  Future<void> _confirmDelete(BuildContext context, ${className} item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar eliminación'),
        content: Text('¿Desea eliminar este ${lowerClassName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await Provider.of<${className}Provider>(context, listen: false)
            .deleteItem(item.id!);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Eliminado exitosamente')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error al eliminar: \$e')),
          );
        }
      }
    }
  }
}
`;
};

/**
 * Genera la pantalla de detalles (Detail Screen)
 */
const generateDetailScreen = (cls, relationships, allClasses) => {
  const className = cls.name;
  const lowerClassName = className.toLowerCase();
  const attributes = cls.attributes || [];
  
  // Normalizar atributos a camelCase
  const normalizedAttributes = attributes.map(attr => {
    if (!attr) return attr;
    return attr.charAt(0).toLowerCase() + attr.slice(1);
  });

  // Detectar relaciones
  const relatedClasses = relationships.filter(
    rel => rel.from === className || rel.to === className
  );

  return `import 'package:flutter/material.dart';
import '../models/${lowerClassName}_model.dart';
import '${lowerClassName}_form_screen.dart';

/// Pantalla de detalles de ${className}
class ${className}DetailScreen extends StatelessWidget {
  final ${className} item;

  const ${className}DetailScreen({Key? key, required this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalles de ${className}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ${className}FormScreen(item: item),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ID Card
            Card(
              child: ListTile(
                leading: const Icon(Icons.fingerprint),
                title: const Text('ID'),
                subtitle: Text('\${item.id}'),
              ),
            ),
            const SizedBox(height: 8),
            
            ${normalizedAttributes.map((attr, index) => {
              const originalAttr = attributes[index];
              const displayName = originalAttr ? originalAttr.charAt(0).toUpperCase() + originalAttr.slice(1) : attr.charAt(0).toUpperCase() + attr.slice(1);
              return `
            // ${displayName} Card
            Card(
              child: ListTile(
                leading: const Icon(Icons.text_fields),
                title: const Text('${displayName}'),
                subtitle: Text(item.${attr}?.toString() ?? 'N/A'),
              ),
            ),
            const SizedBox(height: 8),
            `;
            }).join('')}
            
            ${relatedClasses.length > 0 ? `
            // Relaciones
            const Divider(height: 32),
            const Text(
              'Relaciones',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ${relatedClasses.map(rel => {
              const relatedClass = rel.from === className ? rel.to : rel.from;
              const multiplicity = rel.from === className ? rel.class2Multiplicity : rel.class1Multiplicity;
              
              if (multiplicity === '*' || multiplicity === '0..*' || multiplicity === '1..*') {
                return `
            Card(
              child: ListTile(
                leading: const Icon(Icons.link),
                title: const Text('${relatedClass}s'),
                subtitle: Text('\${item.${relatedClass.toLowerCase()}s?.length ?? 0} elementos'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // TODO: Navegar a lista de ${relatedClass}s relacionados
                },
              ),
            ),
            const SizedBox(height: 8),`;
              } else {
                return `
            Card(
              child: ListTile(
                leading: const Icon(Icons.link),
                title: const Text('${relatedClass}'),
                subtitle: Text('ID: \${item.${relatedClass.toLowerCase()}Id ?? "N/A"}'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // TODO: Navegar a detalle de ${relatedClass}
                },
              ),
            ),
            const SizedBox(height: 8),`;
              }
            }).join('')}
            ` : ''}
          ],
        ),
      ),
    );
  }
}
`;
};

/**
 * Genera la pantalla de formulario (Form Screen)
 */
const generateFormScreen = (cls, relationships, allClasses) => {
  const className = cls.name;
  const lowerClassName = className.toLowerCase();
  const attributes = cls.attributes || [];
  
  // Normalizar atributos a camelCase
  const normalizedAttributes = attributes.map(attr => {
    if (!attr) return attr;
    return attr.charAt(0).toLowerCase() + attr.slice(1);
  });

  // Detectar relaciones ManyToOne (campos relacionales)
  const manyToOneRelations = relationships.filter(rel => {
    if (rel.from === className) {
      return rel.class2Multiplicity === '1' || rel.class2Multiplicity === '0..1';
    } else if (rel.to === className) {
      return rel.class1Multiplicity === '1' || rel.class1Multiplicity === '0..1';
    }
    return false;
  });

  return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/${lowerClassName}_provider.dart';
import '../models/${lowerClassName}_model.dart';
${manyToOneRelations.map(rel => {
  const relatedClass = rel.from === className ? rel.to : rel.from;
  return `import '../providers/${relatedClass.toLowerCase()}_provider.dart';`;
}).join('\n')}

/// Pantalla de formulario para crear/editar ${className}
class ${className}FormScreen extends StatefulWidget {
  final ${className}? item;

  const ${className}FormScreen({Key? key, this.item}) : super(key: key);

  @override
  State<${className}FormScreen> createState() => _${className}FormScreenState();
}

class _${className}FormScreenState extends State<${className}FormScreen> {
  final _formKey = GlobalKey<FormState>();
  late bool _isEditMode;
  
  // Controladores de texto
  ${normalizedAttributes.map(attr => `late TextEditingController _${attr}Controller;`).join('\n  ')}
  
  // IDs de relaciones
  ${manyToOneRelations.map(rel => {
    const relatedClass = rel.from === className ? rel.to : rel.from;
    return `int? _selected${relatedClass}Id;`;
  }).join('\n  ')}

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.item != null;
    
    // Inicializar controladores
    ${normalizedAttributes.map(attr => `_${attr}Controller = TextEditingController(text: widget.item?.${attr} ?? '');`).join('\n    ')}
    
    // Inicializar IDs de relaciones
    ${manyToOneRelations.map(rel => {
      const relatedClass = rel.from === className ? rel.to : rel.from;
      return `_selected${relatedClass}Id = widget.item?.${relatedClass.toLowerCase()}Id;`;
    }).join('\n    ')}
    
    // Cargar datos para dropdowns
    ${manyToOneRelations.map(rel => {
      const relatedClass = rel.from === className ? rel.to : rel.from;
      return `_load${relatedClass}s();`;
    }).join('\n    ')}
  }

  ${manyToOneRelations.map(rel => {
    const relatedClass = rel.from === className ? rel.to : rel.from;
    return `
  Future<void> _load${relatedClass}s() async {
    try {
      await Provider.of<${relatedClass}Provider>(context, listen: false).loadItems();
    } catch (e) {
      // Ignorar errores de carga
    }
  }`;
  }).join('\n')}

  @override
  void dispose() {
    ${normalizedAttributes.map(attr => `_${attr}Controller.dispose();`).join('\n    ')}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Editar ${className}' : 'Nuevo ${className}'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ${normalizedAttributes.map((attr, index) => {
              const originalAttr = attributes[index];
              const displayName = originalAttr ? originalAttr.charAt(0).toUpperCase() + originalAttr.slice(1) : attr.charAt(0).toUpperCase() + attr.slice(1);
              return `
            // Campo ${displayName}
            TextFormField(
              controller: _${attr}Controller,
              decoration: InputDecoration(
                labelText: '${displayName}',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.text_fields),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Por favor ingrese ${displayName}';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            `;
            }).join('')}
            
            ${manyToOneRelations.map(rel => {
              const relatedClass = rel.from === className ? rel.to : rel.from;
              return `
            // Dropdown ${relatedClass}
            Consumer<${relatedClass}Provider>(
              builder: (context, provider, child) {
                return DropdownButtonFormField<int>(
                  value: _selected${relatedClass}Id,
                  decoration: InputDecoration(
                    labelText: '${relatedClass}',
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.link),
                  ),
                  items: provider.items.map((item) {
                    return DropdownMenuItem<int>(
                      value: item.id,
                      child: Text('\${item.id} - \${item.toString()}'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selected${relatedClass}Id = value;
                    });
                  },
                  validator: (value) {
                    // Opcional: Validar si la relación es obligatoria
                    return null;
                  },
                );
              },
            ),
            const SizedBox(height: 16),
            `;
            }).join('')}
            
            // Botones
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _saveItem,
                    child: Text(_isEditMode ? 'Actualizar' : 'Guardar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveItem() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final provider = Provider.of<${className}Provider>(context, listen: false);

    final item = ${className}(
      id: _isEditMode ? widget.item!.id : null,
      ${normalizedAttributes.map(attr => `${attr}: _${attr}Controller.text,`).join('\n      ')}
      ${manyToOneRelations.map(rel => {
        const relatedClass = rel.from === className ? rel.to : rel.from;
        return `${relatedClass.toLowerCase()}Id: _selected${relatedClass}Id,`;
      }).join('\n      ')}
    );

    try {
      if (_isEditMode) {
        await provider.updateItem(widget.item!.id!, item);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Actualizado exitosamente')),
          );
        }
      } else {
        await provider.createItem(item);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Creado exitosamente')),
          );
        }
      }
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: \$e')),
        );
      }
    }
  }
}
`;
};

/**
 * Genera widgets personalizados reutilizables
 */
const generateCustomWidgets = () => {
  return `import 'package:flutter/material.dart';

/// Loading Overlay Widget
class LoadingOverlay extends StatelessWidget {
  final Widget child;
  final bool isLoading;

  const LoadingOverlay({
    Key? key,
    required this.child,
    required this.isLoading,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: Colors.black.withOpacity(0.5),
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
    );
  }
}

/// Empty State Widget
class EmptyState extends StatelessWidget {
  final String message;
  final IconData icon;
  final VoidCallback? onAction;
  final String? actionLabel;

  const EmptyState({
    Key? key,
    required this.message,
    this.icon = Icons.inbox,
    this.onAction,
    this.actionLabel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
          if (onAction != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onAction,
              child: Text(actionLabel ?? 'Acción'),
            ),
          ],
        ],
      ),
    );
  }
}

/// Error Widget
class ErrorDisplay extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorDisplay({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(fontSize: 16),
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Reintentar'),
            ),
          ],
        ],
      ),
    );
  }
}

/// Confirm Dialog
Future<bool?> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmText = 'Confirmar',
  String cancelText = 'Cancelar',
}) {
  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(cancelText),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          child: Text(confirmText),
        ),
      ],
    ),
  );
}
`;
};

/**
 * Genera el archivo main.dart
 */
const generateMainDart = (classes, projectName) => {
  return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Screens
import 'screens/home_screen.dart';

// Providers
${classes.map(cls => `import 'providers/${cls.name.toLowerCase()}_provider.dart';`).join('\n')}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ${classes.map(cls => `ChangeNotifierProvider(create: (_) => ${cls.name}Provider()),`).join('\n        ')}
      ],
      child: MaterialApp(
        title: '${projectName}',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 2,
          ),
          cardTheme: const CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ),
          inputDecorationTheme: const InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(8)),
            ),
            filled: true,
            fillColor: Color(0xFFF5F5F5),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(8)),
              ),
            ),
          ),
        ),
        home: const HomeScreen(),
      ),
    );
  }
}
`;
};

/**
 * Genera la pantalla principal (Home Screen)
 */
const generateHomeScreen = (classes) => {
  return `import 'package:flutter/material.dart';
${classes.map(cls => `import '${cls.name.toLowerCase()}_list_screen.dart';`).join('\n')}

/// Pantalla principal con navegación a todas las entidades
class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: GridView.count(
        crossAxisCount: 2,
        padding: const EdgeInsets.all(16),
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: [
          ${classes.map((cls, index) => {
            const icons = ['person', 'business', 'shopping_cart', 'inventory', 'category', 'settings', 'dashboard', 'analytics'];
            const icon = icons[index % icons.length];
            return `
          _buildCard(
            context,
            '${cls.name}s',
            Icons.${icon},
            Colors.primaries[${index} % Colors.primaries.length],
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ${cls.name}ListScreen()),
            ),
          ),`;
          }).join('')}
        ],
      ),
    );
  }

  Widget _buildCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
`;
};

/**
 * Genera el archivo analysis_options.yaml
 */
const generateAnalysisOptions = () => {
  return `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - prefer_const_constructors
    - prefer_const_literals_to_create_immutables
    - avoid_print
    - prefer_single_quotes
    - always_declare_return_types
    - avoid_unnecessary_containers
`;
};
