var http = require('http');
var fs = require('fs');
var soap = require('soap');
var glob = require('glob');
var objToHtml = require('./objtohtml');
var phantom = require('phantom');
var async = require('async');
var archiver = require('archiver');
var url = require('url');

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
            client.InvoiceService.InvoiceServicePort.queryInvoice(formData.body, function(err, result){
                if (err) {
                    var err_response = {
                        message: err.message,
                        status: 'error'
                    };
                    response.end(JSON.stringify(err_response));
                } else {
                    invoiceResponse = result;
                    console.log(invoiceResponse);
                    result.status = 'success';
                    response.end(JSON.stringify(result));
                }
            },{rejectUnauthorized: false});    
        }
    });
};

var getPdf = function(formData, response) {

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    var orderId = getRandomInt(100000000, 999999999);

    var session = null;

    process.on('exit', function(code, signal) {
        session.exit();
    });

    var createPhantomSession = function(cb) {
        if (session) {
            return cb(null, session);
        } else {
            phantom.create().then(function(_session){
                session = _session;
                return cb(null, session);
            });
        }
    };

    var renderPdf = function(session, pdfContent, pdfFilename, callback, cb) {
      var page;

      try {
        session.createPage().then(function(_page) {
            page = _page;
            page.on('onLoadFinished', function() {
                page.render(pdfFilename).then(function() {
                    page.close();
                    page = null;
                    callback();
                    return cb(null, pdfFilename);
                });
            });
            page.property('paperSize', { width: 8.5*122, height:11*122, margin:{ top: 50, bottom: 50} });
            page.property('content', pdfContent);

        });
      } catch(e) {
        try {
          if (page != null) {
            callback();
            page.close(); // try close the page in case it opened but never rendered a pdf due to other issues
          }
        } catch(e) {
            callback();
          // ignore as page may not have been initialised
        }
        callback();
        return cb('Exception rendering pdf:' + e.toString());
      }
    };

    if (invoiceResponse.invoiceInfoList.invoiceInfo != null) 
        createPhantomSession(function(err,s){
            async.forEachLimit(formData, 50, function(formDataInvoiceId, callback){
                var length = invoiceResponse.invoiceInfoList.invoiceInfo.length;
                var invoiceInfo = {};
                for (var i=0; i < length; i++) {
                    if (invoiceResponse.invoiceInfoList.invoiceInfo[i].invoiceId === formDataInvoiceId) {
                        invoiceInfo = invoiceResponse.invoiceInfoList.invoiceInfo[i];
                        break;
                    }
                }
                var filename = './print/' + orderId + '/' + invoiceInfo.registrationNumber + '.pdf';
                renderPdf(s, objToHtml(invoiceInfo), filename, callback, function(err, f){
                    if (err) console.log(err);
                    console.log(f);
                });
            }, function(err){
                if (err) throw err;
                var res = { 
                    pdfPrepared: true,
                    orderId: orderId
                };
                response.end(JSON.stringify(res));
            });
        });

};

function downloadPdf(orderId, response) {
    response.writeHead(200,{
        "Content-Type": "application/zip",
        "Content-disposition": "attachment; filename=" + orderId + ".zip"
    });
    var archive = archiver('zip');
    archive.on('error', function(err) {
      throw err;
    });
    archive.on('end', function(err) {
        glob("./print/"+ orderId +"/*.*",function(err,files){
             if (err) throw err;
            async.forEach(files,function(item, callback){
                fs.unlink(item, function(err){
                    if (err) throw err;
                    callback();
                });
            },function(){
                if (err) throw err;
                fs.rmdirSync("./print/"+ orderId);
            });
        });
    });
    archive.pipe(response);
    glob("./print/" + orderId + "/*.pdf",function(err,files){
        if (err) throw err;
        async.forEach(files,function(item, callback){
            archive.append(fs.createReadStream(item), { name: item.replace('./print/' + orderId + '/', '') });
            callback();
        },function(){
            if (err) throw err;
            archive.finalize();
        });
    });
}

var server = http.createServer(function(request, response){
    
    console.log(request.headers);
	if (request.method === 'GET'){
        var requestUrl = url.parse(request.url, true);
        //console.log(url.parse(request.url, true));
        switch (requestUrl.pathname) {
            case "/app.js" :
                response.writeHead(200, {"Content-Type": "text/javascript"});
                fs.createReadStream("./app.js").pipe(response);
                break;
            case "/esftable.js" :
                response.writeHead(200, {"Content-Type": "text/javascript"});
                fs.createReadStream("./esftable.js").pipe(response);
                break;
            case "/styles.css" :
                response.writeHead(200, {"Content-Type": "text/css"});
                fs.createReadStream("./styles.css").pipe(response);
                break;
            case "/customer.cer" :
                response.writeHead(200,{
                    "Content-Type": "application/octet-stream",
                    "Content-disposition": "attachment; filename=customer.cer"
                });
                fs.createReadStream("./customer.cer").pipe(response);
                break;
            case "/seller.cer" :
                response.writeHead(200,{
                    "Content-Type": "application/octet-stream",
                    "Content-disposition": "attachment; filename=seller.cer"
                });
                fs.createReadStream("./seller.cer").pipe(response);
                break;
            case "/downloadpdf":
                if (requestUrl.search){
                    downloadPdf(requestUrl.query.orderid, response);
                }
                break;
            default :    
                response.writeHead(200,{"Content-Type": "text/html"});
                fs.createReadStream("./index.html").pipe(response);
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
                case '/api/getpdf':
                    getPdf(formData, response);
                    break;
            }
        });
    };
}).listen(process.env.PORT || 8080);
console.log('Listening on port: ' + (process.env.PORT || 8080));