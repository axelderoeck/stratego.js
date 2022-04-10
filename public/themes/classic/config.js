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
// All existing pawns of 1 team
const ALL_PAWNS = [
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