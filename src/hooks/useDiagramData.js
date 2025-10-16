import { useEffect, useState, useRef } from "react";

export const useDiagramData = (diagramId, getDiagramByIdHook, extractClassesAndRelationshipsFromDiagram) => {
    const [diagramName, setDiagramName] = useState("");
    const [diagramAnfitrion, setDiagramAnfitrion] = useState("");
    const [diagramParticipants, setDiagramParticipants] = useState([]);
    const [diagramContent, setDiagramContent] = useState("");  // Agregamos diagramContent
    const isFetched = useRef(false);  // Flag para controlar la primera ejecución

    useEffect(() => {
        if (diagramId && !isFetched.current) {  // Solo ejecuta una vez cuando `diagramId` cambia
            const fetchData = async () => {
                try {
                    const content = await getDiagramByIdHook(diagramId);
                    setDiagramName(content.name);
                    setDiagramAnfitrion(content.anfitrion);
                    setDiagramParticipants(content.participantes);

                    if (content.plantUML) {
                        setDiagramContent(content.plantUML);  // Establecemos diagramContent
                        extractClassesAndRelationshipsFromDiagram(content.plantUML);
                    }
                    isFetched.current = true;  // Marca como ya obtenidos los datos
                } catch (error) {
                    console.error("Error fetching diagram data:", error);
                }
            };

            fetchData();
        }
    }, [diagramId, getDiagramByIdHook, extractClassesAndRelationshipsFromDiagram]);

    return { diagramName, diagramAnfitrion, diagramParticipants, diagramContent };  // Asegúrate de devolver diagramContent
};
