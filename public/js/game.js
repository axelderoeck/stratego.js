// Connect to socket
let socket = io();

// GAME.JS
// =========================

// CONFIG
// =========================

const ROOMCODE_LENGTH = 6; // Length of roomcode (in characters)
const TIME_FIGHT_DISPLAY = 5; // Amount of time the fight display stays on screen (in seconds)
const PLAYER_FIRST_MOVE = 0; // Player that gets the first move (0 = Blue, 1 = Red)
const BOARD_SIZE = 10; // Size of both sides of the board, size 10 = 100 tiles

// SET DEFAULTS
// =========================

let readyCounter = 0;
let inviteUrl;
let allowReady = false;

// Initialise player object
let player = {
    team: 0,
    ready: false,
    turn: false,
    setup: true
};

const placePawns = () => {
    // Delete old images and effects
    $("#board div")
        .removeClass('shineEffect')
        .children()
        .remove();
    
    // Place pawns
    pawns.forEach(pawn => {
        // Create pawn
        let tile = $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']");
        // Add shine effect to pawn
        tile.addClass('shineEffect');
        // Special pawn settings based on team
        if(pawn[3] != player.team){
            tile.prepend('<img draggable="false" src="./themes/' + decodeURI(game.theme) + '/' + pawn[3] + '/unknown.png" />')
        }else{
            // Place tile image and span
            tile.prepend('<img draggable="false" src="./themes/' + decodeURI(game.theme) + '/' + pawn[3] + '/' + pawn[2] + '.png" />')
                .prepend('<span data-team=' + pawn[3] + '>' + getPawnNumber(pawn[2]) + '</span>')
        }
        if(pawn[3] == player.team && player.turn == true || player.setup == true){
            // Check for static pawns -> no click event on static pawns
            if(pawn[2] != 0 && pawn[2] != 11 || player.setup == true){
                // Add event listener
                tile.click(function() {
                    // Remove event listener click from all tiles before adding new ones to avoid conflict
                    $('#board div').off('click');
                    // Add style to cancel select on pawn
                    $('<div class="cancelSelectTile"><i class="fa-solid fa-xmark"></i></div>').appendTo(tile);
                    movePawn(pawn[0], pawn[1], pawn[2], pawn[3]);
                });
            }
            tile.removeClass('notMoveable');
        }else if(pawn[3] == player.team && player.turn == false || pawn[3] != player.team && player.turn == true){
            tile.addClass('notMoveable');
        }else{
            tile.removeClass('notMoveable');
        }
    })
}

const initBoard = () => {
    // Delete possible existing tiles
    $("#board").children().remove();

    // Create all tiles
    for(y = 1; y <= BOARD_SIZE; y++){
        for(x = 1; x <= BOARD_SIZE; x++){
            // Create tile
            let tile = $('<div></div>')
                .appendTo('#board')
                .attr('data-x', x)
                .attr('data-y', y);

            // If its the setup phase
            if(player.setup && !isTileInSpawnZone(player.team, y)){
                tile.addClass('nospawn');
            }

            // Add class if tile is disabled
            if(isTileDisabled(x, y)){
                tile.addClass('disabled');
            }
        }
    } 
}

