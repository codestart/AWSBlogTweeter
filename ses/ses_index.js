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
            BccAddresses: [],
            CcAddresses: [],
            ToAddresses: ["andoni.oc@gmail.com"]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: ""
                },
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
        ReplyToAddresses: [],
        ReturnPath: "",
        ReturnPathArn: "",
        Source: "andoni.oc@gmail.com",
        SourceArn: ""
    };

    ses.sendEmail(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
        /*
        data = {
        MessageId: "EXAMPLE78603177f-7a5433e7-8edb-42ae-af10-f0181f34d6ee-000000"
        }
        */
    });
};

module.exports = {
    sendEmailNotification
};
