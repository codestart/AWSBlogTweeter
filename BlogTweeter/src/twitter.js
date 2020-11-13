var Twitter = require('twitter');
var fs = require('fs');

const ses = require('./ses.js');

var twitterAccess = async (twitterAccountName) => {
    var doc = JSON.parse(fs.readFileSync('./src/twitter.json', 'utf8'));
    return new Twitter(doc[twitterAccountName]);
};

var sendTweet = async (twitterAccountName, tweetBodyText) => {
    const twitterAccount = await twitterAccess(twitterAccountName);
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
    var returnValue = false;
    await twitterAccessKeys(twitterAccount).then(async (response) => {
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
    twitterAccessKeys(twitterAccount).then((response) => response.post('friendships/create', {
        screen_name: twitterHandle,
        follow: notifyUser
    }, async (error, twitterAccountDetails, response) => {
        if (error) {
            console.log('Twitter.js Error - unconditionalFollow()', JSON.stringify(error, undefined, 4));
            await ses.sendEmailNotification('Twitter.js Error - unconditionalFollow()', JSON.stringify(error, undefined, 4));
        } else {
            console.log('TW3:', twitterAccountDetails);
            // console.log(response); // Raw response object.
        }
    }));
};

var follow = async (twitterAccount, twitterHandle) => {
    if (!await isFollowing(twitterAccount, twitterHandle)) {
        await unconditionalFollow(twitterAccount, twitterHandle, false);
    } else {
        console.log('Following', twitterHandle, ' already');
    }
};

module.exports = {
    sendTweet,
    follow
};
