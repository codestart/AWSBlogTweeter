var Twitter = require('twitter');
var yaml = require('js-yaml');
var fs   = require('fs');

var getSettings = () => {
  // Get document, or throw exception on error
  try {
    var doc = yaml.safeLoad(fs.readFileSync('./twitter/twitter.yml', 'utf8'));
    console.log(doc.secret.consumer_key);
  } catch (e) {
    console.log(e);
  }
}

var sendTweet = (tweetBodyText) => {
  var doc = yaml.safeLoad(fs.readFileSync('./twitter/twitter.yml', 'utf8'));
  // Tweet with @AWSBlogUnreal
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
module.exports.getSettings = getSettings;
