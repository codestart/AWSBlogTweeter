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

    it("should get the correct details of the blog", function () {
        var params = {
            RequestItems: {
                [`ABC_AWS_BLOGS`]: {
                    Keys: ['a', 'b'],
                    ProjectionExpression: 'URLSection, BlogSection, Hashtag'
                }
            }
        };

        spyOn(DynamoDB.ddb, "batchGetItem");

        DynamoDB.getBlogDetails(['a', 'b'], {}, 'ABC_');

        expect(DynamoDB.ddb.batchGetItem).toHaveBeenCalledWith(params);
    });

    it("should check the author's name against the DB", () => {
        var params = {
            TableName: 'ABC_TWITTER_HANDLES',
            ExpressionAttributeValues: {
                ':s': {
                    S: 'JohnDoe'
                }
            },
            KeyConditionExpression: 'AuthorName = :s',
            ProjectionExpression: 'TwitterHandle'
        };
        spyOn(DynamoDB.ddb, "query");

        DynamoDB.checkAuthorName('JohnDoe', 'ABC_');

        expect(DynamoDB.ddb.query).toHaveBeenCalledWith(params);
    });

    it("checks whether a blog post has been tweeted out (published)", () => {
        var params = {
            TableName: 'ABC_BLOG_POSTS',
            ExpressionAttributeValues: {
                ':id': {
                    S: 'abc123'
                },
                ':pub': {
                    BOOL: true
                }
            },
            KeyConditionExpression: 'ID = :id',
            FilterExpression: 'Published = :pub',
            ProjectionExpression: 'ID'
        };
        spyOn(DynamoDB.ddb, "query");

        DynamoDB.isPublished('abc123', 'ABC_');

        expect(DynamoDB.ddb.query).toHaveBeenCalledWith(params);
    });
});
