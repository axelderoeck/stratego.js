// Connect to socket
let socket = io();

// Length of roomcode
const ROOMCODE_LENGTH = 6;

let player = {
    team: 0
};
let roomCode;
let team;

const updatePawns = (array) => {
    pawns = array;
    return pawns;
}

//let pawns = [];

const init = (teamNumber) => {
    // Create the board
    initBoard();
    // Assign team number
    player.team = teamNumber;
    // Mirror the board if it's player 2
    if(player.team == 1){
        mirrorBoard();
    }

    console.log('You are player '+ parseInt(player.team + 1));
    socket.emit('updatePawns', pawns);
    placePawns(pawns);
}

const placePawns = (pawns) => {
    theme = 'classic';

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
            tile.prepend('<img src="./themes/' + theme + '/' + pawn[3] + '/unknown.png" />')
        }else{
            tile.prepend('<img src="./themes/' + theme + '/' + pawn[3] + '/' + pawn[2] + '.png" />')
                .prepend('<span data-team=' + pawn[3] + '>' + pawn[2] + '</span>')
        }
        if(pawn[3] == player.team){
            // Add event listener
            tile.click(function() {
                movePawn(pawn[0], pawn[1], pawn[2], pawn[3]);
            });
        }
    })
}

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
    roomCode = room;
    console.log('Invite link: http://localhost:3000/game.html?room=' + room);
});

socket.on('updatePawns', (array) => {
    pawns = updatePawns(array);
    placePawns(pawns);
})

const isTileDisabled = (x, y) => {
    // Check if tile is disabled
    for (var i = 0; i < DISABLED_TILES.length; i++) {
        if (DISABLED_TILES[i][0] == x && DISABLED_TILES[i][1] == y){
            return true;
        }
    }
    return false;
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

            // Add class if tile is disabled
            if(isTileDisabled(x, y)){
                tile.addClass('disabled');
            }
        }
    } 
}

/* Pawns 2D array = [[X, Y, Pawn, Team], ...]
*
* @param pawns[ID][0] = X (1-10)
* @param pawns[ID][1] = Y (1-10)
* @param pawns[ID][2] = Pawn (0-11) // Flag = 0, Spy = 1, Bomb = 11
* @param pawns[ID][3] = Team (0/1) // Blue = 0, Red = 1
* 
**/

let pawns = [
    [10, 10, 0, 0],
    [9, 10, 1, 0],
    [8, 10, 2, 0],
    [7, 10, 3, 0],
    [6, 10, 4, 0],
    [5, 10, 5, 0],
    [4, 10, 6, 0],
    [3, 10, 7, 0],
    [2, 10, 8, 0],
    [1, 10, 9, 0],
    [10, 9, 10, 0],
    [9, 9, 11, 0],
    [1, 1, 0, 1],
    [2, 1, 1, 1],
    [3, 1, 2, 1],
    [4, 1, 3, 1],
    [5, 1, 4, 1],
    [6, 1, 5, 1],
    [7, 1, 6, 1],
    [8, 1, 7, 1],
    [9, 1, 8, 1],
    [10, 1, 9, 1],
    [1, 2, 10, 1],
    [2, 2, 11, 1]
];

/* Cemetery 2D array = [[Pawn, Team], ...]
*
* @param pawns[ID][0] = Pawn (0-11) // Flag = 0, Spy = 1, Bomb = 11
* @param pawns[ID][1] = Team (0/1) // Blue = 0, Red = 1
* 
**/

let cemetery = [];

