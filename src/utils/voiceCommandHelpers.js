// Utilidades para comandos de voz que reutilizan la lógica de los managers existentes

/**
 * Valida el nombre de una clase según las reglas del ClassManager
 */
export const validateClassName = (className) => {
  const classNamePattern = /^[A-Z][A-Za-z]*$/;
  return classNamePattern.test(className);
};

/**
 * Valida que un atributo no sea "id" según las reglas del ClassManager
 */
export const validateAttribute = (attribute) => {
  const idPattern = /\b(id)\b/i;
  return !idPattern.test(attribute);
};

/**
 * Normaliza el nombre de una tabla/clase
 */
export const normalizeTableName = (name) => {
  if (!name) return "";
  const trimmed = name.trim();
  
  // Remover acentos y caracteres especiales
  const withoutAccents = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Eliminar cualquier carácter que no sea letra, número o espacio (quita símbolos raros detectados por OCR)
  const cleaned = withoutAccents.replace(/[^A-Za-z0-9\s]/g, "");

  // Remover espacios y capitalizar cada palabra (PascalCase)
  const words = cleaned.split(/\s+/);
  const normalized = words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
  
  console.log(`normalizeTableName: "${name}" → "${normalized}"`);
  return normalized;
};

/**
 * Busca una clase por nombre con búsqueda inteligente
 * Si no encuentra la clase exacta, intenta combinaciones de palabras adyacentes
 * @param {Array} classes - Array de clases disponibles
 * @param {string} searchName - Nombre a buscar (puede ser múltiples palabras)
 * @returns {Object|null} - La clase encontrada o null
 */
export const findClassByName = (classes, searchName) => {
  if (!searchName || !classes || classes.length === 0) return null;
  
  const normalized = normalizeTableName(searchName);
  console.log(`🔍 Buscando clase: "${searchName}" (normalizado: "${normalized}")`);
  
  // 1. Intentar búsqueda exacta
  let found = classes.find(cls => cls.name === normalized);
  if (found) {
    console.log(`✅ Clase encontrada (exacta): "${found.name}"`);
    return found;
  }
  
  // 2. Si no se encuentra, buscar combinaciones de palabras
  // Separar el nombre en palabras individuales
  const words = searchName.trim().split(/\s+/).map(w => w.trim()).filter(w => w);
  
  if (words.length > 1) {
    console.log(`🔍 No se encontró exacto. Intentando combinaciones con palabras:`, words);
    
    // Generar combinaciones: todas juntas (2 palabras máximo)
    if (words.length === 2) {
      // Combinación: palabra1 + palabra2
      const combo1 = normalizeTableName(words[0] + " " + words[1]);
      found = classes.find(cls => cls.name === combo1);
      if (found) {
        console.log(`✅ Clase encontrada (combinación 1+2): "${found.name}"`);
        return found;
      }
      
      // Intento alternativo: buscar similitud
      const similarity = findSimilarClass(classes, normalized);
      if (similarity) {
        console.log(`✅ Clase encontrada (similar): "${similarity.name}"`);
        return similarity;
      }
    }
  }
  
  // 3. Búsqueda por palabras que contengan (fallback)
  const searchLower = normalized.toLowerCase();
  found = classes.find(cls => cls.name.toLowerCase().includes(searchLower));
  
  // Buscar que contenga todas las palabras
  if (!found && words.length > 1) {
    found = classes.find(cls => {
      const clsLower = cls.name.toLowerCase();
      return words.every(word => clsLower.includes(word.toLowerCase()));
    });
  }
  
  if (found) {
    console.log(`✅ Clase encontrada (parcial): "${found.name}"`);
    return found;
  }
  
  console.warn(`❌ No se encontró la clase "${searchName}" (normalizado: "${normalized}")`);
  console.log(`📋 Clases disponibles: ${classes.map(c => c.name).join(', ')}`);
  return null;
};

/**
 * Busca una clase por similitud (similar a fuzzy search)
 * Compara las clases disponibles y devuelve la más similar
 */
export const findSimilarClass = (classes, searchName) => {
  if (!classes || classes.length === 0) return null;
  
  const searchLower = searchName.toLowerCase();
  
  // Calcular similitud para cada clase
  let bestMatch = null;
  let bestScore = 0;
  
  classes.forEach(cls => {
    const clsLower = cls.name.toLowerCase();
    
    // Si contiene la búsqueda completa, puntuación alta
    if (clsLower.includes(searchLower) || searchLower.includes(clsLower)) {
      const score = Math.max(clsLower.length, searchLower.length) / Math.min(clsLower.length, searchLower.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = cls;
      }
    }
  });
  
  // Solo devolver si la similitud es suficiente
  if (bestScore > 0.6) {
    return bestMatch;
  }
  
  return null;
};

