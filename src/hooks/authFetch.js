import { useState } from "react";
import { login } from "../services/auth";
import { useDispatch } from "react-redux";
import { createUser } from "../redux/states/user.state";

export const useAuthFetch = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [isLogged, setIsLogged] = useState(false); // Nuevo estado para saber si el usuario está logueado o no
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState(""); // Nuevo estado para el título del modal [1
  const [modalMessage, setModalMessage] = useState(""); // Nuevo estado para el mensaje del modal

  const openModal = (title, message) => {
    setModalTitle(title); // Establece el título del modal
    setModalMessage(message); // Establece el mensaje del modal
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalMessage(""); // Limpia el mensaje del modal
    setModalOpen(false);
  };

  const loginHook = async (user) => {
    setLoading(true);
    try {
      const data = await login(user);
      console.log(data);
      setLoading(false);
      setIsLogged(true); // Establece el estado de isLogged a true
      dispatch(createUser(data)); // Crea el usuario en el estado global
      window.location.href = "/private/diagrams"; // Redirecciona a la página de diagramas
      openModal("Success", "User logged in successfully."); // Muestra mensaje de éxito
      return data;
    } catch (error) {
      setLoading(false);
      setIsLogged(false); // Establece el estado de isLogged a false
      openModal("Error", "Error logging in user. Please try again."); // Muestra mensaje de error
    }
  };

  return {
    loading,
    isModalOpen,
    modalTitle,
    modalMessage,
    isLogged,
    openModal,
    closeModal,
    loginHook,
  };
};
