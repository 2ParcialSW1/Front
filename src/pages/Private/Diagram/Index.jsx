import { lazy } from "react";
import CreateDiagram from "../../../components/Diagram/CreateDiagram";
import Navbar from "../../../components/Navbar/Navbar";
const DiagramsList = lazy(() => import("../../../components/Diagram/ListDiagrams"));

export default function Index() {
    return (
        <div>
            <Navbar />
            <h2 className="text-2xl font-bold text-center mb-6">Mis diagramas</h2>
            {/* Crear Diagrama */}
            <CreateDiagram />
            <hr className="my-6" />
            {/* Listar Diagramas */}
            <DiagramsList />
        </div>
    )
}