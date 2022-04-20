const { 
    addPawn,
    getPawnByCoordinate,
    getPawnId,
    getPawnById,
    getPawnName,
    getPawnNumber,
    isTileDisabled,
    isLegalMove,
    fightOutcome } = require('../stratego.js');

beforeAll(() => {
    addPawn(4, 4, 2, 0);
    addPawn(9, 9, 7, 1);
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
        expect(getPawnName(2)).toBe('Scout');
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

describe('isLegalMove', () => {
    test('Pawn can NOT walk diagonally', () => {
        expect(isLegalMove(1, 1, 2, 2, 6, 0)).toBeFalsy();
    });

    test('Pawn can walk 1 tile vertically', () => {
        expect(isLegalMove(1, 1, 1, 2, 6, 0)).toBeTruthy();
    });

    test('Pawn can walk 1 tile horizontally', () => {
        expect(isLegalMove(1, 1, 2, 1, 6, 0)).toBeTruthy();
    });

    test('Normal pawn can NOT walk 2 tiles vertically', () => {
        expect(isLegalMove(1, 1, 1, 3, 6, 0)).toBeFalsy();
    });

    test('Scout pawn can walk 2 tiles vertically', () => {
        expect(isLegalMove(1, 1, 1, 3, 2, 0)).toBeTruthy();
    });

    test('Static pawn can NOT walk at all', () => {
        expect(isLegalMove(1, 1, 1, 2, 11, 0)).toBeFalsy();
    });

    test('Pawn can NOT walk on existing team pawn', () => {
        expect(isLegalMove(4, 3, 4, 4, 6, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over existing team pawn', () => {
        expect(isLegalMove(4, 3, 4, 5, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over existing enemy pawn vertically up', () => {
        expect(isLegalMove(9, 1, 9, 10, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over existing enemy pawn vertically down', () => {
        expect(isLegalMove(9, 10, 9, 1, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over existing enemy pawn horizontally right', () => {
        expect(isLegalMove(1, 9, 10, 9, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over existing enemy pawn horizontally left', () => {
        expect(isLegalMove(10, 9, 1, 9, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over disabled tiles vertically up', () => {
        expect(isLegalMove(8, 4, 8, 7, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over disabled tiles vertically down', () => {
        expect(isLegalMove(8, 7, 8, 4, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over disabled tiles horizontally right', () => {
        expect(isLegalMove(6, 6, 9, 6, 2, 0)).toBeFalsy();
    });

    test('Scout can NOT walk over disabled tiles horizontally left', () => {
        expect(isLegalMove(9, 6, 6, 6, 2, 0)).toBeFalsy();
    });

    test('Pawn can walk on enemy pawn (for a fight)', () => {
        expect(isLegalMove(8, 9, 9, 9, 4, 0)).toBeTruthy();
    });

    test('Scout can jump on enemy pawn (for a fight)', () => {
        expect(isLegalMove(1, 9, 9, 9, 2, 0)).toBeTruthy();
    });
});

/*
describe('name', () => {

});
*/