var Twitter = require('twitter');

var sendTweet = (tweetBodyText) => {
// Add secrets back in here.
  client.post('statuses/update', {status: tweetBodyText},  function(error, tweet, response) {
    if(error) throw error;
    console.log(tweet);  // Tweet body.
    console.log(response);  // Raw response object.
  });
};

module.exports.sendTweet = sendTweet;
