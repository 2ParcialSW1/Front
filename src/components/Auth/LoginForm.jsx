import { useForm } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Loading from '../Loading/Loading'
import { useAuthFetch } from '../../hooks/authFetch'
/* import Modal from '../Modals/Modal' */

export default function LoginForm() {
    const { register, handleSubmit, formState: { errors } } = useForm()
    const { loginHook, isLogged, loading/* , isModalOpen, modalTitle, modalMessage, closeModal, */ } = useAuthFetch()
    /* const onSubmit = (data) => console.log(data) */
    const onSubmit = (data) => loginHook(data)
    isLogged && console.log(isLogged)


    return (
        <form className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="flex flex-col mb-6">
                <label htmlFor="email" className="mb-2 text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-gray-400" /> {/* Ícono del email */}
                    </div>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email Address"
                        {...register("email", { required: true })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                {errors.email && <span className="text-xs text-red-500 mt-1">Email is required</span>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col mb-6">
                <label htmlFor="password" className="mb-2 text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FontAwesomeIcon icon={faLock} className="text-gray-400 w-5 h-5" /> {/* Ícono del candado */}
                    </div>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password"
                        {...register("password", { required: true })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                {errors.password && <span className="text-xs text-red-500 mt-1">Password is required</span>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">Remember Me</label>
            </div>
            {/* Submit Button */}
            <div className="flex w-full mb-4">
                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
                >
                    Login
                </button>
            </div>
            {/* Loading and Modal */}
            {loading && <Loading />}
            {/* {isModalOpen && <Modal title={modalTitle} message={modalMessage} onClose={closeModal} />} */}
        </form>
    );

}