const dateTime = require('date-and-time');

const awsblog = require('./awsblog/index.js');
const twitter = require('./twitter/twitter.js');

// This wrapper is required by AWS Lambda
exports.sendTweets = function (event, context, callback) {
  var NUMBER_TO_CHECK = process.env.NUMBER_TO_CHECK;
  var MINUTES_IN_PERIOD = process.env.MINUTES_IN_PERIOD;
  var BLOG_ADDRESS_STUB = 'https://aws.amazon.com/blogs/';

  console.log('Beginning sendTweets() function: ');
  const postResult = awsblog.getBlogPost('SortOrderValue', false, NUMBER_TO_CHECK, 'en_US', (error, blogPosts) => {
    if(error) {
      console.log('Oops! There was an error: ' + error);
      callback(error);
    }
    else {
      //console.log(JSON.stringify(blogPosts, undefined, 4));

      // Work from the oldest back to 0 (the newest)
      for(var i = blogPosts.items.length - 1; i >= 0; i--) {
        // e.g.:  "2018-09-30T15:46:10+0000"
        var strTime = new String(blogPosts.items[i].dateUpdated);
        strTime = strTime.substr(0, "YYYY-MM-DDTHH:mm:ss".length);
        var blogPostTimestamp = dateTime.parse(strTime, "YYYY-MM-DDTHH:mm:ss");
        var currentTime = new Date();
        const PERIOD = 1000 * 60 * MINUTES_IN_PERIOD;
        const BLOG_POST_AGE = currentTime - blogPostTimestamp;
        console.log('Blog Post Age: ' + BLOG_POST_AGE);
        console.log('Age Diff: ' + (BLOG_POST_AGE - PERIOD));
        console.log('Blog post timestamp: ' + blogPosts.items[i].dateUpdated);
        console.log('Post details: ' + blogPosts.items[i].id + ') ' + blogPosts.items[i].additionalFields.link);

        var strUrl = new String(blogPosts.items[i].additionalFields.link);
        var changeableUrl = strUrl.substr(BLOG_ADDRESS_STUB.length);
        var sectionName = changeableUrl.substr(0, changeableUrl.indexOf('/'));
        console.log('Section Name: ', sectionName);
        console.log('Section Title: ', awsblog.awsBlogSections[sectionName]);

        if(BLOG_POST_AGE < PERIOD) {
          console.log('** POSTED **');
          twitter.sendTweet('The AWS ' + awsblog.awsBlogSections[sectionName] + ' Blog #' + awsblog.awsBlogHashtags[sectionName] + ' ' + blogPosts.items[i].additionalFields.link);
          console.log(awsblog.awsBlogSections[sectionName] + ' #' + awsblog.awsBlogHashtags[sectionName] + ' ' + blogPosts.items[i].additionalFields.link);
        }
      }
    }
  });
};
