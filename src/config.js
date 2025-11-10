const Config = {
  DB_API: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || "http://localhost:4000",
};

export default Config;
