var AWS2 = require('aws-sdk');
AWS2.config.update({
    region: 'eu-west-1'
});
var ddb = new AWS2.DynamoDB({
    apiVersion: '2012-08-10'
});

// Given as inserting an empty string gives problems.
const DEFAULT_HANDLE = '@';
const NEW_AUTHOR_DECORATION = '*';

var getBlogDetails = async (uniqueSectionNameList, blogInfoToBeSaved, env) => {
    var params = {
        RequestItems: {
            [`${env}AWS_BLOGS`]: {
                Keys: [...uniqueSectionNameList],
                ProjectionExpression: 'URLSection, BlogSection, Hashtag'
            }
        }
    };

    try {
        var data = await ddb.batchGetItem(params).promise();
        data = reArrangeEntries(data, env);

        return {
            statusCode: 200,
            ref: data,
            body: blogInfoToBeSaved
        };
    } catch (error) {
        return {
            statusCode: 400,
            error: `Could not post: ${error.stack}`
        };
    }
};

var checkAuthorName = async (authorName, env) => {
    var params = {
        TableName: `${env}TWITTER_HANDLES`,
        ExpressionAttributeValues: {
            ':s': {
                S: authorName
            }
        },
        KeyConditionExpression: 'AuthorName = :s',
        ProjectionExpression: 'TwitterHandle'
    };

    try {
        return await ddb.query(params).promise();
    } catch (error) {
        console.log('Error is:', error);
        return {
            statusCode: 400,
            error: `Could not post: ${error}`
        };
    }
};

var isPublished = async (blogId, env) => {
    var params = {
        TableName: `${env}BLOG_POSTS`,
        ExpressionAttributeValues: {
            ':id': {
                S: blogId
            },
            ':pub': {
                BOOL: true
            }
        },
        KeyConditionExpression: 'ID = :id',
        FilterExpression: 'Published = :pub',
        ProjectionExpression: 'ID'
    };

    try {
        return (await ddb.query(params).promise()).Count !== 0;
    } catch (error) {
        console.log('Error is:', error);
        return {
            statusCode: 400,
            error: `Could not post: ${error}`
        };
    }
};

// Default initial value for Twitter Handle is blank NOT 'NONE' until it has been searched-for!
// This does not need to be synch'd once it is done!
var addNewAuthor = (authorName, env) => {
    var returnValue = {};
    var params = {
        TableName: `${env}TWITTER_HANDLES`,
        ReturnConsumedCapacity: "TOTAL",
        Item: {
            "AuthorName": {
                S: authorName
            },
            "TwitterHandle": {
                S: DEFAULT_HANDLE
            },
            "DateAdded": {
                N: String(new Date().getTime())
            },
            "CountPosts": {
                N: String(1)
            }
        }
    };

    try {
        returnValue = ddb.putItem(params).promise();
    } catch (error) {
        console.log('Error is:', error);
        returnValue = {
            statusCode: 400,
            error: `Could not post: ${error}`
        };
    }

    return returnValue;
};

var recordTweetVitals = async (tweetVitals, env) => {
    var returnValue = {};
    var params = {
        TableName: `${env}BLOG_POSTS`,
        ReturnConsumedCapacity: "TOTAL",
        Item: {
            "ID": {
                S: tweetVitals.id
            },
            "Slug": {
                S: tweetVitals.slug
            },
            "CreatedBy": {
                SS: JSON.parse(tweetVitals.createdBy)
            },
            "DateUpdated": {
                N: String(new Date(tweetVitals.dateUpdated).getTime())
            },
            "DateCreated": {
                N: String(new Date(tweetVitals.dateCreated).getTime())
            },
            "DatePublished": {
                N: String(new Date().getTime())
            },
            "Published": {
                BOOL: true
            },
            "Link": {
                S: tweetVitals.url
            },
            "Title": {
                S: tweetVitals.title
            }
        }
    };

    returnValue = ddb.putItem(params).promise().catch((err) => {
        console.log(undefined === err ? 'Undefined Error!' : err.message);
    });

    return returnValue;
};

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#batchWriteItem-property
var recordAuthorTweetLink = async (id, authorName, env) => {
    var returnValue = {};
    var params = {
        TableName: `${env}POST_AUTHORS`,
        ReturnConsumedCapacity: "TOTAL",
        Item: {
            "PostID": {
                S: id
            },
            "AuthorName": {
                S: authorName
            }
        }
    };

    try {
        returnValue = ddb.putItem(params).promise();
    } catch (error) {
        console.log('Error is:', error);
        returnValue = {
            statusCode: 400,
            error: `Could not post: ${error}`
        };
    }

    return returnValue;
};

