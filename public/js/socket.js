// Connect to socket
let socket = io();

// On connection
socket.on('connect', () => {
    // If room parameter does not exist -> create room
    if (params.room){
        roomCode = params.room
        socket.emit('joinGame', params.room);
    }else{
        socket.emit('createGame', generateString(ROOMCODE_LENGTH));
    }
})

socket.on('init', (player) => {
    init(player);
})

socket.on('createInvite', (room) => {
    ip = "localhost";
    roomCode = room;
    console.log('Invite link: http://' + ip + ':3000/game.html?room=' + room);
});

socket.on('updatePawns', (array) => {
    pawns = updatePawns(array);
    placePawns(pawns);
})