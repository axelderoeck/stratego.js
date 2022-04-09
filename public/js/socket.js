// Connect to socket
let socket = io();

// On connection
socket.on('connect', () => {
    // If room parameter does not exist -> create room
    if (params.room){
        roomCode = params.room
        socket.emit('joinGame', params.room);
    }else{
        socket.emit('createGame', params.theme, generateString(ROOMCODE_LENGTH));
    }
})

socket.on('init', (player) => {
    init(player);
})

socket.on('createInvite', (theme, room) => {
    ip = "localhost";
    roomCode = room;
    console.info('Invite link: http://' + ip + ':3000/game?theme=' + theme + '&room=' + room);
});

socket.on('readyUp', (teamNumber) => {
    if (player.team == teamNumber){
        player.ready = true;
        console.log('You are ready');
    }else{
        console.log('The other player is ready');
    }
    if(readyCounter < 2){
        readyCounter++;
    }
    checkReadyStatus();
})

socket.on('cancelReadyUp', (teamNumber) => {
    if (player.team == teamNumber){
        player.ready = false;
        console.log('You are no longer ready');
    }else{
        console.log('The other player is no longer ready');
    }
    if(readyCounter >= 1){
        readyCounter--;
    }
})

socket.on('checkReadyStatus', () => {
    console.log('both players are ready, counter: ', readyCounter);
})

socket.on('updatePawns', (array) => {
    pawns = array;
    placePawns(pawns);
})

socket.on('gameNotFound', (room) => {
    //window.location.href = '/';
    console.error('Room: ' + room + ' not found.');
})

socket.on('gameFull', (room) => {
    //window.location.href = '/';
    console.info('Room:  ' + room + ' is full.');
})