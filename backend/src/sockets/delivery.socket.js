// sockets/delivery.socket.js

export const initDeliverySocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`⚡ Socket connected: ${socket.id}`);

        // Join room by orderId (used by both Customer and Delivery Partner)
        socket.on("joinOrderRoom", ({ orderId }) => {
            if (orderId) {
                const roomName = `order_${orderId}`;
                socket.join(roomName);
                console.log(`📍 Socket ${socket.id} joined room: ${roomName}`);

                socket.emit("roomJoined", {
                    success: true,
                    orderId,
                    room: roomName
                });
            }
        });

        // Leave order room
        socket.on("leaveOrderRoom", ({ orderId }) => {
            if (orderId) {
                const roomName = `order_${orderId}`;
                socket.leave(roomName);
                console.log(`🚪 Socket ${socket.id} left room: ${roomName}`);
            }
        });

        // Delivery partner emits live location updates
        // Payload expected: { orderId, latitude, longitude, heading, speed }
        socket.on("location:update", (data) => {
            if (!data) return;

            const { orderId, latitude, longitude, coords } = data;

            const lat = latitude !== undefined ? latitude : coords?.latitude;
            const lng = longitude !== undefined ? longitude : coords?.longitude;

            if (orderId && lat !== undefined && lng !== undefined) {
                const roomName = `order_${orderId}`;

                const locationPayload = {
                    orderId,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                    coords: [parseFloat(lng), parseFloat(lat)], // GeoJSON format [lng, lat]
                    heading: data.heading || 0,
                    speed: data.speed || 0,
                    timestamp: new Date().toISOString()
                };

                // Broadcast live location update to all clients in the order room (customer listening)
                io.to(roomName).emit("location:update", locationPayload);
            }
        });

        socket.on("disconnect", () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });
};