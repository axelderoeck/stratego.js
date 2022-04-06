// Length of roomcode
const ROOMCODE_LENGTH = 6;
let setupStage = true;

let player = {
    team: 0
};
let roomCode;

const getUpdatedArray = (array) => {
    return array;
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

/*
// Add shine effect to a random pawn every minute
setInterval(function(){ 
    // Generate random axis values
    let randomX = Math.floor(Math.random() * 10) + 1;
    let randomY = Math.floor(Math.random() * 10) + 1;
    // Check if tile has a pawn
    while (getPawnByCoordinate(randomX, randomY) == null){
        randomX = Math.floor(Math.random() * 10) + 1;
        randomY = Math.floor(Math.random() * 10) + 1;
    }
    // Get the random tile 
    let tile = $("div[data-x='" + randomX + "'][data-y='" + randomY + "']");
    // Add shine effect
    tile.addClass("shineEffect forceShine");
    // Remove shine effect class after 1 second
    setTimeout(function() {
        tile.removeClass("forceShine");
    }, 1000);
}, 60000);
*/

const init = (teamNumber) => {
    // Assign team number
    player.team = teamNumber;
    // Create the board
    initBoard(setupStage);
    initBox();

    // Mirror the board if it's player 2
    if(player.team == 1){
        mirrorBoard();
    }

    console.info('You are player '+ parseInt(player.team + 1));
    socket.emit('updatePawns', pawns);
    placePawns(pawns);
}

const placePawns = (array) => {
    // Delete old images and effects
    $("#board div")
        .removeClass('shineEffect')
        .children()
        .remove();
    
    // Place pawns
    array.forEach(pawn => {
        // Create pawn
        let tile = $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']");
        // Add shine effect to pawn
        tile.addClass('shineEffect');
        // Special pawn settings based on team
        if(pawn[3] != player.team){
            tile.prepend('<img src="./themes/' + decodeURI(params.theme) + '/' + pawn[3] + '/unknown.png" />')
        }else{
            tile.prepend('<img src="./themes/' + decodeURI(params.theme) + '/' + pawn[3] + '/' + pawn[2] + '.png" />')
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

const isTileDisabled = (x, y) => {
    // Check if tile is disabled
    for (var i = 0; i < DISABLED_TILES.length; i++) {
        if (DISABLED_TILES[i][0] == x && DISABLED_TILES[i][1] == y){
            return true;
        }
    }
    return false;
}

const initBoard = (setup) => {
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
            if(setup && !isTileInSpawnZone(y)){
                tile.addClass('nospawn');
            }

            // Add class if tile is disabled
            if(isTileDisabled(x, y)){
                tile.addClass('disabled');
            }
        }
    } 
}

let pawnsInBox = [
    0,                  // 1x Flag
    1,                  // 1x Spy
    2,2,2,2,2,2,2,2,    // 8x Scout
    3,3,3,3,3,          // 5x Miner
    4,4,4,4,            // 4x Sergeant
    5,5,5,5,            // 4x Lieutenant
    6,6,6,6,            // 4x Captain
    7,7,7,              // 3x Major
    8,8,                // 2x Colonel
    9,                  // 1x General
    10,                 // 1x Marshall
    11,11,11,11,11,11   // 6x Bomb
];

const getPawnsArrayFromServer = () => {
    // Call the server.js and say hello we want the newest whereabouts of the pawns
    socket.emit("getPawnsArrayFromServer");

    // We make the server pinky promise to give us the new pawns because it is the most sacred vow
    // This way it will def work
    const pinkyPromise = new Promise(resolve => {
        socket.on('getPawnsArrayFromServer', (array) => {
            resolve(array);
        })
    });

    // Declare a new empty array
    let array = [];

    // After we get the pinky promise back we have to convert it to an array for some reason
    pinkyPromise.then(promiseArray => {
        promiseArray.forEach(pawn => {
            array.push(pawn);
        });
    });

    // Return the new array
    return array;
}

let myPawns = [];

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

const fight = (attackingPawn, defendingPawn, array) => {
    // Get id from attacking pawn
    attackingPawnId = getPawnId(attackingPawn[0], attackingPawn[1], attackingPawn[2], attackingPawn[3]);
    // Check for fight result
    switch (fightOutcome(attackingPawn[2], defendingPawn[2])){
        case true:
            console.log("won fight");
            // Set new coordinate values to pawn
            array[attackingPawnId][0] = defendingPawn[0];
            array[attackingPawnId][1] = defendingPawn[1];
            // Delete/kill the defending pawn
            deletePawn(defendingPawn, array);
            break;
        case false:
            console.log("lost fight");
            // Delete/kill the attacking pawn
            deletePawn(attackingPawn, array);
            break;
        case "stalemate":
            console.log("both lose");
            // Delete/kill both pawns
            deletePawn(attackingPawn, array);
            deletePawn(defendingPawn, array);
            break;
        case "win":
            console.log("won game");
            // Set new coordinate values to pawn
            array[attackingPawnId][0] = defendingPawn[0];
            array[attackingPawnId][1] = defendingPawn[1];
            // Delete/kill the defending pawn
            deletePawn(defendingPawn, array);
            endGame(attackingPawn[3]);
            break;
    }
    return array;
}

const mirrorBoard = () => {
    $("#board").addClass("mirror");
    $("#board div").addClass("mirror");
}

const addPawn = (x, y, pawn, team) => {
    if(getPawnByCoordinate(x, y) == null){
        pawns.push([x, y, pawn, team]);
        placePawns(pawns);
        return true;
    }else{
        console.error("Failed to execute addPawn() \n Pawn already exists on x:" + x + " y:" + y + ".");
        return false;
    }
}

const deletePawn = (pawn, array) => {
    id = getPawnId(pawn[0], pawn[1], pawn[2], pawn[3]);
    if(id != null){
        // Remove pawn from array
        array.splice(id, 1);
        // Add pawn to cemetery array
        cemetery.push([pawn[2], pawn[3]]);
        // Place all pawns
        placePawns(array);
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
                $(this).prepend('<img class="fightIcon swordLeft" src="./themes/' + encodeURI(params.theme) + '/misc/sword_left.png" />');
                $(this).prepend('<img class="fightIcon swordRight" src="./themes/' + encodeURI(params.theme) + '/misc/sword_right.png" />');
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
                    pawns = fight(attackingPawn, defendingPawn, pawns);
                }else{
                    console.log("Moved pawn: " + pawn + " to x:" + new_x + " y:" + new_y);
                    // Set new coordinate values to pawn
                    pawns[pawnId][0] = new_x;
                    pawns[pawnId][1] = new_y;
                }
                // Remove event listener click from all tiles
                $('#board div').off('click');
                // Place pawns
                placePawns(pawns);
                // Update the array on server
                socket.emit('updateBoard', roomCode, pawns);
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
                placePawns(pawns);
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

const addRandomPawns = () => {
    // Set random Y coordinate based on player
    if (player.team == 0){
        maxY = 10;
        minY = 7;
    }else{
        maxY = 4;
        minY = 1;
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
        // Add pawn on field
        addPawn(randomX, randomY, pawn, player.team);
    });

    return pawns;
}

// const countPawnsAvailableInBox = async (pawn) => {
//     // Count available pawns
//     let amountPawnsAvailable = 0;
//     for(i = 0; i < pawnsInBox.length; i++){
//         // Look for the pawn
//         if(pawn == pawnsInBox[i]){
//             // +1 everytime pawn is found in box
//             amountPawnsAvailable++;
//         }
//         // Break the loop if we already passed our pawn (better performance I guess)
//         if(pawn < pawnsInBox[i]){
//             break;
//         }
//     }
//     return amountPawnsAvailable;
// }

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
            $('<div id="pawn_' + i +'"><img src="./themes/' + decodeURI(params.theme) + '/' + player.team + '/' + i + '.png" /><span data-team="' + player.team + '">' + i + '</span><span class="amount">' + amountPawnsAvailable + 'x</span></div>')
            .appendTo('#box')
            .attr('data-pawn', i)
            .attr('data-remaining', amountPawnsAvailable)
            .click(function(pawn) {
                $("#board div").each(function(){
                    // Add move event to legal tile
                    $(this).on("click", function(){
                        // Turn the html string to a JQuery element object
                        let pawnElement = $($.parseHTML(pawn.currentTarget.outerHTML));
                        if(pawnElement.data('remaining') > 0){
                            // Add pawn to setup
                            tempSetup.push([$(this).data('x'), $(this).data('y'), pawnElement.data('pawn'), player.team]);
                            // Remove pawn from box
                            pawnsInBox.splice(pawnsInBox.indexOf(pawnElement.data('pawn')), 1);
                        }
                        // Check if all pawns have been placed
                        if(tempSetup.length == 40){
                            console.log('placed all pawns');
                            // Ready button appears
                        }
                        // Remove event listener click from all tiles
                        $('#board div').off('click');
                        // Place pawns
                        initBox();
                        placePawns(tempSetup);
                    });
                });
            });
        }
    }
}

let tempSetup = [];

const addPawnToSetup = (x, y, pawn) => {
    tempSetup.push([x, y, pawn, player.team])
}

const isTileInSpawnZone = (y) => {
    if(player.team == 0 && y >= 7 || player.team == 1 && y <= 4){
        return true;
    }
    return false;
}