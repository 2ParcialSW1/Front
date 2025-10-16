import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useDiagramFetch } from "../../hooks/useDiagramFetch";
import { useState } from "react";
import Modal from "react-modal";

// Estilos opcionales para el modal
const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

Modal.setAppElement('#root'); // Establece el elemento de la app para accesibilidad

function ListDiagrams() {
    const { diagrams, deleteDiagramHook } = useDiagramFetch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDiagramId, setSelectedDiagramId] = useState(null);

    const openModal = (id) => {
        setSelectedDiagramId(id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDiagramId(null);
    };

    const confirmDelete = () => {
        if (selectedDiagramId) {
            deleteDiagramHook(selectedDiagramId);
            window.location.href = "/private/diagrams";
        }
        closeModal();
    };

    return (
        <div className="mb-6">
            <div className="flex flex-col">
                <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anfitrión</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {diagrams.map((diagram) => (
                                        <tr key={diagram._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{diagram.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {diagram.anfitrion.firstName} {diagram.anfitrion.lastName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {diagram.participantes.map((participante) => `${participante.firstName} ${participante.lastName}`).join(", ")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                                                <a href={`/private/diagrams/${diagram._id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1">
                                                    <FontAwesomeIcon icon={faEye} />
                                                    <span>Ver</span>
                                                </a>

                                                <button
                                                    onClick={() => openModal(diagram._id)}
                                                    className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                    <span>Eliminar</span>
                                                </button>

                                                <a href={`/private/diagrams/edit/${diagram._id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                    <span>Editar</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Modal para confirmar eliminación */}
                            <Modal
                                isOpen={isModalOpen}
                                onRequestClose={closeModal}
                                style={customStyles}
                                contentLabel="Confirmar eliminación"
                            >
                                <h2 className="text-xl font-bold">Confirmar eliminación</h2>
                                <p>¿Estás seguro de que quieres eliminar este diagrama?</p>
                                <div className="flex justify-end space-x-4 mt-4">
                                    <button
                                        onClick={closeModal}
                                        className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </Modal>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ListDiagrams;
