import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

export const useSocket = (orderId = null) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [locationUpdate, setLocationUpdate] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState(null);

    useEffect(() => {
        // Initialize Socket.IO client instance
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"]
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("⚡ useSocket connected:", socket.id);
            setIsConnected(true);

            if (orderId) {
                socket.emit("joinOrderRoom", { orderId });
            }
        });

        socket.on("roomJoined", (data) => {
            console.log("📍 Joined order room:", data);
        });

        socket.on("location:update", (data) => {
            setLocationUpdate(data);
        });

        socket.on("status:update", (data) => {
            setStatusUpdate(data);
        });

        socket.on("disconnect", () => {
            console.log("❌ useSocket disconnected");
            setIsConnected(false);
        });

        return () => {
            if (orderId) {
                socket.emit("leaveOrderRoom", { orderId });
            }
            socket.disconnect();
        };
    }, [orderId]);

    const joinRoom = useCallback((id) => {
        if (socketRef.current && id) {
            socketRef.current.emit("joinOrderRoom", { orderId: id });
        }
    }, []);

    const leaveRoom = useCallback((id) => {
        if (socketRef.current && id) {
            socketRef.current.emit("leaveOrderRoom", { orderId: id });
        }
    }, []);

    const emitLocationUpdate = useCallback(({ orderId: id, latitude, longitude, heading = 0, speed = 0 }) => {
        if (socketRef.current && id && latitude && longitude) {
            socketRef.current.emit("location:update", {
                orderId: id,
                latitude,
                longitude,
                coords: [longitude, latitude],
                heading,
                speed
            });
        }
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        locationUpdate,
        statusUpdate,
        joinRoom,
        leaveRoom,
        emitLocationUpdate
    };
};

export default useSocket;
