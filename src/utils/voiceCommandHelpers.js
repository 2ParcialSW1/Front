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
  
  // Remover espacios y capitalizar cada palabra (PascalCase)
  const words = withoutAccents.split(/\s+/);
  const normalized = words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
  
  console.log(`normalizeTableName: "${name}" → "${normalized}"`);
  return normalized;
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
  // Normalizar nombre de tabla
  const normalizedTableName = normalizeTableName(tableName);
  
  // Validar atributo
  if (!validateAttribute(attributeName)) {
    console.warn("No se permite usar 'id' como nombre de atributo.");
    return false;
  }

  // Buscar la tabla (comparar nombres normalizados)
  const tableIndex = classes.findIndex(cls => cls.name === normalizedTableName);
  
  if (tableIndex === -1) {
    console.warn(`No se encontró la tabla '${normalizedTableName}'. Creando tabla automáticamente.`);
    // Crear tabla automáticamente con el atributo
    return addClassViaVoice(classes, setClasses, relationships, associations, updateDiagram, normalizedTableName, [attributeName]);
  }

  // Verificar si el atributo ya existe
  const existingClass = classes[tableIndex];
  if (existingClass.attributes.includes(attributeName)) {
    console.warn(`El atributo '${attributeName}' ya existe en la tabla '${normalizedTableName}'`);
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
  
  console.log(`Atributo '${attributeName}' agregado a la tabla '${normalizedTableName}'`);
  return true;
};

/**
 * Agrega una relación usando la misma lógica que RelationshipManager.addRelationship()
 */
export const addRelationshipViaVoice = (classes, relationships, setRelationships, updateDiagram, fromTable, toTable, relationshipType, relationshipName = "", class1Multiplicity = "", class2Multiplicity = "") => {
  // Normalizar nombres de tablas
  const normalizedFromTable = normalizeTableName(fromTable);
  const normalizedToTable = normalizeTableName(toTable);
  
  // Mapear multiplicidades de voz a valores PlantUML
  const mappedClass1Multiplicity = mapMultiplicity(class1Multiplicity);
  const mappedClass2Multiplicity = mapMultiplicity(class2Multiplicity);
  
  // Validar que las tablas existan
  const fromTableExists = classes.some(cls => cls.name === normalizedFromTable);
  const toTableExists = classes.some(cls => cls.name === normalizedToTable);
  
  if (!fromTableExists) {
    console.warn(`La tabla '${normalizedFromTable}' no existe`);
    return false;
  }
  
  if (!toTableExists) {
    console.warn(`La tabla '${normalizedToTable}' no existe`);
    return false;
  }

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
  // Normalizar el nombre de la clase para buscar
  const normalizedClassName = normalizeTableName(className);
  const classToDelete = classes.find(cls => cls.name === normalizedClassName);
  
  if (!classToDelete) {
    console.warn(`La clase '${normalizedClassName}' no existe. Clases disponibles: ${classes.map(c => c.name).join(', ')}`);
    return false;
  }

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
  
  const mappedType = typeMap[normalizedType] || voiceType;
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
    'uno a muchos': '1..*',
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