const fight = (attackingPawn, defendingPawn) => {
    // Get id from attacking pawn
    attackingPawnId = getPawnId(attackingPawn[0], attackingPawn[1], attackingPawn[2], attackingPawn[3]);
    // Check for fight result
    switch (fightOutcome(attackingPawn[2], defendingPawn[2])){
        case true:
            // Display fight result
            socket.emit('displayFight', game.room, attackingPawn, defendingPawn, attackingPawn[3]);
            // Set new coordinate values to pawn
            relocatePawn(attackingPawnId, defendingPawn[0], defendingPawn[1]);
            // Delete/kill the defending pawn
            deletePawn(defendingPawn);
            // Check if game is over
            if(getAmountNonStaticPawnsInTeam(defendingPawn[3]) == 0){
                // Game is over all moveable pawns are dead
                socket.emit('endingGame', game.room, attackingPawn[3]);
            }
            break;
        case false:
            // Display fight result
            socket.emit('displayFight', game.room, attackingPawn, defendingPawn, defendingPawn[3]);
            // Delete/kill the attacking pawn
            deletePawn(attackingPawn);
            // Check if game is over
            if(getAmountNonStaticPawnsInTeam(attackingPawn[3]) == 0){
                // Game is over all moveable pawns are dead
                socket.emit('endingGame', game.room, defendingPawn[3]);
            }
            break;
        case "stalemate":
            // Display fight result
            socket.emit('displayFight', game.room, attackingPawn, defendingPawn, 3);
            // Delete/kill both pawns
            deletePawn(attackingPawn);
            deletePawn(defendingPawn);
            // Check if game is over
            if(getAmountNonStaticPawnsInTeam(defendingPawn[3]) == 0){
                // Game is over all moveable pawns are dead
                socket.emit('endingGame', game.room, attackingPawn[3]);
            }
            if(getAmountNonStaticPawnsInTeam(attackingPawn[3]) == 0){
                // Game is over all moveable pawns are dead
                socket.emit('endingGame', game.room, defendingPawn[3]);
            }
            break;
        case "win":
            // Set new coordinate values to pawn
            relocatePawn(attackingPawnId, defendingPawn[0], defendingPawn[1]);
            // Delete/kill the defending pawn
            deletePawn(defendingPawn);
            socket.emit('endingGame', game.room, attackingPawn[3]);
            break;
    }
}

const mirrorBoard = () => {
    $("#board").addClass("mirror");
    $("#board div").addClass("mirror");
}

const cancelSelect = () => {
    // Remove classes from the tiles
    $('#board div').removeClass('legalMove selected shineEffect');
    // Delete all images with fighticon class
    $("img").remove(".fightIcon");
    // Remove event listener click from all tiles
    $('#board div').off('click');
    // Place pawns
    placePawns();
    // Hide the cancel select button again
    $('#cancelSelect').addClass('hiddenBtn');
}

