describe("Simple Email Service", function () {
    var sesFile = require('../src/ses.js');

    it("Calls the Send Email Service with the correct values", async () => {
        var params = {
            Destination: {
                ToAddresses: ["andoni.oc@gmail.com"]
            },
            Message: {
                Body: {
                    Text: {
                        Charset: "UTF-8",
                        Data: "body goes here"
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "subject goes here"
                }
            },
            Source: "andoni.oc@gmail.com"
        };

        spyOn(sesFile.ses, "sendEmail").and.callThrough();

        sesFile.sendEmailNotification("subject goes here", "body goes here");

        expect(sesFile.ses.sendEmail).toHaveBeenCalledWith(params);
    });
});