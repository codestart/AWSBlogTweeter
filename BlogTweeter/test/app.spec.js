describe("App", function () {
    var App = require('../app.js');

    beforeEach(function () {});

    it("should format the author names list correctly", function () {
        process.env.TWITTER_ON = 'true';
        expect(App.generateAuthorList(['tom', 'dick', 'harry'])).toBe('By: tom, dick and harry');
        expect(App.generateAuthorList(['tom', 'dick'])).toBe('By: tom and dick');
        expect(App.generateAuthorList(['tom'])).toBe('By: tom');
        expect(App.generateAuthorList([])).toBe('');
    });
});
