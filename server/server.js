const path = require('path');
const url = require('url');    
const http = require('http');
const fs = require('fs');
const express = require('express');
const socketIO = require('socket.io');
const { connect } = require('http2');
const { all } = require('proxy-addr');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json({ extended: true }));

app.use(express.static(publicPath));

app.set('view engine', 'ejs');

// On get root directory
app.get('/', async function(req, res) {
    // Render index page
    res.render(publicPath + '/index', {
        // get all themes and pass it through to page
        themes: await getThemes()
    });
});

// On post root directory
app.post('/', function(req, res) {
    // Redirect user to game page
    res.redirect(url.format({
        pathname:"/game",
        // Add theme post value to url parameter
        query: {
           "theme": req.body.theme,
         }
    }));
});

// On get game directory
app.get('/game', function(req, res) {
    // Render game page
    res.render(publicPath + '/game', {
        // Get theme parameter from url and pass it through to page
        theme: req.query.theme
    });
});

server.listen(port, ()=> {
    console.log("[stratego] server is running on port " + port + ".");
});

// Rooms array
let clientRooms = [];
io.on('connection', (socket) => {
    // Log info: new connection
    console.log("\x1b[36m%s\x1b[0m", "[stratego] user `" + socket.id + "` connected.");

    socket.on('createGame', (theme, roomCode) => {
        // Join room
        socket.join(roomCode);
        // Assign room to socket id
        clientRooms[socket.id] = roomCode;
        // Assign player number to socket
        socket.player = 0;
        // Return room code to create invite
        io.in(roomCode).emit('createInvite', theme, roomCode);
        // Init player
        socket.emit('init', socket.player);
        // Log success
        console.log("\x1b[32m%s\x1b[0m", "[stratego] user `" + socket.id + "` successfully created room `" + roomCode + "` as player " + parseInt(socket.player + 1) + ".");
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
        // Check player number in room
        if (players === 0) {
            socket.emit('gameNotFound', roomCode);
            // Log warning
            console.log("\x1b[33m%s\x1b[0m", "[stratego] user `" + socket.id + "` tried to connect to room `" + roomCode + "` but the room does not exist.");
            return;
        }else if (players > 1){
            socket.emit('gameFull', roomCode);
            // Log warning
            console.log("\x1b[33m%s\x1b[0m", "[stratego] user `" + socket.id + "` tried to connect to room `" + roomCode + "` but the room is full.");
            return;
        }else{
            // Join room
            socket.join(roomCode);
            // Assign room to socket id
            clientRooms[socket.id] = roomCode;
            // Assign player number to socket
            socket.player = 1; 
            // Init player
            socket.emit('init', socket.player);
            // Log success
            console.log("\x1b[32m%s\x1b[0m", "[stratego] user `" + socket.id + "` successfully joined room `" + roomCode + "` as player " + parseInt(socket.player + 1) + ".");  
        }
    });

    socket.on('readyUp', (roomCode) => {
        io.in(roomCode).emit('readyUp', socket.player);
    });

    socket.on('updateBoard', (roomCode, pawns) => {
        // change to io later like readyUp
        socket.in(roomCode).emit('updatePawns', pawns);
    });

    socket.on('disconnect', () => {
        console.log("\x1b[36m%s\x1b[0m", "[stratego] user `" + socket.id + "` disconnected.");
        console.log('[stratego] server connections: ' + io.engine.clientsCount);
    });

    socket.on('startGame', () => {
        io.emit('startGame');
    });

    let pawns = [];
    socket.on('getPawnsArrayFromServer', () => {
        socket.emit('getPawnsArrayFromServer', pawns);
    })
});

const getThemes = () => {
    return new Promise(resolve => {
        fs.readdir(publicPath + "/themes/", function (err, files) {
            if (err) throw err;
            result = files
                .filter(file => fs.statSync(publicPath + "/themes/" + file).isDirectory())
                .map(file => file);
            resolve(result);
        });
    });
}