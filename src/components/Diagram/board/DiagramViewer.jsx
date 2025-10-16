import PropTypes from "prop-types";

DiagramViewer.propTypes = {
    diagramContent: PropTypes.string.isRequired,
};
export default function DiagramViewer({ diagramContent }) {
    return (
        <div>
            <img src={diagramContent} alt="Diagrama" />
        </div>
    );
}
