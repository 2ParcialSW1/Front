import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDiagramFetch } from "../../hooks/useDiagramFetch";

function CreateDiagram() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { createDiagramHook } = useDiagramFetch();
    const [isModalOpen, setModalOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    const onSubmit = (data) => {
        createDiagramHook(data);
        closeModal();
        window.location.href = "/private/diagrams";
    };

    return (
        <>
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-200 focus:outline-none"
                onClick={openModal}
            >
                Crear Diagrama
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Crear Diagrama</h3>
                            <button
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full focus:outline-none"
                                onClick={closeModal}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="flex flex-col">
                                <label htmlFor="name" className="text-sm font-semibold text-gray-600">Nombre</label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register("name", { required: true })}
                                    className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre del diagrama"
                                />
                                {errors.name && <span className="text-red-500 text-sm">Nombre es requerido</span>}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default CreateDiagram;
