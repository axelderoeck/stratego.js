// STRATEGO.JS
// =========================

// CONFIG
// =========================

const ROOMCODE_LENGTH = 6; // Length of roomcode (in characters)
const TIME_FIGHT_DISPLAY = 5; // Amount of time the fight display stays on screen (in seconds)
const PLAYER_FIRST_MOVE = 0; // Player that gets the first move (0 = Blue, 1 = Red)

// ARRAYS SETUP
// =========================

// Copy all existing pawns into the box
let pawnsInBox = [...ALL_PAWNS];

/* Pawns 2D array = [[X, Y, Pawn, Team], ...]
* @param pawns[ID][0] = X (1-10)
* @param pawns[ID][1] = Y (1-10)
* @param pawns[ID][2] = Pawn (0-11) // Flag = 0, Spy = 1, Bomb = 11
* @param pawns[ID][3] = Team (0/1) // Blue = 0, Red = 1
**/

let pawns = [];

/* Cemetery 2D array = [[Pawn, Team], ...]
*
* @param pawns[ID][0] = Pawn (0-11) // Flag = 0, Spy = 1, Bomb = 11
* @param pawns[ID][1] = Team (0/1) // Blue = 0, Red = 1
* 
**/

let cemetery = [];

// SET DEFAULTS
// =========================

let readyCounter = 0;

// Initialise player object
let player = {
    team: 0,
    ready: false,
    turn: false,
    setup: true
};

// GET DATA FUNCTIONS
// =========================

const getUpdatedArray = (array) => {
    return array;
}

const getPawnName = (pawn) => {
    switch (pawn){
        case 0:
            return 'Flag';
        case 1:
            return 'Spy';
        case 2:
            return 'Scout';
        case 3:
            return 'Miner';
        case 4:
            return 'Sergeant';
        case 5:
            return 'Lieutenant';
        case 6:
            return 'Captain';
        case 7:
            return 'Major';
        case 8:
            return 'Colonel';
        case 9:
            return 'General';
        case 10:
            return 'Marshall';
        case 11:
            return 'Bomb';
        default:
            return null;
    }
}

const getPawnByCoordinate = (x, y) => {
    for (var i = 0; i < pawns.length; i++) {
        if (pawns[i][0] == x && pawns[i][1] == y){
            return pawns[i];
        }
    }
    return null;
}

const getPawnById = (id) => {
    return pawns[id]
}

const getPawnId = (x, y, pawn, team) => {
    // Loop through all pawns
    for (var i = 0; i < pawns.length; i++) {
        if (pawns[i][0] == x && pawns[i][1] == y && pawns[i][2] == pawn && pawns[i][3] == team){
            // Pawn found -> return id
            return i;
        }
    }
    // Nothing found -> return null
    return null;
}

const getAmountPawnsInTeam = (team) => {
    let counter = 0;
    pawns.forEach(pawn => {
        if (pawn[3] == team){
            counter++;
        }
    });
    return counter;
}

// CHECK FUNCTIONS
// =========================

const isTileDisabled = (x, y) => {
    // Check if tile is disabled
    for (var i = 0; i < DISABLED_TILES.length; i++) {
        if (DISABLED_TILES[i][0] == x && DISABLED_TILES[i][1] == y){
            return true;
        }
    }
    return false;
}

const isTileInSpawnZone = (y) => {
    if(player.team == 0 && y >= 7 || player.team == 1 && y <= 4){
        return true;
    }
    return false;
}

