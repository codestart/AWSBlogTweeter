const axios = require('axios');

const dynamo = require('./dynamodb/index.js');
const twitter = require('./twitter/twitter.js');

// This wrapper is required by AWS Lambda
exports.sendTweets = function (event, context, callback) {
  var NUMBER_TO_CHECK = process.env.NUMBER_TO_CHECK;
  var MINUTES_IN_PERIOD = process.env.MINUTES_IN_PERIOD;
  var TWITTER_ON = (process.env.TWITTER_ON.toLowerCase().trim() === 'true');
  var TWITTER_ACCOUNT = process.env.TWITTER_ACCOUNT;
  const ENV = process.env.ENV;
  
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
      var strTime = blogPosts.items[i].dateCreated;
      strTime = strTime.substr(0, DATE_FORMAT.length);
      var blogPostTimestamp = new Date(strTime + 'Z');
      var currentTime = new Date();
      const PERIOD = 1000 * 60 * MINUTES_IN_PERIOD;
      const BLOG_POST_AGE = currentTime - blogPostTimestamp;

      var author = JSON.parse(blogPosts.items[i].author);
      var strUrl = blogPosts.items[i].additionalFields.link;
      var changeableUrl = strUrl.substr(BLOG_ADDRESS_STUB.length);
      var sectionName = changeableUrl.substr(0, changeableUrl.indexOf('/'));

      recordTweet(blogPosts.items[i], ENV);

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
    return event.length > 0 ? dynamo.queryDatabase(event, undefined, urlList, ENV) : {statusCode: 200, body:[]};
  }).then(async (resolve) => {
    if(resolve.statusCode === 200) {
      for(var item of resolve.body) {
        // console.log('resolve.ref:', resolve.ref);
        // console.log('item.section:', item.section);
        var output =
          'The AWS ' + resolve.ref[item.section][0] +
          ' Blog #' + resolve.ref[item.section][1] +
          ' ' + item.url +
          await authorsList(item, ENV);

        console.log('Tweeting:', output);
        try {
          if(TWITTER_ON) {
            twitter.sendTweet(output, TWITTER_ACCOUNT);
          }
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

var recordTweet = (tweet, env) => {
  for (var author of JSON.parse(tweet.author)) {
    dynamo.recordAuthorTweetLink(tweet.id, author, env);
  }

  dynamo.recordTweetVitals(tweet, env);
}

/**
 * AWS Seem to use 'publicsector' as a default author value. It's of no interest
 * to us.
 */
var authorsList = async (elementData, env) => {
  const STUB = ' by: ';
  const SEPARATOR = ' and ';
  const ABANDON_VALUE = 'publicsector';

  var abandonReturn = false;
  var output = '';

  for (var person of elementData.author) {
    if(person === ABANDON_VALUE) abandonReturn = true;
    console.log('Author to check: ', person);
    await dynamo.handleAuthorName(person, env).then((resolve) => {
      output += resolve;
    });
    if(elementData.author[elementData.author.length - 1] !== person) {
      output += SEPARATOR;
    }
  }

  return (abandonReturn ? '' : STUB + output);
}
