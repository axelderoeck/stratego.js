const { 
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
    checkForEnemyContact } = require('../stratego.js');

beforeAll(() => {
    addPawn(4, 4, 2, 0);
    addPawn(9, 9, 7, 1);
});

describe('addPawn', () => {
    test('Adding pawn to occupied coordinates throws error', () => {
        expect(() => {
            addPawn(4, 4, 6, 0);
        }).toThrow('Unable to add pawn because a pawn already exists on these coordinates!');
    });

    test('Adding pawn to unused coordinates does not throw error', () => {
        expect(() => {
            addPawn(3, 3, 7, 0);
        }).not.toThrow();
    });
});

describe('deletePawn', () => {
    test('Deleting pawn that does not exist throws error', () => {
        expect(() => {
            deletePawn([7, 9, 3, 0]);
        }).toThrow('Pawn does not exist!');
    });
    
    test('Deleting existing pawn does not throw error', () => {
        expect(() => {
            deletePawn([3, 3, 7, 0]);
        }).not.toThrow();
    });
});

describe('getPawnByCoordinate', () => {
    test('Empty coordinate returns null', () => {
        expect(getPawnByCoordinate(4, 8)).toBeNull();
    });

    test('Negative coordinates returns null', () => {
        expect(getPawnByCoordinate(-3, -9)).toBeNull();
    });

    test('String coordinates returns null', () => {
        expect(getPawnByCoordinate('2', '5')).toBeNull();
    });

    test('Taken coordinate returns correct pawn', () => {
        expect(getPawnByCoordinate(4, 4)).toStrictEqual([4, 4, 2, 0]);
    });
});

describe('getPawnName', () => {
    test('Non existant pawn returns null', () => {
        expect(getPawnName(12)).toBeNull();
    });
    
    test('Existing pawn returns name', () => {
        expect(getPawnName(0)).toBe('Flag');
        expect(getPawnName(1)).toBe('Spy');
        expect(getPawnName(2)).toBe('Scout');
        expect(getPawnName(3)).toBe('Miner');
        expect(getPawnName(4)).toBe('Sergeant');
        expect(getPawnName(5)).toBe('Lieutenant');
        expect(getPawnName(6)).toBe('Captain');
        expect(getPawnName(7)).toBe('Major');
        expect(getPawnName(8)).toBe('Colonel');
        expect(getPawnName(9)).toBe('General');
        expect(getPawnName(10)).toBe('Marshall');
        expect(getPawnName(11)).toBe('Bomb');
    });
    
    test('String pawn returns null', () => {
        expect(getPawnName('8')).toBeNull();
    });
    
    test('Negative number pawn returns null', () => {
        expect(getPawnName(-3)).toBeNull();
    });
});

describe('getPawnNumber', () => {
    test('Flag returns F', () => {
        expect(getPawnNumber(0)).toBe('F');
    });

    test('Bomb returns B', () => {
        expect(getPawnNumber(11)).toBe('B');
    });
    
    test('Normal pawn returns number', () => {
        expect(getPawnNumber(5)).toBe(5);
    });
    
    test('Non existant pawn returns null', () => {
        expect(getPawnNumber(15)).toBeNull();
    });
    
    test('Negative number pawn returns null', () => {
        expect(getPawnNumber(-6)).toBeNull();
    });
    
    test('String pawn returns null', () => {
        expect(getPawnNumber('4')).toBeNull();
    });
});

describe('getPawnId', () => {
    test('Existing pawn returns correct id', () => {
        expect(getPawnId(4, 4, 2, 0)).toBe(0);
    });

    test('Non existant pawn returns null', () => {
        expect(getPawnId(2, 8, 7, 0)).toBeNull();
    });

    test('Negative numbers pawn returns null', () => {
        expect(getPawnId(-2, -8, -7, -1)).toBeNull();
    });

    test('String pawn returns null', () => {
        expect(getPawnId('2', '8', '7', '1')).toBeNull();
    });
});

describe('getPawnById', () => {
    test('Existing pawn id returns correct pawn', () => {
        expect(getPawnById(0)).toStrictEqual([4, 4, 2, 0]);
    });

    test('Not existing pawn id returns null', () => {
        expect(getPawnById(14)).toBeNull();
    });

    test('String pawn id returns null', () => {
        expect(getPawnById('3')).toBeNull();
    });

    test('Negative pawn id returns null', () => {
        expect(getPawnById(-4)).toBeNull();
    });
});

describe('isTileDisabled', () => {
    test('Tile is disabled', () => {
        expect(isTileDisabled(3, 6)).toBeTruthy();
    });

    test('Tile is not disabled', () => {
        expect(isTileDisabled(2, 4)).toBeFalsy();
    });

    test('String tile is not disabled', () => {
        expect(isTileDisabled('2', '4')).toBeFalsy();
    });

    test('Negative tile is not disabled', () => {
        expect(isTileDisabled(-2, -4)).toBeFalsy();
    });
});

