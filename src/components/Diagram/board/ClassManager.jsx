import { useState } from "react";
import PropTypes from "prop-types";

export default function ClassManager({ classes, setClasses, relationships, setRelationships, associations, setAssociations, updateDiagram }) {
  const [newClassName, setNewClassName] = useState("");
  const [newClassAttributes, setNewClassAttributes] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClassName, setEditingClassName] = useState("");
  const [newAttribute, setNewAttribute] = useState("");
  const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);
  const [editingAttributeValue, setEditingAttributeValue] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Estado para mensajes de error

  // Expresión regular para detectar "id" en cualquier forma
  const idPattern = /\b(id)\b/i;
  const classNamePattern = /^[A-Z][A-Za-z]*$/; // Primera letra mayúscula, no acepta espacios
  const classNameEditPattern = /^[A-Z][A-Za-z]*$/; // No permite primera letra en minúscula

  // Función para agregar una clase
  const addClass = () => {
    if (!classNamePattern.test(newClassName)) {
      setErrorMessage("El nombre de la clase debe empezar con una mayúscula y no debe contener espacios.");
      return;
    }

    const attributes = newClassAttributes.split(",").map(attr => attr.trim());

    // Validación: no permitir "id" como atributo
    if (attributes.some(attr => idPattern.test(attr))) {
      setErrorMessage("No se permite usar 'id' como nombre de atributo.");
      return;
    }

    const updatedClasses = [...classes, { name: newClassName, attributes }];
    setClasses(updatedClasses);
    setNewClassName("");
    setNewClassAttributes("");
    setErrorMessage(""); // Limpiar el mensaje de error
    updateDiagram(updatedClasses, relationships, associations); // Actualizar el diagrama después de agregar la clase
  };

  // Función para editar el nombre de la clase seleccionada
  const editClassName = () => {
    if (!classNameEditPattern.test(editingClassName)) {
      setErrorMessage("El nombre editado de la clase debe empezar con una mayúscula.");
      return;
    }

    if (selectedClass) {
      const updatedClasses = classes.map(cls => {
        if (cls.name === selectedClass.name) {
          return { ...cls, name: editingClassName };
        }
        return cls;
      });
      setClasses(updatedClasses);
      setEditingClassName("");
      updateDiagram(updatedClasses, relationships, associations); // Actualizar el diagrama después de editar el nombre de la clase
    }
  };

  // Función para eliminar una clase y también sus relaciones y asociaciones
  const deleteClass = () => {
    if (selectedClass) {
      const classNameToDelete = selectedClass.name;

      // Eliminar las relaciones donde la clase eliminada es `from` o `to`
      const updatedRelationships = relationships.filter(rel => rel.from !== classNameToDelete && rel.to !== classNameToDelete);

      // Eliminar las asociaciones donde la clase eliminada es `class1` o `class2`
      const updatedAssociations = associations.filter(assoc => assoc.class1 !== classNameToDelete && assoc.class2 !== classNameToDelete);

      // Eliminar la clase
      const updatedClasses = classes.filter(cls => cls.name !== classNameToDelete);

      setClasses(updatedClasses);
      setRelationships(updatedRelationships);
      setAssociations(updatedAssociations);
      setSelectedClass(null);

      // Generar el código PlantUML actualizado
      updateDiagram(updatedClasses, updatedRelationships, updatedAssociations); // Actualizar el diagrama después de eliminar la clase y sus relaciones
    }
  };

  // Función para agregar un atributo a una clase seleccionada
  const addAttributeToClass = () => {
    if (newAttribute && selectedClass) {

      if (idPattern.test(newAttribute)) {
        setErrorMessage("No se permite usar 'id' como nombre de atributo.");
        return;
      }
      const updatedClasses = classes.map(cls => {
        if (cls.name === selectedClass.name) {
          return { ...cls, attributes: [...cls.attributes, newAttribute] };
        }
        return cls;
      });
      setClasses(updatedClasses);
      setNewAttribute("");
      setErrorMessage(""); // Limpiar el mensaje de error
      updateDiagram(updatedClasses, relationships, associations); // Actualizar el diagrama después de agregar el atributo
    }
  };

  // Función para editar un atributo
  const editAttribute = (index) => {
    setEditingAttributeIndex(index);
    setEditingAttributeValue(selectedClass.attributes[index]);
  };

  // Función para guardar el atributo editado
  const saveEditedAttribute = () => {
    // Validación: no permitir "id" como atributo
    if (idPattern.test(editingAttributeValue)) {
      setErrorMessage("No se permite usar 'id' como nombre de atributo.");
      return;
    }
    const updatedClasses = classes.map(cls => {
      if (cls.name === selectedClass.name) {
        const updatedAttributes = [...cls.attributes];
        updatedAttributes[editingAttributeIndex] = editingAttributeValue;
        return { ...cls, attributes: updatedAttributes };
      }
      return cls;
    });
    setClasses(updatedClasses);
    setEditingAttributeIndex(null);
    setEditingAttributeValue("");
    setErrorMessage(""); // Limpiar el mensaje de error
    updateDiagram(updatedClasses, relationships, associations); // Actualizar el diagrama después de editar el atributo
  };

  // Función para eliminar un atributo
  const deleteAttribute = (index) => {
    const updatedClasses = classes.map(cls => {
      if (cls.name === selectedClass.name) {
        const updatedAttributes = cls.attributes.filter((_, i) => i !== index);
        return { ...cls, attributes: updatedAttributes };
      }
      return cls;
    });
    setClasses(updatedClasses);
    updateDiagram(updatedClasses, relationships, associations); // Actualizar el diagrama después de eliminar el atributo
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Gestionar Clases</h2>

      {/* Formulario para agregar una clase */}
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Nombre de la clase"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Atributos (separados por comas)"
          value={newClassAttributes}
          onChange={(e) => setNewClassAttributes(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
        />
        {errorMessage && (
          <p className="text-red-500 text-sm">{errorMessage}</p> // Mostrar mensaje de error
        )}
        <button
          onClick={addClass}
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
        >
          Agregar Clase
        </button>
      </div>

      {/* Selección de clase y opciones de gestión */}
      <div className="flex flex-col space-y-4">
        <select
          value={selectedClass?.name || ""}
          onChange={(e) => setSelectedClass(classes.find(cls => cls.name === e.target.value))}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar Clase</option>
          {classes.map((cls) => (
            <option key={cls.name} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>

        {selectedClass && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Editar Clase: {selectedClass.name}</h3>
            <input
              type="text"
              placeholder="Nuevo nombre de la clase"
              value={editingClassName}
              onChange={(e) => setEditingClassName(e.target.value)}
              className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={editClassName}
                className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
              >
                Guardar Nombre de Clase
              </button>
              <button
                onClick={deleteClass}
                className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600"
              >
                Eliminar Clase
              </button>
            </div>

            {/* Gestión de atributos de la clase */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold">Atributos de {selectedClass.name}</h4>
              <ul className="space-y-2">
                {selectedClass.attributes.map((attr, index) => (
                  <li key={index} className="flex space-x-2 items-center">
                    {editingAttributeIndex === index ? (
                      <input
                        type="text"
                        value={editingAttributeValue}
                        onChange={(e) => setEditingAttributeValue(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-700">{attr}</span>
                    )}
                    <button
                      onClick={() => editAttribute(index)}
                      className="bg-yellow-500 text-white rounded-md p-1 hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteAttribute(index)}
                      className="bg-red-500 text-white rounded-md p-1 hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
              {editingAttributeIndex !== null && (
                <button
                  onClick={saveEditedAttribute}
                  className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
                >
                  Guardar Atributo
                </button>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nuevo Atributo"
                  value={newAttribute}
                  onChange={(e) => setNewAttribute(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addAttributeToClass}
                  className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
                >
                  Agregar Atributo
                </button>
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p> // Mostrar mensaje de error
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

ClassManager.propTypes = {
  classes: PropTypes.array.isRequired,
  setClasses: PropTypes.func.isRequired,
  relationships: PropTypes.array.isRequired,
  setRelationships: PropTypes.func.isRequired,
  associations: PropTypes.array,  // Cambia esto si no quieres que sea requerido
  setAssociations: PropTypes.func.isRequired,
  updateDiagram: PropTypes.func.isRequired,
};

ClassManager.defaultProps = {
  associations: [],  // Valor por defecto si no se proporciona
};