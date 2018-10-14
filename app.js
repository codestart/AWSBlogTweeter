const dateTime = require('date-and-time');
const axios = require('axios');

const awsblog = require('./awsblog/index.js');
const dynamo = require('./dynamodb/index.js');
const twitter = require('./twitter/twitter.js');

// This wrapper is required by AWS Lambda
exports.sendTweets = function (event, context, callback) {
  console.log('Beginning sendTweets() function: ');

  var NUMBER_TO_CHECK = process.env.NUMBER_TO_CHECK | 3;
  var MINUTES_IN_PERIOD = process.env.MINUTES_IN_PERIOD | 5;
  var BLOG_ADDRESS_STUB = 'https://aws.amazon.com/blogs/';
  var DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

  const orderBy = 'SortOrderValue';
  const sortAscending = false;
  const limit = NUMBER_TO_CHECK;
  const locale = 'en_US';
  const awsBlogUrl = `https://aws.amazon.com/api/dirs/blog-posts/items?order_by=${orderBy}&sort_ascending=${sortAscending}&limit=${limit}&locale=${locale}`;

  //  const postResult = awsblog.getBlogPost('SortOrderValue', false, NUMBER_TO_CHECK, 'en_US', (error, blogPosts) => {

  axios.get(awsBlogUrl).then((response) => {
    // success case expression:
    const blogPosts = response.data;
    //console.log(JSON.stringify(blogPosts, undefined, 4));
    var event = [];
    var eventNo = 0;
    // Work from the oldest back to 0 (the newest)
    blog_post_items:
    for(var i = blogPosts.items.length - 1; i >= 0; i--) {
      // e.g.:  "2018-09-30T15:46:10+0000"
      var strTime = blogPosts.items[i].dateUpdated;
      strTime = strTime.substr(0, DATE_FORMAT.length);
      var blogPostTimestamp = dateTime.parse(strTime, DATE_FORMAT);
      var currentTime = new Date();
      const PERIOD = 1000 * 60 * MINUTES_IN_PERIOD;
      const BLOG_POST_AGE = currentTime - blogPostTimestamp;
//      console.log('Blog Post Age: ' + BLOG_POST_AGE);
//      console.log('Age Diff: ' + (BLOG_POST_AGE - PERIOD));
//      console.log('Blog post timestamp: ' + blogPosts.items[i].dateUpdated);
//      console.log('Post details: ' + blogPosts.items[i].id + ') ' + blogPosts.items[i].additionalFields.link);

      var strUrl = blogPosts.items[i].additionalFields.link;
      var changeableUrl = strUrl.substr(BLOG_ADDRESS_STUB.length);
      var sectionName = changeableUrl.substr(0, changeableUrl.indexOf('/'));

      if(true) { //BLOG_POST_AGE < PERIOD) {
        for(var x = 0; x < event.length; x++) {
          if(event[x].URLSection.S === sectionName) continue blog_post_items;
        }
        event[eventNo] = {'URLSection':{S:sectionName}};
        eventNo++;
      }
    }
    return dynamo.queryDatabase(event, undefined);
  }).then((resolve) => {
    console.log('2nd in chain Blog: ', JSON.stringify(resolve, undefined, 4));
    console.log('Pub Sec Blog Name is: ', resolve.body.data['publicsector'][0])
  }).catch((error) => {
      console.log('Oops! There was an error: ' + error);
      callback(error);
  });
  callback(undefined, 'No Return Value Needed ;-)');
}
