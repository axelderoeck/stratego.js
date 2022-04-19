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
    inviteUrl = 'http://' + ip + ':3000/game?theme=' + theme + '&room=' + room;
    console.info('Invite link: http://' + ip + ':3000/game?theme=' + theme + '&room=' + room);
});

socket.on('readyUp', (teamNumber) => {
    if (player.team == teamNumber){
        player.ready = true;
    }else{
        $('#player' + parseInt(teamNumber + 1)).addClass('readyBackground');
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
    }else{
        $('#player' + parseInt(teamNumber + 1)).removeClass('readyBackground');
    }
    if(readyCounter >= 1){
        readyCounter--;
    }
})

// Game is about to start
socket.on('checkReadyStatus', () => {
    // Start the game
    socket.emit('startGame', game.room, pawns);
})

socket.on('startGame', (array) => {
    // Turn off the setup phase
    player.setup = false;
    // Merge the enemy array with our array
    for(i = 0; i < array.length; i++){
        pawns.push(array[i]);
    }
    // Initialise the game
    init(player.team);
    $('#hud_upper_right').remove();
})

socket.on('startTurn', () => {
    player.turn = true;
})

socket.on('updatePawns', (array) => {
    pawns = array;
    placePawns();
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

socket.on('playerJoined', () => {
    // Remove the invite buttons
    $("#inviteModal").remove();
    $("#inviteButton").remove();
    // Allow players to be ready now
    allowReady = true;
    // Add players to hud
    $('<button id="player1"></button>').appendTo('#hud_upper_right').addClass('userButton').prepend('<i class="fa-solid fa-user"></i> Player 1');
    $('<button id="player2"></button>').appendTo('#hud_upper_right').addClass('userButton').prepend('<i class="fa-solid fa-user"></i> Player 2');
})

socket.on('endGame', () => {
    // Remove event listener click from all tiles
    $('#board div').off('click');
    
    // Delete old images and effects
    $("#board div")
        .removeClass('shineEffect')
        .children()
        .remove();

    // Place pawns
    pawns.forEach(pawn => {
        // Create pawn
        let tile = $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']");
        // Check for flag or bomb pawn
        let pawnNumber;
        if(pawn[2] == 0){
            pawnNumber = 'F';
        }else if(pawn[2] == 11){
            pawnNumber = 'B';
        }else{
            pawnNumber = pawn[2];
        }
        // Place tile image and span
        tile.prepend('<img draggable="false" src="./themes/' + decodeURI(game.theme) + '/' + pawn[3] + '/' + pawn[2] + '.png" />')
            .prepend('<span data-team=' + pawn[3] + '>' + pawnNumber + '</span>')
    });
})

socket.on('gameNotFound', (room) => {
    //window.location.href = '/';
    console.error('Room: ' + room + ' not found.');
})

socket.on('gameFull', (room) => {
    //window.location.href = '/';
    console.info('Room:  ' + room + ' is full.');
})