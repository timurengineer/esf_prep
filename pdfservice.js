"use strict";

var fs = require('fs');
var glob = require('glob');
var objToHtml = require('./objtohtml');
var phantom = require('phantom');
var async = require('async');
var archiver = require('archiver');

//get a list of invoiceIds from user, create and save PDFs to print folder, return orderId to user
module.exports.preparePdf = function(invoiceResponse, formData, response) {

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
    
    if (invoiceResponse[formData.sessionId]){
        if (invoiceResponse[formData.sessionId].invoiceInfoList.invoiceInfo != null) 
            createPhantomSession(function(err,s){
                async.forEachLimit(formData.invoiceIds, 50, function(formDataInvoiceId, callback){
                    var length = invoiceResponse[formData.sessionId].invoiceInfoList.invoiceInfo.length;
                    var invoiceInfo = {};
                    for (var i=0; i < length; i++) {
                        if (invoiceResponse[formData.sessionId].invoiceInfoList.invoiceInfo[i].invoiceId === formDataInvoiceId) {
                            invoiceInfo = invoiceResponse[formData.sessionId].invoiceInfoList.invoiceInfo[i];
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
    } else {
        response.end('Error: no session');
    }

};

//get orderId from user and return PDFs in a zip file
module.exports.downloadPdf = function(orderId, response) {
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