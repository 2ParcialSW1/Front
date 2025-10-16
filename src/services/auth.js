import axios from "axios";
import Config from "../config";

const { DB_API } = Config;
const DB_API_AUTH = `${DB_API}/auth`;

export const login = async ({ email, password }) => {
  const res = await axios.post(DB_API_AUTH, {
    email: email,
    password: password,
  });
  const { data } = res;
  return data;
};
