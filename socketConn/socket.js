let users = {};

module.exports = (io) => {

    io.on("connection", (socket) => {
        console.log("User Connected:", socket.id);

        socket.on("register", (userId) => {
            users[userId] = socket.id;
            // console.log("Users:", users);
        });

        socket.on("send-message", ({ message, to, from }) => {
    // console.log("📩 Message:", message, "To:", to, "From:", from);

    const receiverSocket = users[to];

    if (receiverSocket) {
        io.to(receiverSocket).emit("receive-msg", {
    message: message,
    from: from
})
    } else {
        console.log("❌ User not connected:", to);
    }
});

    });

};