/* This function is written in favor of the attacker.
*
* true = attacker wins.
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

const fight = (x1, y1, x2, y2, array) => {
    attackingPawn = getPawnByCoordinate(x1, y1);
    defendingPawn = getPawnByCoordinate(x2, y2);

    attackingPawnId = getPawnId(attackingPawn[0], attackingPawn[1], attackingPawn[2], attackingPawn[3]);
    switch (fightOutcome(attackingPawn[2], defendingPawn[2])){
        case true:
            console.log("won fight");
            // Delete/kill the defending pawn
            deletePawn(defendingPawn[0], defendingPawn[1], defendingPawn[2], defendingPawn[3]);
            // Set new coordinate values to pawn
            array[attackingPawnId][0] = defendingPawn[0];
            array[attackingPawnId][1] = defendingPawn[1];
            break;
        case false:
            console.log("lost fight");
            // Delete/kill the attacking pawn
            deletePawn(attackingPawn[0], attackingPawn[1], attackingPawn[2], attackingPawn[3]);
            break;
        case "stalemate":
            console.log("both lose");
            // Delete/kill both pawns
            deletePawn(attackingPawn[0], attackingPawn[1], attackingPawn[2], attackingPawn[3]);
            deletePawn(defendingPawn[0], defendingPawn[1], defendingPawn[2], defendingPawn[3]);
            break;
        case "win":
            console.log("won game");
            // Delete/kill the defending pawn
            deletePawn(defendingPawn[0], defendingPawn[1], defendingPawn[2], defendingPawn[3]);
            // Set new coordinate values to pawn
            array[attackingPawnId][0] = defendingPawn[0];
            array[attackingPawnId][1] = defendingPawn[1];
            endGame();
            break;
    }

    return array;
}

const mirrorBoard = () => {
    $("#board").addClass("mirror");
    $("#board div").addClass("mirror");
}

const addPawn = (x, y, pawn, team) => {
    id = getPawnId(x, y, pawn, team);
    if(id == null){
        pawns.push([x, y, pawn, team]);
        placePawns(pawns);
        return true;
    }else{
        console.log("pawn already exists!");
        return false;
    }
}

const deletePawn = (x, y, pawn, team) => {
    id = getPawnId(x, y, pawn, team);
    if(id != null){
        pawns.splice(id, 1);
        cemetery.push([pawn, team]);
        placePawns(pawns);
        return true;
    }else{
        console.log("pawn does not exist.");
        return false;
    }
}

const endGame = () => {
    // Remove event listener click from all tiles
    $('#board div').off('click');
    console.log("The game has ended.");
}

const getPawnByCoordinate = (x, y) => {
    found = false;
    for (var i = 0; i < pawns.length; i++) {
        if (pawns[i][0] == x && pawns[i][1] == y){
            found = true;
            break;
        }
    }

    if(found){
        // Return pawn array
        return pawns[i];
    }else{
        return null;
    }
}

const getPawnById = (id) => {
    return pawns[id]
}

const getPawnId = (x, y, pawn, team) => {
    found = false;
    // Loop through all pawns
    for (var i = 0; i < pawns.length; i++) {
        if (pawns[i][0] == x && pawns[i][1] == y && pawns[i][2] == pawn && pawns[i][3] == team){
            found = true;
            break;
        }
    }

    if(found){
        // Return pawn ID
        return i;
    }else{
        return null;
    }
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
    // TODO: replace last section with first section
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
                $(this).prepend('<img class="fightIcon swordLeft" src="./themes/classic/misc/sword_left.png" />');
                $(this).prepend('<img class="fightIcon swordRight" src="./themes/classic/misc/sword_right.png" />');
            }
            // Add move event to legal tile
            $(this).on("click", function(){
                // Remove classes from the tiles
                $('#board div').removeClass('legalMove selected shineEffect');
                // Remove event listener click from all tiles
                $('#board div').off('click');
                // Delete all images with fighticon class
                $("img").remove(".fightIcon");
                // Get values from selected tile
                new_x = $(this).data("x");
                new_y = $(this).data("y");
            });
        }else if($(this).data("x") == old_x && $(this).data("y") == old_y){
            // Set selected tile
            $(this).addClass('selected');
            // Add cancel event
            $(this).on("click", function(){
                // Remove classes from the tiles
                $('#board div').removeClass('legalMove selected shineEffect');
                // Remove event listener click from all tiles
                $('#board div').off('click');
                // Delete all images with fighticon class
                $("img").remove(".fightIcon");
            });
        }
    });
    // Check if pawn has legal moves -> if none cancel
    if(!atLeastOneLegalMove){
        // Remove classes from the tiles
        $('#board div').removeClass('selected');
        return;
    }

    // replace this
    // Add event listener to all tiles
    $('#board div').on("click", function(){
        // Remove colors from tiles
        $('#board div').removeClass('legalMove');
        // Remove event listener click from all tiles
        $('#board div').off('click');

        // Get selected tile
        selectedTile = $(this);
        // Get values from selected tile
        new_x = selectedTile.data("x");
        new_y = selectedTile.data("y");

        // Move the pawn
        if(isLegalMove(old_x, old_y, new_x, new_y, pawn, team)){
            // Get pawn ID from array
            pawnId = getPawnId(old_x, old_y, pawn, team);

            if (checkForEnemyContact(new_x, new_y, team)){
                // Get full pawn object of both parties
                attackingPawn = getPawnById(pawnId);
                defendingPawn = getPawnByCoordinate(new_x, new_y);

                fight(attackingPawn, defendingPawn);
            
                // switch (fightOutcome(attackingPawn, defendingPawn)){
                //     case true:
                //         console.log("won fight");
                //         // Delete/kill the defending pawn
                //         deletePawn(defendingPawn[0], defendingPawn[1], defendingPawn[2], defendingPawn[3]);
                //         // Set new coordinate values to pawn
                //         pawns[pawnId][0] = new_x;
                //         pawns[pawnId][1] = new_y;

                //         break;
                //     case false:
                //         console.log("lost fight");
                //         // Delete/kill the attacking pawn
                //         deletePawn(old_x, old_y, pawn, team);

                //         break;
                //     case "stalemate":
                //         console.log("both lose");
                //         // Delete/kill both pawns
                //         deletePawn(old_x, old_y, pawn, team);
                //         deletePawn(defendingPawn[0], defendingPawn[1], defendingPawn[2], defendingPawn[3]);

                //         break;
                //     case "win":
                //         console.log("won game");
                //         endGame();

                //         break;
                // }
            }else{
                console.log("Moved pawn: " + pawn);
                // Set new coordinate values to pawn
                pawns[pawnId][0] = new_x;
                pawns[pawnId][1] = new_y;
            }

            socket.emit('updateBoard', roomCode, pawns);
        }else{
            log("Illegal move.");
            console.log("Illegal move");
        }

        // Place pawns
        placePawns(pawns);
    });
}

const addRandomPawns = () => {
    // In order: 0 (=flag), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (=bomb)
    let amount_pawns = [1, 1, 8, 5, 4, 4, 4, 3, 2, 1, 1, 6];
    test = 0;
    /* 
    * i = pawn number
    * j = counter pawns
    **/
    for (i = 0; i < amount_pawns.length; i++){
        for(j = 0; j <= amount_pawns[i]; j++){
            randomX = Math.floor(Math.random() * 10) + 1;
            randomY = Math.floor(Math.random() * 10) + 7;

            while (addPawn(randomX, randomY, i, 0) == false) {
                randomX = Math.floor(Math.random() * 10) + 1;
                randomY = Math.floor(Math.random() * 10) + 7;
            }
        }
    }
}

//addRandomPawns();
placePawns(pawns);

//socket.emit('updateBoard', pawns);