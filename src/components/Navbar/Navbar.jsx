import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Navbar = () => {
    const user = useSelector((state) => state.user);
    
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        window.location.href = "/login";
    };

    return (
        <nav className="bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
                {/* Logo or Title */}
                <Link to="/private/diagrams" className="text-white font-bold text-xl hover:text-blue-300">
                    Diagrams
                </Link>

                {/* User Info */}
                <div className="flex items-center space-x-4">
                    <span className="text-gray-300">{user.email}</span>
                    <button
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
