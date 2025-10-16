import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  getAllDiagrams,
  createDiagram,
  deleteDiagramId,
  getDiagramById,
  updateDiagram,
  createInvitation,
  getDiagramsByUserId,
} from "../services/diagrams";

export const useDiagramFetch = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [diagram, setDiagram] = useState({});
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const user = useSelector((state) => state.user);
  const hasFetched = useRef(false); // Flag para evitar peticiones múltiples

  useEffect(() => {
    const fetchDiagramsByUser = async () => {
      if (user?._id && !hasFetched.current) {
        setLoading(true);
        try {
          const data = await getDiagramsByUserId(user._id);
          console.log("Diagrams by user:", data);
          setDiagrams(data);
          hasFetched.current = true;  // Controlar para que no haga más peticiones
        } catch (error) {
          console.error("Error fetching diagrams by user:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDiagramsByUser();
  }, [user._id]); // Solo depende de `user._id`

  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalMessage("");
    setModalOpen(false);
  };

  const fetchDiagrams = async () => {
    setLoading(true);
    try {
      const data = await getAllDiagrams();
      setDiagrams(data);
    } catch (error) {
      console.error("Error fetching all diagrams:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDiagramsByUserIdHook = async (id) => {
    try {
      const data = await getDiagramsByUserId(id);
      return data;
    } catch (error) {
      console.error("Error fetching diagrams by user ID:", error);
      throw error;
    }
  };

  const createDiagramHook = async ({ name }) => {
    setLoading(true);
    try {
      const data = await createDiagram({ name: name, anfitrion: user._id });
      setDiagrams([...diagrams, data]);
      openModal("Success", "Diagram created successfully.");
    } catch (error) {
      openModal("Error", "Error creating diagram. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteDiagramHook = async (id) => {
    setLoading(true);
    try {
      await deleteDiagramId({ id: id, userId: user._id });
      setDiagrams(diagrams.filter((diagram) => diagram.id !== id));
      openModal("Success", "Diagram deleted successfully.");
    } catch (error) {
      openModal("Error", "Error deleting diagram. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateDiagramHook = async (id, diagram) => {
    try {
      await updateDiagram(id, diagram);
      const updatedDiagrams = diagrams.map((d) =>
        d.id === id ? { ...d, ...diagram } : d
      );
      setDiagrams(updatedDiagrams);
      return updatedDiagrams;
    } catch (error) {
      console.error("Error updating diagram:", error);
      throw error;
    }
  };

  const createInvitationHook = async (id, diagram) => {
    try {
      await createInvitation(id, diagram);
      const updatedDiagrams = diagrams.map((d) =>
        d.id === id ? { ...d, ...diagram } : d
      );
      setDiagrams(updatedDiagrams);
      return updatedDiagrams;
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    }
  };

  const getDiagramByIdHook = async (id) => {
    try {
      if (!hasFetched.current) {
        const data = await getDiagramById(id);
        setDiagram(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching diagram by ID:", error);
      throw error;
    }
  };

  return {
    diagram,
    diagrams,
    loading,
    isModalOpen,
    modalTitle,
    modalMessage,
    openModal,
    closeModal,
    fetchDiagrams,
    createDiagramHook,
    deleteDiagramHook,
    updateDiagramHook,
    createInvitationHook,
    getDiagramByIdHook,
    getDiagramsByUserIdHook,
  };
};
