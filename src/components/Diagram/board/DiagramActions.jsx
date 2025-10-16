import PropTypes from 'prop-types';

DiagramActions.propTypes = {
  onSave: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired
};

export default function DiagramActions({ onSave, onRestore }) {
  return (
    <div className="flex space-x-4 my-4">
      <button
        onClick={onSave}
        className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300"
      >
        Guardar
      </button>
      <button
        onClick={onRestore}
        className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 transition duration-300"
      >
        Restaurar
      </button>
      {/*  */}
    </div>
  );
  /*  */
  //
}
