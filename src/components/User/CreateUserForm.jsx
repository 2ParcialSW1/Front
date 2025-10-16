import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import Loading from '../Loading/Loading';
import { useUserFetch } from '../../hooks/userFetch';
import Modal from '../Modals/Modal';

export default function CreateUserForm() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { createUserHook, loading, isModalOpen, modalTitle, modalMessage, closeModal } = useUserFetch();
    const onSubmit = (data) => createUserHook(data);

    return (
        <form className="w-full max-w-lg mx-auto bg-white shadow-md rounded-lg p-8" onSubmit={handleSubmit(onSubmit)}>
            {/* Name Field */}
            <div className="mb-6">
                <label htmlFor="name" className="block mb-2 text-sm font-semibold text-gray-700">Name</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Name"
                        {...register('name', { required: true })}
                    />
                </div>
                {errors.name && <span className="text-sm text-red-500 mt-1">Name is required</span>}
            </div>

            {/* Email Field */}
            <div className="mb-6">
                <label htmlFor="email" className="block mb-2 text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Email Address"
                        {...register('email', { required: true })}
                    />
                </div>
                {errors.email && <span className="text-sm text-red-500 mt-1">Email is required</span>}
            </div>

            {/* Password Field */}
            <div className="mb-6">
                <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FontAwesomeIcon icon={faLock} />
                    </span>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Password"
                        {...register('password', { required: true })}
                    />
                </div>
                {errors.password && <span className="text-sm text-red-500 mt-1">Password is required</span>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center mb-6">
                <input type="checkbox" id="remember" name="remember" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember Me</label>
            </div>

            {/* Submit Button */}
            <div className="w-full">
                <button
                    type="submit"
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex items-center justify-center"
                >
                    {loading ? <Loading /> : 'Register'}
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Modal title={modalTitle} message={modalMessage} onClose={closeModal} />
            )}
        </form>
    );
}
