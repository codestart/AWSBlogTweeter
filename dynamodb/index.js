// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

var queryDatabase = (urlsection, callback) => {
  // Set the region
  AWS.config.update({region: 'eu-west-1'});

  // Create DynamoDB service object
  var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

  var params = {
    ExpressionAttributeValues: {
      ':s': {S: urlsection}
  //    ,
  //    ':e' : {N: '09'},
  //    ':topic' : {S: 'PHRASE'}
     },
   KeyConditionExpression: 'URLSection = :s',
   ProjectionExpression: 'BlogSection, Hashtag',
  //  FilterExpression: 'contains (Subtitle, :topic)',
   TableName: 'AWS_BLOGS'
  };

  ddb.query(params, function(err, data) {
    if (err) {
      console.log("Error", err);
      callback(err);
    } else {
      data.Items.forEach(function(element, index, array) {
        console.log(element.BlogSection.S + " (" + element.Hashtag.S + ")");
        callback(undefined, element);
      });
    }
  });
}

module.exports = {
    queryDatabase: queryDatabase
  };
