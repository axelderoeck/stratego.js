const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const { connect } = require('http2');
const { all } = require('proxy-addr');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));

server.listen(port, ()=> {
    console.log("[stratego] server is running on port " + port + ".");
});

// Rooms array
let clientRooms = [];
io.on('connection', (socket) => {
    // Log info: new connection
    console.log("\x1b[36m%s\x1b[0m", "[stratego] user `" + socket.id + "` connected.");

    socket.on('connect', () => { 
        //
    });

    socket.on('createGame', (roomCode) => {
        // Join room
        socket.join(roomCode);

        // Assign room to socket id
        clientRooms[socket.id] = roomCode;

        // Assign player number to socket
        socket.player = 0;

        // Log success
        console.log("\x1b[32m%s\x1b[0m", "[stratego] user `" + socket.id + "` successfully created room `" + roomCode + "` as player " + parseInt(socket.player + 1) + ".");

        // Return room code to create invite
        io.emit('createInvite', roomCode);

        socket.to(roomCode).emit('initPlayer', socket.player);
        //io.emit('initPlayer', socket.player);
    });

    socket.on('joinGame', (roomCode) => {
        // Get the room by code
        const room = io.sockets.adapter.rooms.get(roomCode);

        // Set defaults
        let players = 0;

        // If room exists -> add users to variable
        if(room){
            players = room.size;
        }

        if (players === 0) {
            //client.emit('gameNotFound');
            // Log warning
            console.log("\x1b[33m%s\x1b[0m", "[stratego] user `" + socket.id + "` tried to connect to room `" + roomCode + "` but the room does not exist.");
            return;
        }else if (players > 1){
            //client.emit('gameFull');
            // Log warning
            console.log("\x1b[33m%s\x1b[0m", "[stratego] user `" + socket.id + "` tried to connect to room `" + roomCode + "` but the room is full.");
            return;
        }

        // Join room
        socket.join(roomCode);

        // Assign room to socket id
        clientRooms[socket.id] = roomCode;

        // Assign player number to socket
        socket.player = 1;

        // Log success
        console.log("\x1b[32m%s\x1b[0m", "[stratego] user `" + socket.id + "` successfully joined room `" + roomCode + "` as player " + parseInt(socket.player + 1) + ".");
        
        socket.to(roomCode).emit('initPlayer', socket.player);
        //io.emit('initPlayer', socket.player);
    });

    socket.on('updateBoard', (roomCode, pawns) => {
        socket.in(roomCode).emit('updatePawns', pawns);
    });

    socket.on('disconnect', () => {
        console.log("\x1b[36m%s\x1b[0m", "[stratego] user `" + socket.id + "` disconnected.");
        console.log('[stratego] server connections: ' + io.engine.clientsCount);
    });

    socket.on('startGame', () => {
        io.emit('startGame');
    });
});

const updateBoard = (roomCode, pawns) => {
    io.sockets.in(roomCode).emit('updateBoard', pawns);
}