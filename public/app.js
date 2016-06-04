;"use strict";
var errorBox = document.getElementById('errorbox');
var certificateInput = document.getElementById("certificate-input");
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var companyInput = document.getElementById('company-input');
var loginButton = document.getElementById('login-button');
var loginHelper = new EsfLogin();
var apiHelper = new ApiHelper();

(function() {
    var sessionId = getCookie('sessionId');
    if (sessionId) {
        document.getElementById('user_company').textContent = getCookie('userCompany');
        document.getElementById('login_page').style.display = 'none';
        document.getElementById('app_page').style.display = 'block';
        apiHelper.setSessionId(sessionId);
    }
})();

function onGoogleSignIn(user) {
  var profile = user.getBasicProfile();
  document.getElementById('gname').textContent = profile.getName();
  document.getElementById('gemail').textContent = profile.getEmail();
}

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

certificateInput.focus();

//provide certificate and get user ID, if certificate is valid
certificateInput.addEventListener('change', function(evt){
    errorBox.style.display = 'none';
    for (var i=companyInput.options.length; i-->0 ;) {
        companyInput.options[i] = null;
    }
    companyInput.disabled = true;
    loginButton.disabled = true;
    var certFile = evt.target.files[0];
    if (certFile) loginHelper.readCert(certFile, function(err, userId) {
        if (err) {
            usernameInput.value = null;
            passwordInput.disabled = true;
            errorBox.textContent = err;
            errorBox.style.display = 'block';
        } else {
            usernameInput.value = userId;
            passwordInput.disabled = false;
            passwordInput.value = null;
            passwordInput.focus();
        }
    });
}, false);

//provide password and get user's company info if password is correct
function passKeyPressed(evt){
    if (evt.keyCode === 13){
        passwordInput.disabled = true;
        document.getElementById('loading').style.display = 'inline';
        
        loginHelper.getCompanyList(passwordInput.value, function(err, userCompanyList) {
            document.getElementById('loading').style.display = 'none';
            if (err) {
                passwordInput.disabled = false;
                errorBox.textContent = err;
                errorBox.style.display = 'block';
                passwordInput.focus();
            } else {
                errorBox.style.display = 'none';
                for (var i=0; i < userCompanyList.length; i++) {
                    var opt = document.createElement('option');
                    opt.value = userCompanyList[i].id;
                    opt.innerHTML = userCompanyList[i].name
                    companyInput.appendChild(opt);
                }
                companyInput.disabled = false;
                loginButton.disabled = false;
                companyInput.focus();
            }
        });
    }
}

//get session ID and switch from login to working mode
function logIn(){
    loginHelper.getSessionId(companyInput.value, function(err, sessionId) {
        if (err) {
            errorBox.textContent = err;
            errorBox.style.display = 'block';
        } else {
            passwordInput.value = null;
            delete loginHelper;
            errorBox.style.display = 'none';
            document.getElementById('login_page').style.display = 'none';
            document.getElementById('app_page').style.display = 'block';
            document.getElementById('user_company').textContent = companyInput.options[companyInput.selectedIndex].innerHTML;
            setCookie('sessionId', sessionId, 30);
            setCookie('userCompany', companyInput.options[companyInput.selectedIndex].innerHTML, 30);
            apiHelper.setSessionId(sessionId);
        }
    });
}

function queryInvoice() {
    if (!getCookie('sessionId')) 
    {
        return logOut();
    }
    
    document.getElementById('table_content').innerHTML = '';
    document.getElementById('messages').textContent = "Loading... Please wait";
    
    var params = {
        body: {
            sessionId: '',
            criteria: {
                direction: ''
            }
        }
    };
    var directions = document.getElementsByName('direction');
    var length = directions.length;
    for (var i = 0; i < length; i++) {
        if (directions[i].checked) {
            params.body.criteria.direction = directions[i].value;
            break;
        }
    }
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
    params.body.criteria.invoiceStatusList = {
        invoiceStatus: invoiceStatusArray
    }
    var invoiceType = document.getElementById('invoice_type').value;
    if (invoiceType) params.body.criteria.invoiceType = invoiceType;
    params.body.criteria.asc = false;
    
    apiHelper.queryInvoice(params, function(err, response) {
        document.getElementById('messages').textContent = "";
        var tableContent = document.getElementById('table_content');
        if (err) {
            tableContent.textContent = err;
            return;
        }
        if (response.invoiceInfoList) {
            var invoiceTable = new EsfTable(response.invoiceInfoList.invoiceInfo);
            tableContent.appendChild(invoiceTable.getTable([
                'regNumber',
                'sellerId',
                'sellerName',
                'type',
                'status',
                'currency',
                'totalWithTax'
            ]));
        } else {
            tableContent.textContent = 'No invoice found';   
        }
    });
}

function getPdf(){
    document.getElementById('messages').textContent = "Loading... Please wait";
    document.getElementById('pdf_button').disabled = true;
    document.getElementById('search_button').disabled = true;
    
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
    
    apiHelper.getPdf(params, function(err) {
        document.getElementById('pdf_button').disabled = false;
        document.getElementById('search_button').disabled = false;
        var messageBox = document.getElementById('messages');
        messageBox.textContent = '';
        if (err) {
            messageBox.textContent = err;
            return;
        }
    });
}

function logOut(){
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'userCompany=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    location.href = "/";
}

function ajaxCall(url, params, onload) {
    var request = new XMLHttpRequest();
    request.onload = function () {
        if (request.status == 200) {
            var response = JSON.parse(request.responseText);
            onload(null, response);
        } else {
            onload(request);
        }
    };
    request.onerror = function(){
        errorBox.textContent = "Status: " + request.status + ". Response text: " + request.responseText;
        errorBox.style.display = 'block';  
    };
    request.open("POST", url, true);
    request.setRequestHeader("Content-type", "text/plain");
    request.send(JSON.stringify(params));
}