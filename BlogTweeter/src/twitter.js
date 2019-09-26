var Twitter = require('twitter');
var fs = require('fs');

var client = async (twitterAccount) => {
    var doc = JSON.parse(await fs.readFileSync('./twitter/twitter.json', 'utf8'));
    return await new Twitter(doc[twitterAccount]);
};

var sendTweet = (twitterAccount, tweetBodyText) => {
    client(twitterAccount).then((response) => response.post('statuses/update', {
        status: tweetBodyText
    }, function (error, tweet, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(tweet); // Tweet details.
            //            console.log(response); // Raw response object.
        }
    }));
};

var isFollowing = async (twitterAccount, twitterHandle) => {
    var returnValue = false;
    await client(twitterAccount).then(async (response) => {
        await response.get('friendships/lookup', {
            screen_name: twitterHandle
        }).then((response) => {
            if (null != response && response.length > 0) {
                var firstResponse = response[0];
                for (var status of firstResponse.connections) {
                    if (status === 'following') {
                        returnValue = true;
                    }
                }
            }
            return returnValue;
        });
    }).catch((err) => {
        console.log('isFollowing() promise catch is:', err);
    });
    return returnValue;
};

var unconditionalFollow = async (twitterAccount, twitterHandle, notifyUser) => {
    client(twitterAccount).then((response) => response.post('friendships/create', {
        screen_name: twitterHandle,
        follow: notifyUser
    }, function (error, twitterAccountDetails, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(twitterAccountDetails);
            //            console.log(response); // Raw response object.
        }
    }));
};

var follow = async (twitterAccount, twitterHandle) => {
    if (!await isFollowing(twitterAccount, twitterHandle)) {
        unconditionalFollow(twitterAccount, twitterHandle, false);
    } else {
        console.log('Following', twitterHandle, ' already');
    }
};

module.exports = {
    sendTweet,
    follow
};
