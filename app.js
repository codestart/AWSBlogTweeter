const dateTime = require('date-and-time');

const awsblog = require('./awsblog/index.js');
const twitter = require('./twitter/twitter.js');

// This wrapper is required by AWS Lambda
exports.sendTweets = function (event, context, callback) {
  console.log('Beginning sendTweets() function: ');
  const postResult = awsblog.getBlogPost('SortOrderValue', false, 5, 'en_US', (error, blogPosts) => {
    if(error) {
      console.log('Oops! There was an error: ' + error);
      callback(error);
    }
    else {
    //  console.log(JSON.stringify(blogPosts, undefined, 4));

      // Work from the oldest back to 0 (the newest)
      for(var i = blogPosts.items.length - 1; i >= 0; i--) {
        // e.g.:  "2018-09-30T15:46:10+0000"
        var blogPostTimestamp = dateTime.parse(blogPosts.items[i].dateUpdated, "YYYY-MM-DDTHH:mm:ss+0000");
        var currentTime = new Date();
        const FOUR_HOURS = 1000 * 60 * 60 * 4;
        const BLOG_POST_AGE = currentTime - blogPostTimestamp;
        console.log('Blog Post Age: ' + BLOG_POST_AGE);
        console.log('Age Diff: ' + (BLOG_POST_AGE - FOUR_HOURS));
        console.log('Blog post timestamp: ' + blogPosts.items[i].dateUpdated);
        console.log('Post details: ' + blogPosts.items[i].id + ') ' + blogPosts.items[i].additionalFields.link);

        if(BLOG_POST_AGE < FOUR_HOURS) {
          console.log('** POSTED **');
//           callback(undefined, blogPosts.items[i].id + ') ' + blogPosts.items[i].additionalFields.link);
          twitter.sendTweet(blogPosts.items[i].additionalFields.link);
        }

      }
    }
  });

  callback(undefined, postResult);
};
