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

var EsfLoginHelper = function () {
    
    var self = this;
    var username = '';
    var password = '';
    var certBase64 = '';
    
    self.setUsername = function (uname) {
        username = uname;
    };
    
    self.getUsername = function () {
        return username;
    }
    
    self.setCertBase64 = function (cert) {
        certBase64 = cert;
    }
    
    self.getCertBase64 = function () {
        return certBase64;
    }
    
    self.setPassword = function (pwd) {
        password = pwd;
    }
    
    self.getPassword = function () {
        return password;
    }
    
};

EsfLoginHelper.prototype = {
    readCert: function (certFile, callback) { // read certificate file, parse and return username
        var self = this; 
        var reader = new FileReader();
        reader.onload = function(e) {
            var re = /-----BEGIN CERTIFICATE-----[\n\r\w\W]*-----END CERTIFICATE-----/;
            if (reader.result.match(re)){
                var username = '';
                var certBase64 = reader.result.match(re)[0];
                certBase64 = certBase64.replace('-----BEGIN CERTIFICATE-----','');
                certBase64 = certBase64.replace('-----END CERTIFICATE-----','');
                certBase64 = certBase64.replace(/[\n\r\s]/g,'');
                self.setCertBase64(certBase64);
                username = atob(certBase64).match(/IIN\d{12}/)[0];
                username = username.replace(/IIN/,'');
                self.setUsername(username);
                callback(null, username);
            } else {
                callback('Invalid certificate file');
            }
        }
        reader.readAsText(certFile);
    },
    getCompanyList: function (pass, callback) { // retrieve a list of companies that user has access to
        this.setPassword(pass);
        var params = {
            security:{
                username: this.getUsername(),
                password: this.getPassword()
            },
            body: {
                tin: this.getUsername(),
                x509Certificate: this.getCertBase64()   
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
    getSessionId: function (tin, callback) {
        var params = {
            security:{
                username: this.getUsername(),
                password: this.getPassword()
            },
            body: {
                tin: tin,
                x509Certificate: this.getCertBase64()   
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

// expose LoginHelper constructor function to global scope
global.EsfLoginHelper = EsfLoginHelper;


//-------------- API HELPER -----------------

var EsfApiHelper = function (sessionId) {};

EsfApiHelper.prototype = {
    setSessionId: function (sessionId) {
        this.sessionId = sessionId;
    },
    queryInvoice: function (params, callback) {
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
    getPdf: function (params, callback) {
        ajaxCall('api/pdfservice/preparepdf', params, function(err, response) {
            if (err) {
                return callback("Status: " + err.status + ". Response text: " + err.responseText); 
            }
            if (response.pdfPrepared) {
                location.href = "/api/pdfservice/downloadpdf?orderid=" + response.orderId;
                callback();
            } else {
                return callback('Cannot prepare PDF');
            }
        });
    }
};

global.EsfApiHelper = EsfApiHelper;

} (window));