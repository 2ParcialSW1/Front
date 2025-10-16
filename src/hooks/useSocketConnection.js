import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Config from "../config";

const { SOCKET_URL } = Config;

export const useSocketConnection = (diagramId, user) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [usersConnected, setUsersConnected] = useState([]);
    const isServerUpdate = useRef(false);

    useEffect(() => {
        if (!diagramId || !user.email) return; // Evitar conexiones sin los datos necesarios

        const socketInstance = io(SOCKET_URL);
        setSocket(socketInstance);

        socketInstance.emit("joinRoom", { diagramId, user: user.email });
        socketInstance.emit("userConnected", { diagramId, user });

        socketInstance.on("usersConnectedUpdate", (connectedUsers) => {
            setUsersConnected(connectedUsers);
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [diagramId, user.email]); // Evitar la repetición innecesaria cuando cambian `diagramId` o `user.email`

    return { socket, isConnected, usersConnected, isServerUpdate };
};
