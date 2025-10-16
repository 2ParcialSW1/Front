export const extractClassesAndRelationshipsFromDiagram = (diagram) => {

    /* console.log("Extracting classes and relationships from diagram:", diagram); */

    const classRegex = /class\s+([a-zA-Z0-9_]+)\s*\{([^}]*)\}/g;
    const relationshipRegex = /([a-zA-Z0-9_]+)\s*"([0-9.*]*)"\s*([<>o*#x^+|}~-]+)\s*"([0-9.*]*)"\s*([a-zA-Z0-9_]+)(?:\s*:\s*([a-zA-Z0-9_]+))?/g;
    const associationRegex = /\(([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\)\s*\.\.\s*([a-zA-Z0-9_]+)/g;

    const foundClasses = [];
    const foundRelationships = [];
    const foundAssociations = [];

    let match;

    // Extraer clases
    while ((match = classRegex.exec(diagram)) !== null) {
        const attributes = match[2].trim().split("\n").map(attr => attr.trim()).filter(attr => attr);
        foundClasses.push({ name: match[1], attributes });
    }

    // Extraer relaciones
    while ((match = relationshipRegex.exec(diagram)) !== null) {
        const newRelationship = {
            from: match[1],
            class1Multiplicity: match[2],
            type: match[3],
            class2Multiplicity: match[4],
            to: match[5],
            name: match[6] || ""
        };

        if (!foundRelationships.some(rel =>
            rel.from === newRelationship.from &&
            rel.to === newRelationship.to &&
            rel.type === newRelationship.type
        )) {
            foundRelationships.push(newRelationship);
        }
    }

    // Extraer asociaciones
    while ((match = associationRegex.exec(diagram)) !== null) {
        const newAssociation = {
            class1: match[1],
            class2: match[2],
            associationClass: match[3],
        };

        if (!foundAssociations.some(assoc =>
            assoc.class1 === newAssociation.class1 &&
            assoc.class2 === newAssociation.class2 &&
            assoc.associationClass === newAssociation.associationClass
        )) {
            foundAssociations.push(newAssociation);
        }
    }

    return { foundClasses, foundRelationships, foundAssociations };
};
