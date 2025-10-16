import { useState } from "react";
import PropTypes from "prop-types";

AssociationManager.propTypes = {
  classes: PropTypes.array.isRequired,
  relationships: PropTypes.array.isRequired,
  associations: PropTypes.array.isRequired,
  setAssociations: PropTypes.func.isRequired,
  updateDiagram: PropTypes.func.isRequired
};
export default function AssociationManager({ classes, relationships, associations, setAssociations, updateDiagram }) {

  const [class1, setClass1] = useState("");
  const [class2, setClass2] = useState("");
  const [associationClass, setAssociationClass] = useState("");
  const [selectedAssociation, setSelectedAssociation] = useState(null);

  // Agregar una nueva asociación con clase intermedia
  const addAssociation = () => {
    if (class1 && class2 && associationClass) {
      const newAssociation = { class1, class2, associationClass };

      const existingAssociation = associations.find(
        assoc =>
          assoc.class1 === class1 &&
          assoc.class2 === class2 &&
          assoc.associationClass === associationClass
      );

      if (!existingAssociation) {
        setAssociations(prevAssociations => {
          const updatedAssociations = [...prevAssociations, newAssociation];
          updateDiagram(classes, relationships, updatedAssociations); // Actualizar el diagrama
          return updatedAssociations;
        });
      }

      // Limpiar campos después de agregar
      setClass1("");
      setClass2("");
      setAssociationClass("");
    }
  };

  // Seleccionar una asociación para editar
  const selectAssociation = (assoc) => {
    setSelectedAssociation(assoc);
    setClass1(assoc.class1);
    setClass2(assoc.class2);
    setAssociationClass(assoc.associationClass);
  };

  // Actualizar una asociación seleccionada
  const updateAssociation = () => {
    if (selectedAssociation) {
      setAssociations(prevAssociations => {
        const updatedAssociations = prevAssociations.map(assoc => {
          if (assoc === selectedAssociation) {
            return { ...assoc, class1, class2, associationClass };
          }
          return assoc;
        });
        updateDiagram(classes, [], updatedAssociations); // Actualizar el diagrama
        return updatedAssociations;
      });

      // Limpiar campos después de actualizar
      setSelectedAssociation(null);
      setClass1("");
      setClass2("");
      setAssociationClass("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Agregar Asociación (Clase Intermedia)</h2>

      <div className="flex flex-col space-y-2">
        <select
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          value={class1}
          onChange={(e) => setClass1(e.target.value)}
        >
          <option value="">Selecciona Clase 1</option>
          {classes.map((cls) => (
            <option key={cls.name} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          value={class2}
          onChange={(e) => setClass2(e.target.value)}
        >
          <option value="">Selecciona Clase 2</option>
          {classes.map((cls) => (
            <option key={cls.name} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Clase Intermedia (Asociación)"
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          value={associationClass}
          onChange={(e) => setAssociationClass(e.target.value)}
        />

        <button
          onClick={addAssociation}
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
        >
          Agregar Asociación
        </button>
      </div>

      {/* Nueva sección para editar asociaciones */}
      {associations.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Editar Asociación</h2>
          <select
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            onChange={(e) => selectAssociation(associations[e.target.value])}
          >
            <option value="">Seleccionar Asociación</option>
            {associations.map((assoc, index) => (
              <option key={index} value={index}>
                {`${assoc.class1} - ${assoc.class2} (Intermedia: ${assoc.associationClass})`}
              </option>
            ))}
          </select>

          {selectedAssociation && (
            <div className="flex flex-col space-y-2">
              <select
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                value={class1}
                onChange={(e) => setClass1(e.target.value)}
              >
                <option value="">Selecciona Clase 1</option>
                {classes.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>

              <select
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                value={class2}
                onChange={(e) => setClass2(e.target.value)}
              >
                <option value="">Selecciona Clase 2</option>
                {classes.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Clase Intermedia (Asociación)"
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                value={associationClass}
                onChange={(e) => setAssociationClass(e.target.value)}
              />

              <button
                onClick={updateAssociation}
                className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
              >
                Actualizar Asociación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}