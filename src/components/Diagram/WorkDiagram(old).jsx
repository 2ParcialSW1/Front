import { useEffect, useState } from "react";
import { useDiagramFetch } from "../../hooks/diagramFetch";
import io from "socket.io-client";
import { useSelector } from "react-redux";
import MermaidComponent from "../Mermaid/Mermaid";
import { useParams } from "react-router-dom";
import { useUserFetch } from "../../hooks/userFetch";
import LoadingDiagram from "../Loading/LoadingDiagram";
import Config from "../../config";
const { SOCKET_URL } = Config;

export default function WorkDiagram() {
    const [diagramContent, setDiagramContent] = useState("");
    const [diagramName, setDiagramName] = useState("");
    const [diagramId, setDiagramId] = useState("");
    const [diagramAnfitrion, setDiagramAnfitrion] = useState("");
    const [diagramParticipants, setDiagramParticipants] = useState([]);
    const [editorContent, setEditorContent] = useState("");
    const { getDiagramByIdHook, updateDiagramHook } = useDiagramFetch();
    const { _id } = useParams();
    /* Socket.io */
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { users } = useUserFetch();
    const user = useSelector((state) => state.user); // Obtiene el usuario del estado global
    const [usersConnected, setUsersConnected] = useState([]);


    useEffect(() => {
        const socket = io(SOCKET_URL);
        setSocket(socket);

        // Emite un evento "joinRoom" con el id del diagrama
        socket.emit("joinRoom", { diagramId: _id, user: user.email });

        socket.emit("userConnected", { diagramId: _id, user: user });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* const DEFAULT_CONFIG = {
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        themeCSS: `
    g.classGroup rect {
      fill: #282a36;
      stroke: #6272a4;
    } 
    g.classGroup text {
      fill: #f8f8f2;
    }
    g.classGroup line {
      stroke: #f8f8f2;
      stroke-width: 0.5;
    }
    .classLabel .box {
      stroke: #21222c;
      stroke-width: 3;
      fill: #21222c;
      opacity: 1;
    }
    .classLabel .label {
      fill: #f1fa8c;
    }
    .relation {
      stroke: #ff79c6;
      stroke-width: 1;
    }
    #compositionStart, #compositionEnd {
      fill: #bd93f9;
      stroke: #bd93f9;
      stroke-width: 1;
    }
    #aggregationEnd, #aggregationStart {
      fill: #21222c;
      stroke: #50fa7b;
      stroke-width: 1;
    }
    #dependencyStart, #dependencyEnd {
      fill: #00bcd4;
      stroke: #00bcd4;
      stroke-width: 1;
    } 
    #extensionStart, #extensionEnd {
      fill: #f8f8f2;
      stroke: #f8f8f2;
      stroke-width: 1;
    }`,
        fontFamily: "Fira Code"
    }; */

    useEffect(() => {
        const fetchData = async () => {
            const content = await getDiagramByIdHook(_id);
            const chart = `${content.plantUML}`;
            setDiagramName(content.name);
            setDiagramId(content._id);
            setDiagramAnfitrion(content.anfitrion);
            setDiagramParticipants(content.participantes);
            setDiagramContent(chart);
            setEditorContent(chart);

            /* // Intenta inicializar Mermaid aquí después de obtener el contenido
            mermaid.initialize({ startOnLoad: true });
            mermaid.contentLoaded();

            // Log para verificar que la inicialización se ha realizado
            console.log("Mermaid initialized"); */
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_id]);

    const handleUpdateDiagramContent = async () => {
        setDiagramContent(editorContent);

        // Actualiza el diagrama en la base de datos
        await updateDiagramHook(diagramId, { diagram: editorContent, name: diagramName, anfitrion: diagramAnfitrion, participantes: diagramParticipants });

        // Emite un evento "updateDiagram" con el nuevo contenido del diagrama
        socket.emit("updateDiagram", { diagramContent: editorContent });
        console.log('socket', socket);
    };

    useEffect(() => {
        const handleDiagramUpdate = data => {
            // Aquí puedes realizar acciones cuando ocurra el evento 'diagramUpdate'
            setDiagramContent(data.plantUML);
            setEditorContent(data.plantUML);
            console.log('Estoy en el useEffect');
            console.log('Diagram updated:', data);
        };

        const handleUserConnected = data => {
            // Aquí puedes realizar acciones cuando ocurra el evento 'userConnected'
            console.log('User connected:', data.user);
            setUsersConnected(usersConnected => [...usersConnected, data.user])
        }
        if (socket) {
            socket.on("updateDiagram", handleDiagramUpdate);
            socket.on("userConnected", handleUserConnected);
            console.log('socket', socket);
            setIsConnected(true); // Actualizar el estado aquí
        }

        return () => {
            if (socket) {
                socket.off("updateDiagram", handleDiagramUpdate);
            }
        };
    }, [socket]);

    const templateXML = `<?xml version="1.0" encoding="windows-1252"?>
<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" timestamp="2024-04-24 21:47:39">
    <XMI.header>
        <XMI.documentation>
            <XMI.exporter>Enterprise Architect</XMI.exporter>
            <XMI.exporterVersion>2.5</XMI.exporterVersion>
        </XMI.documentation>
    </XMI.header>
    <XMI.content>
        <UML:Model name="EA Model" xmi.id="MX_EAID_7A9BC04A_0621_4be2_BC1A_1050474C5220">
            <UML:Namespace.ownedElement>
                <UML:Class name="EARootClass" xmi.id="EAID_11111111_5487_4080_A7F4_41526CB0AA00" isRoot="true" isLeaf="false" isAbstract="false"/>
                <UML:Package name="Vista Diagrama de Secuencia" xmi.id="EAPK_7A9BC04A_0621_4be2_BC1A_1050474C5220" isRoot="false" isLeaf="false" isAbstract="false" visibility="public">
                    <UML:ModelElement.taggedValue>
                        <UML:TaggedValue tag="parent" value="EAPK_B20E5B0B_5010_43a6_BCE1_D38F0FF46E8A"/>
                        <UML:TaggedValue tag="created" value="2024-04-24 21:45:00"/>
                        <UML:TaggedValue tag="modified" value="2024-04-24 21:45:00"/>
                        <UML:TaggedValue tag="iscontrolled" value="FALSE"/>
                        <UML:TaggedValue tag="version" value="1.0"/>
                        <UML:TaggedValue tag="isprotected" value="FALSE"/>
                        <UML:TaggedValue tag="usedtd" value="FALSE"/>
                        <UML:TaggedValue tag="logxml" value="FALSE"/>
                        <UML:TaggedValue tag="packageFlags" value="CRC=0;"/>
                        <UML:TaggedValue tag="phase" value="1.0"/>
                        <UML:TaggedValue tag="status" value="Proposed"/>
                        <UML:TaggedValue tag="author" value="marco"/>
                        <UML:TaggedValue tag="complexity" value="1"/>
                        <UML:TaggedValue tag="ea_stype" value="Public"/>
                        <UML:TaggedValue tag="tpos" value="0"/>
                        <UML:TaggedValue tag="gentype" value="Java"/>
                    </UML:ModelElement.taggedValue>
                    <UML:Namespace.ownedElement>
                        <!-- Aquí se insertarán los actores -->
                    </UML:Namespace.ownedElement>
                </UML:Package>
            </UML:Namespace.ownedElement>
        </UML:Model>
        <UML:Diagram name="Vista Diagrama de Secuencia" xmi.id="EAID_D9E35F11_07A1_49f0_A9AF_37EB82B3C9D1" diagramType="SequenceDiagram" owner="EAPK_7A9BC04A_0621_4be2_BC1A_1050474C5220" toolName="Enterprise Architect 2.5">
            <UML:ModelElement.taggedValue>
                <UML:TaggedValue tag="version" value="1.0"/>
                <UML:TaggedValue tag="author" value="marco"/>
                <UML:TaggedValue tag="created_date" value="2024-04-24 21:45:08"/>
                <UML:TaggedValue tag="modified_date" value="2024-04-24 21:45:24"/>
                <UML:TaggedValue tag="package" value="EAPK_7A9BC04A_0621_4be2_BC1A_1050474C5220"/>
                <UML:TaggedValue tag="type" value="Sequence"/>
                <UML:TaggedValue tag="swimlanes" value="locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;hl=1;cls=0;SwimlaneFont=lfh:-13,lfw:0,lfi:0,lfu:0,lfs:0,lfface:ARIAL,lfe:0,lfo:0,lfchar:1,lfop:0,lfcp:0,lfq:0,lfpf=0,lfWidth=0;"/>
                <UML:TaggedValue tag="matrixitems" value="locked=false;matrixactive=false;swimlanesactive=true;kanbanactive=false;width=1;clrLine=0;"/>
                <UML:TaggedValue tag="ea_localid" value="11"/>
                <UML:TaggedValue tag="EAStyle" value="ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=1;HighlightForeign=1;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;PPgs.cx=1;PPgs.cy=1;DocSize.cx=850;DocSize.cy=1098;ShowDetails=0;Orientation=P;Zoom=100;ShowTags=0;OpParams=1;VisibleAttributeDetail=0;ShowOpRetType=1;ShowIcons=1;CollabNums=0;HideProps=0;ShowReqs=0;ShowCons=0;PaperSize=1;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideElemStereo=0;ShowTests=0;ShowMaint=0;ConnectorNotation=UML 2.1;ExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;ShowNotes=0;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;"/>
                <UML:TaggedValue tag="styleex" value="SaveTag=C3318D49;ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=0;INT_ARGS=;INT_RET=;INT_ATT=;SeqTopMargin=50;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.1;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;ProfileData=;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;"/>
            </UML:ModelElement.taggedValue>
            <UML:Diagram.element>
                <!-- Aquí se insertarán los elementos del diagrama -->
            </UML:Diagram.element>
        </UML:Diagram>
    </XMI.content>
    <XMI.difference/>
    <XMI.extensions xmi.extender="Enterprise Architect 2.5"/>
</XMI>`;


    const extractActors = async () => {
        // Dividir el string en líneas
        const lines = editorContent.split('\n');

        // Array para almacenar la información de actores y mensajes
        const actors = [];
        const messages = [];

        // Iterar sobre cada línea para extraer los actores
        lines.forEach(line => {
            // Verificar si la línea contiene un actor
            if (line.includes('actor')) {
                // Extraer el nombre del actor
                const actor = line.replace('actor', '').trim();
                actors.push({ type: 'actor', name: actor });
            }
        });

        // Iterar sobre cada línea para extraer los mensajes
        lines.forEach(line => {
            const match = line.match(/(\w+)-+>>(\w+):\s*(.*)/);
            if (match) {
                let sender = match[1].trim();
                let receiver = match[2].trim();
                const message = match[3].trim();

                // Si el sender o receiver no coincide con ningún actor, marcarlo como "desconocido"
                if (!actors.some(actor => actor.name === sender)) {
                    sender = 'desconocido';
                }
                if (!actors.some(actor => actor.name === receiver)) {
                    receiver = 'desconocido';
                }

                messages.push({ type: 'message', sender, receiver, message });
            }
        });

        const actorsAndMessages = actors.concat(messages);

        console.log(actorsAndMessages, 'Actors and messages');
        createXML(actorsAndMessages);

        return actorsAndMessages;
    }


    // Función para generar un ID aleatorio
    function generateId() {
        return 'EAID_' + Math.random().toString(36).substr(2, 10).toUpperCase();
    }

    function createXML(actorsAndMessages) {
        let actors = '';
        let elements = '';

        const packageId = generateId();

        actorsAndMessages.forEach(item => {
            if (item.type === 'actor') {
                /* actors += `<UML:Actor name="${item.name}" xmi.id="EAID_${item.name}" isRoot="false" isLeaf="false" isAbstract="false"/>`; */
                actors += `<UML:Actor name="${item.name}" xmi.id="${item.name}" visibility="public" namespace="${packageId}" isRoot="false" isLeaf="false" isAbstract="false">
                <UML:ModelElement.taggedValue>
                    <UML:TaggedValue tag="isSpecification" value="false"/>
                    <UML:TaggedValue tag="ea_stype" value="Actor"/>
                    <UML:TaggedValue tag="ea_ntype" value="0"/>
                    <UML:TaggedValue tag="version" value="1.0"/>
                    <UML:TaggedValue tag="isActive" value="false"/>
                    <UML:TaggedValue tag="package" value="EAPK_7A9BC04A_0621_4be2_BC1A_1050474C5220"/>
                    <UML:TaggedValue tag="date_created" value="2024-04-24 21:45:13"/>
                    <UML:TaggedValue tag="date_modified" value="2024-04-24 21:45:13"/>
                    <UML:TaggedValue tag="gentype" value="&lt;none&gt;"/>
                    <UML:TaggedValue tag="tagged" value="0"/>
                    <UML:TaggedValue tag="package_name" value="Vista Diagrama de Secuencia"/>
                    <UML:TaggedValue tag="phase" value="1.0"/>
                    <UML:TaggedValue tag="author" value="marco"/>
                    <UML:TaggedValue tag="complexity" value="1"/>
                    <UML:TaggedValue tag="status" value="Proposed"/>
                    <UML:TaggedValue tag="tpos" value="0"/>
                    <UML:TaggedValue tag="ea_localid" value="44"/>
                    <UML:TaggedValue tag="ea_eleType" value="element"/>
                    <UML:TaggedValue tag="style" value="BackColor=-1;BorderColor=-1;BorderWidth=-1;FontColor=-1;VSwimLanes=1;HSwimLanes=1;BorderStyle=0;"/>
                </UML:ModelElement.taggedValue>
            </UML:Actor>`;

                elements += `<UML:DiagramElement geometry="Left=181;Top=50;Right=271;Bottom=148;" subject="${item.name}" subjectType="UML:Actor" xmi.id="EAID_${item.name}" diagram="EAID_D9E35F11_07A1_49f0_A9AF_37EB82B3C9D1" style="BackColor=-1;BorderColor=-1;BorderWidth=-1;FontColor=-1;VSwimLanes=1;HSwimLanes=1;BorderStyle=0;"/>`;
            }
        });

        actors += `<UML:Collaboration xmi.id="EAID_7A9BC04A_0621_4be2_BC1A_1050474C5220_Collaboration" name="Collaborations">
                    <UML:Namespace.ownedElement/>
                        <UML:Collaboration.interaction>
                            <UML:Interaction xmi.id="EAID_7A9BC04A_0621_4be2_BC1A_1050474C5220_INT" name="EAID_7A9BC04A_0621_4be2_BC1A_1050474C5220_INT">
                                <UML:Interaction.message>`;

        actorsAndMessages.forEach(item => {
            if (item.type === 'message') {
                actors += `
                <UML:Message name="${item.message}" xmi.id="${item.message}" visibility="public" sender="${item.sender}" receiver="${item.receiver}">
                    <UML:ModelElement.taggedValue>
                    <UML:TaggedValue tag="style" value="1"/>
                    <UML:TaggedValue tag="ea_type" value="Sequence"/>
                    <UML:TaggedValue tag="direction" value="Source -&gt; Destination"/>
                    <UML:TaggedValue tag="linemode" value="1"/>
                    <UML:TaggedValue tag="linecolor" value="-1"/>
                    <UML:TaggedValue tag="linewidth" value="0"/>
                    <UML:TaggedValue tag="seqno" value="1"/>
                    <UML:TaggedValue tag="headStyle" value="0"/>
                    <UML:TaggedValue tag="lineStyle" value="0"/>
                    <UML:TaggedValue tag="privatedata1" value="Synchronous"/>
                    <UML:TaggedValue tag="privatedata2" value="retval=void;"/>
                    <UML:TaggedValue tag="privatedata3" value="Call"/>
                    <UML:TaggedValue tag="privatedata4" value="0"/>
                    <UML:TaggedValue tag="ea_localid" value="39"/>
                    <UML:TaggedValue tag="ea_sourceName" value="${item.sender}"/>
                    <UML:TaggedValue tag="ea_targetName" value="${item.receiver}"/>
                    <UML:TaggedValue tag="ea_sourceType" value="Actor"/>
                    <UML:TaggedValue tag="ea_targetType" value="Actor"/>
                    <UML:TaggedValue tag="ea_sourceID" value="90"/>
                    <UML:TaggedValue tag="ea_targetID" value="91"/>
                    <UML:TaggedValue tag="src_visibility" value="Public"/>
                    <UML:TaggedValue tag="src_isOrdered" value="false"/>
                    <UML:TaggedValue tag="src_targetScope" value="instance"/>
                    <UML:TaggedValue tag="src_changeable" value="none"/>
                    <UML:TaggedValue tag="src_isNavigable" value="false"/>
                    <UML:TaggedValue tag="src_containment" value="Unspecified"/>
                    <UML:TaggedValue tag="src_style" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Non-Navigable;"/>
                    <UML:TaggedValue tag="dst_visibility" value="Public"/>
                    <UML:TaggedValue tag="dst_aggregation" value="0"/>
                    <UML:TaggedValue tag="dst_isOrdered" value="false"/>
                    <UML:TaggedValue tag="dst_targetScope" value="instance"/>
                    <UML:TaggedValue tag="dst_changeable" value="none"/>
                    <UML:TaggedValue tag="dst_isNavigable" value="true"/>
                    <UML:TaggedValue tag="dst_containment" value="Unspecified"/>
                    <UML:TaggedValue tag="dst_style" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Navigable;"/>
                    <UML:TaggedValue tag="privatedata5" value="SX=0;SY=0;EX=0;EY=0;$LLB=;LLT=;LMT=CX=100:CY=10:OX=0:OY=0:HDN=0:BLD=0:ITA=0:UND=0:CLR=-1:ALN=0:DIR=0:ROT=0;LMB=;LRT=;LRB=;IRHS=;ILHS=;"/>
                    <UML:TaggedValue tag="sequence_points" value="PtStartX=194;PtStartY=-135;PtEndX=437;PtEndY=-135;"/>
                    <UML:TaggedValue tag="stateflags" value="Activation=0;ExtendActivationUp=0;"/>
                    <UML:TaggedValue tag="virtualInheritance" value="0"/>
                    <UML:TaggedValue tag="diagram" value="EAID_D9E35F11_07A1_49f0_A9AF_37EB82B3C9D1"/>
                    <UML:TaggedValue tag="mt" value="hola()"/>
                    </UML:ModelElement.taggedValue>
                </UML:Message>`;
                elements += `<UML:DiagramElement geometry="SX=0;SY=0;EX=0;EY=0;Path=;" subject="${item.message}" style=";Hidden=0;"/>`;
            }
        });

        actors += `</UML:Interaction.message>
                </UML:Interaction>
            </UML:Collaboration.interaction>
        </UML:Collaboration>`;

        const xml = templateXML.replace('<!-- Aquí se insertarán los actores -->', actors).replace('<!-- Aquí se insertarán los elementos del diagrama -->', elements);
        /* return xml; */
        console.log(xml);

        // Crear un Blob con el contenido XML
        const blob = new Blob([xml], { type: 'text/xml' });

        // Crear un URL a partir del Blob
        const url = window.URL.createObjectURL(blob);

        // Crear un enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = "fileName";

        // Simular un clic en el enlace para iniciar la descarga
        document.body.appendChild(a);
        a.click();

        // Liberar el URL del Blob
        window.URL.revokeObjectURL(url);
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex justify-center">
                <h1 className="text-2xl font-bold">{diagramName}</h1>
            </div>
            {/* User */}
            <div className="flex justify-center">
                <h2 className="text-xl font-bold">Anfitrión: {users.map((user) => (user._id === diagramAnfitrion) ? user.firstName + " " + user.lastName : "")}</h2>
            </div>
            <div className="flex justify-center">
                <h2 className="text-xl font-bold">Participantes: {diagramParticipants.map((participante) => (users.map((user) => (user._id === participante) ? user.firstName + " " + user.lastName : ""))).join(", ")}</h2>
            </div>
            {/* Usuarios Conectados */}
            <div className="flex justify-center">
                <h2 className="text-xl font-bold">Usuarios Conectados: {usersConnected.map((user) => (user.firstName + " " + user.lastName)).join(", ")}</h2>
            </div>
            <div>
                <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    rows={10}
                    cols={50}
                />
            </div>
            <div className="flex justify-end">
                <button
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
                    onClick={handleUpdateDiagramContent}
                >
                    Actualizar Contenido del Diagrama
                </button>

                {/* Extraer actores */}
                <button
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
                    onClick={extractActors}
                >
                    Extraer Actores
                </button>
            </div>
            {diagramContent !== "" ? (
                <MermaidComponent chart={diagramContent} /* config={DEFAULT_CONFIG} */ />
            ) : (
                <LoadingDiagram />
            )}
            <h2>{isConnected ? "Connected" : "Disconnected"}</h2>
        </div>
    );
}
