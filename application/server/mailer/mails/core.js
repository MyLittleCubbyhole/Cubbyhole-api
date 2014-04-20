var mailer = {}
,   sender = require(global.paths.server + '/mailer/tools/sender')
,   config = require(global.paths.server + '/config/core').get()
,   fs = require('fs');

mailer.sendActivationMail = function(receiverAddress, token) {

    var urlActivation = config["webserver"].protocol + '//' + config["webserver"].host + ':' + config["webserver"].port + '/activation?token=' + token;

    fs.readFile(global.paths.server + '/mailer/mails/templates/activation/activation.html', 'utf8', function(error, data) {
        if(!error) {
            var mailOptions = {
                to: receiverAddress,
                subject: "Activez votre compte CubbyHole",
                generateTextFromHTML: true,
                html: data.replace(/{{urlActivation}}/g, urlActivation)
            };

            sender.sendMail(mailOptions);

        } else
            console.log(error);
    });

};



module.exports = mailer;