// Función para convertir el XML a un formato que puedas utilizar en tu aplicación
export const importXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Extraer las clases del XML, excluyendo "EARootClass"
    const classes = Array.from(xmlDoc.getElementsByTagName("UML:Class"))
        .filter((classElement) => classElement.getAttribute("name") !== "EARootClass")
        .map((classElement) => {
            const name = classElement.getAttribute("name");
            const attributes = Array.from(classElement.getElementsByTagName("UML:Attribute")).map(
                (attrElement) => attrElement.getAttribute("name")
            );

            return {
                name,
                id: classElement.getAttribute("xmi.id"), // Guardar el ID para mapear asociaciones
                attributes,
            };
        });

    // Crear un mapa para buscar los nombres de clases por ID
    const classMap = new Map(classes.map(cls => [cls.id, cls.name]));

    // Extraer las generalizaciones (herencia) del XML
    const generalizations = Array.from(
        xmlDoc.getElementsByTagName("UML:Generalization")
    ).map((relElement) => {
        const from = classMap.get(relElement.getAttribute("subtype"));
        const to = classMap.get(relElement.getAttribute("supertype"));
        const type = "<|--"; // Representación de herencia

        return {
            from,
            to,
            type,
        };
    });

    // Extraer las asociaciones del XML
    const associations = Array.from(
        xmlDoc.getElementsByTagName("UML:Association")
    ).map((assocElement) => {
        const class1Id = assocElement
            .getElementsByTagName("UML:AssociationEnd")[0]
            .getAttribute("type");
        const class2Id = assocElement
            .getElementsByTagName("UML:AssociationEnd")[1]
            .getAttribute("type");
        const from = classMap.get(class1Id) || "unknown";
        const to = classMap.get(class2Id) || "unknown";
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
        };
    });

    // Extraer las dependencias y realizaciones
    const dependencies = Array.from(
        xmlDoc.getElementsByTagName("UML:Dependency")
    ).map((depElement) => {
        const from = classMap.get(depElement.getAttribute("client"));
        const to = classMap.get(depElement.getAttribute("supplier"));
        const type = "..>"; // Tipo de dependencia por defecto

        return {
            from,
            to,
            type,
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
