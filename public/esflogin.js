(function(global) {
    
    var EsfLogin = function() {
        return new EsfLogin.init();
    }
    
    var username;
    var certBase64;
    var password;
    
    EsfLogin.prototype = {
        readCert: function(certFile, callback) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var user ={};
                var certFileContent = reader.result;
                var re = /-----BEGIN CERTIFICATE-----[\n\r\w\W]*(?=-----END CERTIFICATE-----)/g;
                if (certFileContent.match(re)){
                    user.certBase64 = certFileContent.match(re)[0];
                    user.certBase64 = user.certBase64.replace(/-----BEGIN CERTIFICATE-----/,'');
                    user.certBase64 = user.certBase64.replace(/[\n\r ]/g,'');
                    user.certDecoded = atob(user.certBase64);
                    user.id = user.certDecoded.match(/IIN\d{12}/)[0];
                    user.id = user.id.replace(/IIN/,'');
                    username = user.id;
                    certBase64 = user.certBase64;
                    callback(null, user.id);
                } else {
                    callback('Invalid certificate file');
                }
            }
            reader.readAsText(certFile);
        },
        getCompanyList: function(pass, callback) {
            password = pass;
            var params = {
                security:{
                    username: username,
                    password: password
                },
                body: {
                    tin: username,
                    x509Certificate: certBase64   
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
                    username: username,
                    password: password
                },
                body: {
                    tin: tin,
                    x509Certificate: certBase64   
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
    
    EsfLogin.init = function() {
        
        var self = this;
        
    }
    
    EsfLogin.init.prototype = EsfLogin.prototype;
    
    global.EsfLogin = EsfLogin;
    
}(window));