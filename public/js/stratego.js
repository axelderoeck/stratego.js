// STRATEGO.JS
// =========================

// CONFIG
// =========================

const DISABLED_TILES = [ // Coordinates of disabled tiles
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
const ALL_PAWNS = [ // All existing pawns of 1 team
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

// GET DATA FUNCTIONS
// =========================

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

const getPawnNumber = (pawn) => {
    switch (pawn){
        case 0:
            return 'F';
        case 11:
            return 'B';
        default:
            return pawn;
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
    if(pawns[id] != null){
        return pawns[id];
    }
    throw `No pawn exists with given ID.`;
}

const getPawnId = (x, y, pawn, team) => {
    // Loop through all pawns
    for (var i = 0; i < pawns.length; i++) {
        if (pawns[i][0] == x && pawns[i][1] == y && pawns[i][2] == pawn && pawns[i][3] == team){
            // Pawn found -> return id
            return i;
        }
    }
    throw `Pawn not found.`;
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

const getAmountNonStaticPawnsInTeam = (team) => {
    let counter = 0;
    pawns.forEach(pawn => {
        if (pawn[3] == team && pawn[2] != 0 && pawn[2] != 11){
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

const isTileInSpawnZone = (team, y) => {
    if(team == 0 && y >= 7 || team == 1 && y <= 4){
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

const checkForEnemyContact = (new_x, new_y, team) => {
    // Get pawn by coordinate
    pawn = getPawnByCoordinate(new_x, new_y);
    // Check if pawn exists and is not on same team
    if (pawn != null && pawn[3] != team) {
        return true;
    }
    return false;
}

// MANAGE PAWNS
// =========================

const addPawn = (x, y, pawn, team) => {
    if(getPawnByCoordinate(x, y) == null){
        pawns.push([x, y, pawn, team]);
    }else{
        throw `Unable to add pawn because a pawn already exists on these coordinates!`;
    }
}

const deletePawn = (pawn) => {
    try {
        id = getPawnId(pawn[0], pawn[1], pawn[2], pawn[3]);
        // Remove pawn from array
        pawns.splice(id, 1);
        // Add pawn to cemetery array
        cemetery.push([pawn[2], pawn[3]]);
    }catch (error){
        throw error;
    }
}

// OTHER
// =========================

const fightOutcome = (attackingPawn, defendingPawn) => {
    // If the defending pawn is the flag
    if(defendingPawn == 0){
        return "win";
    }else if(attackingPawn < defendingPawn){
        // If the defending pawn is a marshal (10) and the attacking pawn is a spy (1) OR the defending pawn is a bomb (11) and the attacking pawn is a miner (3)
        if(defendingPawn == 10 && attackingPawn == 1 || defendingPawn == 11 && attackingPawn == 3){
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

// EXPORT FOR TESTING
// =========================

module.exports = {
    addPawn,
    deletePawn,
    getPawnByCoordinate,
    getPawnId,
    getPawnById,
    getAmountPawnsInTeam,
    getAmountNonStaticPawnsInTeam,
    getPawnName,
    getPawnNumber,
    isTileDisabled,
    isTileInSpawnZone,
    isLegalMove,
    fightOutcome,
    checkForEnemyContact
};