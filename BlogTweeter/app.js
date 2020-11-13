const axios = require('axios');

const dynamo = require('./src/dynamodb.js');
const ses = require('./src/ses.js');
const twitter = require('./src/twitter.js');

const NUMBER_TO_CHECK = process.env.NUMBER_TO_CHECK;
var twitterOn = process.env.TWITTER_ON;
const TWITTER_ON = (twitterOn === undefined ? false : twitterOn.toLowerCase().trim() === 'true');
const TWITTER_ACCOUNT = process.env.TWITTER_ACCOUNT;
const ENV = process.env.ENV;

const BLOG_ADDRESS_STUB = 'https://aws.amazon.com/blogs/';

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

var sendTweets = async () => {
    var jsonResponseFromAmazon = await axios.get(awsBlogUrl);
    var formattedBlogPostData = await collectDataForThisPollsBlogPosts(jsonResponseFromAmazon);
    var statusCodes = await processBlogPostDataForCurrentPoll(formattedBlogPostData);

    return statusCodes;
};

var collectDataForThisPollsBlogPosts = async (response) => {
    // success case expression:
    const blogPosts = response.data;
    let uniqueSectionNames = new Set();
    var blogPostInfoToBeSaved = []; // Must be same size or bigger than uniqueSectionNameList array above.
    var unTweetedBlogPostCounter = 0;
    // Work from the oldest back to 0 (the newest)
    for (var i = blogPosts.items.length - 1; i >= 0; i--) {
        var author = JSON.parse(blogPosts.items[i].author);
        var url = blogPosts.items[i].additionalFields.link;
        var changeableUrl = url.substr(BLOG_ADDRESS_STUB.length);
        var section = changeableUrl.substr(0, changeableUrl.indexOf('/'));
        var id = blogPosts.items[i].id;

        if (!await dynamo.isPublished(id, ENV)) {
            // Only add URLs to be posted, to the list (not the number-to-check)
            blogPostInfoToBeSaved[unTweetedBlogPostCounter++] = {
                id,
                slug: blogPosts.items[i].additionalFields.slug,
                createdBy: blogPosts.items[i].createdBy,
                dateUpdated: blogPosts.items[i].dateUpdated,
                dateCreated: blogPosts.items[i].dateCreated,
                title: blogPosts.items[i].additionalFields.title,
                url,
                section,
                author
            };
            uniqueSectionNames.add(section);
        }
    }

    var newBlogData;
    if (uniqueSectionNames.size > 0) {
        newBlogData = await dynamo.getBlogDetails(uniqueSectionNames, ENV);
        newBlogData.body = blogPostInfoToBeSaved;
    } else {
        newBlogData = {statusCode: 200, body: []};
    }
    return newBlogData;
};

var processBlogPostDataForCurrentPoll = async (currPollNewBlogPostDetails) => {
    var tweetsSent = [];
    if (currPollNewBlogPostDetails.statusCode === 200) {
        for (var item of currPollNewBlogPostDetails.body) {
            if (currPollNewBlogPostDetails.blogLookupInfo.hasOwnProperty(item.section)) {
                await recordTweet(item, ENV);
                var tweetContent =
                    'The AWS ' + currPollNewBlogPostDetails.blogLookupInfo[item.section][0] +
                    ' Blog #' + currPollNewBlogPostDetails.blogLookupInfo[item.section][1] +
                    '\n' + item.url +
                    '\n' + await authorsList(item, ENV);

                try {
                    if (TWITTER_ON) {
                        console.log('TWITTER_ON=true - Tweeting:', JSON.stringify(tweetContent, undefined, 4));
                        await twitter.sendTweet(TWITTER_ACCOUNT, tweetContent);
                    } else {
                        console.log('TWITTER_ON=false - NOT Tweeting:', tweetContent);
                        await ses.sendEmailNotification('Tweet Not Sent', 'Twitter Off:\n' + tweetContent);
                    }
                    tweetsSent.push(tweetContent);
                } catch (error) {
                    console.log('Error is: ', error);
                }
            } else {
                // TODO: A new blog has been created - Add to AWS_BLOGS table.
                await ses.sendEmailNotification('Unknown/new blog name: ' + item.section, 'So NOT tweeting. Add new section to AWS_BLOGS.\nEmail sent in app.js');
                console.log('Unknown blog name: ' + item.section, 'Add to AWS_BLOGS table!');
            }
        }
    } else {
        console.log('Status Code is: ', currPollNewBlogPostDetails.statusCode);
        console.log('Error Message is: ', currPollNewBlogPostDetails.error);
    }
    
    return outputTweetsSent(tweetsSent);
};

var outputTweetsSent = (tweetsSent) => {
    var returnValue = '';

    if (tweetsSent === undefined || tweetsSent.length === 0) {
        returnValue = 'No Tweets Sent';
    } else if (tweetsSent.length === 1) {
        returnValue = tweetsSent[0];
    } else {
        returnValue = JSON.stringify(tweetsSent);
    }

    return returnValue;
};

var recordTweet = async (tweet, env) => {
    // console.log('Tweet:', tweet);
    for (var author of tweet.author) {
        await dynamo.recordAuthorTweetLink(tweet.id, author, env);
    }

    // This also sets 'published' to true.
    await dynamo.recordTweetVitals(tweet, env);
};

var authorsList = async (elementData, env) => {
    const ABANDON_VALUES = ['publicsector', 'AWS Admin'];

    var finalAuthorList = [];
    var abandonReturn = false;

    listAuthors:
    for (var authorName of elementData.author) {
        for (var abandonValue of ABANDON_VALUES) {
            if (authorName === abandonValue) {
                abandonReturn = true;
                break listAuthors;
            }
        }

        var author = await dynamo.handleOneAuthorName(authorName, env);
        finalAuthorList.push(await followAuthor(author));
    }

    return abandonReturn ? '' : generateAuthorList(finalAuthorList);
};

var followAuthor = async (author) => {
    var isValidHandle = false;
    var verifiedHandle;

    if (author.isTwitterHandle) {
        isValidHandle = dynamo.isValidTwitterHandle(author.authorReference);
    } else {
        verifiedHandle = author.authorReference;
    }

    if (isValidHandle) {
        verifiedHandle = author.authorReference;

        if (TWITTER_ON) {
            await twitter.follow(TWITTER_ACCOUNT, author.authorReference);
        } else {
            console.log('TWITTER_ON=false sending follow to:', author.authorReference);
        }
    }

    return verifiedHandle;
};

var generateAuthorList = (authors) => {
    var authorList = '';
    const STUB = 'By: ';
    const SEPARATOR_AND = ' and ';
    const SEPARATOR_COMMA = ', ';

    var currentAuthorNumber = authors.length;
    for (var author of authors) {
        authorList += author;
        if (currentAuthorNumber > 2) authorList += SEPARATOR_COMMA;
        else if (currentAuthorNumber == 2) authorList += SEPARATOR_AND;

        currentAuthorNumber--;
    }

    return authorList == '' ? '' : STUB + authorList;
};

// make a function to handle that error
// https://youtu.be/DwQJ_NPQWWo
function handleError(fn) {
    return function (...params) {
        return fn (...params).catch(function (err) {
            // Do something with the error
            console.error(`Oops!`, err);
        });
    }
}

module.exports = {
    sendTweets,
    outputTweetsSent,
    recordTweet,
    authorsList,
    generateAuthorList
};
