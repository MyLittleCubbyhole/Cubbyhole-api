var mailer = {}
,   sender = require(global.paths.server + '/mailer/tools/sender')
,   config = require(global.paths.server + '/config/core').get()
,   fs = require('fs');

mailer.sendActivationMail = function(receiverAddress, firstname, token) {

    var webserverUrl = config["webserver"].protocol + '//' + config["webserver"].host + ':' + config["webserver"].port;

    var activationUrl = webserverUrl + '/activation?token=' + token;
    //var logoUrl = webserverUrl + '/images/design/snuffen.png';
    var logoUrl = 'http://nsa33.casimages.com/img/2014/04/20/14042004120478149.png';

    fs.readFile(global.paths.server + '/mailer/mails/templates/activation/activation.html', 'utf8', function(error, data) {
        if(!error) {
            var mailOptions = {
                to: receiverAddress,
                subject: "Activez votre compte CubbyHole",
                generateTextFromHTML: true,
                html: data.replace(/{{activationUrl}}/g, activationUrl).replace(/{{logoUrl}}/g, logoUrl).replace(/{{firstname}}/g, firstname)
            };

            sender.sendMail(mailOptions);
        } else
            console.log(error);
    });

};



module.exports = mailer;