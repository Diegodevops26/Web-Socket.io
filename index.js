const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

app.use("/public", express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = {};

io.on('connection', (socket) => {
    console.log(`Conectado: ${socket.id}`);
    
    // Inicia o usuário
    users[socket.id] = { id: socket.id, x: 50, y: 50 };

    // Envia para TODOS os usuários o objeto ATUALIZADO
    io.emit("ON_USERS_UPDATE", users);

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit("ON_USERS_UPDATE", users);
    });

    socket.on("ON_USER_MOVE", (data) => {
        const user = users[socket.id];
        if (user && data.move) {
            user.x += data.move.x;
            user.y += data.move.y;
            
            // Trava no mapa 420x420 (sprite tem 30px)
            user.x = Math.max(0, Math.min(user.x, 390));
            user.y = Math.max(0, Math.min(user.y, 390));

            io.emit("ON_USERS_UPDATE", users);
        }
    });
});

server.listen(3000, () => console.log('Rodando em http://localhost:3000'));
