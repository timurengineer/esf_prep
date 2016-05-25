;"use strict";
var reader = new FileReader();
var user = {};
var errorBox = document.getElementById('errorbox');
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var companyInput = document.getElementById('company');
var loginButton = document.getElementById('login_button');
var getUserResponse;
var queryInvoiceResponse;
var direction;

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exmins) {
    var d = new Date();
    d.setTime(d.getTime() + (exmins*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

(function() {
    var sessionId = getCookie('sessionId');
    if (sessionId) {
        document.getElementById('user_company').textContent = getCookie('userCompany');
        document.getElementById('login_page').style.display = 'none';
        document.getElementById('app_page').style.display = 'block';
    }
})();

reader.onload = function(e) {
    var certFileContent = reader.result;
    var re = /-----BEGIN CERTIFICATE-----[\n\r\w\W]*(?=-----END CERTIFICATE-----)/g;
    for (var i=companyInput.options.length; i-->0 ;) {
        companyInput.options[i] = null;
    }
    companyInput.disabled = true;
    loginButton.disabled = true;
    if (certFileContent.match(re)){
        user.certBase64 = certFileContent.match(re)[0];
        user.certBase64 = user.certBase64.replace(/-----BEGIN CERTIFICATE-----/,'');
        user.certBase64 = user.certBase64.replace(/[\n\r ]/g,'');
        user.certDecoded = atob(user.certBase64);
        user.id = user.certDecoded.match(/IIN\d{12}/)[0];
        user.id = user.id.replace(/IIN/,'');
        usernameInput.value = user.id;
        passwordInput.disabled = false;
        passwordInput.value = null;
        passwordInput.focus();
    } else {
        usernameInput.value = null;
        passwordInput.disabled = true;
        errorBox.textContent = 'Invalid certificate file';
        errorBox.style.display = 'block';
    }
}

document.getElementById("certificate").addEventListener('change', function(evt){
    errorBox.style.display = 'none';
    var certFile = evt.target.files[0];
    if (certFile) reader.readAsText(certFile);
}, false);

function insertCompanyInfo() {
    for (var i=0; i < getUserResponse.user.enterpriseEntries.length; i++) {
        var opt = document.createElement('option');
        opt.value = getUserResponse.user.enterpriseEntries[i].tin;
        opt.innerHTML = getUserResponse.user.enterpriseEntries[i].enterpriseTaxpayerInfo.nameRu;
        companyInput.appendChild(opt);
        if (getUserResponse.user.enterpriseEntries[i].branches) {
            var branchesLength = getUserResponse.user.enterpriseEntries[i].branches.length;
            for (var j=0; j < branchesLength; j++){
                opt = document.createElement('option');
                opt.value = getUserResponse.user.enterpriseEntries[i].branches[j].tin;
                opt.innerHTML = getUserResponse.user.enterpriseEntries[i].branches[j].enterpriseTaxpayerInfo.nameRu;
                companyInput.appendChild(opt);
            }
        }
    }
}

function queryInvoice() {
    if (getCookie('sessionId')) {
        var params = {
            body: {
                sessionId: getCookie('sessionId'),
                criteria: {
                    direction: ''
                }
            }
        };
        //set direction parameter
        var directions = document.getElementsByName('direction');
        var length = directions.length;
        for (var i = 0; i < length; i++) {
            if (directions[i].checked) {
                direction = directions[i].value;
                params.body.criteria.direction = directions[i].value;
                break;
            }
        }
        //set other parameters here
        var contragentTin = document.getElementById('company_id').value;
        if (contragentTin) params.body.criteria.contragentTin = contragentTin;
        var dateFrom = document.getElementById('date_from').value;
        if (dateFrom) {
            dateFrom = new Date(dateFrom);
            params.body.criteria.dateFrom = dateFrom; 
        }
        var dateTo = document.getElementById('date_to').value;
        if (dateTo) {
            dateTo = new Date(dateTo);
            params.body.criteria.dateTo = dateTo; 
        }
        var invoiceStatusArray = [];
        var invoiceStatusCheckboxes = document.getElementsByName('invoice_status');
        for (var i=0; i < invoiceStatusCheckboxes.length; i++){
            if (invoiceStatusCheckboxes[i].checked) {
                invoiceStatusArray.push(invoiceStatusCheckboxes[i].value);
            }
        }
        params.body.criteria.invoiceStatusList ={
            invoiceStatus: invoiceStatusArray
        }
        var invoiceType = document.getElementById('invoice_type').value;
        if (invoiceType) params.body.criteria.invoiceType = invoiceType;
        params.body.criteria.asc = false;
        var request = new XMLHttpRequest();
        request.onload = function() {
            document.getElementById('messages').textContent = "";
            if (request.status == 200) {
                queryInvoiceResponse = JSON.parse(request.responseText);
                if (queryInvoiceResponse.status === "success"){
                    errorBox.style.display = 'none';
                    if (queryInvoiceResponse.invoiceInfoList) {
                        var invoiceTable = EsfTable(queryInvoiceResponse.invoiceInfoList.invoiceInfo);
                        document.getElementById('table_content').appendChild(invoiceTable.getTable([
                            'regNumber',
                            'companyId',
                            'companyName',
                            'type',
                            'status',
                            'currency',
                            'totalWithTax'
                        ]));
                    } else {
                        document.getElementById('table_content').textContent = 'No invoice found';   
                    }

                } else if (queryInvoiceResponse.status === "error") {
                    document.getElementById('table_content').textContent = JSON.stringify(queryInvoiceResponse);
                }
            } else {
                document.getElementById('table_content').textContent = "Status: " + request.status + ". Response text: " + request.responseText;
            }
        };
        request.open("POST", "api/invoiceservice/queryinvoice", true);
        request.setRequestHeader("Content-type", "text/plain");
        request.send(JSON.stringify(params));
        document.getElementById('table_content').innerHTML = '';
        document.getElementById('messages').textContent = "Loading... Please wait";
    } else {
        logOut();
    }
}

function passKeyPressed(evt){
    if (evt.keyCode === 13){
        var params = {
            security:{
                username: user.id,
                password: passwordInput.value
            },
            body: {
                tin: user.id,
                x509Certificate: user.certBase64   
            }
        };
        passwordInput.disabled = true;
        document.getElementById('loading').style.display = 'inline';
        var request = new XMLHttpRequest();
        request.onload = function() {
            document.getElementById('loading').style.display = 'none';
            if (request.status == 200) {
                getUserResponse = JSON.parse(request.responseText);
                if (getUserResponse.status === "success"){
                    errorBox.style.display = 'none';
                    if (getUserResponse.user.enterpriseEntries) {
                        insertCompanyInfo();
                    }
                    companyInput.disabled = false;
                    loginButton.disabled = false;
                } else if (getUserResponse.status === "error") {
                    passwordInput.disabled = false;
                    errorBox.textContent = getUserResponse.message;
                    errorBox.style.display = 'block';
                }
            } else {
                passwordInput.disabled = false;
                errorBox.textContent = "Status: " + request.status + ". Response text: " + request.responseText;
                errorBox.style.display = 'block';
            }
        };
        request.onerror = function(){
            errorBox.textContent = "Status: " + request.status + ". Response text: " + request.responseText;
            errorBox.style.display = 'block';  
        };
        request.open("POST", "api/sessionservice/getuser", true);
        request.setRequestHeader("Content-type", "text/plain");
        request.send(JSON.stringify(params));
    }
}

function logIn(){
    var params = {
        security:{
            username: user.id,
            password: passwordInput.value
        },
        body: {
            tin: companyInput.value,
            x509Certificate: user.certBase64
        }
    };
    var request = new XMLHttpRequest();
    request.onload = function() {
        if (request.status == 200) {
            var createSessionResponse = JSON.parse(request.responseText);
            if (createSessionResponse.status === "success"){
                errorBox.style.display = 'none';
                document.getElementById('login_page').style.display = 'none';
                document.getElementById('app_page').style.display = 'block';
                document.getElementById('user_company').textContent = companyInput.options[companyInput.selectedIndex].innerHTML;
                setCookie('sessionId', createSessionResponse.sessionId, 30);
                setCookie('userCompany', companyInput.options[companyInput.selectedIndex].innerHTML, 30);
                //document.cookie = "sessionId=" + createSessionResponse.sessionId;
                //document.cookie = "userCompany=" + companyInput.options[companyInput.selectedIndex].innerHTML;
            } else if (createSessionResponse.status === "error") {
                errorBox.textContent = getUserResponse.message;
                errorBox.style.display = 'block';
            }
        } else {
            errorBox.textContent = "Status: " + request.status + ". Response text: " + request.responseText;
            errorBox.style.display = 'block';
        }
    };
    request.open("POST", "api/sessionservice/createsession", true);
    request.setRequestHeader("Content-type", "text/plain");
    request.send(JSON.stringify(params));
}

function getPdf(){
    var params = {
        sessionId: getCookie('sessionId'),
        invoiceIds: []
    };
    var checkboxes = document.getElementsByName('invoice_checkbox');
    for(var i=0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked){
            params.invoiceIds.push(checkboxes[i].value);
        };
    }
    var request = new XMLHttpRequest();
    request.onload = function() {
        document.getElementById('pdf_button').disabled = false;
        if (request.status == 200) {
            document.getElementById('messages').textContent = '';
            var getPdfResponse = JSON.parse(request.responseText);
            if (getPdfResponse.pdfPrepared) {
                location.href = "/downloadpdf?orderid=" + getPdfResponse.orderId;
            } else {
                document.getElementById('messages').textContent = 'Cannot prepare PDF';
            }
        } else {
            document.getElementById('messages').textContent = "Status: " + request.status + ". Response text: " + request.responseText;
        }
    };
    request.open("POST", "api/getpdf", true);
    request.setRequestHeader("Content-type", "text/plain");
    request.send(JSON.stringify(params));
    document.getElementById('messages').textContent = "Loading... Please wait";
    document.getElementById('pdf_button').disabled = true;
}

function logOut(){
    user = {};
    getUserResponse = {};
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'userCompany=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    location.href = "/";
}