"use strict";

var http = require('http');
var fs = require('fs');
var soap = require('soap');
var url = require('url');

var pdfService = require('./pdfservice');

var invoiceResponse = {};

var session_service_wsdl = 'session_service.wsdl';
var invoice_service_wsdl = 'invoice_service.wsdl';
var wsdlOptions = {
    "overrideRootElement": {
        "namespace": "tns"
    }
};

var sessionService = function(operation, formData, response){
    soap.createClient(session_service_wsdl, wsdlOptions, function(err, client) {
        if (err) throw err;
        client.setSecurity(new soap.WSSecurity(formData.security.username, formData.security.password, {hasTimeStamp: false}));

        if (operation === 'getUser') {
            client.SessionService.SessionServicePort.getUser(formData.body, function(err, result){
                if (err) {
                    var err_response = {
                        message: err.message,
                        status: 'error'
                    };
                    response.end(JSON.stringify(err_response));
                } else {
                    result.status = 'success';
                    response.end(JSON.stringify(result));
                }
            }, {rejectUnauthorized: false});
        } else if (operation === 'createSession') {
            client.SessionService.SessionServicePort.createSession(formData.body, function(err, result){
                if (err) {
                    var err_response = {
                        message: err.message,
                        status: 'error'
                    };
                    response.end(JSON.stringify(err_response));
                } else {
                    invoiceResponse[result.sessionId] = {}
                    setTimeout(function(){
                        delete invoiceResponse[result.sessionId];
                        console.log('Session deleted ', result.sessionId);
                    }, 30*60*1000);
                    result.status = 'success';
                    response.end(JSON.stringify(result));
                }
            }, {rejectUnauthorized: false});
        }
    });
};

var invoiceService = function(operation, formData, response){
    soap.createClient(invoice_service_wsdl, wsdlOptions, function(err, client) {
        if (err) throw err;
        if (operation === 'queryInvoice'){
            if (invoiceResponse[formData.body.sessionId]){
                client.InvoiceService.InvoiceServicePort.queryInvoice(formData.body, function(err, result){
                    if (err) {
                        var err_response = {
                            message: err.message,
                            status: 'error'
                        };
                        response.end(JSON.stringify(err_response));
                    } else {
                        invoiceResponse[formData.body.sessionId] = result;
                        result.status = 'success';
                        response.end(JSON.stringify(result));
                    }
                },{rejectUnauthorized: false});
            } else {
                response.end('Error: no session');
            }
        }
    });
};

//handle client requests
var server = http.createServer(function(request, response){
	if (request.method === 'GET'){
        var requestUrl = url.parse(request.url, true);
        switch (requestUrl.pathname) {
            case "/app.js" :
                response.writeHead(200, {"Content-Type": "text/javascript"});
                fs.createReadStream("./public/app.js").pipe(response);
                break;
            case "/esftable.js" :
                response.writeHead(200, {"Content-Type": "text/javascript"});
                fs.createReadStream("./public/esftable.js").pipe(response);
                break;
            case "/esflogin.js" :
                response.writeHead(200, {"Content-Type": "text/javascript"});
                fs.createReadStream("./public/esflogin.js").pipe(response);
                break;
            case "/esfapi.js" :
                response.writeHead(200, {"Content-Type": "text/javascript"});
                fs.createReadStream("./public/esfapi.js").pipe(response);
                break;
            case "/styles.css" :
                response.writeHead(200, {"Content-Type": "text/css"});
                fs.createReadStream("./public/styles.css").pipe(response);
                break;
            case "/customer.cer" :
                response.writeHead(200,{
                    "Content-Type": "text/plain",
                    "Content-disposition": "attachment; filename=customer.cer"
                });
                fs.createReadStream("./public/customer.cer").pipe(response);
                break;
            case "/seller.cer" :
                response.writeHead(200,{
                    "Content-Type": "text/plain",
                    "Content-disposition": "attachment; filename=seller.cer"
                });
                fs.createReadStream("./public/seller.cer").pipe(response);
                break;
            case "/api/downloadpdf":
                if (requestUrl.search){
                    pdfService.downloadPdf(requestUrl.query.orderid, response);
                }
                break;
            default :    
                response.writeHead(200,{"Content-Type": "text/html"});
                fs.createReadStream("./public/index.html").pipe(response);
        }
    } else if (request.method === 'POST'){
        var requestBody = '';
        request.on('data', function(data) {
            requestBody += data;
            if(requestBody.length > 1e7) {
                response.writeHead(413, 'Request Entity Too Large', {'Content-Type': 'text/html'});
                response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
            }
        });
        request.on('end', function() {
            var formData = JSON.parse(requestBody);
            switch (request.url) {
                case '/api/sessionservice/getuser':
                    sessionService('getUser', formData, response);
                    break;
                case '/api/sessionservice/createsession':
                    sessionService('createSession', formData, response);
                    break;
                case '/api/invoiceservice/queryinvoice':
                    invoiceService('queryInvoice', formData, response);
                    break;
                case '/api/preparepdf':
                    pdfService.preparePdf(invoiceResponse, formData, response);
                    break;
            }
        });
    };
}).listen(process.env.PORT || 8080);
console.log('Listening on port: ' + (process.env.PORT || 8080));