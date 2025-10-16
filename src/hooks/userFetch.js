import { useState } from "react";
import { useEffect } from "react";
import { getAllUser, createUser, deleteUserId } from "../services/users";

export const useUserFetch = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState(""); // Nuevo estado para el título del modal [1
  const [modalMessage, setModalMessage] = useState(""); // Nuevo estado para el mensaje del modal

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (title, message) => {
    setModalTitle(title); // Establece el título del modal
    setModalMessage(message); // Establece el mensaje del modal
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalMessage(""); // Limpia el mensaje del modal
    setModalOpen(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUser();
    setUsers(data);
    setLoading(false);
  };

  const createUserHook = async (user) => {
    setLoading(true);
    try {
      const data = await createUser(user);
      setUsers([...users, data]);
      setLoading(false);
      openModal("Success", "User created successfully."); // Muestra mensaje de éxito
    } catch (error) {
      setLoading(false);
      openModal("Error", "Error creating user. Please try again."); // Muestra mensaje de error
    }
  };

  const deleteUserHook = async (id) => {
    await deleteUserId(id, users);
    const data = users.filter((user) => user.id !== id);
    setUsers(data);
  };

  return {
    users,
    loading,
    isModalOpen,
    modalTitle,
    modalMessage,
    openModal,
    closeModal,
    fetchUsers,
    createUserHook,
    deleteUserHook,
  };
};
