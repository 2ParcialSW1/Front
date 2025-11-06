// Función para convertir el XML a un formato que puedas utilizar en tu aplicación
export const importXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Extraer las clases del XML (buscar tanto UML:Class como uml:Class)
    const umlClassElements = Array.from(xmlDoc.getElementsByTagName("UML:Class"));
    const umlClassElementsLowerCase = Array.from(xmlDoc.getElementsByTagName("uml:Class"));
    const allClassElements = [...umlClassElements, ...umlClassElementsLowerCase];
    
    const classes = allClassElements
        .filter((classElement) => classElement.getAttribute("name") !== "EARootClass")
        .map((classElement) => {
            const name = classElement.getAttribute("name");
            const attributes1 = Array.from(classElement.getElementsByTagName("UML:Attribute")).map(
                (attrElement) => attrElement.getAttribute("name")
            );
            const attributes2 = Array.from(classElement.getElementsByTagName("uml:Property")).map(
                (attrElement) => attrElement.getAttribute("name")
            );
            const attributes = [...attributes1, ...attributes2];

            return {
                name,
                id: classElement.getAttribute("xmi:id") || classElement.getAttribute("xmi.id"), // Intentar con y sin punto
                attributes,
            };
        });

    // Crear un mapa para buscar los nombres de clases por ID
    const classMap = new Map(classes.map(cls => [cls.id, cls.name]));

    // Extraer las generalizaciones (herencia) del XML SOLO SI EXISTEN
    const generalizations = Array.from(
        xmlDoc.getElementsByTagName("UML:Generalization")
    ).filter(relElement => {
        const from = classMap.get(relElement.getAttribute("subtype"));
        const to = classMap.get(relElement.getAttribute("supertype"));
        return from && to; // Solo incluir si ambas clases existen
    }).map((relElement) => {
        const from = classMap.get(relElement.getAttribute("subtype"));
        const to = classMap.get(relElement.getAttribute("supertype"));
        const type = "<|--"; // Representación de herencia

        return {
            from,
            to,
            type,
            class1Multiplicity: "", // Generalizaciones no tienen multiplicidad
            class2Multiplicity: "", // Generalizaciones no tienen multiplicidad
            name: "", // Nombre vacío por defecto
        };
    });

    // Extraer las asociaciones del XML SOLO SI EXISTEN
    const associations = Array.from(
        xmlDoc.getElementsByTagName("UML:Association")
    ).filter(assocElement => {
        const class1Id = assocElement.getElementsByTagName("UML:AssociationEnd")[0]?.getAttribute("type");
        const class2Id = assocElement.getElementsByTagName("UML:AssociationEnd")[1]?.getAttribute("type");
        const from = classMap.get(class1Id);
        const to = classMap.get(class2Id);
        return from && to; // Solo incluir si ambas clases existen
    }).map((assocElement) => {
        const class1Id = assocElement
            .getElementsByTagName("UML:AssociationEnd")[0]
            .getAttribute("type");
        const class2Id = assocElement
            .getElementsByTagName("UML:AssociationEnd")[1]
            .getAttribute("type");
        const from = classMap.get(class1Id);
        const to = classMap.get(class2Id);
        const class1Multiplicity = assocElement
            .getElementsByTagName("UML:AssociationEnd")[0]
            .getAttribute("multiplicity") || "1"; // Asignar multiplicidad por defecto si no está presente
        const class2Multiplicity = assocElement
            .getElementsByTagName("UML:AssociationEnd")[1]
            .getAttribute("multiplicity") || "1"; // Asignar multiplicidad por defecto si no está presente
        
        // Asignar el tipo correcto a las asociaciones (composición, agregación, simple, etc.)
        const type = assocElement.getElementsByTagName("UML:AssociationEnd")[0].getAttribute("aggregation") === "composite" 
            ? "*--" // Composición
            : assocElement.getElementsByTagName("UML:AssociationEnd")[0].getAttribute("aggregation") === "shared"
            ? "o--" // Agregación
            : "--"; // Asociación simple por defecto

        return {
            from,
            to,
            class1Multiplicity,
            class2Multiplicity,
            type,
            name: "", // Nombre vacío por defecto
        };
    });

    // Extraer las dependencias y realizaciones SOLO SI EXISTEN
    const dependencies = Array.from(
        xmlDoc.getElementsByTagName("UML:Dependency")
    ).filter(depElement => {
        const from = classMap.get(depElement.getAttribute("client"));
        const to = classMap.get(depElement.getAttribute("supplier"));
        return from && to; // Solo incluir si ambas clases existen
    }).map((depElement) => {
        const from = classMap.get(depElement.getAttribute("client"));
        const to = classMap.get(depElement.getAttribute("supplier"));
        const type = "..>"; // Tipo de dependencia por defecto

        return {
            from,
            to,
            type,
            class1Multiplicity: "", // Dependencias no tienen multiplicidad
            class2Multiplicity: "", // Dependencias no tienen multiplicidad
            name: "", // Nombre vacío por defecto
        };
    });

    // Unir todas las relaciones (generalizaciones, asociaciones, dependencias)
    const relationships = [...generalizations, ...associations, ...dependencies];

    console.log("Relaciones:", relationships);

    return {
        classes,
        relationships,
    };
};

// Función para leer el archivo XML y convertirlo en string
export const readXMLFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const xmlString = event.target.result;
            resolve(xmlString);
        };
        reader.onerror = () => {
            reject(new Error("Error al leer el archivo XML"));
        };
        reader.readAsText(file);
    });
};