const movePawn = (old_x, old_y, pawn, team) => {
    // Remove event listener click from all tiles before adding new ones to avoid conflict
    $('#board div').off('click');
    // Check if we are in the setup stage
    if(player.setup){
        // Loop through all tiles on the board
        $("#board div").each(function(){
            // Check if tile is in the spawnzone
            if(isTileInSpawnZone(player.team, $(this).data('y'))){
                // Add click event to the tile that will move our previously selected pawn to the new tile
                $(this).on("click", function(){
                    // Get our previously selected pawn id
                    pawnId = getPawnId(old_x, old_y, pawn, player.team);
                    // Get selected tile's pawn (if exists)
                    selectedTile = getPawnByCoordinate($(this).data('x'), $(this).data('y'));
                    // Check if the selected tile already has a pawn or not (yes -> swap place)
                    if(selectedTile != null){
                        // Get other pawn id
                        selectedPawnId = getPawnId(selectedTile[0], selectedTile[1], selectedTile[2], player.team);
                        // Move other pawn to current tile
                        relocatePawn(selectedPawnId, old_x, old_y);
                    }
                    // Move original selected pawn to selected tile
                    relocatePawn(pawnId, $(this).data('x'), $(this).data('y'));
                    // Remove highlight class
                    $('#board div').removeClass('legalMove selected');
                    // Remove event listener click from all tiles
                    $('#board div').off('click');
                    // Place pawns
                    placePawns();
                });
            }
        });
    }else{
        // Show the cancel select button
        $('#cancelSelect').removeClass('hiddenBtn');
        // Check all the tiles
        $("#board div").each(function(){
            // Check for legal tiles
            if(isLegalMove(old_x, old_y, $(this).data('x'), $(this).data('y'), pawn, team)){
                // Add color to legal tile
                $(this).addClass('legalMove shineEffect');
                // Check if tile has an enemy
                if(checkForEnemyContact($(this).data('x'), $(this).data('y'), team)){
                    $(this).prepend('<img class="fightIcon swordLeft" src="./themes/' + encodeURI(game.theme) + '/misc/sword_left.png" />');
                    $(this).prepend('<img class="fightIcon swordRight" src="./themes/' + encodeURI(game.theme) + '/misc/sword_right.png" />');
                }
                // Add move event to legal tile
                $(this).on("click", function(){
                    // Remove classes from the tiles
                    $('#board div').removeClass('legalMove selected shineEffect');
                    // Delete all images with fighticon class
                    $("img").remove(".fightIcon");
                    // Get pawn ID from array
                    pawnId = getPawnId(old_x, old_y, pawn, team);
                    // Check if there is an enemy on the new tile
                    if (checkForEnemyContact($(this).data("x"), $(this).data("y"), team)){
                        // Get full pawn object of both parties
                        attackingPawn = getPawnById(pawnId);
                        defendingPawn = getPawnByCoordinate($(this).data("x"), $(this).data("y"));
                        // Execute the fight
                        fight(attackingPawn, defendingPawn);
                    }else{
                        // Set new coordinate values to pawn
                        relocatePawn(pawnId, $(this).data("x"), $(this).data("y"));
                    }
                    // End our turn
                    socket.emit('endTurn', game.room);
                    player.turn = false;
                    // Remove event listener click from all tiles
                    $('#board div').off('click');
                    // Place pawns
                    placePawns();
                    // Hide the cancel select button again
                    $('#cancelSelect').addClass('hiddenBtn');
                    // Update the array on server
                    socket.emit('updateBoard', game.room, pawns);
                });
            // Cancel on click same tile
            }else if($(this).data("x") == old_x && $(this).data("y") == old_y){
                // Set selected tile
                $(this).addClass('selected');
                // Add cancel event
                $(this).on("click", function(){
                    // Remove classes from the tiles
                    $('#board div').removeClass('legalMove selected shineEffect');
                    // Delete all images with fighticon class
                    $("img").remove(".fightIcon");
                    // Remove event listener click from all tiles
                    $('#board div').off('click');
                    // Place pawns
                    placePawns();
                    // Hide the cancel select button again
                    $('#cancelSelect').addClass('hiddenBtn');
                });
            }
        });
    }
}

// SETUP PHASE FUNCTIONS
// =========================

const reset = () => {
    // Reset the pawns
    resetPawns();

    // Disable ready button
    $('#readyUp').prop('disabled', true);

    // Init again
    initBox();
    placePawns();
}

const randomise = () => {
    // Randomly fill up the entire spawn zone
    randomisePawns(player.team);

    // Enable ready button
    if(allowReady){
        $('#readyUp').prop('disabled', false);
    }

    // empty the array
    pawnsInBox = [];
    placePawns();
    initBox();
}

const readyUp = () => {
    // Remove event listener click from all tiles
    $('#board div').off('click');
    $('#box div').off('click');
    // Change display
    $('#readyUp').addClass('hidden');
    $('#cancelReadyUp').removeClass('hidden');
    $('#player' + parseInt(player.team + 1)).addClass('readyBackground');
    // Disable the other buttons
    $('.standardButton').prop('disabled', true);
    // Emit action to server
    socket.emit('readyUp', game.room);
}

const cancelReadyUp = () => {
    // Reset all event listeners and pawns
    initBox();
    placePawns();
    // Change display
    $('#readyUp').removeClass('hidden');
    $('#cancelReadyUp').addClass('hidden');
    $('#player' + parseInt(player.team + 1)).removeClass('readyBackground');
    // Enable the other buttons
    $('.standardButton').prop('disabled', false);
    // Emit action to server
    socket.emit('cancelReadyUp', game.room);
}

const checkReadyStatus = () => {
    if(readyCounter >= 2){
        // Both players are ready -> start the process to start the game
        socket.emit('checkReadyStatus', game.room);
    }
}

// INIT FUNCTIONS
// =========================