/**
 * Agrega una clase usando la misma lógica que ClassManager.addClass()
 * NOTA: El className ya debe estar normalizado antes de llamar esta función
 */
export const addClassViaVoice = (classes, setClasses, relationships, associations, updateDiagram, className, attributes = []) => {
  console.log(`addClassViaVoice recibió: "${className}"`);
  // Validaciones del ClassManager (className ya debe estar normalizado)
  if (!validateClassName(className)) {
    console.warn("El nombre de la clase debe empezar con una mayúscula y no debe contener espacios.");
    return false;
  }

  // Validar atributos
  const invalidAttributes = attributes.filter(attr => !validateAttribute(attr));
  if (invalidAttributes.length > 0) {
    console.warn("No se permite usar 'id' como nombre de atributo.");
    return false;
  }

  // Verificar si la clase ya existe
  if (classes.some(cls => cls.name === className)) {
    console.warn(`La tabla ${className} ya existe`);
    return false;
  }

  // Agregar la clase
  const updatedClasses = [...classes, { name: className, attributes }];
  setClasses(updatedClasses);
  updateDiagram(updatedClasses, relationships, associations);
  
  console.log(`Tabla '${className}' agregada exitosamente`);
  return true;
};

/**
 * Agrega un atributo a una clase usando la misma lógica que ClassManager.addAttributeToClass()
 */
export const addAttributeViaVoice = (classes, setClasses, relationships, associations, updateDiagram, tableName, attributeName) => {
  // Búsqueda inteligente de la tabla
  const table = findClassByName(classes, tableName);
  
  // Validar atributo
  if (!validateAttribute(attributeName)) {
    console.warn("No se permite usar 'id' como nombre de atributo.");
    return false;
  }

  if (!table) {
    console.warn(`No se encontró la tabla '${tableName}'. Creando tabla automáticamente.`);
    // Crear tabla automáticamente con el atributo
    const normalizedTableName = normalizeTableName(tableName);
    return addClassViaVoice(classes, setClasses, relationships, associations, updateDiagram, normalizedTableName, [attributeName]);
  }
  
  const tableIndex = classes.findIndex(cls => cls.name === table.name);

  // Verificar si el atributo ya existe
  const existingClass = classes[tableIndex];
  if (existingClass.attributes.includes(attributeName)) {
    console.warn(`El atributo '${attributeName}' ya existe en la tabla '${table.name}'`);
    return false;
  }

  // Agregar el atributo
  const updatedClasses = classes.map((cls, idx) => {
    if (idx === tableIndex) {
      return { ...cls, attributes: [...cls.attributes, attributeName] };
    }
    return cls;
  });
  
  console.log("Agregando atributo - Estado antes:", {
    classes: classes.length,
    relationships: relationships.length,
    associations: associations.length
  });
  
  setClasses(updatedClasses);
  updateDiagram(updatedClasses, relationships, associations);
  
  console.log("Agregando atributo - Estado después:", {
    updatedClasses: updatedClasses.length,
    relationships: relationships.length,
    associations: associations.length
  });
  
  console.log(`Atributo '${attributeName}' agregado a la tabla '${table.name}'`);
  return true;
};

/**
 * Agrega una relación usando la misma lógica que RelationshipManager.addRelationship()
 */
