describe("DynamoDB", function () {
    var DynamoDB = require('../src/dynamodb.js');

    beforeEach(function () {
    });

    it("should detect a valid twitter handle", function () {
        expect(DynamoDB.isValidTwitterHandle('@aoc')).toBe(true);
        expect(DynamoDB.isValidTwitterHandle('@a1c')).toBe(true);
        expect(DynamoDB.isValidTwitterHandle('@a_c')).toBe(true);
        expect(DynamoDB.isValidTwitterHandle('@abcdefghij12345')).toBe(true);
    });

    it("should detect an invalid twitter handle", function () {
        expect(DynamoDB.isValidTwitterHandle('@')).toBe(false);
        expect(DynamoDB.isValidTwitterHandle(null)).toBe(false);
        expect(DynamoDB.isValidTwitterHandle('Andoni')).toBe(false);
        expect(DynamoDB.isValidTwitterHandle('...')).toBe(false);
        expect(DynamoDB.isValidTwitterHandle('@abcdefghij123456')).toBe(false);
        expect(DynamoDB.isValidTwitterHandle('@...')).toBe(false);
        expect(DynamoDB.isValidTwitterHandle('@ space')).toBe(false);
        expect(DynamoDB.isValidTwitterHandle('@abadminab')).toBe(false);
    });

    it("should handle an author name", function () {
        spyOn(DynamoDB, 'checkAuthorName').withArgs('Andoni', 'TW.DEV');
        expectAsync(DynamoDB.handleAuthorName('Andoni', 'TW.DEV')).toBeResolved();
    });
});
