import PropTypes from 'prop-types';
const Modal = ({ title, message, onClose }) => {
    return (
        <div className="fixed top-0 right-0 left-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <p className="text-gray-500 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button
                        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
Modal.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default Modal;