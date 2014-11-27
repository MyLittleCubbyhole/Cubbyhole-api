var sender = {}
,   config = require(global.paths.server + '/config/core').get()
,   nodemailer = require("nodemailer");

/**
 * Send a mail
 * @param  {[type]} mailOptions options to send the email
 */
sender.sendMail = function(mailOptions) {

    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: config['mail_options'].service,
        auth: {
            user: config['mail_options'].user,
            pass: config['mail_options'].password
        }
    });

    mailOptions.from = config['mail_options'].sender_address;

    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error)
            console.log(error);
        else
            console.log("Message sent: " + response.message + " - to: " + mailOptions.to);

        smtpTransport.close();
    });

};



module.exports = sender;