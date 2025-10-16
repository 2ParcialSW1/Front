import { useState } from 'react';
import PropTypes from 'prop-types';

const ForeignKeyAssociationModal = ({ show, onClose, onSubmit, associations }) => {
    const [selectedAssociations, setSelectedAssociations] = useState({});

    const handleSelection = (assoc, selectedClass) => {
        setSelectedAssociations({
            ...selectedAssociations,
            [assoc.associationClass]: { ...assoc, classSelector: selectedClass },
        });
    };

    const handleSubmit = () => {
        onSubmit(Object.values(selectedAssociations)); // Enviar las asociaciones seleccionadas
    };

    if (!show) return null;

    const associationsWithoutAttributes = associations.filter(
        (assoc) => assoc.associationClass && !assoc.attributes?.length
    );

    return (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-lg font-bold mb-4">Seleccione la clase para la clave foránea</h2>
                {associationsWithoutAttributes.length > 0 ? (
                    associationsWithoutAttributes.map((assoc, index) => (
                        <div key={index} className="mb-4">
                            <p className="mb-2">Asociación: {assoc.associationClass}</p>
                            <div className="flex space-x-4">
                                <label>
                                    <input
                                        type="radio"
                                        name={`foreignKey-${index}`}
                                        value={assoc.class1}
                                        onChange={() => handleSelection(assoc, assoc.class1)}
                                    />
                                    {assoc.class1}
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name={`foreignKey-${index}`}
                                        value={assoc.class2}
                                        onChange={() => handleSelection(assoc, assoc.class2)}
                                    />
                                    {assoc.class2}
                                </label>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No hay asociaciones sin atributos.</p>
                )}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

ForeignKeyAssociationModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    associations: PropTypes.array.isRequired,
};

export default ForeignKeyAssociationModal;
