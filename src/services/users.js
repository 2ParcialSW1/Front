import axios from "axios";
import Config from "../config";

const { DB_API } = Config;
const DB_API_USERS = `${DB_API}/users`;

export const getAllUser = async () => {
  const res = await axios.get(DB_API_USERS);
  const { data } = res;
  return data;
};

export const createUser = async ({ name, email, password }) => {
  const res = await axios.post(DB_API_USERS, {
    firstName: name,
    lastName: "Toledo",
    email: email,
    password: password,
  });
  const { data } = res;
  return data;
};

export const deleteUserId = async (id, users) => {
  const { userName } = users[0];
  await axios.delete(`${DB_API_USERS}/${id}`, { userName: userName });
};