export const addRelationshipViaVoice = (classes, relationships, setRelationships, updateDiagram, fromTable, toTable, relationshipType, relationshipName = "", class1Multiplicity = "", class2Multiplicity = "") => {
  // Búsqueda inteligente de clases con combinaciones
  const fromClass = findClassByName(classes, fromTable);
  const toClass = findClassByName(classes, toTable);
  
  if (!fromClass) {
    console.warn(`❌ La tabla '${fromTable}' no existe o no se pudo encontrar. Clases disponibles: ${classes.map(c => c.name).join(', ')}`);
    return false;
  }
  
  if (!toClass) {
    console.warn(`❌ La tabla '${toTable}' no existe o no se pudo encontrar. Clases disponibles: ${classes.map(c => c.name).join(', ')}`);
    return false;
  }
  
  // Usar los nombres encontrados (ya normalizados)
  const normalizedFromTable = fromClass.name;
  const normalizedToTable = toClass.name;
  
  // Mapear multiplicidades de voz a valores PlantUML
  const mappedClass1Multiplicity = mapMultiplicity(class1Multiplicity);
  const mappedClass2Multiplicity = mapMultiplicity(class2Multiplicity);

  // Crear la relación con la misma estructura que RelationshipManager
  const newRelationship = {
    from: normalizedFromTable,
    to: normalizedToTable,
    type: relationshipType,
    name: relationshipName,
    class1Multiplicity: !["--|>", "<|--", "..|>"].includes(relationshipType) ? mappedClass1Multiplicity : "",
    class2Multiplicity: !["--|>", "<|--", "..|>"].includes(relationshipType) ? mappedClass2Multiplicity : "",
  };

  // Verificar si la relación ya existe
  const existingRelationship = relationships.find(
    rel =>
      rel.from === normalizedFromTable &&
      rel.to === normalizedToTable &&
      rel.type === relationshipType &&
      rel.class1Multiplicity === mappedClass1Multiplicity &&
      rel.class2Multiplicity === mappedClass2Multiplicity
  );

  if (existingRelationship) {
    console.warn("La relación ya existe");
    return false;
  }

  // Agregar la relación usando la misma lógica que RelationshipManager
  setRelationships(prevRelationships => {
    const updatedRelationships = [...prevRelationships, newRelationship];
    updateDiagram(classes, updatedRelationships); // Llama igual que RelationshipManager manual
    return updatedRelationships;
  });

  const multiplicityInfo = mappedClass1Multiplicity && mappedClass2Multiplicity 
    ? ` con multiplicidad ${mappedClass1Multiplicity} a ${mappedClass2Multiplicity}`
    : "";
  console.log(`Relación de tipo '${relationshipType}' agregada entre '${normalizedFromTable}' y '${normalizedToTable}'${multiplicityInfo}`);
  return true;
};

/**
 * Agrega una asociación usando la misma lógica que AssociationManager.addAssociation()
 */
export const addAssociationViaVoice = (classes, relationships, associations, setAssociations, updateDiagram, class1, class2, associationClass) => {
  // Normalizar nombres de clases
  const normalizedClass1 = normalizeTableName(class1);
  const normalizedClass2 = normalizeTableName(class2);
  const normalizedAssociationClass = normalizeTableName(associationClass);
  
  // Validar que las clases existan
  const class1Exists = classes.some(cls => cls.name === normalizedClass1);
  const class2Exists = classes.some(cls => cls.name === normalizedClass2);
  
  if (!class1Exists) {
    console.warn(`La clase '${normalizedClass1}' no existe`);
    return false;
  }
  
  if (!class2Exists) {
    console.warn(`La clase '${normalizedClass2}' no existe`);
    return false;
  }

  // Crear la asociación con la misma estructura que AssociationManager
  const newAssociation = { class1: normalizedClass1, class2: normalizedClass2, associationClass: normalizedAssociationClass };

  // Verificar si la asociación ya existe
  const existingAssociation = associations.find(
    assoc =>
      assoc.class1 === normalizedClass1 &&
      assoc.class2 === normalizedClass2 &&
      assoc.associationClass === normalizedAssociationClass
  );

  if (existingAssociation) {
    console.warn("La asociación ya existe");
    return false;
  }

  // Agregar la asociación
  setAssociations(prevAssociations => {
    const updatedAssociations = [...prevAssociations, newAssociation];
    updateDiagram(classes, relationships, updatedAssociations);
    return updatedAssociations;
  });

  console.log(`Asociación '${normalizedAssociationClass}' agregada entre '${normalizedClass1}' y '${normalizedClass2}'`);
  return true;
};

/**
 * Elimina una clase usando la misma lógica que ClassManager.deleteClass()
 */
export const deleteClassViaVoice = (classes, setClasses, relationships, setRelationships, associations, setAssociations, updateDiagram, className) => {
  // Búsqueda inteligente de la clase
  const classToDelete = findClassByName(classes, className);
  
  if (!classToDelete) {
    console.warn(`❌ La clase '${className}' no existe o no se pudo encontrar. Clases disponibles: ${classes.map(c => c.name).join(', ')}`);
    return false;
  }
  
  const normalizedClassName = classToDelete.name;

  // Eliminar relaciones donde la clase es from o to
  const updatedRelationships = relationships.filter(rel => rel.from !== normalizedClassName && rel.to !== normalizedClassName);

  // Eliminar asociaciones donde la clase es class1 o class2
  const updatedAssociations = associations.filter(assoc => assoc.class1 !== normalizedClassName && assoc.class2 !== normalizedClassName);

  // Eliminar la clase
  const updatedClasses = classes.filter(cls => cls.name !== normalizedClassName);

  setClasses(updatedClasses);
  setRelationships(updatedRelationships);
  setAssociations(updatedAssociations);
  updateDiagram(updatedClasses, updatedRelationships, updatedAssociations);

  console.log(`Clase '${normalizedClassName}' eliminada exitosamente`);
  return true;
};

