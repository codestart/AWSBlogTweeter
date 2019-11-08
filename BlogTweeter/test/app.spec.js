describe("App", function () {
    var App = require('../app.js');

    beforeEach(function () {});

    it("should format the author names list correctly", function () {
        process.env.TWITTER_ON = 'true';
        expect(App.generateAuthorList(['tom', 'dick', 'harry'])).toBe(' by: tom, dick and harry');
        expect(App.generateAuthorList(['tom', 'dick'])).toBe(' by: tom and dick');
        expect(App.generateAuthorList(['tom'])).toBe(' by: tom');
        expect(App.generateAuthorList([])).toBe('');
    });
});
