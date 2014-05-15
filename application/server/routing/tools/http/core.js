var https = require('https')
,   qs = require('querystring')
,   httpTools = {};

httpTools.processPaypalIpn = function(request, response, callback) {

    var headers = request.headers
    ,   body = request.body;

    response.send(200);

    var testIpn = body.test_ipn;

    body = 'cmd=_notify-validate&' + qs.stringify(body);

    var req_options = {
        host: (testIpn) ? 'www.sandbox.paypal.com' : 'www.paypal.com',
        method: 'POST',
        path: '/cgi-bin/webscr',
        headers: {'Content-Length': body.length, 'Content-Type': 'application/x-www-form-urlencoded'}
    };

    var req = https.request(req_options, function paypal_request(res) {
        var data = [];

        res.on('data', function paypal_response(d) {
            data.push(d);
        });

        res.on('end', function response_end() {
            var result = data.join('');

            callback.call(this, (result == 'VERIFIED' ? null : 'Invalid payment - ' + result));
        });
    });

    req.write(body);
    req.end();

    req.on('error', function request_error(e) {
        callback.call(this, 'error when sending request to Paypal - ' + e);
    });
}

module.exports = httpTools;
