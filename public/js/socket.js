// Connect to socket
let socket = io();

// On connection
socket.on('connect', () => {
    // If room parameter does not exist -> create room
    if (params.room){
        roomCode = params.room
        socket.emit('joinGame', params.room);
    }else{
        roomCode = generateString(ROOMCODE_LENGTH);
        params.room = roomCode;
        socket.emit('createGame', params.theme, roomCode);
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
    // Check if both players are ready
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

// Game is about to start
socket.on('checkReadyStatus', () => {
    // Start the game
    socket.emit('startGame', roomCode, tempSetup);
})

socket.on('startGame', (array) => {
    // Turn off the setup phase
    setupStage = false;
    // Merge the enemy array with our array based on team
    if (player.team == 0){
        pawns = tempSetup;
        for(i = 0; i < array.length; i++){
            pawns.push(array[i]);
        }
    }else{
        for(i = 0; i < array.length; i++){
            pawns.push(array[i]);
        }
        for(i = 0; i < tempSetup.length; i++){
            pawns.push(tempSetup[i]);
        }
    } 
    // Initialise the game
    init(player.team);
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