const isLegalMove = (old_x, old_y, new_x, new_y, pawn, team) => {
    // Get pawn info from new tile
    let tilePawn = getPawnByCoordinate(new_x, new_y);
    // Set defaults
    let passedEnemies = 0;
    // Check if tile is disabled
    if(!isTileDisabled(new_x, new_y)){
        // If pawn does not exist or is not part of team ->
        if(tilePawn == null || tilePawn[3] != team){
            if(pawn == 0 || pawn == 11){ // Check for static pawns
                return false;
            }else if(pawn == 2){ // Check for scout pawn
                // New X or Y can be any value except the old while the other axis has to stay the same (avoid diagonal walking)
                if(new_x != old_x && new_y == old_y || new_y != old_y && new_x == old_x){
                    if(old_x == new_x){
                        if(old_y < new_y){
                            for(i = old_y +1; i <= new_y; i++){
                                if(passedEnemies >= 1 || isTileDisabled(new_x, i)){
                                    return false;
                                }
                                if (getPawnByCoordinate(new_x, i) != null){
                                    if (checkForEnemyContact(new_x, i, team)){
                                        passedEnemies++;
                                    }else{
                                        return false;
                                    }
                                }
                            }
                        }else{
                            for(i = old_y -1; i >= new_y; i--){
                                if(passedEnemies >= 1 || isTileDisabled(new_x, i)){
                                    return false;
                                }
                                if (getPawnByCoordinate(new_x, i) != null){
                                    if (checkForEnemyContact(new_x, i, team)){
                                        passedEnemies++;
                                    }else{
                                        return false;
                                    }
                                }
                            }
                        }
                    }else if(old_y == new_y){
                        if(old_x < new_x){
                            for(i = old_x +1; i <= new_x; i++){
                                if(passedEnemies >= 1 || isTileDisabled(i, new_y)){
                                    return false;
                                }
                                if (getPawnByCoordinate(i, new_y) != null){
                                    if (checkForEnemyContact(i, new_y, team)){
                                        passedEnemies++;
                                    }else{
                                        return false;
                                    }
                                }
                            }
                        }else{
                            for(i = old_x -1; i >= new_x; i--){
                                if(passedEnemies >= 1 || isTileDisabled(i, new_y)){
                                    return false;
                                }
                                if (getPawnByCoordinate(i, new_y) != null){
                                    if (checkForEnemyContact(i, new_y, team)){
                                        passedEnemies++;
                                    }else{
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                    return true;
                }else{
                    return false;
                }
            }else{ // Any other pawn
                // New X or Y has to be +1 or -1 while the other coordinate axis has to stay the same (avoid diagonal walking)
                if((new_x == old_x + 1 || new_x == old_x - 1) && new_y == old_y || (new_y == old_y + 1 || new_y == old_y - 1) && new_x == old_x){
                    return true;
                }else{
                    return false;
                }
            }
        }else{
            return false;
        }
    }else{
        return false;
    }
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
        }
        if(pawn[3] == player.team && player.turn == true || player.setup == true){
            // Add event listener
            tile.click(function() {
                // Add highlight class
                tile.addClass('legalMove selected');
                movePawn(pawn[0], pawn[1], pawn[2], pawn[3]);
            });
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
            if(player.setup && !isTileInSpawnZone(y)){
                tile.addClass('nospawn');
            }

            // Add class if tile is disabled
            if(isTileDisabled(x, y)){
                tile.addClass('disabled');
            }
        }
    } 
}

/* This function is written in favor of the attacker.
*
* return true = attacker wins.
* 
**/

const fightOutcome = (attackingPawn, defendingPawn) => {
    // If the defending pawn is the flag
    if(defendingPawn == 0){
        return "win";
    }else if(attackingPawn < defendingPawn){
        // If the defending pawn is a marshal (10) and the attacking pawn is a spy (1)
        if(defendingPawn == 10 && attackingPawn == 1){
            return true;
        }
        // If the defending pawn is a bomb (11) and the attacking pawn is a miner (3)
        if(defendingPawn == 11 && attackingPawn == 3){
            return true;
        }
        return false;
    }else if(attackingPawn == defendingPawn){
        return "stalemate";
    }else{
        // If the attacking pawn is a marshal (10) and the defending pawn is a spy (1)
        // NOTE: official rules state that the spy HAS to be the attacking pawn to win (ignoring atm).
        if(attackingPawn == 10 && defendingPawn == 1){
            return false;
        }
        return true;
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
            pawns[attackingPawnId][0] = defendingPawn[0];
            pawns[attackingPawnId][1] = defendingPawn[1];
            // Delete/kill the defending pawn
            deletePawn(defendingPawn);
            break;
        case false:
            // Display fight result
            socket.emit('displayFight', game.room, attackingPawn, defendingPawn, defendingPawn[3]);
            // Delete/kill the attacking pawn
            deletePawn(attackingPawn);
            break;
        case "stalemate":
            // Display fight result
            socket.emit('displayFight', game.room, attackingPawn, defendingPawn, 3);
            // Delete/kill both pawns
            deletePawn(attackingPawn);
            deletePawn(defendingPawn);
            break;
        case "win":
            // Set new coordinate values to pawn
            pawns[attackingPawnId][0] = defendingPawn[0];
            pawns[attackingPawnId][1] = defendingPawn[1];
            // Delete/kill the defending pawn
            deletePawn(defendingPawn);
            endGame(attackingPawn[3]);
            break;
    }
}

const mirrorBoard = () => {
    $("#board").addClass("mirror");
    $("#board div").addClass("mirror");
}

const addPawn = (x, y, pawn, team) => {
    if(getPawnByCoordinate(x, y) == null){
        pawns.push([x, y, pawn, team]);
        placePawns();
        return true;
    }else{
        console.error("Failed to execute addPawn() \n Pawn already exists on x:" + x + " y:" + y + ".");
        return false;
    }
}

const deletePawn = (pawn) => {
    id = getPawnId(pawn[0], pawn[1], pawn[2], pawn[3]);
    if(id != null){
        // Remove pawn from array
        pawns.splice(id, 1);
        // Add pawn to cemetery array
        cemetery.push([pawn[2], pawn[3]]);
        // Place all pawns
        placePawns();
        return true;
    }else{
        console.log("pawn: " + pawn + " does not exist.");
        return false;
    }
}

const endGame = (player) => {
    // Remove event listener click from all tiles
    $('#board div').off('click');
    console.log("player: " + parseInt(player + 1) + " has won the game.");
    console.log("The game has ended.");
}

const checkForEnemyContact = (new_x, new_y, team) => {
    // Get pawn by coordinate
    pawn = getPawnByCoordinate(new_x, new_y);

    // Check if pawn exists and is not on same team
    if (pawn != null && pawn[3] != team) {
        return true;
    }else{
        return false;
    }
}

const movePawn = (old_x, old_y, pawn, team) => {
    // Remove event listener click from all tiles before adding new ones to avoid conflict
    $('#board div').off('click');
    // Check if we are in the setup stage
    if(player.setup){
        // Loop through all tiles on the board
        $("#board div").each(function(){
            // Check if tile is in the spawnzone
            if(isTileInSpawnZone($(this).data('y'))){
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
                        pawns[selectedPawnId][0] = old_x;
                        pawns[selectedPawnId][1] = old_y;
                    }
                    // Move original selected pawn to selected tile
                    pawns[pawnId][0] = $(this).data('x');
                    pawns[pawnId][1] = $(this).data('y');
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
        // Check for static pawn
        if(pawn == 11 || pawn == 0){
            // Cancel move
            return;
        }
        // Set defaults
        let atLeastOneLegalMove = false;
        // Check all the tiles
        $("#board div").each(function(){
            // Check for legal tiles
            if(isLegalMove(old_x, old_y, $(this).data('x'), $(this).data('y'), pawn, team)){
                // Turn checker on if isn't on already
                if(!atLeastOneLegalMove){
                    atLeastOneLegalMove = true;
                }
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
                    // Get values from selected tile
                    new_x = $(this).data("x");
                    new_y = $(this).data("y");
                    // Get pawn ID from array
                    pawnId = getPawnId(old_x, old_y, pawn, team);
                    // Check if there has to be a fight
                    if (checkForEnemyContact(new_x, new_y, team)){
                        // Get full pawn object of both parties
                        attackingPawn = getPawnById(pawnId);
                        defendingPawn = getPawnByCoordinate(new_x, new_y);
                        // Execute the fight
                        fight(attackingPawn, defendingPawn);
                    }else{
                        // Set new coordinate values to pawn
                        pawns[pawnId][0] = new_x;
                        pawns[pawnId][1] = new_y;
                    }
                    // End our turn
                    socket.emit('endTurn', game.room);
                    player.turn = false;
                    // Remove event listener click from all tiles
                    $('#board div').off('click');
                    // Place pawns
                    placePawns();
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
                });
            }
        });
        // Check if pawn has legal moves -> if none cancel
        if(!atLeastOneLegalMove){
            // Remove classes from the tiles
            $('#board div').removeClass('selected');
            return;
        }
    }
}

// SETUP PHASE FUNCTIONS
// =========================

const resetPawns = () => {
    // Empty the setup
    pawns = [];
    // Reset the pawnsInBox array
    pawnsInBox = [...ALL_PAWNS];

    // Disable ready button
    $('#readyUp').prop('disabled', true);

    //
    initBox();
    placePawns();
}

const randomisePawns = () => {
    // Set random Y coordinate based on player
    if (player.team == 0){
        maxY = 10;
        minY = 7;
    }else{
        maxY = 4;
        minY = 1;
    }

    // If we already have a full set
    if(pawnsInBox.length == 0){
        resetPawns();
    }

    // For every pawn available
    pawnsInBox.forEach(pawn => {
        // Generate random values
        let randomX = Math.floor(Math.random() * (10 - 1 + 1) + 1);
        let randomY = Math.floor(Math.random() * (maxY - minY + 1) + minY);
        while(getPawnByCoordinate(randomX, randomY) != null){
            // Generate random values
            randomX = Math.floor(Math.random() * (10 - 1 + 1) + 1);
            randomY = Math.floor(Math.random() * (maxY - minY + 1) + minY);
        }
        // Add pawn
        pawns.push([randomX, randomY, pawn, player.team]);
    });

    // Enable ready button
    $('#readyUp').prop('disabled', false);

    // empty the array
    pawnsInBox = [];
    placePawns();
    initBox();

    return pawns;
}

const readyUp = () => {
    // Remove event listener click from all tiles
    $('#board div').off('click');
    $('#box div').off('click');
    // Change display button
    $('#readyUp').addClass('hidden');
    $('#cancelReadyUp').removeClass('hidden');
    // Disable the other buttons
    $('.standardButton').prop('disabled', true);
    // Emit action to server
    socket.emit('readyUp', game.room);
}

const cancelReadyUp = () => {
    // Reset all event listeners and pawns
    initBox();
    placePawns();
    // Change display button
    $('#readyUp').removeClass('hidden');
    $('#cancelReadyUp').addClass('hidden');
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
            // Check for flag or bomb pawn
            let pawnNumber;
            if(i == 0){
                pawnNumber = 'F';
            }else if(i == 11){
                pawnNumber = 'B';
            }else{
                pawnNumber = i;
            }
            // Place pawn in box
            $('<div id="pawn_' + i +'"><img draggable="false" src="./themes/' + decodeURI(game.theme) + '/' + player.team + '/' + i + '.png" /><span data-team="' + player.team + '">' + pawnNumber + '</span><span class="amount">' + amountPawnsAvailable + 'x</span></div>')
            .appendTo('#box')
            .attr('data-pawn', i)
            .attr('data-remaining', amountPawnsAvailable)
            .click(function(pawn) {
                // Add highlight class to tile
                $(this).addClass('legalMove selected');
                // Loop all tiles
                $("#board div").each(function(){
                    if(isTileInSpawnZone($(this).data('y'))){
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
                                $('#readyUp').prop('disabled', false);
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
    }

    console.info('You are player '+ parseInt(player.team + 1));
    socket.emit('updatePawns', pawns);
    placePawns();
}

const initNavigation = () => {
    // Remove existing buttons
    $("#hud_lower_right").children().remove();
    //$("#hud_upper_right").children().remove();
    //$("#navigation").attr('data-team', player.team);
    if (player.setup){
        // Add info span
        //$('<span>' + readyCounter + '/2 players ready</span>').appendTo('#hud_lower_right').append('<br>');
        // Add ready button
        $('<button id="readyUp"></button>').appendTo('#hud_lower_right').addClass('readyButton').click(readyUp).prop('disabled', true).prepend('<i class="fa-solid fa-check"></i> Ready');
        // Add cancel button
        $('<button id="cancelReadyUp"></button>').appendTo('#hud_lower_right').addClass('cancelButton hidden').click(cancelReadyUp).prepend('<i class="fa-solid fa-xmark"></i> Cancel Ready');
        // Add randomise button
        $('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click(randomisePawns).prepend('<i class="fa-solid fa-shuffle"></i> Randomise');
        // Add reset button
        $('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click(resetPawns).prepend('<i class="fa-solid fa-arrow-rotate-left"></i> Reset Pawns');
    }else{
        // Add cancel move button
        $('<button></button>').appendTo('#hud_lower_right').addClass('deleteButton').click().prepend('<i class="fa-solid fa-xmark"></i> Cancel Move');
        // Add cemetery button
        $('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click().prepend('<i class="fa-solid fa-cross"></i> View Cemetery');
        // Add skip turn button
        $('<button></button>').appendTo('#hud_lower_right').addClass('standardButton').click().prepend('<i class="fa-solid fa-forward"></i> Skip Turn');
    }
}