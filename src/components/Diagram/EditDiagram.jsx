import { useDiagramFetch } from "../../hooks/useDiagramFetch";
import { useUserFetch } from "../../hooks/userFetch";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function EditDiagram() {
    const { _id } = useParams();
    const { createInvitationHook, getDiagramByIdHook, updateDiagramHook } = useDiagramFetch();
    const { users } = useUserFetch();

    const [diagram, setDiagram] = useState({});
    const [name, setName] = useState("");
    const [anfitrion, setAnfitrion] = useState("");
    const [participantes, setParticipantes] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]); // Usuarios disponibles para agregar

    // Fetch diagram data and users on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDiagramByIdHook(_id);
                setDiagram(data.plantUML);
                setName(data.name);
                setAnfitrion(data.anfitrion);
                setParticipantes(data.participantes);
            } catch (error) {
                console.error("Error fetching data: ", error);
            }
        };
        fetchData();
    }, [_id]);

    useEffect(() => {
        // Filtrar usuarios disponibles (excluyendo participantes actuales y anfitrión)
        setAvailableUsers(users.filter(user => !participantes.some(p => p._id === user._id) && user._id !== anfitrion));
    }, [users, participantes, anfitrion]);

    // Mover participante de la lista disponible a la lista de participantes
    const addParticipante = (userId) => {
        const userToAdd = availableUsers.find(user => user._id === userId);
        if (userToAdd) {
            setParticipantes([...participantes, userToAdd]);
            setAvailableUsers(availableUsers.filter(user => user._id !== userId)); // Quitar de los disponibles
        }
    };

    // Remover participante de la lista de participantes
    const removeParticipante = (userId) => {
        const userToRemove = participantes.find(p => p._id === userId);
        if (userToRemove) {
            setAvailableUsers([...availableUsers, userToRemove]); // Añadir a los disponibles
            setParticipantes(participantes.filter(p => p._id !== userId)); // Quitar de los participantes actuales
        }
    };

    // Update diagram logic
    const updateDiagram = async () => {
        try {
            const updatedData = { diagram, name, anfitrion, participantes };
            if (participantes.length < 1) {
                updateDiagramHook(_id, updatedData);
                window.location.href = "/private/diagrams";
            } else {
                await createInvitationHook(_id, updatedData);
                window.location.href = "/private/diagrams";
            }
        } catch (error) {
            console.error("Error updating diagram: ", error);
        }
    };

    return (
        <div className="flex flex-col items-center py-8 px-4">
            <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Diagrama</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Nombre del Diagrama */}
                    <div className="col-span-1">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Diagrama</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* Anfitrión */}
                    <div className="col-span-1">
                        <label htmlFor="anfitrion" className="block text-sm font-medium text-gray-700">Anfitrión</label>
                        <select
                            id="anfitrion"
                            value={anfitrion}
                            onChange={(e) => setAnfitrion(e.target.value)}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {`${user.firstName} `}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seleccionar Participantes - Lista de usuarios disponibles */}
                    <div className="col-span-1">
                        <label htmlFor="participantes" className="block text-sm font-medium text-gray-700">Seleccionar Participantes</label>
                        <ul className="mt-1 space-y-2">
                            {availableUsers
                                .filter(user => user._id !== anfitrion._id)
                                .map(user => (
                                    <li
                                        key={user._id}
                                        onDoubleClick={() => addParticipante(user._id)} // Doble clic para agregar participante
                                        className="py-2 px-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200"
                                    >
                                        {`${user.firstName} `}
                                    </li>
                                ))}
                        </ul>
                    </div>


                    {/* Participantes Existentes */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Participantes Existentes</label>
                        <ul className="mt-1 space-y-2">
                            {participantes
                                .filter(participante => participante._id !== anfitrion) // Excluir anfitrión de la lista
                                .map(participante => (
                                    <li
                                        key={participante._id}
                                        onDoubleClick={() => removeParticipante(participante._id)} // Doble clic para remover participante
                                        className="py-2 px-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200"
                                    >
                                        {`${participante.firstName}`}
                                    </li>
                                ))}
                        </ul>
                    </div>

                    {/* Botón de actualizar */}
                    <div className="col-span-2">
                        <button
                            onClick={updateDiagram}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold"
                        >
                            Actualizar Diagrama
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
