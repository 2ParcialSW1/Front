import { useState } from "react";
import plantUmlEncoder from 'plantuml-encoder';

export const useDiagramContent = (socket, diagramId, diagramName, diagramAnfitrion, diagramParticipants, updateDiagramHook) => {
    const [diagramContent, setDiagramContent] = useState("");
    const [classes, setClasses] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [associations, setAssociations] = useState([]);

    const handleUpdateDiagramContent = async () => {
        console.log("Updating diagram with current state:");
        console.log("Classes:", classes);
        console.log("Relationships:", relationships);
        console.log("Associations:", associations);
    
        const plantUMLCode = generatePlantUML(classes, relationships, associations);
        setDiagramContent(plantUMLCode);
    
        try {
            await updateDiagramHook(diagramId, {
                diagram: plantUMLCode,
                name: diagramName,
                anfitrion: diagramAnfitrion,
                participantes: diagramParticipants,
            });
    
            const encodedString = plantUmlEncoder.encode(plantUMLCode);
            const plantUMLUrl = `http://www.plantuml.com/plantuml/svg/${encodedString}`;
            setDiagramContent(plantUMLUrl);
    
            if (socket) {
                socket.emit("updateDiagram", { diagramId, diagramContent: plantUMLCode });
            }
        } catch (error) {
            console.error("Error updating diagram:", error);
        }
    };

    const generatePlantUML = (updatedClasses, updatedRelationships, updatedAssociations) => {
        let plantUML = "@startuml\n";

        updatedClasses.forEach(cls => {
            plantUML += `class ${cls.name} {\n`;
            cls.attributes.forEach(attr => plantUML += `  ${attr}\n`);
            plantUML += "}\n";
        });

        const validTypes = ["<|--", "<|..", "-->", "..>", "..|>", "*--", "o--", "--", "<--*", "#--", "x--", "}--", "+--", "^--"];
        
        updatedRelationships.forEach(rel => {
            if (!validTypes.includes(rel.type)) return;
            const relationship = `${rel.from} "${rel.class1Multiplicity}" ${rel.type} "${rel.class2Multiplicity}" ${rel.to}`;
            plantUML += rel.name ? `${relationship} : ${rel.name}\n` : `${relationship}\n`;
        });

        updatedAssociations.forEach(assoc => {
            if (assoc.class1 && assoc.class2 && assoc.associationClass) {
                plantUML += `${assoc.class1} "0..*" - "1..*" ${assoc.class2}\n`;
                plantUML += `(${assoc.class1}, ${assoc.class2}) .. ${assoc.associationClass}\n`;
            }
        });

        plantUML += "\n@enduml";
        return plantUML;
    };

    return { 
        diagramContent, 
        setClasses, 
        setRelationships, 
        setAssociations, 
        handleUpdateDiagramContent 
    };
};
