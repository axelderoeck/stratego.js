// Size of both sides of the board, size 10 = 100 tiles
const BOARD_SIZE = 10;
// Coordinates of disabled tiles
const DISABLED_TILES = [
    // X, Y
    // Left square
    [3, 5],
    [4, 5],
    [3, 6],
    [4, 6],
    // Right square
    [7, 5],
    [8, 5],
    [7, 6],
    [8, 6]
]

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

initBoard();

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

const fightPawn = (attackingPawn, defendingPawn) => {
    if(attackingPawn < defendingPawn){
        console.log("attacker lose");
    }else if(attackingPawn == defendingPawn){
        console.log("both lose");
    }else{
        console.log("defender lose");
    }
    // if (attackingPawn < defendingPawn){
    //     if(defender != 1 && attacker == 0) {
    //         console.log("attacker lose");
    //     }else if(defender == 8 && attacker == 10){
    //         console.log("bomb defused");
    //     }else{
    //         console.log("attacker win");
    //     }
    // }else if(attacker == defender){
    //     console.log("both lose");
    // }else{
    //     console.log("attacker lose")
    // }
}

const mirrorNumber = (n) => {
    return BOARD_SIZE - (n - 1);
}

const addPawn = (x, y, pawn, team) => {
    id = getPawnId(x, y, pawn, team);
    if(id == null){
        pawns.push([x, y, pawn, team]);
        placePawns();
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
        placePawns();
        return true;
    }else{
        console.log("pawn does not exist.");
        return false;
    }
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
    tilePawn = getPawnByCoordinate(new_x, new_y);

    // Check if tile is disabled
    if(!isTileDisabled(new_x, new_y)){
        // If pawn does not exist or is not part of team ->
        if(tilePawn == null || tilePawn[3] != team){
            if(pawn == 0 || pawn == 11){ // Check for static pawns
                return false;
            }else if(pawn == 2){ // Check for scout pawn
                // New X or Y can be any value except the old while the other axis has to stay the same (avoid diagonal walking)
                if(new_x != old_x && new_y == old_y || new_y != old_y && new_x == old_x){
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
    // Add event listener to all tiles
    $('#board div').on("click", function(){
        // Remove event listener click from all tiles
        $('#board div').off('click');

        // Get selected tile
        selectedTile = $(this);
        // Get values from selected tile
        new_x = selectedTile.data("x");
        new_y = selectedTile.data("y");

        // Move the pawn
        if(isLegalMove(old_x, old_y, new_x, new_y, pawn, team)){
            if (checkForEnemyContact(new_x, new_y, team)){
                console.log("Fight");
            }

            console.log("Moved pawn: " + pawn);

            // Get pawn ID from array
            pawnId = getPawnId(old_x, old_y, pawn, team);
            // Set new coordinate values to pawn
            pawns[pawnId][0] = new_x;
            pawns[pawnId][1] = new_y;

            // Place pawns
            placePawns();
        }else{
            console.log("Illegal move");
            // Re attach click event
            pawns.forEach(pawn => {
                $("div[data-x='" + pawn[0] + "'][data-y='" + pawn[1] + "']")
                .click(function() {
                    movePawn(pawn[0], pawn[1], pawn[2], pawn[3]);
                });
            })
        }
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
placePawns();