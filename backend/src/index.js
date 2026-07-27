import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { initDeliverySocket } from "./sockets/delivery.socket.js";

dotenv.config({
    path: "./.env"
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true
    }
});

// Initialize real-time delivery socket events
initDeliverySocket(io);

const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server & Socket.IO running at port : ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed!!!", err);
    });

export { server, io };