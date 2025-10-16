export default function LoadingDiagram() {
    return (
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold">Cargando...</h1>
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    )
}