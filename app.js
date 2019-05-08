const axios = require('axios');

const dynamo = require('./dynamodb/index.js');
const ses = require('./ses/ses_index.js');

const twitter = require('./twitter/twitter.js');

const NUMBER_TO_CHECK = process.env.NUMBER_TO_CHECK;
// const MINUTES_IN_PERIOD = process.env.MINUTES_IN_PERIOD;
// const PERIOD = 1000 * 60 * MINUTES_IN_PERIOD;
const TWITTER_ON = (process.env.TWITTER_ON.toLowerCase().trim() === 'true');
const TWITTER_ACCOUNT = process.env.TWITTER_ACCOUNT;
const ENV = process.env.ENV;

const BLOG_ADDRESS_STUB = 'https://aws.amazon.com/blogs/';
// const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

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

exports.sendTweets = function (event, context, callback) {
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
        for (var i = blogPosts.items.length - 1; i >= 0; i--) {
            // var dateCreated = blogPosts.items[i].dateCreated;
            // dateCreated = dateCreated.substr(0, DATE_FORMAT.length);
            // var blogPostTimestamp = new Date(dateCreated + 'Z');
            // var currentTime = new Date();
            // const BLOG_POST_AGE = currentTime - blogPostTimestamp;

            var author = JSON.parse(blogPosts.items[i].author);
            var url = blogPosts.items[i].additionalFields.link;
            var changeableUrl = url.substr(BLOG_ADDRESS_STUB.length);
            var section = changeableUrl.substr(0, changeableUrl.indexOf('/'));
            var id = blogPosts.items[i].id;

            // if (BLOG_POST_AGE < PERIOD) {
            if (!dynamo.isPublished(id, ENV)) {
                // Only add URLs to be posted, to the list (not the number-to-check)
                urlList[unTweetedUrlCounter++] = {
                    id,
                    slug: blogPosts.items[i].additionalFields.slug,
                    createdBy: blogPosts.items[i].createdBy,
                    dateUpdated: blogPosts.items[i].dateUpdated,
                    dateCreated,
                    title: blogPosts.items[i].additionalFields.title,
                    url,
                    section,
                    author
                };
                for (var x = 0; x < event.length; x++) {
                    // More than one blog post is new - checking for duplicate section names to query only unique names
                    if (event[x].URLSection.S === section) continue blog_post_items;
                }
                // Create a list of unique section names
                event[eventNo] = {
                    'URLSection': {
                        S: section
                    }
                };
                eventNo++;
            }
        }
        return event.length > 0 ? dynamo.getBlogDetails(event, undefined, urlList, ENV) : {
            statusCode: 200,
            body: []
        };
    }).then(async (resolve) => {
        var tweetsSent = [];
        if (resolve.statusCode === 200) {
            for (var item of resolve.body) {
                // console.log('resolve:', JSON.stringify(resolve, undefined, 4));

                if (resolve.ref.hasOwnProperty(item.section)) {
                    recordTweet(item, ENV);
                    var output =
                        'The AWS ' + resolve.ref[item.section][0] +
                        ' Blog #' + resolve.ref[item.section][1] +
                        ' ' + item.url +
                        await authorsList(item, ENV);

//                    console.log('Tweeting:', output);
                    try {
                        if (TWITTER_ON) {
                            twitter.sendTweet(output, TWITTER_ACCOUNT);
                        }
                        tweetsSent.push(output);
                    } catch (error) {
                        console.log('Error is: ', error);
                    }
                } else {
                    // TODO: A new blog has been created - Add to AWS_BLOGS table.
                    ses.notifyNewBlog('Unknown blog name:' + item.section, 'Add to AWS_BLOGS table!');
                    console.log('Unknown Key to add to Database:', item.section);
                }
            }
        } else {
            console.log('Status Code is: ', resolve.statusCode);
            console.log('Error Message is: ', resolve.error);
        }
        callback(undefined, outputTweetsSent(tweetsSent));
    }).catch((error) => {
        console.log('Oops! There was an error:', error);
        callback(error);
    });
}

var outputTweetsSent = (tweetsSent) => {
    var returnValue = '';

    if(tweetsSent === undefined || tweetsSent.length === 0) {
        returnValue = 'No Tweets Sent';
    } else if(tweetsSent.length === 1){
        returnValue = tweetsSent[0];
    } else {
        returnValue = JSON.stringify(tweetsSent);
    }

    return returnValue;
}

var recordTweet = (tweet, env) => {
    // console.log('Tweet:', tweet);
    for (var author of tweet.author) {
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
    const ABANDON_VALUES = ['publicsector'];

    var abandonReturn = false;
    var output = '';

    for (var person of elementData.author) {
        for (var value of ABANDON_VALUES) {
            if (person === value) abandonReturn = true;
        }

        await dynamo.handleAuthorName(person, env).then((resolve) => {
            output += resolve;
        }).catch((err) => {
            console.log('Error on authorsList:', elementData);
            console.log('err:', JSON.stringify(err, undefined, 4));
        });
        if (elementData.author[elementData.author.length - 1] !== person) {
            output += SEPARATOR;
        }
    }

    return (abandonReturn ? '' : STUB + output);
}
