(function(global) {
    
function ajaxCall(url, params, callback) {
    var request = new XMLHttpRequest();
    request.onload = function () {
        if (request.status == 200) {
            var response = JSON.parse(request.responseText);
            callback(null, response);
        } else {
            return callback(request);
        }
    };
    request.onerror = function(){
        return callback("Status: " + request.status + ". Response text: " + request.responseText);
    };
    request.open("POST", url, true);
    request.setRequestHeader("Content-type", "text/plain");
    request.send(JSON.stringify(params));
}
    
//-------------- LOGIN HELPER -----------------

var EsfLoginHelper = function() {};

EsfLoginHelper.prototype = {
    readCert: function(certFile, callback) {
        var self = this; 
        var reader = new FileReader();
        reader.onload = function(e) {
            var re = /-----BEGIN CERTIFICATE-----[\n\r\w\W]*-----END CERTIFICATE-----/;
            if (reader.result.match(re)){
                var certBase64 = reader.result.match(re)[0];
                certBase64 = certBase64.replace('-----BEGIN CERTIFICATE-----','');
                certBase64 = certBase64.replace('-----END CERTIFICATE-----','');
                certBase64 = certBase64.replace(/[\n\r ]/,'');
                self.certBase64 = certBase64;
                var username = atob(certBase64).match(/IIN\d{12}/)[0];
                self.username = username.replace(/IIN/,'');
                callback(null, self.username);
            } else {
                callback('Invalid certificate file');
            }
        }
        reader.readAsText(certFile);
    },
    getCompanyList: function(pass, callback) {
        this.password = pass;
        var params = {
            security:{
                username: this.username,
                password: this.password
            },
            body: {
                tin: this.username,
                x509Certificate: this.certBase64   
            }
        };
        ajaxCall('api/sessionservice/getuser', params, function(err, response) {
            if (err) {
                callback("Status: " + err.status + ". Response text: " + err.responseText);
            } else {
                if (response.status === "success"){
                    var companyList = [];
                    for (var i=0; i < response.user.enterpriseEntries.length; i++) {
                        companyList.push({
                            id: response.user.enterpriseEntries[i].tin,
                            name: response.user.enterpriseEntries[i].enterpriseTaxpayerInfo.nameRu
                        });
                        if (response.user.enterpriseEntries[i].branches) {
                            for (var j=0; j < response.user.enterpriseEntries[i].branches.length; j++){
                                companyList.push({
                                    id: response.user.enterpriseEntries[i].branches[j].tin,
                                    name: response.user.enterpriseEntries[i].branches[j].enterpriseTaxpayerInfo.nameRu
                                });
                            }
                        }
                    }
                    callback(null, companyList);
                } else {
                    callback(response.message);
                }
            }
        });
    },
    getSessionId: function(tin, callback) {
        var params = {
            security:{
                username: this.username,
                password: this.password
            },
            body: {
                tin: tin,
                x509Certificate: this.certBase64   
            }
        };
        ajaxCall('api/sessionservice/createsession', params, function(err, response) {
            if (err) {
                callback("Status: " + request.status + ". Response text: " + request.responseText);
            } else {
                if (response.status === "success"){
                    return callback(null, response.sessionId);
                } else {
                    callback(response.message);
                }
            }
        });
    }
};

global.EsfLoginHelper = EsfLoginHelper;


//-------------- API HELPER -----------------

var EsfApiHelper = function(sessionId) {};

EsfApiHelper.prototype = {
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

global.EsfApiHelper = EsfApiHelper;

} (window));