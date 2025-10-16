import { useState } from "react";
import PropTypes from "prop-types";

RelationshipManager.propTypes = {
  classes: PropTypes.array.isRequired,
  relationships: PropTypes.array.isRequired,
  setRelationships: PropTypes.func.isRequired,
  updateDiagram: PropTypes.func.isRequired,
};
export default function RelationshipManager({ classes, relationships, setRelationships, updateDiagram }) {
  const [class1, setClass1] = useState("");
  const [class2, setClass2] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [relationshipName, setRelationshipName] = useState("");
  const [class1Multiplicity, setClass1Multiplicity] = useState("");
  const [class2Multiplicity, setClass2Multiplicity] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState(null);

  // Agregar una nueva relación
  const addRelationship = () => {
    if (class1 && class2 && relationshipType /* && class1Multiplicity && class2Multiplicity */) {
      const newRelationship = {
        from: class1,
        to: class2,
        type: relationshipType,
        name: relationshipName || "",
        class1Multiplicity:
          !["--|>", "<|--", "..|>"].includes(relationshipType) ? class1Multiplicity : "",
        class2Multiplicity:
          !["--|>", "<|--", "..|>"].includes(relationshipType) ? class2Multiplicity : "",
      };

      const existingRelationship = relationships.find(
        rel =>
          rel.from === class1 &&
          rel.to === class2 &&
          rel.type === relationshipType &&
          rel.class1Multiplicity === class1Multiplicity &&
          rel.class2Multiplicity === class2Multiplicity
      );

      if (!existingRelationship) {
        setRelationships(prevRelationships => {
          const updatedRelationships = [...prevRelationships, newRelationship];
          updateDiagram(classes, updatedRelationships); // Actualizar diagrama
          return updatedRelationships;
        });
      }

      // Limpiar los campos
      setClass1("");
      setClass2("");
      setRelationshipType("");
      setRelationshipName("");
      setClass1Multiplicity("");
      setClass2Multiplicity("");
    }
  };

  // Editar relación seleccionada
  const selectRelationship = (rel) => {
    setSelectedRelationship(rel);
    setClass1(rel.from);
    setClass2(rel.to);
    setRelationshipType(rel.type);
    setRelationshipName(rel.name || "");
    setClass1Multiplicity(rel.class1Multiplicity || "");
    setClass2Multiplicity(rel.class2Multiplicity || "");
  };

  // Actualizar una relación existente
  const updateRelationship = () => {
    if (selectedRelationship) {
      setRelationships(prevRelationships => {
        const updatedRelationships = prevRelationships.map(rel => {
          if (rel === selectedRelationship) {
            return {
              ...rel,
              from: class1,
              to: class2,
              type: relationshipType,
              name: relationshipName,
              class1Multiplicity:
                !["--|>", "<|--", "..|>"].includes(relationshipType) ? class1Multiplicity : "",
              class2Multiplicity:
                !["--|>", "<|--", "..|>"].includes(relationshipType) ? class2Multiplicity : "",
            };
          }
          return rel;
        });
        updateDiagram(classes, updatedRelationships); // Actualizar diagrama
        return updatedRelationships;
      });

      // Limpiar los campos después de actualizar
      setSelectedRelationship(null);
      setClass1("");
      setClass2("");
      setRelationshipType("");
      setRelationshipName("");
      setClass1Multiplicity("");
      setClass2Multiplicity("");
    }
  };

  // Eliminar una relación seleccionada
  const deleteRelationship = () => {
    if (selectedRelationship) {
      setRelationships((prevRelationships) => {
        const updatedRelationships = prevRelationships.filter(
          (rel) => rel !== selectedRelationship
        );
        updateDiagram(classes, updatedRelationships); // Actualizar diagrama
        return updatedRelationships;
      });

      // Limpiar los campos después de eliminar
      setSelectedRelationship(null);
      setClass1("");
      setClass2("");
      setRelationshipType("");
      setRelationshipName("");
      setClass1Multiplicity("");
      setClass2Multiplicity("");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Agregar Relación</h2>

      {/* Selector para tipo de relación */}
      <select
        value={relationshipType}
        onChange={(e) => setRelationshipType(e.target.value)}
        className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleccionar tipo de relación</option>
        <option value="--">Association</option>
        <option value="-->">Directed Association</option>
        <option value="--o">Aggregation to Whole</option>
        <option value="o--">Aggregation to Part</option>
        <option value="--*">Composition to Whole</option>
        <option value="*--">Composition to Part</option>
        <option value="--+">Nest</option>
        <option value="--|>">Generalization</option>
        <option value="<|--">Specialization</option>
        {/* <option value="templatebinding">TemplateBinding</option> */}
        <option value="..|>">Realize</option>
        <option value="..>">Dependency</option>
        {/* <option value="import">Import</option> */}
        {/* <option value="instantiate">Instantiate</option> */}
        {/* <option value="..>">Usage</option> */}
        {/* <option value="trace">Trace</option> */}
        {/* <option value="informationflow">Information Flow</option> */}

      </select>

      {/* Selección de clases y campos para multiplicidades */}
      <div className="flex flex-col space-y-4">
        <select
          value={class1}
          onChange={(e) => setClass1(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona Clase 1</option>
          {classes.map((cls) => (
            <option key={cls.name} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>

        {/* Mostrar solo si no es Generalization */}
        {!["--|>", "<|--", "..|>"].includes(relationshipType) && (
          <select
            value={class1Multiplicity}
            onChange={(e) => setClass1Multiplicity(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona la multiplicidad</option>
            <option value="*">*</option>
            <option value="0">0</option>
            <option value="0..*">0..*</option>
            <option value="0..1">0..1</option>
            <option value="1">1</option>
            <option value="1..">1..</option>
            <option value="1..*">1..*</option>
          </select>
        )}

        <select
          value={class2}
          onChange={(e) => setClass2(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona Clase 2</option>
          {classes.map((cls) => (
            <option key={cls.name} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>

        {/* Mostrar solo si no es Generalization */}
        {!["--|>", "<|--", "..|>"].includes(relationshipType) && (
          <select
            value={class2Multiplicity}
            onChange={(e) => setClass2Multiplicity(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona la multiplicidad</option>
            <option value="*">*</option>
            <option value="0">0</option>
            <option value="0..*">0..*</option>
            <option value="0..1">0..1</option>
            <option value="1">1</option>
            <option value="1..">1..</option>
            <option value="1..*">1..*</option>
          </select>
        )}



        <input
          type="text"
          placeholder="Nombre de la relación"
          value={relationshipName}
          onChange={(e) => setRelationshipName(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={addRelationship}
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
        >
          Agregar Relación
        </button>
      </div>

      {/* Sección para editar relaciones */}
      {relationships.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">Editar Relación</h2>
          <select
            onChange={(e) => selectRelationship(relationships[e.target.value])}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar Relación</option>
            {relationships.map((rel, index) => (
              <option key={index} value={index}>
                {`${rel.from} ${rel.type} ${rel.to}`}
              </option>
            ))}
          </select>

          {selectedRelationship && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre de la relación"
                value={relationshipName}
                onChange={(e) => setRelationshipName(e.target.value)}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={class1Multiplicity}
                onChange={(e) => setClass1Multiplicity(e.target.value)}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona la multiplicidad</option>
                <option value="*">*</option>
                <option value="0">0</option>
                <option value="0..*">0..*</option>
                <option value="0..1">0..1</option>
                <option value="1">1</option>
                <option value="1..">1..</option>
                <option value="1..*">1..*</option>
              </select>

              <select
                value={class2Multiplicity}
                onChange={(e) => setClass2Multiplicity(e.target.value)}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona la multiplicidad</option>
                <option value="*">*</option>
                <option value="0">0</option>
                <option value="0..*">0..*</option>
                <option value="0..1">0..1</option>
                <option value="1">1</option>
                <option value="1..">1..</option>
                <option value="1..*">1..*</option>
              </select>

              <button
                onClick={updateRelationship}
                className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
              >
                Actualizar Relación
              </button>
              <button
                onClick={deleteRelationship}
                className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600"
              >
                Eliminar Relación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

}
