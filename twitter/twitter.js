var Twitter = require('twitter');
var yaml = require('js-yaml');
var fs   = require('fs');

var sendTweet = (tweetBodyText) => {
  var doc = yaml.safeLoad(fs.readFileSync('./twitter/twitter.yml', 'utf8'));

  var client = new Twitter({
    consumer_key: doc.secret.consumer_key,
    consumer_secret: doc.secret.consumer_secret,
    access_token_key: doc.secret.access_token_key,
    access_token_secret: doc.secret.access_token_secret
  });

  client.post('statuses/update', {status: tweetBodyText},  function(error, tweet, response) {
    if(error) throw error;
    console.log(tweet);  // Tweet body.
    console.log(response);  // Raw response object.
  });
};

module.exports.sendTweet = sendTweet;