/**
 * Mapea tipos de relación de voz a símbolos PlantUML
 */
export const mapRelationshipType = (voiceType) => {
  // Normalizar quitando acentos
  const normalizedType = voiceType.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  const typeMap = {
    'asociacion': '--',
    'asociacion_directa': '-->',
    'agregacion': 'o--',
    'composicion': '*--',
    'herencia': '--|>',
    'especializacion': '<|--',
    'dependencia': '..>',
    'realizacion': '..|>',
    'nest': '--+'
  };
  // Si la entrada ya parece un símbolo de PlantUML, aceptar el símbolo tal cual
  // Lista de símbolos permitidos (comunes en PlantUML)
  const allowedSymbols = new Set(['--', '-->', '<--', '<|--', '--|>', '*--', '--*', 'o--', '--o', '..>', '..|>', '--+', '->', '<-', '->>', '<<-']);

  const trimmed = voiceType ? voiceType.toString().trim() : '';

  // Si la entrada contiene principalmente caracteres simbólicos, comprobar si es un símbolo válido
  const onlySymbols = /^[-.|o*+<>]+$/i.test(trimmed);
  if (onlySymbols && allowedSymbols.has(trimmed)) {
    console.log(`Mapeando tipo (símbolo directo): "${voiceType}" → "${trimmed}"`);
    return trimmed;
  }

  // Si la entrada ya es exactamente uno de los símbolos permitidos (posible que venga del procesamiento previo), devolverlo
  if (allowedSymbols.has(trimmed)) {
    console.log(`Mapeando tipo (símbolo directo exacto): "${voiceType}" → "${trimmed}"`);
    return trimmed;
  }

  // Si no es símbolo, mapear por palabra
  const mappedType = typeMap[normalizedType] || '--';

  // Si el tipo original contiene símbolos no alfanuméricos (posible output OCR) y no se encontró en el mapa, logear
  const isSymbolic = /[^a-z0-9\s]/i.test(voiceType);
  if (!typeMap[normalizedType] && isSymbolic) {
    console.warn(`Tipo de relación no reconocido o simbólico: "${voiceType}" — usando fallback '--'`);
  }

  console.log(`Mapeando tipo: "${voiceType}" → "${normalizedType}" → "${mappedType}"`);
  return mappedType;
};


/**
 * Mapea multiplicidades de voz a valores PlantUML
 */
export const mapMultiplicity = (voiceMultiplicity) => {
  if (!voiceMultiplicity) return "";
  
  const multiplicityMap = {
    // Uno a uno
    'uno a uno': '1',
    '1 a 1': '1',
    '1:1': '1',
    'uno': '1',
    
    // Uno a muchos
    'uno a muchos': '1..*',
    '1 a muchos': '1..*',
    '1:*': '1..*',
    'uno a n': '1..*',
    '1 a n': '1..*',
    
    // Muchos a uno
    'muchos a uno': '*',
    'muchos a 1': '*',
    '*:1': '*',
    'n a uno': '*',
    'n a 1': '*',
    
    // Muchos a muchos
    'muchos a muchos': '*..*',
    '*:*': '*..*',
    'n a n': '*..*',
    'n a m': '*..*',
    
    // Cero a uno
    'cero a uno': '0..1',
    '0 a 1': '0..1',
    '0:1': '0..1',
    'opcional': '0..1',
    
    // Cero a muchos
    'cero a muchos': '0..*',
    '0 a muchos': '0..*',
    '0:*': '0..*',
    'cero a n': '0..*',
    '0 a n': '0..*',
    
    // Valores directos
    '1': '1',
    '0': '0',
    '*': '*',
    '0..1': '0..1',
    '1..*': '1..*',
    '0..*': '0..*',
    '1..1': '1..1',
    '1..n': '1..*',
    'm..n': '*..*'
  };
  
  const normalized = voiceMultiplicity.toLowerCase().trim();
  return multiplicityMap[normalized] || voiceMultiplicity;
};