describe('isTileInSpawnZone', () => {
    test('Tile is in spawnzone', () => {
        expect(isTileInSpawnZone(0, 8)).toBeTruthy();
        expect(isTileInSpawnZone(1, 4)).toBeTruthy();
    });

    test('Tile is NOT in spawnzone', () => {
        expect(isTileInSpawnZone(0, 3)).toBeFalsy();
        expect(isTileInSpawnZone(1, 9)).toBeFalsy();
    });
});

describe('isLegalMove', () => {
    test('Pawn can walk 1 tile', () => {
        // Vertically
        expect(isLegalMove(1, 1, 1, 2, 6, 0)).toBeTruthy();
        // Horizontally
        expect(isLegalMove(1, 1, 2, 1, 6, 0)).toBeTruthy();
    });

    test('Pawn can NOT walk diagonally', () => {
        expect(isLegalMove(1, 1, 2, 2, 6, 0)).toBeFalsy();
        expect(isLegalMove(9, 9, 8, 8, 4, 0)).toBeFalsy();
    });

    test('Normal pawn can NOT walk 2 tiles vertically', () => {
        expect(isLegalMove(1, 1, 1, 3, 6, 0)).toBeFalsy();
    });

    test('Scout pawn can walk 2 tiles vertically', () => {
        expect(isLegalMove(1, 1, 1, 3, 2, 0)).toBeTruthy();
    });

    test('Static pawn can NOT walk at all', () => {
        expect(isLegalMove(1, 1, 1, 2, 11, 0)).toBeFalsy();
        expect(isLegalMove(1, 1, 1, 2, 0, 0)).toBeFalsy();
    });

    test('Pawn can NOT walk on existing team pawn', () => {
        expect(isLegalMove(4, 3, 4, 4, 6, 0)).toBeFalsy();
    });

    test('Scout can NOT jump over existing team pawn', () => {
        // Vertically up
        expect(isLegalMove(4, 3, 4, 5, 2, 0)).toBeFalsy();
        // Vertically down
        expect(isLegalMove(4, 5, 4, 3, 2, 0)).toBeFalsy();
        // Horizontally right
        expect(isLegalMove(3, 4, 5, 4, 2, 0)).toBeFalsy();
        // Horizontally left
        expect(isLegalMove(5, 3, 3, 5, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT jump over existing enemy pawn', () => {
        // Vertically up
        expect(isLegalMove(9, 1, 9, 10, 2, 0)).toBeFalsy();
        // Vertically down
        expect(isLegalMove(9, 10, 9, 1, 2, 0)).toBeFalsy();
        // Horizontally right
        expect(isLegalMove(1, 9, 10, 9, 2, 0)).toBeFalsy();
        // Horizontally left
        expect(isLegalMove(10, 9, 1, 9, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT jump over disabled tiles', () => {
        // Vertically up
        expect(isLegalMove(8, 4, 8, 7, 2, 0)).toBeFalsy();
        // Vertically down
        expect(isLegalMove(8, 7, 8, 4, 2, 0)).toBeFalsy();
        // Horizontally right
        expect(isLegalMove(6, 6, 9, 6, 2, 0)).toBeFalsy();
        // Horizontally left
        expect(isLegalMove(9, 6, 6, 6, 2, 0)).toBeFalsy();
    });

    test('Pawn can walk on enemy pawn (for a fight)', () => {
        expect(isLegalMove(8, 9, 9, 9, 4, 0)).toBeTruthy();
    });

    test('Scout can jump on enemy pawn (for a fight)', () => {
        expect(isLegalMove(1, 9, 9, 9, 2, 0)).toBeTruthy();
    });
});

describe('fightOutcome', () => {
    test('Higher number wins fight', () => {
        expect(fightOutcome(6, 3)).toBeTruthy();
        expect(fightOutcome(10, 3)).toBeTruthy();
        expect(fightOutcome(2, 1)).toBeTruthy();
    });

    test('Lower number loses fight', () => {
        expect(fightOutcome(6, 7)).toBeFalsy();
        expect(fightOutcome(2, 6)).toBeFalsy();
    });

    test('Spy always wins from Marshall', () => {
        expect(fightOutcome(1, 10)).toBeTruthy();
        expect(fightOutcome(10, 1)).toBeFalsy();
    });

    test('Everyone loses against the bomb except the miner', () => {
        expect(fightOutcome(6, 11)).toBeFalsy();
        expect(fightOutcome(10, 11)).toBeFalsy();
        expect(fightOutcome(3, 11)).toBeTruthy();
    });

    test('Same number is a stalemate', () => {
        expect(fightOutcome(3, 3)).toBe('stalemate');
        expect(fightOutcome(10, 10)).toBe('stalemate');
    });

    test('Fighting the flag is a win', () => {
        expect(fightOutcome(5, 0)).toBe('win');
        expect(fightOutcome(9, 0)).toBe('win');
    });
});

/*
describe('name', () => {

});
*/