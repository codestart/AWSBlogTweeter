var Twitter = require('twitter');
var fs = require('fs');

const ses = require('./ses.js');

var twitterAccessKeys = async (twitterAccountName) => {
    var doc = JSON.parse(fs.readFileSync('./src/twitter.json', 'utf8'));
    return new Twitter(doc[twitterAccountName]);
};

var sendTweet = async (twitterAccountName, tweetBodyText) => {
    const twitterAccount = await twitterAccessKeys(twitterAccountName);
    return await postTweetToTwitter(twitterAccount, tweetBodyText);
};

var postTweetToTwitter = async (twitterAccount, tweetBodyText) => twitterAccount.post('statuses/update', {
        status: tweetBodyText
    }, async (error, tweet) => {
        if (error) {
            console.log('Twitter.js Error - sendTweet()', JSON.stringify(error, undefined, 4));
            await ses.sendEmailNotification('Twitter.js Error - sendTweet()', JSON.stringify(error, undefined, 4));
        } else {
            console.log('Sending tweet:', tweet.id_str, '\n', 'Text:', tweet.text);
        }
    });

var isFollowing = async (twitterAccount, twitterHandle) => {
    var returnValue = true;
    await twitterAccessKeys(twitterAccount).then(async (response) => {
        await response.get('friendships/lookup', {
            screen_name: twitterHandle
        }).then((response) => {
            if (null != response && response.length > 0) {
                var firstResponse = response[0];
                for (var status of firstResponse.connections) {
                    // Values for connections can be: following, following_requested, followed_by, none, blocking, muting.
                    if (status === 'none') {
                        returnValue = false;
                    }
                    console.log('isFollowing - friendships/lookup - status is:', JSON.stringify(status, undefined, 4));
                }
            }
            return returnValue;
        });
    }).catch((err) => {
        console.log('isFollowing() promise catch is:', err);
    });
    return returnValue;
};

var unconditionalFollow = async (twitterAccount, twitterHandle, enableNotifications) => {
    twitterAccessKeys(twitterAccount).then((response) => response.post('friendships/create', {
        screen_name: twitterHandle,
        follow: enableNotifications
    }, async (error, twitterAccountDetails, response) => {
        if (error) {
            console.log('Twitter.js Error - unconditionalFollow()', JSON.stringify(error, undefined, 4));
            await ses.sendEmailNotification('Twitter.js Error - unconditionalFollow()', JSON.stringify(error, undefined, 4));
        } else {
            console.log('TW3:', twitterAccountDetails);
            await ses.sendEmailNotification('TW3:', JSON.stringify(twitterAccountDetails, undefined, 4));
            // console.log(response); // Raw response object.
        }
    }));
};

var follow = async (twitterAccount, twitterHandle) => {
    if (!await isFollowing(twitterAccount, twitterHandle)) {
        await unconditionalFollow(twitterAccount, twitterHandle, false);
    }
};

module.exports = {
    sendTweet,
    follow
};
