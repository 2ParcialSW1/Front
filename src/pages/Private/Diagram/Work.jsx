import { lazy } from "react";
import Navbar from "../../../components/Navbar/Navbar";
const WorkDiagram = lazy(() => import("../../../components/Diagram/board/WorkDiagram"));

export default function Work() {
    return (
        <div>
            <Navbar />
            <WorkDiagram />
        </div>
    )
}