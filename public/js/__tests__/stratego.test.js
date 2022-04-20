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

/*
describe('name', () => {

});
*/