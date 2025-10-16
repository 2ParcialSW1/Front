import axios from "axios";
import Config from "../config";

const { DB_API } = Config;
const DB_API_DIAGRAMS = `${DB_API}/diagrams`;

export const getAllDiagrams = async () => {
  const res = await axios.get(DB_API_DIAGRAMS);
  const { data } = res;
  return data;
};

export const createDiagram = async ({ name, anfitrion }) => {
  console.log("name", name);
  console.log("anfitrion", anfitrion);
  const res = await axios.post(DB_API_DIAGRAMS, {
    name: name,
    anfitrion: anfitrion,
  });
  const { data } = res;
  return data;
};

export const deleteDiagramId = async ({ id, userId }) => {
  console.log("id", id);
  console.log("userId", userId);
  const res = await axios.delete(`${DB_API_DIAGRAMS}/${id}/${userId}`);
  console.log("res", res);
};

export const updateDiagram = async (
  id,
  { name, diagram, anfitrion, participantes }
) => {
  const res = await axios.put(`${DB_API_DIAGRAMS}/${id}`, {
    name: name,
    plantUML: diagram,
    anfitrion: anfitrion,
    participantes: participantes,
  });
  const { data } = res;
  return data;
};

export const createInvitation = async (
  id,
  { name, diagram, anfitrion, participantes }
) => {
  const res = await axios.post(`${DB_API_DIAGRAMS}/user/invite/${id}`, {
    name: name,
    plantUML: diagram,
    anfitrion: anfitrion,
    participantes: participantes,
  });
  const { data } = res;
  return data;
};

export const getDiagramById = async (id) => {
  const res = await axios.get(`${DB_API_DIAGRAMS}/${id}`);
  const { data } = res;
  return data;
};

export const getDiagramsByUserId = async (id) => {
  const res = await axios.get(`${DB_API_DIAGRAMS}/user/${id}`);
  const { data } = res;
  return data;
};
