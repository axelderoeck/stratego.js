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

socket.on('displayFight', (attackingPawn, defendingPawn, winningTeam) => {
    // Create visualfight div
    $('<div id="visualFight"></div>').appendTo('#fullboard');
        // Add swords
        $('<div class="swords"></div>').appendTo('#visualFight')
            .append('<img class="swoopInLeft" src="./themes/' + game.theme + '/misc/sword_left.png"/>')
            .append('<img class="swoopInRight" src="./themes/' + game.theme + '/misc/sword_right.png" />');
        // Add versus span
        $('<span class="versus">VS</span>').appendTo('#visualFight');
        // Add left section
        $('<div id="left"></div>').appendTo('#visualFight')
            .append('<img src="themes/' + game.theme + '/' + attackingPawn[3] + '/' + attackingPawn[2] + '.png" alt="pawn image">')
            .append('<span>' + attackingPawn[2] + '. ' + getPawnName(attackingPawn[2]) + '</span>');
        // Add right section
        $('<div id="right"></div>').appendTo('#visualFight')
            .append('<img src="themes/' + game.theme + '/' + defendingPawn[3] + '/' + defendingPawn[2] + '.png" alt="pawn image">')
            .append('<span>' + defendingPawn[2] + '. ' + getPawnName(defendingPawn[2]) + '</span>');
        // Add result span
        let result = (winningTeam == player.team) ? 'Win' : 'Lose';
        $('<span class="result">' + result + '</span>').appendTo('#visualFight');
    // Delete visualfight div after timer
    setTimeout(function() {
        $('#visualFight').remove();
    }, TIME_FIGHT_DISPLAY * 1000);
})

socket.on('gameNotFound', (room) => {
    //window.location.href = '/';
    console.error('Room: ' + room + ' not found.');
})

socket.on('gameFull', (room) => {
    //window.location.href = '/';
    console.info('Room:  ' + room + ' is full.');
})