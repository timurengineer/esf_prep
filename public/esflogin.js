(function(global) {
    
    var EsfLogin = function() {};
    
    EsfLogin.prototype = {
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
    
    global.EsfLogin = EsfLogin;
    
}(window));