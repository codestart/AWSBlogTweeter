var Twitter = require('twitter');
var fs = require('fs');

var client = async (twitterAccount) => {
    var doc = JSON.parse(fs.readFileSync('./twitter/twitter.json', 'utf8'));

    return new Twitter(doc[twitterAccount]);
};

var sendTweet = (twitterAccount, tweetBodyText) => {
    client(twitterAccount).post('statuses/update', {
        status: tweetBodyText
    }, function (error, tweet, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(tweet); // Tweet details.
            console.log(response); // Raw response object.
        }
    });
};

var isFollowing = async (twitterAccount, twitterHandle) => {
    return await client(twitterAccount).get('friendships/lookup', {
        screen_name: twitterHandle
    }, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(response); // Raw response object.
            if (null != response && response.length > 0) {
                var firstResponse = response[0];
                console.log('First Response on list of names returned from query to Twitter is: ' + firstResponse.name);
                for (var status in firstResponse.connections) {
                    if (status === 'following') {
                        returnValue = true;
                    }
                }
            }
        }
    });
};

var unconditionalFollow = async (twitterAccount, twitterHandle, notifyUser) => {
    client(twitterAccount).post('friendships/create', {
        screen_name: twitterHandle,
        follow: notifyUser
    }, function (error, tweet, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(tweet); // Tweet body.
            console.log(response); // Raw response object.
        }
    });
};

var follow = async (twitterAccount, twitterHandle) => {
    if (!await isFollowing(twitterAccount, twitterHandle)) {
        unconditionalFollow(twitterAccount, twitterHandle, false);
    }
};

module.export = {
    sendTweet,
    follow
};
