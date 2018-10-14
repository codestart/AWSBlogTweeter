// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Set the region
AWS.config.update({region: 'eu-west-1'});

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var queryDatabase = async (event, context) => {
//  console.log('Event is: ', JSON.stringify(event, undefined, 4));

  var params = {
    RequestItems: {
      'AWS_BLOGS': {
        Keys: event,
        ProjectionExpression: 'URLSection, BlogSection, Hashtag'
      }
    }
  };

  try {
    var data = await ddb.batchGetItem(params).promise();
    var data = reArrangeEntries(data);
    return { statusCode: 200, body: { params, data } };
  } catch (error) {
    return {
      statusCode: 400,
      error: `Could not post: ${error.stack}`
    };
  }
};

var reArrangeEntries = (data) => {
  var resultsArr = data.Responses['AWS_BLOGS'];
  var output = {};
  for(var result of resultsArr) {
    output[result.URLSection.S] = [result.BlogSection.S, result.Hashtag.S];
  }
  return output;
};

module.exports = {
    queryDatabase: queryDatabase
  };
