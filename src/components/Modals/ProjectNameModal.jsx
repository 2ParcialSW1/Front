import { useState } from "react";
import PropTypes from "prop-types";

const ProjectNameModal = ({ show, onClose, onSubmit }) => {
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        const projectNamePattern = /^[a-z]+\.[a-z]+$/; // Regex para validar formato com.example

        if (!projectNamePattern.test(inputValue)) {
            setError("El nombre del proyecto debe estar en el formato com.example");
        } else {
            setError("");
            onSubmit(inputValue);
            onClose();
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4 sm:mx-0 sm:w-2/3 md:w-1/2">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Nombre del Proyecto</h2>
                <input
                    type="text"
                    placeholder="com.example"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-700"
                />
                {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
                <div className="flex justify-end space-x-4">
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

ProjectNameModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default ProjectNameModal;
