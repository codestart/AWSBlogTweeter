const axios = require('axios');

const dynamo = require('./dynamodb/index.js');
const twitter = require('./twitter/twitter.js');

// This wrapper is required by AWS Lambda
exports.sendTweets = function (event, context, callback) {
  console.log('Beginning sendTweets()');

  var NUMBER_TO_CHECK = process.env.NUMBER_TO_CHECK;
  var MINUTES_IN_PERIOD = process.env.MINUTES_IN_PERIOD;
  var BLOG_ADDRESS_STUB = 'https://aws.amazon.com/blogs/';
  var DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

  const orderBy = 'SortOrderValue';
  const sortAscending = false;
  const limit = NUMBER_TO_CHECK;
  const locale = 'en_US';
  const awsBlogUrl =
    `https://aws.amazon.com/api/dirs/blog-posts/items?` +
    `order_by=${orderBy}` +
    `&sort_ascending=${sortAscending}` +
    `&limit=${limit}` +
    `&locale=${locale}`;
// https://aws.amazon.com/api/dirs/blog-posts/items?order_by=SortOrderValue&sort_ascending=true&limit=10&locale=en_US

  axios.get(awsBlogUrl).then((response) => {
    // success case expression:
    const blogPosts = response.data;
    //console.log(JSON.stringify(blogPosts, undefined, 4));
    var event = [];
    var urlList = []; // Must be same size or bigger than event array above.
    var eventNo = 0;
    var unTweetedUrlCounter = 0;
    // Work from the oldest back to 0 (the newest)
    blog_post_items:
    for(var i = blogPosts.items.length - 1; i >= 0; i--) {
      var strTime = blogPosts.items[i].dateUpdated;
      strTime = strTime.substr(0, DATE_FORMAT.length);
      var blogPostTimestamp = new Date(strTime + 'Z');
      var currentTime = new Date();
      const PERIOD = 1000 * 60 * MINUTES_IN_PERIOD;
      const BLOG_POST_AGE = currentTime - blogPostTimestamp;

      var author = JSON.parse(blogPosts.items[i].author);
      var strUrl = blogPosts.items[i].additionalFields.link;
      var changeableUrl = strUrl.substr(BLOG_ADDRESS_STUB.length);
      var sectionName = changeableUrl.substr(0, changeableUrl.indexOf('/'));

      console.log('BLOG_POST_AGE < PERIOD:', (BLOG_POST_AGE < PERIOD));

      if(BLOG_POST_AGE < PERIOD) {
        // Only add URLs to be posted, to the list (not the number-to-check)
        urlList[unTweetedUrlCounter++] = {url: strUrl, section: sectionName, author};
        for(var x = 0; x < event.length; x++) {
          // More than one blog post is new - checking for duplicate section names to query only unique names
          if(event[x].URLSection.S === sectionName) continue blog_post_items;
        }
        // Create a list of unique section names
        event[eventNo] = {'URLSection':{S:sectionName}};
        eventNo++;
      }
    }
    return event.length > 0 ? dynamo.queryDatabase(event, undefined, urlList) : {statusCode: 200, body:[]};
  }).then((resolve) => {
    if(resolve.statusCode === 200) {
      for(element of resolve.body) {
        var output =
          'The ' + resolve.ref[element.section][0] +
          ' Blog #' + resolve.ref[element.section][1] +
          ' ' + element.url +
          ' by: ';
          for (var person of element.author) {
            output += person;
            if(element.author[element.author.length - 1] !== person)
              output += ' and '
          }

        console.log('Tweeting:', output);
        try {
          twitter.sendTweet(output);
        }
        catch(error) {
          console.log('Error is: ', error);
        }
      }
    }
    else {
      console.log('Status Code is: ', resolve.statusCode);
      console.log('Error Message is: ', resolve.error);
    }
  }).catch((error) => {
      console.log('Oops! There was an error:', error);
      callback(error);
  });
  callback(undefined, 'No Return Value Needed ;-)');
}
