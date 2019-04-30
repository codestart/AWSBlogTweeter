var AWS = require('aws-sdk');
AWS.config.update({
    region: 'eu-west-1'
});
var ddb = new AWS.DynamoDB({
    apiVersion: '2012-08-10'
});

// Given as inserting an empty string gives problems.
const DEFAULT_HANDLE = '@';

var getBlogDetails = async (event, context, body, env) => {
    //    console.log('Event is: ', JSON.stringify(event, undefined, 4));

    var params = {
        RequestItems: {
            [`${env}AWS_BLOGS`]: {
                Keys: event,
                ProjectionExpression: 'URLSection, BlogSection, Hashtag'
            }
        }
    };

    try {
        var data = await ddb.batchGetItem(params).promise();
        var data = reArrangeEntries(data, env);
        // Debugging Return: return { statusCode: 200, body: { params, data } };
        return {
            statusCode: 200,
            ref: data,
            body
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
}

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
}

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
}

var handleAuthorName = async (authorName, env) => {
    var returnValue = '';
    await checkAuthorName(authorName, env).then((data) => {
        if (data.Count === 1 && data.Items[0].TwitterHandle.S === DEFAULT_HANDLE) {
            console.log('Seen before, previously entered in the DB, but not yet checked for a twitter handle.');
            // TODO: Update DB check count +1
            returnValue = authorName;
        } else if (data.Count === 1 && data.Items[0].TwitterHandle.S !== 'NONE') {
            // check does returnValue.Items[0].TwittterHandle.S, begine with an @-sign and have the correct number of characters.
            // TODO-Later: validate against Twitter?
            console.log('Has a twitter and it is:', data.Items[0].TwitterHandle.S);
            // TODO: Update DB check count +1
            returnValue = data.Items[0].TwitterHandle.S;
            if (!isValidTwitterHandle(returnValue)) {
                returnValue = authorName;
            }
        } else if (data.Count === 1 && data.Items[0].TwitterHandle.S === 'NONE') {
            console.log('Is known to have no Twitter so use full name in tweet');
            returnValue = authorName;
        } else if (data.Count === 0) {
            console.log('Never before seen, so enter it in DB and use full name for now.');
            var confirmation = addNewAuthor(authorName, env);
            console.log('Confirmation:', confirmation);
            returnValue = authorName;
        } else {
            console.log('Unknown case: Duplicate names?, None-misspelt, Multiple entries?, other?');
            returnValue = authorName;
        }
    }).catch((err) => {
        console.log('Error on checkAuthorName:', authorName);
        console.log('err:', JSON.stringify(err, undefined, 4));
    });

    return returnValue;
}

var reArrangeEntries = (data, env) => {
    var resultsArr = data.Responses[`${env}AWS_BLOGS`];
    var output = {};
    for (var result of resultsArr) {
        output[result.URLSection.S] = [result.BlogSection.S, result.Hashtag.S];
    }
    return output;
};

var isValidTwitterHandle = async handle => {
    // Usernames containing the words Twitter or Admin cannot be claimed. No account names can contain Twitter or Admin unless they are official Twitter accounts.
    // Your username cannot be longer than 15 characters. Your name can be longer (50 characters), but usernames are kept shorter for the sake of ease.
    // A username can only contain alphanumeric characters (letters A-Z, numbers 0-9) with the exception of underscores, as noted above. Check to make sure your desired username doesn't contain any symbols, dashes, or spaces.

    var valid = true;
    var REG_EXP = new RegExp('[0-9a-z_]+', 'i');

    if (null !== handle && DEFAULT_HANDLE !== handle) {
        handle = handle.substr(1);

        if (handle.length < 1 || handle.length > 15) {
            valid = false;
            console.log('Fail validation 1) length', handle);
        } else if (null === REG_EXP.exec(handle)) {
            valid = false;
            console.log('Fail validation 2) reg ex', handle);
        } else if (REG_EXP.exec(handle)[0] != handle) {
            valid = false;
            console.log('Fail validation 3) reg ex', handle);
        } else if (handle.toLowerCase().indexOf('twitter') !== -1 || handle.toLowerCase().indexOf('admin') !== -1) {
            valid = false;
            console.log('Fail validation 3) content', handle);
        }
    } else {
        console.log('Fail validation 0) null');
    }

    return valid;
}

module.exports = {
    getBlogDetails,
    handleAuthorName,
    recordTweetVitals,
    recordAuthorTweetLink
};
