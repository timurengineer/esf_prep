(function(global) {
    
    var ApiHelper = function(sessionId) {};
    
    ApiHelper.prototype = {
        setSessionId: function(sessionId) {
            this.sessionId = sessionId;
        },
        queryInvoice: function(params, callback) {
            params.body.sessionId = this.sessionId;
            ajaxCall('api/invoiceservice/queryinvoice', params, function(err, response) {
                if (err) {
                    return callback("Status: " + err.status + ". Response text: " + err.responseText);
                } else {
                    if (response.status === "success"){
                        callback(null, response);
                    } else if (response.status === "error") {
                        return callback(JSON.stringify(response));
                    }
                }
            });
        },
        getPdf: function(params, callback) {
            ajaxCall('api/preparepdf', params, function(err, response) {
                if (err) {
                    return callback("Status: " + err.status + ". Response text: " + err.responseText); 
                }
                if (response.pdfPrepared) {
                    location.href = "/api/downloadpdf?orderid=" + response.orderId;
                    callback();
                } else {
                    return callback('Cannot prepare PDF');
                }
            });
        }
    };
    
    global.ApiHelper = ApiHelper;
} (window));