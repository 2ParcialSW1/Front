// Generar un ID único
const generateId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const idIndex = generateId();

// Función para generar y exportar el XML
export const generateAndExportXML = (
  diagramName,
  diagramAnfitrion,
  classes,
  relationships,
  associations
) => {
  const xmlHeader = `<?xml version="1.0" encoding="windows-1252"?>\n<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" timestamp="${new Date().toISOString()}">\n
    <XMI.header>\n<XMI.documentation>\n<XMI.exporter>Enterprise Architect</XMI.exporter>\n<XMI.exporterVersion>2.5</XMI.exporterVersion>\n</XMI.documentation>\n</XMI.header>
  `;
  const xmlFooter = `\n</XMI.content>\n<XMI.difference/>\n<XMI.extensions xmi.extender="Enterprise Architect 2.5"/>\n</XMI>`;

  // Aquí almacenamos los IDs de las clases
  const classData = classes.map((cls) => ({
    name: cls.name,
    id: generateId(),
    attributes: cls.attributes,
  }));

  /* console.log("Class Data", classData); */

  /* console.log("Relationships", relationships); */

  // Aqui almacenamos las IDs de las relaciones
  const relationshipData = relationships.map((rel) => ({
    id: generateId(),
    class1Multiplicity: rel.class1Multiplicity,
    class2Multiplicity: rel.class2Multiplicity,
    from: rel.from,
    idFrom: classData.find((cls) => cls.name === rel.from).id,
    name: rel.name,
    to: rel.to,
    idTo: classData.find((cls) => cls.name === rel.to).id,
    type: rel.type,
  }));

  /* console.log("Relationship Data", relationshipData); */

  console.log("Association Data", associations);
  //Aqui almacenamos las IDs de las asociaciones
  const associationData = associations.map((assoc) => ({
    id: generateId(),
    class1: assoc.class1,
    idClass1: classData.find((cls) => cls.name === assoc.class1).id,
    class1Multiplicity: assoc.class1Multiplicity,
    class2: assoc.class2,
    idClass2: classData.find((cls) => cls.name === assoc.class2).id,
    class2Multiplicity: assoc.class2Multiplicity,
    associationClass: assoc.associationClass,
    idAssociationClass: classData.find(
      (cls) => cls.name === assoc.associationClass
    ).id,
  }));

  console.log("Association Data", associationData);

  const modelSection = `
        <XMI.content>
            <UML:Model name="EA Model" xmi.id="MX_EAID_${generateId()}">
                <UML:Namespace.ownedElement>
                    <UML:Class name="EARootClass" xmi.id="EAID_${generateId()}" isRoot="true" isLeaf="false" isAbstract="false"/>
                    <UML:Package name="${diagramName}" xmi.id="EAPK_${idIndex}" isRoot="false" isLeaf="false" isAbstract="false" visibility="public">
                        <UML:ModelElement.taggedValue>
                            <UML:TaggedValue tag="parent" value="EAPK_${generateId()}"/>
                            <UML:TaggedValue tag="created" value="${new Date().toISOString()}"/>
                            <UML:TaggedValue tag="modified" value="${new Date().toISOString()}"/>
                            <UML:TaggedValue tag="iscontrolled" value="FALSE"/>
                            <UML:TaggedValue tag="version" value="1.0"/>
                            <UML:TaggedValue tag="author" value="${diagramAnfitrion}"/>
                            <UML:TaggedValue tag="complexity" value="1"/>
                            <UML:TaggedValue tag="status" value="Proposed"/>
                        </UML:ModelElement.taggedValue>
                        <UML:Namespace.ownedElement>
                            ${generateClassesXML(classData)}
                            ${generateRelationshipsXML(
                              relationshipData,
                              classData
                            )}
                            ${generateAssociationXML(associationData)}
                        </UML:Namespace.ownedElement>
                    </UML:Package>
                    <UML:DataType xmi.id="eaxmiid0" name="string" visibility="private" isRoot="false" isLeaf="false" isAbstract="false"/>
                </UML:Namespace.ownedElement>
            </UML:Model>
            ${generateDiagramSection(
              diagramName,
              classData,
              relationshipData,
              associationData
            )}
    `;

  const completeXML = xmlHeader + modelSection + xmlFooter;

  // Descarga el archivo XML generado
  const blob = new Blob([completeXML], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${diagramName}.xml`;
  link.click();
};

// Función para generar las clases
const generateClassesXML = (classData) => {
  return classData
    .map(
      (cls) => `
        <UML:Class name="${cls.name}" xmi.id="EAID_${
        cls.id
      }" visibility="public" namespace="EAPK_${idIndex}" isRoot="false" isLeaf="false" isAbstract="false" isActive="false">
            <UML:ModelElement.taggedValue>
                <UML:TaggedValue tag="isSpecification" value="false"/>
			    <UML:TaggedValue tag="ea_stype" value="Class"/>
				<UML:TaggedValue tag="ea_ntype" value="0"/>
				<UML:TaggedValue tag="version" value="1.0"/>
                <UML:TaggedValue tag="package" value="EAPK_${idIndex}"/>
                <UML:TaggedValue tag="date_created" value="${new Date().toISOString()}"/>
                <UML:TaggedValue tag="date_modified" value="${new Date().toISOString()}"/>
                <UML:TaggedValue tag="gentype" value="Java"/>
                <UML:TaggedValue tag="tagged" value="0"/>
                <UML:TaggedValue tag="package_name" value="${cls.name}"/>
                <UML:TaggedValue tag="phase" value="1.0"/>
                <UML:TaggedValue tag="author" value="marco"/>
                <UML:TaggedValue tag="complexity" value="1"/>
				<UML:TaggedValue tag="product_name" value="Java"/>
				<UML:TaggedValue tag="status" value="Proposed"/>
				<UML:TaggedValue tag="tpos" value="0"/>
				<UML:TaggedValue tag="ea_localid" value="331"/>
				<UML:TaggedValue tag="ea_eleType" value="element"/>
				<UML:TaggedValue tag="style" value="BackColor=-1;BorderColor=-1;BorderWidth=-1;FontColor=-1;VSwimLanes=1;HSwimLanes=1;BorderStyle=0;"/>
            </UML:ModelElement.taggedValue>
            <UML:Classifier.feature>
                ${generateAttributesXML(cls.attributes)}
            </UML:Classifier.feature>
        </UML:Class>
      `
    )
    .join("\n");
};

// Función para generar atributos de clases
const generateAttributesXML = (attributes) => {
  return attributes
    .map(
      (attr) => `
        <UML:Attribute name="${attr}" visibility="private">
            <UML:ModelElement.taggedValue>
                <UML:TaggedValue tag="type" value="string"/>
				<UML:TaggedValue tag="containment" value="Not Specified"/>
                <UML:TaggedValue tag="ordered" value="0"/>
				<UML:TaggedValue tag="collection" value="false"/>
				<UML:TaggedValue tag="position" value="0"/>
				<UML:TaggedValue tag="lowerBound" value="1"/>
				<UML:TaggedValue tag="upperBound" value="1"/>
				<UML:TaggedValue tag="duplicates" value="0"/>
				<UML:TaggedValue tag="ea_guid" value="{6DA4FDC9-BDD5-4fca-A0C0-3E12059CBE55}"/>
				<UML:TaggedValue tag="ea_localid" value="44"/>
				<UML:TaggedValue tag="styleex" value="volatile=0;"/>
            </UML:ModelElement.taggedValue>
        </UML:Attribute>
    `
    )
    .join("\n");
};

// Función para generar la sección del diagrama
const generateDiagramSection = (
  diagramName,
  classData,
  relationshipData,
  associationData
) => {
  return `
        <UML:Diagram name="${diagramName}" xmi.id="EAID_${generateId()}" diagramType="ClassDiagram" owner="EAPK_${idIndex}" toolName="Enterprise Architect 2.5">
            <UML:ModelElement.taggedValue>
                <UML:TaggedValue tag="version" value="1.0"/>
                <UML:TaggedValue tag="author" value="marco"/>
                <UML:TaggedValue tag="package" value="EAPK_${idIndex}"/>
                <UML:TaggedValue tag="type" value="Logical"/>
				<UML:TaggedValue tag="swimlanes" value="locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;hl=1;cls=0;SwimlaneFont=lfh:-13,lfw:0,lfi:0,lfu:0,lfs:0,lfface:ARIAL,lfe:0,lfo:0,lfchar:1,lfop:0,lfcp:0,lfq:0,lfpf=0,lfWidth=0;"/>
				<UML:TaggedValue tag="matrixitems" value="locked=false;matrixactive=false;swimlanesactive=true;kanbanactive=false;width=1;clrLine=0;"/>
				<UML:TaggedValue tag="ea_localid" value="69"/>
				<UML:TaggedValue tag="EAStyle" value="ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=1;HighlightForeign=1;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;PPgs.cx=1;PPgs.cy=1;DocSize.cx=850;DocSize.cy=1098;ShowDetails=0;Orientation=P;Zoom=100;ShowTags=0;OpParams=1;VisibleAttributeDetail=0;ShowOpRetType=1;ShowIcons=1;CollabNums=0;HideProps=0;ShowReqs=0;ShowCons=0;PaperSize=1;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideElemStereo=0;ShowTests=0;ShowMaint=0;ConnectorNotation=UML 2.1;ExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;ProfileData=;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;"/>
            </UML:ModelElement.taggedValue>
            <UML:Diagram.element>
                ${generateDiagramElementsXML(classData)}
                ${generateRelationshipElementsXML(relationshipData)}
                ${generateAssociationElementsXML(associationData)}
            </UML:Diagram.element>
        </UML:Diagram>
    `;
};

// Generar diagram elements
const generateDiagramElementsXML = (classData) => {
  return classData
    .map(
      (cls, index) => `
        <UML:DiagramElement geometry="Left=${index * 100};Top=${
        index * 100
      };Right=${index * 100 + 100};Bottom=${
        index * 100 + 100
      };" subject="EAID_${cls.id}" seqno="${index + 1}" />
      `
    )
    .join("\n");
};

const generateAssociationElementsXML = (associationData) => {
  return associationData
    .map(
      (assoc) => `
        <UML:DiagramElement geometry="EDGE=2;$LLB=;LLT=;LMT=;LMB=;LRT=;LRB=;IRHS=;ILHS=;Path=;" subject="EAID_${assoc.id}" style="Mode=3;EOID=D38F8BB6;SOID=5383E6A2;Color=-1;LWidth=0;Hidden=0;"/>
      `
    )
    .join("\n");
};

const generateAssociationXML = (associationData) => {
  return associationData
    .map(
      (assoc) => `
        <UML:Association xmi.id="EAID_${assoc.id}" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">
            <UML:ModelElement.taggedValue>
                <UML:TaggedValue tag="style" value="3"/>
								<UML:TaggedValue tag="ea_type" value="Association"/>
								<UML:TaggedValue tag="direction" value="Unspecified"/>
								<UML:TaggedValue tag="linemode" value="3"/>
								<UML:TaggedValue tag="linecolor" value="-1"/>
								<UML:TaggedValue tag="linewidth" value="0"/>
								<UML:TaggedValue tag="seqno" value="0"/>
								<UML:TaggedValue tag="subtype" value="Class"/>
								<UML:TaggedValue tag="headStyle" value="0"/>
								<UML:TaggedValue tag="lineStyle" value="0"/>
								<UML:TaggedValue tag="privatedata1" value="546"/>
								<UML:TaggedValue tag="ea_localid" value="359"/>
								<UML:TaggedValue tag="ea_sourceName" value="${assoc.class1}"/>
								<UML:TaggedValue tag="ea_targetName" value="${assoc.class2}"/>
								<UML:TaggedValue tag="ea_sourceType" value="Class"/>
								<UML:TaggedValue tag="ea_targetType" value="Class"/>
								<UML:TaggedValue tag="ea_sourceID" value="342"/>
								<UML:TaggedValue tag="ea_targetID" value="366"/>
								<UML:TaggedValue tag="virtualInheritance" value="0"/>
								<UML:TaggedValue tag="associationclass" value="EAID_${assoc.idAssociationClass}"/>
								<UML:TaggedValue tag="lb" value="${assoc.class1Multiplicity}"/>
								<UML:TaggedValue tag="rb" value="${assoc.class2Multiplicity}"/>
            </UML:ModelElement.taggedValue>
            <UML:Association.connection>
								<UML:AssociationEnd visibility="public" multiplicity="${assoc.class1Multiplicity}" aggregation="none" isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="EAID_${assoc.idClass1}">
									<UML:ModelElement.taggedValue>
										<UML:TaggedValue tag="containment" value="Unspecified"/>
										<UML:TaggedValue tag="sourcestyle" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;"/>
										<UML:TaggedValue tag="ea_end" value="source"/>
									</UML:ModelElement.taggedValue>
								</UML:AssociationEnd>
								<UML:AssociationEnd visibility="public" multiplicity="${assoc.class2Multiplicity}" aggregation="none" isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="EAID_${assoc.idClass2}">
									<UML:ModelElement.taggedValue>
										<UML:TaggedValue tag="containment" value="Unspecified"/>
										<UML:TaggedValue tag="deststyle" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;"/>
										<UML:TaggedValue tag="ea_end" value="target"/>
									</UML:ModelElement.taggedValue>
								</UML:AssociationEnd>
							</UML:Association.connection>
        </UML:Association>
      `
    )
    .join("\n");
};

const generateRelationshipElementsXML = (relationshipData) => {
  return relationshipData
    .map(
      (rel) => `
        <UML:DiagramElement geometry="SX=0;SY=0;EX=0;EY=0;Path=;" subject="EAID_${rel.id}" style=";Hidden=0;"/>
      `
    )
    .join("\n");
};

// Función para generar las relaciones con diferentes tipos
const generateRelationshipsXML = (relationships, classData) => {
  return relationships
    .map((rel) => {
      let relTypeXML = "";

      // Según el tipo de relación seleccionado
      switch (rel.type) {
        case "--": // Asociación
        case "-->": // Asociación dirigida
          relTypeXML = `
            <UML:Association name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">
              ${generateModelElementTaggedValue(rel, "Association")}
              <UML:Association.connection>
                ${generateConnectionRelationship(
                  rel,
                  "AssociationEnd",
                  classData
                )}
              </UML:Association.connection>
            </UML:Association>
          `;
          break;

        case "o--": // Agregación to Part
        case "*--": // Composición to Part
        case "--o": // Agregación to Whole
        case "--*": // Composición to Whole
        case "--+": // Nesting
          relTypeXML = `
            <UML:Association name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">
              ${generateModelElementTaggedValue(rel, "Aggregation")}
              <UML:Association.connection>
                ${generateConnectionRelationship(
                  rel,
                  "AssociationEnd",
                  classData
                )}
              </UML:Association.connection>
            </UML:Association>
          `;
          break;

        case "--|>": // Generalización
          relTypeXML = `
            <UML:Generalization subtype="EAID_${rel.idFrom}" supertype="EAID_${
            rel.idTo
          }" name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public">
                ${generateModelElementTaggedValue(rel, "Generalization")}
            </UML:Generalization>
          `;
          break;

        case "<|--": // Generalización inversa
          relTypeXML = `
            <UML:Generalization subtype="EAID_${rel.idTo}" supertype="EAID_${
            rel.idFrom
          }" name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public">
                ${generateModelElementTaggedValue(rel, "Generalization")}
            </UML:Generalization>
          `;
          break;

        case "..|>": // Realización
          relTypeXML = `
            <UML:Dependency client="EAID_${rel.idFrom}" supplier="EAID_${
            rel.idTo
          }" name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public">
                ${generateModelElementTaggedValue(rel, "Realisation")}
            </UML:Dependency>
          `;
          break;

        case "..>": // Dependencia
          relTypeXML = `
            <UML:Dependency client="EAID_${rel.idFrom}" supplier="EAID_${
            rel.idTo
          }" name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public">
                ${generateModelElementTaggedValue(rel, "Dependency")}
            </UML:Dependency>
          `;
          break;

        // Otros casos según los tipos de relaciones que necesitas
        default:
          relTypeXML = `
            <UML:Association name="${rel.name || ""}" xmi.id="EAID_${
            rel.id
          }" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">
              ${generateModelElementTaggedValue(rel, "Association")}
              <UML:Association.connection>
                ${generateConnectionRelationship(
                  rel,
                  "AssociationEnd",
                  classData
                )}
              </UML:Association.connection>
            </UML:Association>
          `;
          break;
      }

      return relTypeXML;
    })
    .join("\n");
};

const generateConnectionRelationship = (
  relationship,
  typeRelationship,
  classData
) => {
  console.log("Data", relationship, typeRelationship, classData);
  return `
    <UML:${typeRelationship} visibility="public" multiplicity="${
    relationship.class1Multiplicity
  }" aggregation="${
    relationship.type === "o--"
      ? "shared"
      : relationship.type === "*--"
      ? "composite"
      : "none"
  }" isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="EAID_${
    relationship.idFrom
  }">
      <UML:ModelElement.taggedValue>
        <UML:TaggedValue tag="containment" value="Unspecified"/>
        <UML:TaggedValue tag="sourcestyle" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;"/>
        <UML:TaggedValue tag="ea_end" value="source"/>
      </UML:ModelElement.taggedValue>
    </UML:${typeRelationship}>
    <UML:${typeRelationship} visibility="public" multiplicity="${
    relationship.class2Multiplicity
  }" aggregation="${
    relationship.type === ("--o" || "--+")
      ? "shared"
      : relationship.type === "--*"
      ? "composite"
      : "none"
  }" isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="EAID_${
    relationship.idTo
  }">
      <UML:ModelElement.taggedValue>
        <UML:TaggedValue tag="containment" value="Unspecified"/>
        <UML:TaggedValue tag="deststyle" value="Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;"/>
        <UML:TaggedValue tag="ea_end" value="target"/>
			</UML:ModelElement.taggedValue>
    </UML:${typeRelationship}>
  `;
};

const generateModelElementTaggedValue = (relationship, typeRelationship) => {
  /* console.log("Data", relationship); */
  return `
    <UML:ModelElement.taggedValue>
      <UML:TaggedValue tag="style" value="3"/>
      <UML:TaggedValue tag="ea_type" value="${typeRelationship}"/>
      <UML:TaggedValue tag="direction" value="${
        ["-->", "o--", "*--", "--+", "--|>", "..|>", "..>"].includes(
          relationship.type
        )
          ? "Source -&gt; Destination"
          : "Unspecified"
      }"/>
			<UML:TaggedValue tag="linemode" value="3"/>
			<UML:TaggedValue tag="linecolor" value="-1"/>
			<UML:TaggedValue tag="linewidth" value="0"/>
			<UML:TaggedValue tag="seqno" value="0"/>
			<UML:TaggedValue tag="headStyle" value="0"/>
			<UML:TaggedValue tag="lineStyle" value="0"/>
			<UML:TaggedValue tag="ea_localid" value="182"/>
      <UML:TaggedValue tag="ea_sourceName" value="${relationship.from}"/>
      <UML:TaggedValue tag="ea_targetName" value="${relationship.to}"/>
      <UML:TaggedValue tag="ea_sourceType" value="Class"/>
			<UML:TaggedValue tag="ea_targetType" value="Class"/>
			<UML:TaggedValue tag="ea_sourceID" value="342"/>
			<UML:TaggedValue tag="ea_targetID" value="366"/>
      <UML:TaggedValue tag="src_visibility" value="Public"/>
			<UML:TaggedValue tag="src_multiplicity" value="${
        relationship.class1Multiplicity
      }"/>
			<UML:TaggedValue tag="dst_multiplicity" value="${
        relationship.class2Multiplicity
      }"/>
			<UML:TaggedValue tag="lb" value="${relationship.class1Multiplicity}"/>
      <UML:TaggedValue tag="mt" value="${relationship.name}"/>
      <UML:TaggedValue tag="rb" value="${relationship.class2Multiplicity}"/>
    </UML:ModelElement.taggedValue>
  `;
};