const initBox = () => {
    $('#box').remove();
    $('<div id="box"></div>').appendTo('#fullboard');

    for(i = 0; i <= Math.max(...pawnsInBox); i++){
        // Count available pawns
        let amountPawnsAvailable = 0;
        for(j = 0; j < pawnsInBox.length; j++){
            // Look for the pawn
            if(i == pawnsInBox[j]){
                // +1 everytime pawn is found in box
                amountPawnsAvailable++;
            }
            // Break the loop if we already passed our pawn (better performance I guess)
            if(i < pawnsInBox[j]){
                break;
            }
        }

        // If still available -> place pawn in box
        if(amountPawnsAvailable > 0){
            // Place pawn in box
            $('<div id="pawn_' + i +'"><img draggable="false" src="./themes/' + decodeURI(game.theme) + '/' + player.team + '/' + i + '.png" /><span data-team="' + player.team + '">' + getPawnNumber(i) + '</span><span class="amount">' + amountPawnsAvailable + 'x</span></div>')
            .appendTo('#box')
            .attr('data-pawn', i)
            .attr('data-remaining', amountPawnsAvailable)
            .click(function(pawn) {
                // Add highlight class to tile
                $(this).addClass('legalMove selected');
                // Loop all tiles
                $("#board div").each(function(){
                    if(isTileInSpawnZone(player.team, $(this).data('y'))){
                        // Add move event to legal tile
                        $(this).on("click", function(){
                            // Remove highlight class
                            $('#board div').removeClass('legalMove selected');
                            // Turn the html string to a JQuery element object
                            let pawnElement = $($.parseHTML(pawn.currentTarget.outerHTML));
                            if(pawnElement.data('remaining') > 0){
                                // Check if the place already has a pawn
                                if(getPawnByCoordinate($(this).data('x'), $(this).data('y')) == null){
                                    // Add pawn to setup
                                    pawns.push([$(this).data('x'), $(this).data('y'), pawnElement.data('pawn'), player.team]);
                                    // Remove pawn from box
                                    pawnsInBox.splice(pawnsInBox.indexOf(pawnElement.data('pawn')), 1);
                                }
                            }

                            // Remove event listener click from all tiles
                            $('#board div').off('click');
                            // Place pawns
                            placePawns();
                            // Check if all pawns have been placed
                            if(pawns.length == 40){
                                console.log('placed all pawns');
                                // Enable ready button
                                if(allowReady){
                                    $('#readyUp').prop('disabled', false);
                                }
                            }else if(pawns.length < 40){
                                // Disable ready button
                                $('#readyUp').prop('disabled', true);
                                initBox();
                            }else{
                                // too many pawns someones cheating
                            }
                        });
                    }
                });
            });
        }
    }
}

const init = (teamNumber) => {
    // Assign team number
    player.team = teamNumber;
    // Create the board
    initBoard();
    if(player.setup){
        // Add box
        initBox();
    }else if(player.team == PLAYER_FIRST_MOVE){
        player.turn = true;
    }
    initNavigation();

    // Mirror the board if it's player 2
    if(player.team == 1){
        mirrorBoard();
        // Notify player 1 about connected player 2
        socket.emit('playerJoined', game.room);
    }

    socket.emit('updatePawns', pawns);
    placePawns();
}

