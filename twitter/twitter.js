var Twitter = require('twitter');
var fs   = require('fs');

var sendTweet = (tweetBodyText, twitterAccount) => {
  var doc = JSON.parse(fs.readFileSync('./twitter/twitter.json', 'utf8'));

  var client = new Twitter(doc[twitterAccount]);

  client.post('statuses/update', {status: tweetBodyText},  function(error, tweet, response) {
    if(error) console.log(error);
    console.log(tweet);  // Tweet body.
    console.log(response);  // Raw response object.
  });
};

module.exports.sendTweet = sendTweet;
