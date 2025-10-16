import { useState } from "react";
import PropTypes from 'prop-types';

const ForeignKeyModal = ({ show, onClose, onSubmit, relationships }) => {
    const [foreignKeySelections, setForeignKeySelections] = useState([]);

    // Función para manejar la selección de qué clase llevará la clave foránea
    const handleSelection = (relation, selectedClass) => {
        const updatedSelections = foreignKeySelections.filter(
            (sel) => !(sel.class1 === relation.from && sel.class2 === relation.to)
        );

        console.log("Updated selections:", updatedSelections);

        setForeignKeySelections([
            ...updatedSelections,
            {
                class1: relation.from,
                class2: relation.to,
                foreignKey: selectedClass,
            },
        ]);
    };

    const handleSubmit = () => {
        
        onSubmit(foreignKeySelections);
        onClose();
    };

    if (!show) return null;

    // Filtrar solo las relaciones 1 a 1
    const oneToOneRelationships = relationships.filter(
        (rel) => rel.class1Multiplicity === "1" && rel.class2Multiplicity === "1"
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4 sm:mx-0 sm:w-2/3 md:w-1/2">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Selecciona la clase que llevará la clave foránea
                </h2>
                <div className="space-y-4">
                    {oneToOneRelationships.length > 0 ? (
                        oneToOneRelationships.map((rel, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <span>
                                    Relación entre {rel.from} y {rel.to}
                                </span>
                                <div className="space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`foreignKey-${index}`}
                                            value={rel.from}
                                            onChange={() => handleSelection(rel, rel.from)}
                                            className="mr-2"
                                        />
                                        {rel.from}
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`foreignKey-${index}`}
                                            value={rel.to}
                                            onChange={() => handleSelection(rel, rel.to)}
                                            className="mr-2"
                                        />
                                        {rel.to}
                                    </label>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No hay relaciones 1 a 1 disponibles.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-5 rounded-lg transition-all duration-200 ease-in-out"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg transition-all duration-200 ease-in-out"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

ForeignKeyModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    relationships: PropTypes.arrayOf(PropTypes.shape({
        class1Multiplicity: PropTypes.string.isRequired,
        class2Multiplicity: PropTypes.string.isRequired,
        from: PropTypes.string.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
};

export default ForeignKeyModal;
