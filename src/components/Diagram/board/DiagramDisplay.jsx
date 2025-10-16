import LoadingDiagram from '../../Loading/LoadingDiagram';
import PropTypes from "prop-types";

DiagramDisplay.propTypes = {
  diagramContent: PropTypes.string,
  isConnected: PropTypes.bool.isRequired
};
export default function DiagramDisplay({ diagramContent, isConnected }) {
  return (
    <div className="diagram-display">
      {/* Mostrar el diagrama o un componente de carga si aún no está disponible */}
      {diagramContent ? (
        <img src={diagramContent} alt="Diagrama UML" className="diagram-image" />
      ) : (
        <LoadingDiagram />
      )}

      {/* Mostrar el estado de la conexión */}
      <h2 className="connection-status">
        {isConnected ? 'Conectado' : 'Desconectado'}
      </h2>
    </div>
  );
}
