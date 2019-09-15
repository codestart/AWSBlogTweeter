var AWS = require('aws-sdk');

AWS.config.update({
    region: 'eu-west-1'
});
var ses = new AWS.SES({
    apiVersion: '2010-12-01'
});

/* The following example sends a formatted email: */

var sendEmailNotification = (subject, body) => {
    var params = {
        Destination: {
            ToAddresses: ["andoni.oc@gmail.com"]
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: body
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: subject
            }
        },
        Source: "andoni.oc@gmail.com"
    };

    ses.sendEmail(params, function (err, data) {
        if (err) console.log('SES Error:', err, err.stack); // an error occurred
        else console.log('SES Success:', data); // successful response
    });
};

module.exports = {
    sendEmailNotification
};
