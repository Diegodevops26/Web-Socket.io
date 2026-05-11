// [ Servidor Web ]
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require('path');

// [ Adicionando Suporte a Sockets ]
const { Server } = require("socket.io");
const io = new Server(server);

// [ Rotas e Arquivos Estáticos ]
// Usando path.join para evitar erros de diretório em diferentes OS
app.use("/public", express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// [ Setup da parte de Sockets ]
let users = {};

io.on('connection', (socket) => {
    console.log(` [${socket.id}] LOG: USER_CONNECTED`);

    // 1. Inicializa o usuário com posição e uma skin aleatória (0 a 3)
    users[socket.id] = { 
        id: socket.id, 
        x: 50, 
        y: 50,
        skin: Math.floor(Math.random() * 4) 
    };

    // 2. Envia a lista de usuários atuais apenas para o novo usuário que conectou
    socket.emit("ON_USERS_UPDATE", users);

    // 3. Avisa todos os outros que um novo usuário entrou
    socket.broadcast.emit("ON_USERS_UPDATE", users);

    socket.on('disconnect', () => {
        console.log(` [${socket.id}] LOG: USER_DISCONNECTED`);
        // IMPORTANTE: Use 'delete' para remover a chave do objeto totalmente
        delete users[socket.id];
        
        // Avisa os demais para removerem o sprite da tela
        io.emit("ON_USERS_UPDATE", users);
    });

    socket.on("ON_USER_MOVE", (data) => {
        const user = users[socket.id];
        
        if (user && data.move) {
            // Atualiza a posição no servidor
            user.x += (data.move.x || 0);
            user.y += (data.move.y || 0);

            // 4. Trava de segurança para não sair do canvas (420x420)
            user.x = Math.max(0, Math.min(user.x, 390));
            user.y = Math.max(0, Math.min(user.y, 390));

            // Envia a atualização para todos (Socket.io já converte para JSON automaticamente)
            io.emit("ON_USERS_UPDATE", users);
        }
    });
});

// [ Start do servidor ]
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    =========================================
    Servidor rodando em: http://localhost:${PORT}
    Status: Pronto para jogar!
    =========================================
    `);
});
