(function() {
"use strict";
var errorBox = document.getElementById('errorbox');
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var companyInput = document.getElementById('company-input');
var loginButton = document.getElementById('login-button');
var messageBox = document.getElementById('messages');
var tablePlaceholder = document.getElementById('table-placeholder'); //placeholder for retrieved data
var pdfButton = document.getElementById('pdf_button');

var loginHelper = new EsfLoginHelper();
var apiHelper = new EsfApiHelper();
var invoiceTable = new EsfTable(pdfButton, messageBox);

// on page load switch to main view if sessionId cookie exist
if (getCookie('sessionId')) {
    document.getElementById('user_company').textContent = getCookie('userCompany');
    switchToView('main');
    apiHelper.setSessionId(getCookie('sessionId'));
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

//switch between main and login view
function switchToView(view) {
    if (view === 'main') {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'block';
    } else if (view === 'login') {
        document.getElementById('login-view').style.display = 'block';
        document.getElementById('main-view').style.display = 'none';
    }
}

//do not let user click buttons while waiting for server response
function waitingForServer(on) {
    if (on) {
        messageBox.textContent = "Loading... Please wait";
        pdfButton.disabled = true;
        document.getElementById('search_button').disabled = true;
    } else {
        document.getElementById('search_button').disabled = false;
        messageBox.textContent = '';
    }
}

//provide certificate and get user ID, if certificate is valid
document.getElementById('certificate-input').addEventListener('change', function(evt) {
    errorBox.style.display = 'none';
    for (var i = companyInput.options.length; i-->0 ;) {
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

//get user's company info if password is correct
passwordInput.addEventListener('keyup', function(evt){
    if (evt.keyCode === 13) {
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
});

//get session ID and switch from login to main view
function login() {
    loginHelper.getSessionId(companyInput.value, function(err, sessionId) {
        if (err) {
            errorBox.textContent = err;
            errorBox.style.display = 'block';
        } else {
            passwordInput.value = null;
            loginHelper.password = null;
            errorBox.style.display = 'none';
            switchToView('main');
            document.getElementById('user_company').textContent = companyInput.options[companyInput.selectedIndex].innerHTML;
            setCookie('sessionId', sessionId, 30);
            setCookie('userCompany', companyInput.options[companyInput.selectedIndex].innerHTML, 30);
            apiHelper.setSessionId(sessionId);
        }
    });
}

//login when enter is pressed while company select is in focus
document.getElementById('company-input').addEventListener('keyup', function (evt) {
    if (evt.keyCode === 13) {
        login();
    }
});

//bind login function with login button
loginButton.addEventListener('click', login);

//query invoice and draw the result table
function queryInvoice() {
    //logout if session does not exist
    if (!getCookie('sessionId')) 
    {
        return logOut();
    }
    
    waitingForServer(true);
    
    var directions = document.getElementsByName('direction');
    var contragentTin = document.getElementById('company_id').value;
    var dateFrom = document.getElementById('date_from').value;
    var dateTo = document.getElementById('date_to').value;
    var invoiceStatusArray = [];
    var invoiceStatusCheckboxes = document.getElementsByName('invoice_status');
    var invoiceType = document.getElementById('invoice_type').value;
    
    //set params
    var params = {
        body: {
            sessionId: '',
            criteria: {
                direction: ''
            }
        }
    };
    for (var i = 0; i < directions.length; i++) {
        if (directions[i].checked) {
            params.body.criteria.direction = directions[i].value;
            break;
        }
    }
    if (contragentTin) params.body.criteria.contragentTin = contragentTin;
    if (dateFrom) {
        dateFrom = new Date(dateFrom);
        params.body.criteria.dateFrom = dateFrom; 
    }
    if (dateTo) {
        dateTo = new Date(dateTo);
        params.body.criteria.dateTo = dateTo; 
    }
    for (var i=0; i < invoiceStatusCheckboxes.length; i++){
        if (invoiceStatusCheckboxes[i].checked) {
            invoiceStatusArray.push(invoiceStatusCheckboxes[i].value);
        }
    }
    params.body.criteria.invoiceStatusList = {
        invoiceStatus: invoiceStatusArray
    }
    if (invoiceType) params.body.criteria.invoiceType = invoiceType;
    params.body.criteria.asc = false;
    
    apiHelper.queryInvoice(params, function(err, response) {
        waitingForServer(false);
        if (err) {
            tablePlaceholder.textContent = err;
            return;
        }
        if (response.invoiceInfoList) {
            invoiceTable.invoiceInfoList = response.invoiceInfoList.invoiceInfo;
            var invoiceTableElement = invoiceTable.getTable();
            while (tablePlaceholder.firstChild) {
                tablePlaceholder.removeChild(tablePlaceholder.firstChild);
            }
            tablePlaceholder.appendChild(invoiceTableElement);
        } else {
            tablePlaceholder.textContent = 'No invoice found';   
        }
    });
}
document.getElementById('search_button').addEventListener('click', queryInvoice);

function getPdf(){   
    //disable buttons and show loading message
    waitingForServer(true);
    
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
        waitingForServer(false);
        if (err) {
            messageBox.textContent = err;
            return;
        }
    });
}
document.getElementById('pdf_button').addEventListener('click', getPdf);

function logOut(){
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'userCompany=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    location.href = "/";
}
document.getElementById('logout_button').addEventListener('click', logOut);

//save column selection
function saveSettingsClick() {  
    var selectColumnCheckboxes = document.getElementsByName('select_columns');
    var columnsArray = [];
    for (var i = 0; i < selectColumnCheckboxes.length; i++) {
         if (selectColumnCheckboxes[i].checked) {
             columnsArray.push(selectColumnCheckboxes[i].value);
         }
    }
    invoiceTable.selectedColumns = columnsArray;
    while (tablePlaceholder.firstChild) {
        tablePlaceholder.removeChild(tablePlaceholder.firstChild);
    }
    if (invoiceTable.invoiceInfoList) {   
        tablePlaceholder.appendChild(invoiceTable.getTable());
    }
    
}

//show column selection panel
document.getElementById('settings-button').addEventListener('click', function() {
    while (tablePlaceholder.firstChild) {
        tablePlaceholder.removeChild(tablePlaceholder.firstChild);
    }
    tablePlaceholder.appendChild(invoiceTable.getSettingsPanel());
    document.getElementById('save-settings-button').addEventListener('click', saveSettingsClick);
});
}());