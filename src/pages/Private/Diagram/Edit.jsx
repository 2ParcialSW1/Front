import { lazy } from "react";
import Navbar from "../../../components/Navbar/Navbar";
const EditDiagram = lazy(() => import("../../../components/Diagram/EditDiagram"));

export default function Edit() {
    return (
        <div>
            <Navbar />
            <EditDiagram />
        </div>
    )
}