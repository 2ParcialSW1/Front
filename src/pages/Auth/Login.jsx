import LoginForm from "../../components/Auth/LoginForm";

export default function Login() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="flex flex-col w-full p-10 bg-white rounded-lg shadow-md lg:w-1/2">
                <h2 className="mb-5 text-3xl font-bold text-center text-gray-700">Login</h2>
                <LoginForm />
                <p className="text-sm text-center text-gray-400">
                    Don&apos;t have an account?&nbsp;
                    <a href="/register" className="text-indigo-400 focus:outline-none focus:underline focus:text-indigo-500 hover:text-indigo-500">Register</a></p>
            </div>
        </div>
    );
}