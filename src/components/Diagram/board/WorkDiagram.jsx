/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import VoiceCommandListener from "../../Voice/VoiceCommandListener";
import DiagramGenerationListener from "../../Voice/DiagramGenerationListener";
import io from "socket.io-client";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useDiagramFetch } from "../../../hooks/useDiagramFetch";
/* import { useUserFetch } from "../../hooks/userFetch"; */
import plantUmlEncoder from 'plantuml-encoder';
import Config from "../../../config";

// Componentes personalizados
import ProjectNameModal from "../../Modals/ProjectNameModal";
import DiagramViewer from "./DiagramViewer";
import ClassManager from "./ClassManager";
import RelationshipManager from "./RelationshipManager";
import AssociationManager from "./AssociationManager";
import DiagramActions from "./DiagramActions";
import LoadingDiagram from "../../Loading/LoadingDiagram";
import ImageDiagramUploader from "./ImageDiagramUploader";
import XMLDiagramUploader from "./XMLDiagramUploader";

import { Bars3Icon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

import { generateAndExportXML } from './../../../utils/path-to-xml-export';
import { generateAndDownloadZip, generateAndDownloadSpringBootProject } from "../../../utils/path-to-spring-boot";
import { generateAndDownloadFlutterProject } from "../../../utils/path-to-flutter";
import ForeignKeyModal from "./ForeignKeyModal";
import ForeignKeyAssociationModal from "./ForeignKeyAssociationModal";
import { 
  addClassViaVoice, 
  addAttributeViaVoice, 
  addRelationshipViaVoice, 
  addAssociationViaVoice,
  deleteClassViaVoice,
  mapRelationshipType,
  normalizeTableName
} from '../../../utils/voiceCommandHelpers';
import { generateDiagramForDomain } from '../../../services/commandProcessor';

const { SOCKET_URL } = Config;

export default function WorkDiagram() {
    const [diagramContent, setDiagramContent] = useState("");
    const [diagramName, setDiagramName] = useState("");
    const [diagramId, setDiagramId] = useState("");
    const [diagramAnfitrion, setDiagramAnfitrion] = useState("");
    const [diagramParticipants, setDiagramParticipants] = useState([]);
    const { getDiagramByIdHook, updateDiagramHook } = useDiagramFetch();
    const { _id } = useParams();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    /* const { users } = useUserFetch(); */
    const user = useSelector((state) => state.user);
    const [usersConnected, setUsersConnected] = useState([]);
    const isServerUpdate = useRef(false);  // Nueva bandera para detectar si el cambio proviene del servidor

    // Estados para clases, relaciones y asociaciones
    const [classes, setClasses] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [associations, setAssociations] = useState([]);
    const [existingDiagram, setExistingDiagram] = useState("");

    // Prevenir comandos duplicados
    const commandsInProgress = useRef(new Set());

    // Manejar comandos de voz usando helpers que reutilizan la lógica de los managers
    const handleVoiceCommand = async (cmd) => {
      console.log("🎤 handleVoiceCommand -> recibido:", cmd);
      if (!cmd) {
        console.warn("handleVoiceCommand -> comando vacío");
        return;
      }

      // 🚫 Prevenir comandos duplicados
      const commandId = `${cmd.acción}_${JSON.stringify(cmd.parámetros)}`;
      if (commandsInProgress.current.has(commandId)) {
        console.log("⏸️ Comando ya en progreso, ignorando duplicado:", commandId);
        return;
      }
      
      commandsInProgress.current.add(commandId);
      
      // ⏰ Limpiar comando después de 2 segundos
      setTimeout(() => {
        commandsInProgress.current.delete(commandId);
      }, 2000);

      // Normalizar comando para usar nombres consistentes
      const normalizedCmd = {
        action: cmd.acción || cmd.action,
        tableName: cmd.parámetros?.tabla || cmd.tableName || selectedTable,
        attributeName: cmd.parámetros?.atributo || cmd.attributeName,
        fromTable: cmd.parámetros?.desde || cmd.fromTable,
        toTable: cmd.parámetros?.hacia || cmd.toTable,
        relationshipType: cmd.parámetros?.tipo || cmd.relationshipType,
        relationshipName: cmd.parámetros?.nombre || cmd.relationshipName,
        class1Multiplicity: cmd.parámetros?.multiplicidad1 || cmd.class1Multiplicity,
        class2Multiplicity: cmd.parámetros?.multiplicidad2 || cmd.class2Multiplicity,
        associationClass: cmd.parámetros?.clase_asociacion || cmd.associationClass,
        faltaMultiplicidad: cmd.parámetros?.falta_multiplicidad,
        claseIntermediaNombre: cmd.parámetros?.clase_intermedia_nombre,
        claseIntermediaNombres: cmd.parámetros?.clase_intermedia_nombres,
      };

      // ----------------- Agregar tabla -----------------
      if (normalizedCmd.action === "agregar_tabla" || normalizedCmd.action === "addTable") {
        if (!normalizedCmd.tableName) {
          console.warn("No se especificó el nombre de la tabla a agregar");
          return;
        }
        
        const normalizedTableName = normalizeTableName(normalizedCmd.tableName);
        console.log(`Normalizando: "${normalizedCmd.tableName}" → "${normalizedTableName}"`);
        const success = addClassViaVoice(
          classes, 
          setClasses, 
          relationships, 
          associations, 
          handleUpdateDiagramContent, 
          normalizedTableName, 
          []
        );
        
        if (success) {
          setSelectedTable(normalizedTableName);
        }
        return;
      }

      // ----------------- Seleccionar tabla -----------------
      if (normalizedCmd.action === "seleccionar" || normalizedCmd.action === "selectTable") {
        if (!normalizedCmd.tableName) {
          console.warn("No se especificó el nombre de la tabla a seleccionar");
          return;
        }
        
        const normalizedTableName = normalizeTableName(normalizedCmd.tableName);
        const tableExists = classes.some(cls => cls.name === normalizedTableName);
        
        if (!tableExists) {
          console.warn(`La tabla '${normalizedTableName}' no existe`);
          return;
        }
        
        setSelectedTable(normalizedTableName);
        console.log(`Tabla seleccionada: ${normalizedTableName}`);
        return;
      }
      
      // ----------------- Agregar atributo -----------------
      if (normalizedCmd.action === "agregar_atributo" || normalizedCmd.action === "addAttribute") {
        if (!normalizedCmd.attributeName) {
          console.warn("No se especificó el atributo a agregar");
          return;
        }
        
        const tableName = normalizedCmd.tableName || selectedTable;
        if (!tableName) {
          console.warn("No se especificó tabla. Se creará una automáticamente llamada 'TablaNueva'");
          addClassViaVoice(classes, setClasses, relationships, associations, handleUpdateDiagramContent, "TablaNueva", [normalizedCmd.attributeName]);
          setSelectedTable("TablaNueva");
          return;
        }
        
        addAttributeViaVoice(
          classes, 
          setClasses, 
          relationships, 
          associations, 
          handleUpdateDiagramContent, 
          tableName, 
          normalizedCmd.attributeName
        );
        return;
      }

      // ----------------- Eliminar atributo -----------------
      if (normalizedCmd.action === "eliminar_atributo" || normalizedCmd.action === "deleteAttribute") {
        if (!normalizedCmd.attributeName) {
          console.warn("No se especificó el atributo a eliminar");
          return;
        }
        
        const tableName = normalizedCmd.tableName || selectedTable;
        if (!tableName) {
          console.warn("No se especificó tabla para eliminar el atributo");
          return;
        }
        
        const normalizedTableName = normalizeTableName(tableName);
        const tableIndex = classes.findIndex(cls => cls.name === normalizedTableName);
        
        if (tableIndex === -1) {
          console.warn(`No se encontró la tabla '${normalizedTableName}'`);
          return;
        }
        
        const updatedClasses = classes.map((cls, idx) => {
          if (idx === tableIndex) {
            const updatedAttributes = cls.attributes.filter(attr => attr !== normalizedCmd.attributeName);
            if (updatedAttributes.length === cls.attributes.length) {
              console.warn(`El atributo '${normalizedCmd.attributeName}' no existe en la tabla '${normalizedTableName}'`);
            } else {
              console.log(`Atributo '${normalizedCmd.attributeName}' eliminado de la tabla '${normalizedTableName}'`);
            }
            return { ...cls, attributes: updatedAttributes };
          }
          return cls;
        });
        
        console.log("Eliminando atributo - Estado antes:", {
          classes: classes.length,
          relationships: relationships.length,
          associations: associations.length
        });
        
        setClasses(updatedClasses);
        
        console.log("Eliminando atributo - Estado después:", {
          updatedClasses: updatedClasses.length,
          relationships: relationships.length,
          associations: associations.length
        });
        
        handleUpdateDiagramContent(updatedClasses, relationships, associations);
        return;
      }

      // ----------------- Agregar relación -----------------
      if (normalizedCmd.action === "agregar_relacion" || normalizedCmd.action === "addRelationship") {
        console.log("🔍 DEBUG RELACIÓN:");
        console.log("  - normalizedCmd completo:", normalizedCmd);
        console.log("  - fromTable:", normalizedCmd.fromTable);
        console.log("  - toTable:", normalizedCmd.toTable);
        console.log("  - relationshipType:", normalizedCmd.relationshipType);
        console.log("  - class1Multiplicity:", normalizedCmd.class1Multiplicity);
        console.log("  - class2Multiplicity:", normalizedCmd.class2Multiplicity);
        
        if (!normalizedCmd.fromTable || !normalizedCmd.toTable) {
          console.warn("❌ Faltan parámetros para crear la relación (desde, hacia)");
          return;
        }

        // REGLA: Si es tipo "asociacion" sin multiplicidad especificada
        if (normalizedCmd.relationshipType === "asociacion" && normalizedCmd.faltaMultiplicidad) {
          console.warn("❌ Falta la multiplicidad para la asociación");
          alert("Para crear una asociación, debes especificar la multiplicidad. Por ejemplo: 'de uno a muchos'");
          return;
        }
        
        const mappedType = mapRelationshipType(normalizedCmd.relationshipType);
        console.log(`Creando relación: ${normalizedCmd.fromTable} ${mappedType} ${normalizedCmd.toTable} con multiplicidades ${normalizedCmd.class1Multiplicity} a ${normalizedCmd.class2Multiplicity}`);
        addRelationshipViaVoice(
          classes,
          relationships,
          setRelationships,
          handleUpdateDiagramContent,
          normalizedCmd.fromTable,
          normalizedCmd.toTable,
          mappedType,
          normalizedCmd.relationshipName,
          normalizedCmd.class1Multiplicity,
          normalizedCmd.class2Multiplicity
        );
        return;
      }

      // ----------------- Agregar asociación -----------------
      if (normalizedCmd.action === "agregar_asociacion" || normalizedCmd.action === "addAssociation") {
        if (!normalizedCmd.fromTable || !normalizedCmd.toTable) {
          console.warn("Faltan parámetros para crear la asociación (clase1, clase2)");
          return;
        }

        // Determinar el nombre de la clase intermedia
        let nombreClaseIntermedia;
        
        if (normalizedCmd.claseIntermediaNombre) {
          // Usuario especificó el nombre de la clase intermedia
          nombreClaseIntermedia = normalizedCmd.claseIntermediaNombre;
        } else if (normalizedCmd.claseIntermediaNombres) {
          // Usuario dijo "muchos a muchos" → combinar nombres de las tablas
          const fromTable = normalizeTableName(normalizedCmd.fromTable);
          const toTable = normalizeTableName(normalizedCmd.toTable);
          nombreClaseIntermedia = `${fromTable}${toTable}`;
        } else if (normalizedCmd.associationClass) {
          // Fallback a parámetro antiguo
          nombreClaseIntermedia = normalizedCmd.associationClass;
        } else {
          console.warn("Faltan parámetros para crear la asociación (clase_intermedia_nombre o clase_intermedia_nombres)");
          return;
        }
        
        addAssociationViaVoice(
          classes,
          relationships,
          associations,
          setAssociations,
          handleUpdateDiagramContent,
          normalizedCmd.fromTable,
          normalizedCmd.toTable,
          nombreClaseIntermedia
        );
        return;
      }

      // ----------------- Eliminar asociación -----------------
      if (normalizedCmd.action === "eliminar_asociacion" || normalizedCmd.action === "deleteAssociation") {
        if (!normalizedCmd.associationClass && !normalizedCmd.fromTable && !normalizedCmd.toTable) {
          console.warn("Especifica la clase intermedia o las clases a desasociar");
          return;
        }
        
        let updatedAssociations;
        let associationToDelete = null;
        
        if (normalizedCmd.associationClass) {
          // Eliminar por nombre de clase intermedia
          associationToDelete = associations.find(assoc => 
            normalizeTableName(assoc.associationClass) === normalizeTableName(normalizedCmd.associationClass)
          );
          updatedAssociations = associations.filter(assoc => 
            normalizeTableName(assoc.associationClass) !== normalizeTableName(normalizedCmd.associationClass)
          );
          console.log(`Eliminando asociación con clase intermedia: ${normalizedCmd.associationClass}`);
        } else if (normalizedCmd.fromTable && normalizedCmd.toTable) {
          // Eliminar por clases involucradas
          const normalizedFrom = normalizeTableName(normalizedCmd.fromTable);
          const normalizedTo = normalizeTableName(normalizedCmd.toTable);
          
          console.log("🔍 DEBUG Eliminar Asociación:");
          console.log("  - Buscando entre:", normalizedFrom, "y", normalizedTo);
          console.log("  - Asociaciones existentes:", associations);
          
          // Normalizar las clases de las asociaciones existentes para comparar
          associationToDelete = associations.find(assoc => {
            const normClass1 = normalizeTableName(assoc.class1);
            const normClass2 = normalizeTableName(assoc.class2);
            console.log(`  - Comparando: ${normClass1} - ${normClass2} con ${normalizedFrom} - ${normalizedTo}`);
            return (normClass1 === normalizedFrom && normClass2 === normalizedTo) ||
                   (normClass1 === normalizedTo && normClass2 === normalizedFrom);
          });
          
          console.log("  - Asociación encontrada:", associationToDelete);
          
          updatedAssociations = associations.filter(assoc => 
            !(normalizeTableName(assoc.class1) === normalizedFrom && normalizeTableName(assoc.class2) === normalizedTo) &&
            !(normalizeTableName(assoc.class1) === normalizedTo && normalizeTableName(assoc.class2) === normalizedFrom)
          );
          console.log(`Eliminando asociación entre: ${normalizedFrom} y ${normalizedTo}`);
        }
        
        if (updatedAssociations.length < associations.length && associationToDelete) {
          // Eliminar también la clase intermedia de las clases
          const updatedClasses = classes.filter(cls => cls.name !== associationToDelete.associationClass);
          setClasses(updatedClasses);
          setAssociations(updatedAssociations);
          handleUpdateDiagramContent(updatedClasses, relationships, updatedAssociations);
          console.log(`Asociación y clase intermedia '${associationToDelete.associationClass}' eliminadas exitosamente`);
        } else {
          console.warn("No se encontró la asociación a eliminar");
        }
        return;
      }

      // ----------------- Eliminar tabla -----------------
      if (normalizedCmd.action === "eliminar_tabla" || normalizedCmd.action === "deleteTable") {
        if (!normalizedCmd.tableName) {
          console.warn("No se especificó el nombre de la tabla a eliminar");
          return;
        }
        
        deleteClassViaVoice(
          classes,
          setClasses,
          relationships,
          setRelationships,
          associations,
          setAssociations,
          handleUpdateDiagramContent,
          normalizedCmd.tableName
        );
        return;
      }

      // ----------------- Eliminar relación específica -----------------
      if (normalizedCmd.action === "eliminar_relacion" || normalizedCmd.action === "deleteRelationship") {
        if (!normalizedCmd.fromTable || !normalizedCmd.toTable) {
          console.warn("No se especificó las tablas para eliminar la relación");
          return;
        }
        
        const normalizedFrom = normalizeTableName(normalizedCmd.fromTable);
        const normalizedTo = normalizeTableName(normalizedCmd.toTable);
        
        const updatedRelationships = relationships.filter(rel => 
          !(normalizeTableName(rel.from) === normalizedFrom && normalizeTableName(rel.to) === normalizedTo) &&
          !(normalizeTableName(rel.from) === normalizedTo && normalizeTableName(rel.to) === normalizedFrom)
        );
        
        if (updatedRelationships.length < relationships.length) {
          setRelationships(updatedRelationships);
          handleUpdateDiagramContent(classes, updatedRelationships, associations);
          console.log(`Relación entre ${normalizedFrom} y ${normalizedTo} eliminada exitosamente`);
        } else {
          console.warn("No se encontró la relación a eliminar");
        }
        return;
      }

      // ----------------- Exportar diagrama -----------------
      if (normalizedCmd.action === "exportar_diagrama" || normalizedCmd.action === "exportDiagram") {
        console.log("Exportando diagrama a XML");
        handleExportXML();
        return;
      }

      // ----------------- Restaurar diagrama -----------------
      if (normalizedCmd.action === "restaurar_diagrama" || normalizedCmd.action === "restoreDiagram") {
        console.log("Restaurando diagrama a su estado original");
        restoreOriginalDiagram();
        return;
      }

      // ----------------- Limpiar diagrama -----------------
      if (normalizedCmd.action === "limpiar_diagrama" || normalizedCmd.action === "clearDiagram") {
        console.log("Limpiando diagrama");
        setClasses([]);
        setRelationships([]);
        setAssociations([]);
        handleUpdateDiagramContent([], [], []);
        return;
      }

      // ----------------- Limpiar relaciones -----------------
      if (normalizedCmd.action === "limpiar_relaciones" || normalizedCmd.action === "clearRelationships") {
        console.log("Limpiando relaciones");
        setRelationships([]);
        handleUpdateDiagramContent(classes, [], associations);
        return;
      }

      // ----------------- Generar diagrama base -----------------
      if (normalizedCmd.action === "generar_diagrama" || normalizedCmd.action === "generateDiagram" || 
          normalizedCmd.acción === "generar_diagrama") {
        const domain = normalizedCmd.dominio || normalizedCmd.domain || normalizedCmd.parámetros?.dominio;
        if (domain) {
          console.log(`🤖 Generando diagrama base para: ${domain}`);
          processDiagramGeneration(domain);
          setListeningForGeneration(false);
        } else {
          console.warn("No se especificó el dominio para generar el diagrama");
        }
        return;
      }

      console.warn("Comando no reconocido o incompleto:", normalizedCmd);
    };

    const [selectedTable, setSelectedTable] = useState(null); // Estado para la tabla seleccionada

    // Estado para controlar el ancho del sidebar
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    // Estados para mostrar u ocultar las secciones
    const [showClassManager, setShowClassManager] = useState(true);
    const [showRelationshipManager, setShowRelationshipManager] = useState(false);
    const [showAssociationManager, setShowAssociationManager] = useState(false);

    // Nombre del proyecto Spring Boot
    const [proyectName, setProyectName] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [showForeignKeyModal, setShowForeignKeyModal] = useState(false);
    const [showProjectNameModal, setShowProjectNameModal] = useState(false);
    const [foreignKeySelections, setForeignKeySelections] = useState({});

    // Modal Assocaition
    const [showForeignKeyAssociationModal, setShowForeignKeyAssociationModal] = useState(false);
    const [foreignKeyAssociation, setForeignKeyAssociation] = useState({});

    // Modal Flutter Export
    const [showFlutterModal, setShowFlutterModal] = useState(false);
    const [flutterProjectName, setFlutterProjectName] = useState("");
    const [flutterBackendUrl, setFlutterBackendUrl] = useState("http://localhost:8080");


    /* console.log("Relaciones:", relationships); */
    useEffect(() => {
        const socketInstance = io(SOCKET_URL);
        setSocket(socketInstance);

        // Emitir cuando el usuario se une a la sala
        socketInstance.emit("joinRoom", { diagramId: _id, user: user.email });
        socketInstance.emit("userConnected", { diagramId: _id, user });

        // Escuchar la actualización de usuarios conectados
        socketInstance.on("usersConnectedUpdate", (connectedUsers) => {
            console.log("Usuarios conectados actualizados:", connectedUsers);
            setUsersConnected(connectedUsers);
        });

        // Escuchar la actualización de diagramas desde el servidor
        socketInstance.on("diagramUpdated", (updatedDiagram) => {
            /* console.log("Diagrama actualizado recibido:", updatedDiagram); */
            isServerUpdate.current = true; // Marcamos que el cambio proviene del servidor
            extractClassesAndRelationshipsFromDiagram(updatedDiagram);
            const encodedString = plantUmlEncoder.encode(updatedDiagram);
            const plantUMLUrl = `http://www.plantuml.com/plantuml/svg/${encodedString}`;
            setDiagramContent(plantUMLUrl);
        });

        //Escuchar los usuarios conectados
        socketInstance.on("userConnected", (connectedUsers) => {
            console.log("Usuarios conectados:", connectedUsers);
            /* setUsersConnected(connectedUsers); */
        });

        // Verificar la conexión
        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        // Limpieza al desmontar el componente
        return () => {
            socketInstance.disconnect();
        };
    }, [_id, user.email, user]);

    useEffect(() => {
        const fetchData = async () => {
            const content = await getDiagramByIdHook(_id);
            setDiagramName(content.name);
            setDiagramId(content._id);
            setDiagramAnfitrion(content.anfitrion);
            setDiagramParticipants(content.participantes);

            if (content.plantUML) {
                const chart = `${content.plantUML}`;
                setExistingDiagram(chart);
                extractClassesAndRelationshipsFromDiagram(chart);
                const encodedString = plantUmlEncoder.encode(chart);
                const plantUMLUrl = `http://www.plantuml.com/plantuml/svg/${encodedString}`;
                setDiagramContent(plantUMLUrl);
            }
        };

        fetchData();
    }, [_id]);

    useEffect(() => {
        console.log("🔄 useEffect disparado:", {
            classesLength: classes.length,
            relationshipsLength: relationships.length,
            associationsLength: associations.length,
            isServerUpdate: isServerUpdate.current,
            relationshipsDetails: relationships
        });
        
        if ((classes.length || relationships.length || associations.length) && !isServerUpdate.current) {
            console.log("📝 Llamando handleUpdateDiagramContent desde useEffect");
            handleUpdateDiagramContent(classes, relationships, associations);
        } else {
            // Si fue una actualización desde el servidor, reseteamos el flag
            isServerUpdate.current = false;
        }
    }, [classes, relationships, associations]);

    const extractClassesAndRelationshipsFromDiagram = (diagram) => {
        console.log("Extrayendo clases y relaciones del diagrama", diagram);

        // Regex para capturar las clases correctamente
        const classRegex = /class\s+([a-zA-Z0-9_]+)\s*\{([^}]*)\}/g;

        // Regex mejorado para capturar las relaciones con multiplicidades
        const relationshipRegex = /([a-zA-Z0-9_]+)\s*(?:"([^"]*)")?\s*((?:--|-->|<\|--|\.\.>|\.\.\|>|\*--|--\*|o--|--o|--\+|--\|>|<--|#--|x--|}\--|--\+|\^--))\s*(?:"([^"]*)")?\s*([a-zA-Z0-9_]+)(?:\s*:\s*([a-zA-Z0-9_]+))?/g;

        // Regex para capturar las asociaciones simples (solo "-") 
        const simpleAssociationRegex = /([a-zA-Z0-9_]+)\s*(?:"([^"]*)")?\s*-\s*(?:"([^"]*)")?\s*([a-zA-Z0-9_]+)(?:\s*:\s*([a-zA-Z0-9_]+))?/g;

        // Regex para capturar asociaciones intermedias (tablas intermedias)
        const tableAssociationRegex = /\((\w+),\s*(\w+)\)\s*\.\.\s*(\w+)/g;

        const foundClasses = [];
        const foundRelationships = [];
        const foundSimpleAssociations = [];
        const foundTableAssociations = [];
        let match;

        // Extraer clases primero
        while ((match = classRegex.exec(diagram)) !== null) {
            const attributes = match[2].trim().split("\n").map(attr => attr.trim()).filter(attr => attr);
            foundClasses.push({ name: normalizeTableName(match[1]), attributes });
        }

        // Mostrar clases encontradas
        console.log("Clases encontradas:", foundClasses);
        setClasses(foundClasses);

        // Limpiar el diagrama para extraer relaciones y asociaciones correctamente
        const cleanedDiagram = diagram
            .split("\n")
            .filter(line => {
                const trimmedLine = line.trim();
                
                // Ignorar líneas vacías, @startuml, @enduml
                if (trimmedLine.length === 0 || trimmedLine === "@startuml" || trimmedLine === "@enduml") {
                    return false;
                }
                
                // Ignorar líneas de definición de clases
                const isClassLine = trimmedLine.includes("class") || trimmedLine.includes("{") || trimmedLine.includes("}");
                if (isClassLine) {
                    return false;
                }
                
                // Verificar si es una línea de atributo (dentro de una clase)
                // Los atributos aparecen solos en líneas, las relaciones tienen símbolos
                const hasRelationshipSymbols = /--|-->|<\|--|\.\.>|\.\.\|>|\*--|--\*|o--|--o|--\+|--\|>|<--|#--|x--|}\--|--\+|\^--|\.\./.test(trimmedLine);
                const hasParentheses = /\(.*\).*\.\./.test(trimmedLine); // Para asociaciones intermedias
                
                if (hasRelationshipSymbols || hasParentheses) {
                    // Es una relación, mantenerla
                    return true;
                }
                
                // Si llegamos aquí, probablemente es un atributo suelto, eliminarlo
                return false;
            })
            .join("\n");

        console.log("Diagrama limpio:", cleanedDiagram);

        // Extraer asociaciones de tablas intermedias (que utilizan paréntesis)
        while ((match = tableAssociationRegex.exec(cleanedDiagram)) !== null) {
            /* console.log("Asociación intermedia encontrada:", match); */
            const newAssociation = {
                class1: normalizeTableName(match[1]),
                class2: normalizeTableName(match[2]),
                associationClass: normalizeTableName(match[3]),
            };

            if (!foundTableAssociations.some(assoc =>
                assoc.class1 === newAssociation.class1 &&
                assoc.class2 === newAssociation.class2 &&
                assoc.associationClass === newAssociation.associationClass
            )) {
                foundTableAssociations.push(newAssociation);
            }
        }

        // Extraer relaciones complejas (que usan "--", "o--", etc.), excluyendo asociaciones
        const cleanedDiagramWithoutTables = cleanedDiagram.replace(tableAssociationRegex, ""); // Eliminar asociaciones intermedias antes de extraer relaciones
        console.log("Diagrama sin tablas intermedias:", cleanedDiagramWithoutTables);

        console.log("Texto a procesar para relaciones:", cleanedDiagramWithoutTables);
        console.log("Regex utilizado:", relationshipRegex);
        
        while ((match = relationshipRegex.exec(cleanedDiagramWithoutTables)) !== null) {
            console.log("Match encontrado:", match);
            const newRelationship = {
                from: match[1],
                class1Multiplicity: match[2] || "", // Dejar vacío si no hay multiplicidad
                type: match[3],
                class2Multiplicity: match[4] || "", // Dejar vacío si no hay multiplicidad
                to: match[5],
                name: match[6] || "" // Nombre de la relación (opcional)
            };
            
            console.log("Relación extraída:", newRelationship);

            if (newRelationship.type !== "-") {
                // Evitar duplicados
                if (!foundRelationships.some(rel =>
                    rel.from === newRelationship.from &&
                    rel.to === newRelationship.to &&
                    rel.type === newRelationship.type &&
                    rel.name === newRelationship.name
                )) {
                    foundRelationships.push(newRelationship);
                }
            }
        }

        // Extraer asociaciones simples (que usan solo "-"), excluyendo relaciones
        while ((match = simpleAssociationRegex.exec(cleanedDiagramWithoutTables)) !== null) {
            /* console.log("Asociación simple encontrada:", match); */
            const newAssociation = {
                from: match[1],
                class1Multiplicity: match[2] || "", // Dejar vacío si no hay multiplicidad
                to: match[4],
                class2Multiplicity: match[3] || "", // Dejar vacío si no hay multiplicidad
                name: match[5] || "" // Nombre de la asociación (opcional)
            };

            // Evitar duplicados
            // if (newAssociation.type === "-") {
            if (!foundSimpleAssociations.some(assoc =>
                assoc.from === newAssociation.from &&
                assoc.to === newAssociation.to &&
                assoc.name === newAssociation.name
            )) {
                foundSimpleAssociations.push(newAssociation);
            }
            //}
        }

        // Mostrar relaciones y asociaciones encontradas
        console.log("Relaciones encontradas:", foundRelationships);
        setRelationships(foundRelationships);
        /* console.log("Asociaciones simples encontradas:", foundSimpleAssociations);
        console.log("Asociaciones intermedias encontradas:", foundTableAssociations); */

        const foundTableAssociationsData = [];
        foundSimpleAssociations.map(assoc => {
            const newAssociation = {
                class1: assoc.from,
                class2: assoc.to,
                associationClass: foundTableAssociations.find(tableAssoc =>
                    tableAssoc.class1 === assoc.from && tableAssoc.class2 === assoc.to
                )?.associationClass || "",
                class1Multiplicity: assoc.class1Multiplicity,
                class2Multiplicity: assoc.class2Multiplicity,
            };

            if (!foundTableAssociationsData.some(assocData =>
                assocData.class1 === newAssociation.class1 &&
                assocData.class2 === newAssociation.class2 &&
                assocData.associationClass === newAssociation.associationClass
            )) {
                foundTableAssociationsData.push(newAssociation);
            }
        });

        console.log("Asociaciones intermedias encontradas:", foundTableAssociationsData);

        // Combinar todas las asociaciones
        setAssociations(foundTableAssociationsData);
    };


    const handleUpdateDiagramContent = async (updatedClasses = classes, updatedRelationships = relationships, updatedAssociations = associations) => {
        const timestamp = Date.now();
        console.log(`🔧 handleUpdateDiagramContent iniciado [${timestamp}]:`, {
            classes: updatedClasses.length,
            relationships: updatedRelationships.length,
            associations: updatedAssociations.length
        });
        
        const plantUMLCode = generatePlantUML(updatedClasses, updatedRelationships, updatedAssociations);
        setDiagramContent(plantUMLCode);

        await updateDiagramHook(diagramId, {
            diagram: plantUMLCode,
            name: diagramName,
            anfitrion: diagramAnfitrion,
            participantes: diagramParticipants,
        });

        const encodedString = plantUmlEncoder.encode(plantUMLCode);
        const plantUMLUrl = `http://www.plantuml.com/plantuml/svg/${encodedString}`;
        setDiagramContent(plantUMLUrl);

        console.log("Emitiendo actualización de diagrama");
        socket.emit("updateDiagram", { diagramId, diagramContent: plantUMLCode });
    };

    const generatePlantUML = (updatedClasses = [], updatedRelationships = [], updatedAssociations = []) => {
        let plantUML = "@startuml\n";
        
        // Limpiar relaciones duplicadas y auto-relaciones
        const cleanRelationships = updatedRelationships.filter((rel, index, self) => {
            // Eliminar auto-relaciones
            if (rel.from === rel.to) {
                console.warn(`Eliminando auto-relación: ${rel.from} -> ${rel.to}`);
                return false;
            }
            
            // Eliminar duplicados basados en from, to y type
            const isDuplicate = self.findIndex(r => 
                r.from === rel.from && 
                r.to === rel.to && 
                r.type === rel.type &&
                r.class1Multiplicity === rel.class1Multiplicity &&
                r.class2Multiplicity === rel.class2Multiplicity
            ) !== index;
            
            if (isDuplicate) {
                console.warn(`Eliminando relación duplicada: ${rel.from} ${rel.type} ${rel.to}`);
                return false;
            }
            
            return true;
        });
        
        console.log(`Relaciones limpias: ${cleanRelationships.length} de ${updatedRelationships.length}`);

        updatedClasses.forEach(cls => {
            const normalizedName = normalizeTableName(cls.name);
            plantUML += `class ${normalizedName} {\n`;
            cls.attributes.forEach(attr => plantUML += `  ${attr}\n`);
            plantUML += "}\n";
        });

        const validTypes = [
            "<|--", "<|..", "-->", "..>", "..|>", "*--", "--*", "o--", "--o", "--", "--|>", "<|--",
            "<--*", "#--", "x--", "}--", "--+", "^--"
        ];

        cleanRelationships.forEach(rel => {
            console.log("Procesando relación:", rel);
            const { from, to, type, class1Multiplicity, class2Multiplicity, name } = rel;

            // Validar que no sea una auto-relación
            if (from === to) {
                console.warn(`Ignorando auto-relación: ${from} -> ${to}`);
                return;
            }

            // Mapear tipos descriptivos a símbolos de PlantUML
            let plantUMLType = type;
            if (type === "asociacion" || type === "asociación") {
                plantUMLType = "--";
            } else if (type === "herencia" || type === "extends") {
                plantUMLType = "<|--";
            } else if (type === "composicion" || type === "composición") {
                plantUMLType = "*--";
            } else if (type === "agregacion" || type === "agregación") {
                plantUMLType = "o--";
            } else if (type === "dependencia") {
                plantUMLType = "..>";
            }

            if (!validTypes.includes(plantUMLType)) {
                console.warn(`Tipo de relación no válido: ${type} -> ${plantUMLType}`);
                return;
            }

            // Construir la relación con multiplicidades en formato PlantUML correcto
            let relationship = "";
            
            // Formato: Clase1 "multiplicidad1" relación "multiplicidad2" Clase2
            const normalizedFrom = normalizeTableName(from);
            const normalizedTo = normalizeTableName(to);
            
            relationship += normalizedFrom;
            
            if (class1Multiplicity) {
                relationship += ` "${class1Multiplicity}"`;
            }
            
            relationship += ` ${plantUMLType}`;
            
            if (class2Multiplicity) {
                relationship += ` "${class2Multiplicity}"`;
            }
            
            relationship += ` ${normalizedTo}`;
            
            // Para debugging: mostrar formato alternativo también
            const alternativeFormat = `${from} ||${class1Multiplicity || ''}${plantUMLType}${class2Multiplicity || ''}|| ${to}`;
            console.log(`Formato alternativo: ${alternativeFormat}`);

            // Agregar el nombre de la relación si está presente
            plantUML += name ? `${relationship} : ${name}\n` : `${relationship}\n`;

            console.log(`PlantUML generado: ${relationship}`);
        });


        updatedAssociations.forEach(assoc => {
            if (assoc.class1 && assoc.class2 && assoc.associationClass) {
                if (!plantUML.includes(`class ${assoc.associationClass}`)) {
                    /* plantUML += `class ${assoc.associationClass} {\n`;
                    plantUML += `}\n`; */
                // Buscar en el plantUML la seccion de class y agregar la clase de asociacion
                const normalizedAssociationClass = normalizeTableName(assoc.associationClass);
                const classAssociation = `class ${normalizedAssociationClass} {\n}\n`;
                plantUML = plantUML.replace("@startuml", `@startuml\n${classAssociation}`);
                }

                /* plantUML += `${assoc.class1} "0..*" - "1..*" ${assoc.class2}\n`;
                plantUML += `(${assoc.class1}, ${assoc.class2}) .. ${assoc.associationClass}\n`; */
                // Buscar en el plantUML la seccion de relaciones y agregar la relacion al final
                const normalizedClass1 = normalizeTableName(assoc.class1);
                const normalizedClass2 = normalizeTableName(assoc.class2);
                const relationship = `${normalizedClass1} "0..*" - "1..*" ${normalizedClass2}\n(${normalizedClass1}, ${normalizedClass2}) .. ${normalizedAssociationClass}\n`;
                plantUML += relationship;
                /* plantUML += `class ${assoc.associationClass} {\n`;
                plantUML += `}\n`;
                plantUML += `${assoc.class1} "0..*" - "1..*" ${assoc.class2}\n`;
                plantUML += `(${assoc.class1}, ${assoc.class2}) .. ${assoc.associationClass}\n`; */
            }

            /* console.log("PlantUML:", plantUML); */
        });

        plantUML += "\n@enduml";
        console.log("PlantUML completo:", plantUML);
        return plantUML;
    };

    const restoreOriginalDiagram = () => {
        setClasses([]);
        setRelationships([]);
        setAssociations([]);
        extractClassesAndRelationshipsFromDiagram(existingDiagram);
    };

    const handleExportXML = () => {
        generateAndExportXML(diagramName, diagramAnfitrion, classes, relationships, associations);
    };

    // Manejar la presentación del modal para la clave foránea
    const handleProjectNameSubmit = (name) => {
        setProyectName(name); // Guardar el nombre del proyecto
        setShowProjectNameModal(false); // Cerrar el modal de nombre del proyecto
        setShowForeignKeyModal(true); // Abrir el modal para seleccionar la clave foránea
    };

    const handleForeignKeySubmit = (selections) => {
        setForeignKeySelections(selections); // Guardar las selecciones
        console.log("Selecciones de clave foránea:", foreignKeySelections);
        setShowForeignKeyModal(false); // Cerrar el modal de clave foránea

        if (associations.length > 0) {
            setShowForeignKeyAssociationModal(true); // Mostrar el modal para seleccionar la clase que llevará la clave foránea
        } else {
            // Proceder con la exportación después de la selección
            generateAndDownloadSpringBootProject(classes, relationships, associations, proyectName, selections, {});
        }
    };

    const handleForeignKeyAssociationSubmit = (selections) => {
        setForeignKeyAssociation(selections); // Guardar las selecciones
        console.log("Selecciones de clave foránea:", foreignKeyAssociation);
        setShowForeignKeyAssociationModal(false); // Cerrar el modal de clave foránea

        // Proceder con la exportación después de la selección
        generateAndDownloadSpringBootProject(classes, relationships, associations, proyectName, foreignKeySelections, selections);
    };

    const handleExportSpringBoot = () => {
        setShowProjectNameModal(true); // Mostrar el modal para el nombre del proyecto
    };

    // Handler para exportar a Flutter
    const handleExportFlutter = () => {
        setShowFlutterModal(true); // Mostrar el modal de configuración de Flutter
    };

    // Handler para confirmar exportación de Flutter
    const handleFlutterExportSubmit = async () => {
        if (!flutterProjectName.trim()) {
            alert("Por favor ingrese un nombre de proyecto");
            return;
        }

        if (classes.length === 0) {
            alert("No hay clases para exportar");
            return;
        }

        try {
            await generateAndDownloadFlutterProject(
                classes,
                relationships,
                associations,
                flutterProjectName,
                {},
                "com.example.demo",
                flutterBackendUrl
            );
            setShowFlutterModal(false);
            alert("¡Proyecto Flutter generado exitosamente!");
        } catch (error) {
            console.error("Error al generar proyecto Flutter:", error);
            alert("Error al generar el proyecto Flutter: " + error.message);
        }
    };

    // Estado para controlar el reconocimiento de voz para generación
    const [listeningForGeneration, setListeningForGeneration] = useState(false);

    // Estado para controlar el modal de importación desde imagen
    const [showImageUploader, setShowImageUploader] = useState(false);

    // Estado para controlar el modal de importación desde XML
    const [showXMLUploader, setShowXMLUploader] = useState(false);

    // Generar diagrama base desde un dominio por voz
    const handleGenerateDiagramBase = () => {
        console.log("🎙️ Activando reconocimiento de voz para generar diagrama base...");
        setListeningForGeneration(true);
        // El micrófono se activará automáticamente cuando se abra el modal
    };

    // Abrir modal de importación desde imagen
    const handleOpenImageUploader = () => {
        console.log("🖼️ Abriendo importador de imagen...");
        setShowImageUploader(true);
    };

    // Abrir modal de importación desde XML
    const handleOpenXMLUploader = () => {
        console.log("📄 Abriendo importador de XML...");
        setShowXMLUploader(true);
    };

    // Procesar diagrama extraído de la imagen
    const handleImageDiagramProcessed = (diagramData) => {
        console.log("🖼️ Procesando datos de imagen:", diagramData);
        
        try {
            // Limpiar diagrama actual
            setClasses([]);
            setRelationships([]);
            setAssociations([]);

            // Establecer nuevos datos
            setClasses(diagramData.classes);
            setRelationships(diagramData.relationships);
            setAssociations(diagramData.associations);

            // Actualizar el diagrama
            handleUpdateDiagramContent(
                diagramData.classes,
                diagramData.relationships,
                diagramData.associations
            );

            console.log("✅ Diagrama cargado desde imagen exitosamente!");
            alert("¡Diagrama importado exitosamente desde la imagen!");

        } catch (error) {
            console.error("❌ Error al cargar diagrama desde imagen:", error);
            alert("Error al cargar el diagrama desde la imagen.");
        }
    };

    // Procesar diagrama extraído del XML
    const handleXMLDiagramProcessed = (diagramData) => {
        console.log("📄 Procesando datos de XML:", diagramData);
        
        try {
            // Limpiar diagrama actual
            setClasses([]);
            setRelationships([]);
            setAssociations([]);

            // Establecer nuevos datos NORMALIZADOS
            const normalizedClasses = diagramData.classes.map(cls => ({
                ...cls,
                name: normalizeTableName(cls.name)
            }));
            const normalizedRelationships = diagramData.relationships.map(rel => ({
                ...rel,
                from: normalizeTableName(rel.from),
                to: normalizeTableName(rel.to)
            }));
            const normalizedAssociations = diagramData.associations?.map(assoc => ({
                ...assoc,
                class1: normalizeTableName(assoc.class1),
                class2: normalizeTableName(assoc.class2),
                associationClass: normalizeTableName(assoc.associationClass)
            })) || [];

            // ELIMINAR DUPLICADOS después de normalizar
            const uniqueClasses = normalizedClasses.filter((cls, index, self) => {
                const firstIndex = self.findIndex(c => c.name === cls.name);
                return firstIndex === index;
            });
            
            // Log para debugging
            if (normalizedClasses.length !== uniqueClasses.length) {
                console.warn(`⚠️ Clases duplicadas eliminadas: ${normalizedClasses.length - uniqueClasses.length}`);
            }

            setClasses(uniqueClasses);
            setRelationships(normalizedRelationships);
            setAssociations(normalizedAssociations);

            // Actualizar el diagrama con datos normalizados (usar uniqueClasses)
            handleUpdateDiagramContent(
                uniqueClasses,
                normalizedRelationships,
                normalizedAssociations
            );

            console.log("✅ Diagrama cargado desde XML exitosamente!");
            alert("¡Diagrama importado exitosamente desde XML!");

        } catch (error) {
            console.error("❌ Error al cargar diagrama desde XML:", error);
            alert("Error al cargar el diagrama desde XML.");
        }
    };

    // Función para procesar la generación de diagrama base
    const processDiagramGeneration = async (domain) => {
        console.log(`🤖 Generando diagrama base para: ${domain}`);
        
        try {
            console.log(`🔍 Llamando a generateDiagramForDomain con: "${domain.trim()}"`);
            const diagramData = await generateDiagramForDomain(domain.trim());
            
            if (!diagramData) {
                console.error("❌ generateDiagramForDomain devolvió null");
                alert("Error: No se pudo generar el diagrama base. Verifica la consola para más detalles.");
                return;
            }

            console.log("📊 Datos del diagrama generado:", diagramData);

            // Limpiar diagrama actual
            setClasses([]);
            setRelationships([]);
            setAssociations([]);

            // Procesar clases generadas
            if (diagramData.clases && Array.isArray(diagramData.clases)) {
                const newClasses = diagramData.clases.map(clase => ({
                    name: clase.nombre || clase.name,
                    attributes: clase.atributos || clase.attributes || []
                }));
                setClasses(newClasses);
                console.log("✅ Clases agregadas:", newClasses);
            }

            // Procesar relaciones generadas
            if (diagramData.relaciones && Array.isArray(diagramData.relaciones)) {
                const newRelationships = diagramData.relaciones.map(relacion => ({
                    from: relacion.desde || relacion.from,
                    to: relacion.hacia || relacion.to,
                    type: relacion.tipo || relacion.type || "asociacion",
                    name: relacion.nombre || relacion.name || "",
                    class1Multiplicity: relacion.multiplicidad1 || relacion.class1Multiplicity || "",
                    class2Multiplicity: relacion.multiplicidad2 || relacion.class2Multiplicity || ""
                }));
                setRelationships(newRelationships);
                console.log("✅ Relaciones agregadas:", newRelationships);
            }

            // Procesar asociaciones generadas (si las hay)
            if (diagramData.asociaciones && Array.isArray(diagramData.asociaciones)) {
                const newAssociations = diagramData.asociaciones.map(asociacion => ({
                    class1: asociacion.clase1 || asociacion.class1,
                    class2: asociacion.clase2 || asociacion.class2,
                    associationClass: asociacion.claseIntermedia || asociacion.associationClass
                }));
                setAssociations(newAssociations);
                console.log("✅ Asociaciones agregadas:", newAssociations);
            }

            // Actualizar el diagrama
            handleUpdateDiagramContent(
                diagramData.clases ? diagramData.clases.map(clase => ({
                    name: clase.nombre || clase.name,
                    attributes: clase.atributos || clase.attributes || []
                })) : [],
                diagramData.relaciones ? diagramData.relaciones.map(relacion => ({
                    from: relacion.desde || relacion.from,
                    to: relacion.hacia || relacion.to,
                    type: relacion.tipo || relacion.type || "asociacion",
                    name: relacion.nombre || relacion.name || "",
                    class1Multiplicity: relacion.multiplicidad1 || relacion.class1Multiplicity || "",
                    class2Multiplicity: relacion.multiplicidad2 || relacion.class2Multiplicity || ""
                })) : [],
                diagramData.asociaciones ? diagramData.asociaciones.map(asociacion => ({
                    class1: asociacion.clase1 || asociacion.class1,
                    class2: asociacion.clase2 || asociacion.class2,
                    associationClass: asociacion.claseIntermedia || asociacion.associationClass
                })) : []
            );

            console.log("🎉 Diagrama base generado exitosamente!");
            alert(`¡Diagrama base generado exitosamente para: ${domain}!`);

        } catch (error) {
            console.error("Error al generar diagrama base:", error);
            alert("Error al generar el diagrama base. Verifica tu conexión a internet y la clave de API de OpenAI.");
        }
    };



    return (
        <div className="flex w-full h-full">
            <VoiceCommandListener onCommand={handleVoiceCommand} />
            <DiagramGenerationListener 
                isActive={listeningForGeneration}
                onDomainDetected={processDiagramGeneration}
                onClose={() => setListeningForGeneration(false)}
            />
            <ImageDiagramUploader 
                isActive={showImageUploader}
                onClose={() => setShowImageUploader(false)}
                onDiagramProcessed={handleImageDiagramProcessed}
            />
            <XMLDiagramUploader 
                isActive={showXMLUploader}
                onClose={() => setShowXMLUploader(false)}
                onDiagramProcessed={handleXMLDiagramProcessed}
            />
            <div className={`${sidebarExpanded ? "w-64" : "w-16 h-screen"} bg-gray-800 text-gray-300 transition-all duration-300 relative`}>
                <button
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    className="absolute top-4 -right-8 bg-blue-500 p-2 rounded-full text-white shadow-lg"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>

                {sidebarExpanded && (
                    <div className="p-4 space-y-6">
                        <h1 className="text-2xl font-bold mb-6">{diagramName}</h1>

                        <DiagramActions
                            onSave={() =>
                                handleUpdateDiagramContent(classes, relationships, associations)
                            }
                            onRestore={restoreOriginalDiagram}
                        />

                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                            onClick={handleExportXML}>Exportar XML</button>

                        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                            onClick={handleGenerateDiagramBase}>🤖 Generar Diagrama Base</button>

                        <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg"
                            onClick={handleOpenImageUploader}>🖼️ Importar desde Imagen</button>

                        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
                            onClick={handleOpenXMLUploader}>📄 Importar desde XML</button>

                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                            onClick={handleExportSpringBoot}>Exportar Spring Boot</button>

                        <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-lg"
                            onClick={handleExportFlutter}>📱 Exportar Flutter</button>

                        {/* Modal para ingresar el nombre del proyecto */}
                        <ProjectNameModal
                            show={showProjectNameModal}
                            onClose={() => setShowProjectNameModal(false)}
                            onSubmit={handleProjectNameSubmit}
                        />

                        {/* Modal para seleccionar la clase que llevará la clave foránea */}
                        <ForeignKeyModal
                            show={showForeignKeyModal}
                            onClose={() => setShowForeignKeyModal(false)}
                            onSubmit={handleForeignKeySubmit}
                            relationships={relationships}
                        />

                        {/* Modal para seleccionar la clase que llevará la clave foránea */}
                        <ForeignKeyAssociationModal
                            show={showForeignKeyAssociationModal}
                            onClose={() => setShowForeignKeyAssociationModal(false)}
                            onSubmit={handleForeignKeyAssociationSubmit}
                            associations={associations} // Enviar asociaciones
                        />

                        {/* Modal para exportar a Flutter */}
                        {showFlutterModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Exportar a Flutter</h2>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2 text-gray-700">
                                            Nombre del Proyecto
                                        </label>
                                        <input
                                            type="text"
                                            value={flutterProjectName}
                                            onChange={(e) => setFlutterProjectName(e.target.value)}
                                            placeholder="mi_proyecto_flutter"
                                            className="w-full border rounded px-3 py-2 text-gray-800"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Solo letras minúsculas, números y guiones bajos
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2 text-gray-700">
                                            URL del Backend Spring Boot
                                        </label>
                                        <input
                                            type="text"
                                            value={flutterBackendUrl}
                                            onChange={(e) => setFlutterBackendUrl(e.target.value)}
                                            placeholder="http://localhost:8080"
                                            className="w-full border rounded px-3 py-2 text-gray-800"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            URL donde está ejecutándose el backend
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                                        <h3 className="font-semibold text-sm text-blue-900 mb-2">📋 Información</h3>
                                        <ul className="text-xs text-blue-800 space-y-1">
                                            <li>✅ Genera app Flutter completa</li>
                                            <li>✅ Pantallas CRUD para cada entidad</li>
                                            <li>✅ Conexión con API REST</li>
                                            <li>✅ Gestión de estado con Provider</li>
                                            <li>✅ Multi-plataforma (Android, iOS, Web)</li>
                                        </ul>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setShowFlutterModal(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleFlutterExportSubmit}
                                            className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                                        >
                                            Generar Proyecto Flutter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal para ingresar el nombre del proyecto */}
                        <ProjectNameModal
                            show={showModal}
                            onClose={() => setShowModal(false)}
                            onSubmit={handleProjectNameSubmit}
                        />

                        <div>
                            <button
                                onClick={() => setShowClassManager(!showClassManager)}
                                className="text-left w-full flex justify-between items-center py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg"
                            >
                                <span>Class Manager</span>
                                {showClassManager ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </button>
                            {showClassManager && (
                                <ClassManager
                                    classes={classes}
                                    setClasses={setClasses}
                                    relationships={relationships}
                                    setRelationships={setRelationships}
                                    associations={associations || []}  // <-- Aquí asegúrate de que no sea undefined
                                    setAssociations={setAssociations}
                                    updateDiagram={handleUpdateDiagramContent}
                                />
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => setShowRelationshipManager(!showRelationshipManager)}
                                className="text-left w-full flex justify-between items-center py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg"
                            >
                                <span>Relationship Manager</span>
                                {showRelationshipManager ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </button>
                            {showRelationshipManager && (
                                <RelationshipManager
                                    classes={classes}
                                    relationships={relationships}
                                    setRelationships={setRelationships}
                                    updateDiagram={handleUpdateDiagramContent}
                                />
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => setShowAssociationManager(!showAssociationManager)}
                                className="text-left w-full flex justify-between items-center py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg"
                            >
                                <span>Association Manager</span>
                                {showAssociationManager ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </button>
                            {showAssociationManager && (
                                <AssociationManager
                                    classes={classes}
                                    relationships={relationships}
                                    associations={associations}
                                    setAssociations={setAssociations}
                                    updateDiagram={handleUpdateDiagramContent}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={`${sidebarExpanded ? "w-3/4" : "w-[calc(100%-64px)]"} flex flex-col justify-center items-center bg-gray-100 p-6 transition-all duration-300`}>
                {diagramContent !== "" ? (
                    <DiagramViewer diagramContent={diagramContent} />
                ) : (
                    <LoadingDiagram />
                )}

                <h2 className="text-lg font-bold mt-4">
                    {isConnected ? "Conectado" : "Desconectado"}
                </h2>

                <h3>Usuarios conectados:</h3>
                <ul>
                    {usersConnected.map((connectedUser, index) => (
                        <li key={index}>{connectedUser.email}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