var incAuthorPostCount = (authorName, env) => {
    var paramsUpdate = {
        TableName: `${env}TWITTER_HANDLES`,
        Key: {
            'AuthorName': {
                S: authorName
            }
        },
        UpdateExpression: 'ADD CountPosts :q',
        ExpressionAttributeValues: {
            ':q': {
                N: '1'
            }
        }
    }

    try {
        // console.log(JSON.stringify(paramsUpdate, undefined, 4));
        ddb.updateItem(paramsUpdate).promise().catch((err) => {
            console.log('Increment counter function err:', err);
        });
    } catch (error) {
        console.log('Update Error is:', error);
    }
};

var handleAuthorName = async (authorName, env) => {
    var authorReference = authorName;
    var isTwitterHandle = false;
    await checkAuthorName(authorName, env).then((data) => {
        if (data.Count === 1 && data.Items[0].TwitterHandle.S === DEFAULT_HANDLE) {
            console.log('Seen before, blank twitter handle.');
            incAuthorPostCount(authorName, env);
        } else if (data.Count === 1 && data.Items[0].TwitterHandle.S !== 'NONE') {
            var twitterHandle = data.Items[0].TwitterHandle.S;
            console.log('Seen before, twitter handle is:', twitterHandle);
            if (isValidTwitterHandle(twitterHandle)) {
                authorReference = twitterHandle;
                isTwitterHandle = true;
            }
            incAuthorPostCount(authorName, env);
        } else if (data.Count === 1 && data.Items[0].TwitterHandle.S === 'NONE') {
            console.log('Seen before, no twitter handle.');
            incAuthorPostCount(authorName, env);
        } else if (data.Count === 0) {
            console.log('Never seen before, adding...');
            addNewAuthor(authorName, env);
            authorReference += NEW_AUTHOR_DECORATION;
        } else {
            console.log('Unknown case: Duplicate names?, None-misspelt, Multiple entries?, other?');
        }
    }).catch((err) => {
        console.log('Error on checkAuthorName:', authorName);
        console.log('err:', JSON.stringify(err, undefined, 4));
    });

    return {
        authorReference,
        isTwitterHandle
    }
};

var reArrangeEntries = (data, env) => {
    var resultsArr = data.Responses[`${env}AWS_BLOGS`];
    var output = {};
    for (var result of resultsArr) {
        output[result.URLSection.S] = [result.BlogSection.S, result.Hashtag.S];
    }
    return output;
};

var isValidTwitterHandle = handle => {
    // Usernames containing the words Twitter or Admin cannot be claimed. No account names can contain Twitter or Admin unless they are official Twitter accounts.
    // Your username cannot be longer than 15 characters. Your name can be longer (50 characters), but usernames are kept shorter for the sake of ease.
    // A username can only contain alphanumeric characters (letters A-Z, numbers 0-9) with the exception of underscores, as noted above. Check to make sure your desired username doesn't contain any symbols, dashes, or spaces.
    var valid = true;
    var REG_EXP = new RegExp('[0-9a-z_]+', 'i');
    if (null !== handle && DEFAULT_HANDLE !== handle) {
        var firstChar = handle.substr(0, 1);
        var handle_only = handle.substr(1);

        if (firstChar !== '@') {
            valid = false;
            console.log('Fail validation 0) no leading @-sign', handle);
        } else if (handle_only.length < 1 || handle_only.length > 15) {
            valid = false;
            console.log('Fail validation 1) length', handle_only);
        } else if (null === REG_EXP.exec(handle_only)) {
            valid = false;
            console.log('Fail validation 2) reg ex', handle_only);
        } else if (REG_EXP.exec(handle_only)[0] != handle_only) {
            valid = false;
            console.log('Fail validation 3) reg ex', handle_only);
        } else if (handle_only.toLowerCase().indexOf('twitter') !== -1 || handle_only.toLowerCase().indexOf('admin') !== -1) {
            valid = false;
            console.log('Fail validation 4) content', handle_only);
        }
    } else {
        valid = false;
        console.log('Fail validation -1)', handle);
    }

    return valid;
};

module.exports = {
    ddb,
    isPublished,
    getBlogDetails,
    checkAuthorName,
    handleAuthorName,
    recordTweetVitals,
    isValidTwitterHandle,
    recordAuthorTweetLink
};
