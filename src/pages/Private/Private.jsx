import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoutes } from "../../constants/routes";
import LoadingDiagram from "../../components/Loading/LoadingDiagram";

const Index = lazy(() => import("./Diagram/Index"));
const Work = lazy(() => import("./Diagram/Work"));
const Edit = lazy(() => import("./Diagram/Edit"));

function Private() {
    return (
        <Suspense fallback={<LoadingDiagram />}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <Navigate to={`${PrivateRoutes.PRIVATE}${PrivateRoutes.INDEX}`} replace={true} />
                    }
                />
                <Route path={PrivateRoutes.INDEX} element={<Index />} />
                <Route path={PrivateRoutes.WORK} element={<Work />} />
                <Route path={PrivateRoutes.EDIT} element={<Edit />} />
            </Routes>
        </Suspense>
    );
}

export default Private;
