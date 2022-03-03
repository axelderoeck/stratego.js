const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const { connect } = require('http2');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}.`)
});

// "\x1b[31m%s\x1b[0m" = red
// "\x1b[33m%s\x1b[0m" = yellow
// "\x1b[32m%s\x1b[0m" = green
// "\x1b[36m%s\x1b[0m" = cyan

// Rooms array
let clientRooms = [];
io.on('connection', (socket) => {
    console.log('A user just connected.');
    socket.on('connect', () => { 
    });

    socket.on('createGame', (roomCode) => {
        socket.join(roomCode);
        // Assign room to socket id
        clientRooms[socket.id] = roomCode;

        // Assign player number to socket
        socket.player = 0;

        // Log action
        console.log("\x1b[32m%s\x1b[0m", "[stratego] id `" + socket.id + "` successfully created room `" + roomCode + "` as player " + socket.player + ".");

        // Return room code to create invite
        io.emit('createInvite', roomCode);

        io.emit('init', socket.player);
    });

    socket.on('joinGame', (roomCode) => {
        // Get the room by code
        const room = io.sockets.adapter.rooms[roomCode];

        // If room exists -> add users to variable
        let allUsers;
        if(room){
            // something is wrong here
            allUsers = room.sockets;
        }

        let numClients = 0;
        if(allUsers){
            numClients = Object.keys(allUsers).length;
        }

        if (numClients === 0) {
            //client.emit('gameNotFound');
            console.log("\x1b[33m%s\x1b[0m", "[stratego] id `" + socket.id + "` tried to connect to room `" + roomCode + "` but the room does not exist.");
            return;
        }else if (numClients > 1){
            //client.emit('gameFull');
            console.log("\x1b[33m%s\x1b[0m", "[stratego] id `" + socket.id + "` tried to connect to room `" + roomCode + "` but the room is full.");
            return;
        }

        socket.join(roomCode);
        // Assign room to socket id
        clientRooms[socket.id] = roomCode;

        // Assign player number to socket
        socket.player = 1;

        // Log action
        console.log("\x1b[32m%s\x1b[0m", "[stratego] id `" + socket.id + "` successfully joined room `" + roomCode + "` as player " + socket.player + ".");

        io.emit('init', socket.player);
    });

    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
        console.log('connections to server: ' + io.engine.clientsCount);
    });

    socket.on('startGame', () => {
        io.emit('startGame');
    });

    const newGame = () => {
        let room = createRoom(6);
        clientRooms[client.id] = room;
        client.emit('gameCode', room);

        client.join();
    }
});