const initNavigation = () => {
    // Remove existing buttons
    $("#hud_lower_right").children().remove();
    $("#hud_upper_right").children().remove();
    $("#inviteModal").remove();
    if (player.setup){
        // Create invite modal
        $('<div id="inviteModal" class="hidden"></div>').appendTo('#fullboard').prepend('<span>Invite Player</span><br>Send this URL to the second player. <br><br><input id="url" value="' + inviteUrl + '"><button id="copyBtn" data-clipboard-target="#url">Copy URL</button>')
        // Add invite button
        $('<button id="inviteButton"></button>').appendTo('#hud_upper_right').addClass('standardButton').click(invitePlayer).prepend('<i class="fa-solid fa-envelope"></i> Invite Player');
        // Add ready button
        $('<button id="readyUp"></button>').appendTo('#hud_lower_right').addClass('readyButton').click(readyUp).prop('disabled', true).prepend('<i class="fa-solid fa-check"></i> Ready');
        // Add cancel button
        $('<button id="cancelReadyUp"></button>').appendTo('#hud_lower_right').addClass('cancelButton hidden').click(cancelReadyUp).prepend('<i class="fa-solid fa-xmark"></i> Cancel Ready');
        // Add randomise button
        $('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click(randomise).prepend('<i class="fa-solid fa-shuffle"></i> Randomise');
        // Add reset button
        $('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click(reset).prepend('<i class="fa-solid fa-arrow-rotate-left"></i> Reset Pawns');
    }else{
        // Add cancel move button
        $('<button id="cancelSelect"></button>').appendTo('#hud_lower_right').addClass('deleteButton hiddenBtn').click(cancelSelect).prepend('<i class="fa-solid fa-xmark"></i> Cancel Select');
        // Add cemetery button
        //$('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click().prepend('<i class="fa-solid fa-cross"></i> View Cemetery');
        // Add skip turn button
        //$('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click().prepend('<i class="fa-solid fa-forward"></i> Skip Turn');
    }
}

const invitePlayer = () => {
    $('#inviteModal').toggleClass('hidden');
}

// FLUFF
// =========================
const wallhack = () => {
    pawns.forEach(pawn => {
        let tile = $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']");
        if(pawn[3] != player.team){
            tile.prepend("<span>" + pawn[2] + " " + getPawnName(pawn[2]) + "</span>").css({
                "font-size": "10px",
                "color": "rgba(0, 128, 0, 0.3)"
            })
        }
    });
}

const randomMove = () => {
    // Generate new random values
    let randomX = Math.floor(Math.random() * (10 - 1 + 1) + 1);
    let randomY = Math.floor(Math.random() * (10 - 1 + 1) + 1);
    // Check if it's a legally moveable tile (same team, no flag/bomb)
    while (getPawnByCoordinate(randomX, randomY) == null || getPawnByCoordinate(randomX, randomY)[3] != player.team || getPawnByCoordinate(randomX, randomY)[2] == 0 || getPawnByCoordinate(randomX, randomY)[2] == 11){
        // Generate new random values
        randomX = Math.floor(Math.random() * (10 - 1 + 1) + 1);
        randomY = Math.floor(Math.random() * (10 - 1 + 1) + 1);
    }
    // Get pawn
    let pawn = getPawnByCoordinate(randomX, randomY);
    // Click the random pawn
    $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']").trigger('click');
    
    setTimeout(function(){
        // Generate new random values
        randomX = Math.floor(Math.random() * (10 - 1 + 1) + 1);
        randomY = Math.floor(Math.random() * (10 - 1 + 1) + 1);
        // Set counter to avoid overloading
        tries = 0;
        // Check if tile is a legal move
        while (!isLegalMove(pawn[0], pawn[1], randomX, randomY, pawn[2], pawn[3]) && tries <= 100){
            tries++;
            // Generate new random values
            randomX = Math.floor(Math.random() * (10 - 1 + 1) + 1);
            randomY = Math.floor(Math.random() * (10 - 1 + 1) + 1);
        }
        // Cancel move on 100 tries
        if(tries >= 100){
            $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']").trigger('click');
            console.log("Cancelled move.");
        }else{
            // Click a random legal tile
            $("div[data-x='" + randomX + "'][data-y='" + randomY + "']").trigger('click');
        }
    }, 100);
}

// Insane ai implementation with a very complex algorithm
// totally not randomised clicks and ifs
const loopRandomMove = () => {
    setInterval(function(){ 
        randomMove();
    }, 500);
}

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
        // Place tile image and span
        tile.prepend('<img draggable="false" src="./themes/' + decodeURI(game.theme) + '/' + pawn[3] + '/' + pawn[2] + '.png" />')
            .prepend('<span data-team=' + pawn[3] + '>' + getPawnNumber(pawn[2]) + '</span>')
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