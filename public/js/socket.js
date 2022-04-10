// Connect to socket
let socket = io();

// On connection
socket.on('connect', () => {
    // If room parameter does not exist -> create room
    if (game.room){
        socket.emit('joinGame', game.room);
    }else{
        game.room = generateString(ROOMCODE_LENGTH);
        socket.emit('createGame', game.theme, game.room);
    }
})

socket.on('init', (player) => {
    init(player);
})

socket.on('createInvite', (theme, room) => {
    ip = "localhost";
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
    socket.emit('startGame', game.room, pawnsSetup);
})

socket.on('startGame', (array) => {
    // Turn off the setup phase
    setupStage = false;
    // Merge the enemy array with our array based on team
    if (player.team == 0){
        pawns = pawnsSetup;
        for(i = 0; i < array.length; i++){
            pawns.push(array[i]);
        }
    }else{
        for(i = 0; i < array.length; i++){
            pawns.push(array[i]);
        }
        for(i = 0; i < pawnsSetup.length; i++){
            pawns.push(pawnsSetup[i]);
        }
    } 
    // Initialise the game
    init(player.team);
})

socket.on('startTurn', () => {
    player.turn = true;
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