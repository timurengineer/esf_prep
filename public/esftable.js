(function(global) {
    
    var EsfTable = function(invoiceInfoList) {
        this.invoiceInfoList = invoiceInfoList;
    }
    
    var handleCheckboxClick = function() {
        var checkboxes = document.getElementsByName('invoice_checkbox');
        var count = 0;
        for(var i=0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked){
                count++;
            };
        }
        if (count < 251 && count > 1){
            document.getElementById('messages').textContent = count + ' invoices selected';
            document.getElementById('pdf_button').disabled = false;
        } else if (count === 1) {
            document.getElementById('messages').textContent = count + ' invoice selected';
            document.getElementById('pdf_button').disabled = false;
        } else if (count > 250) {
            document.getElementById('messages').textContent = count + ' invoices selected. Cannot export more that 250 invoices at a time.';
            document.getElementById('pdf_button').disabled = true;
        } else {
            document.getElementById('messages').textContent = '';
            document.getElementById('pdf_button').disabled = true;
        }
    };
    
    EsfTable.prototype = {
        getTable: function(selectedColumns) {
            
            var tbl = document.createElement('table');
            tbl.className = 'table table-hover table-condensed';

            //table header
            var thead = document.createElement('thead');
            var tr = document.createElement('tr');
            var th = document.createElement('th');
            var chkbox = document.createElement('input');
            chkbox.type = 'checkbox';
            chkbox.name = 'checkall_checkbox';
            chkbox.onclick = function() {
                var checkboxes = document.getElementsByName('invoice_checkbox');
                for(var i=0; i < checkboxes.length; i++) {
                    checkboxes[i].checked = this.checked;
                }
                handleCheckboxClick();
            };
            th.appendChild(chkbox);
            tr.appendChild(th);
            for (var i=0; i<selectedColumns.length; i++){
                th = document.createElement('th');
                if (columns[selectedColumns[i]].class) th.className = columns[selectedColumns[i]].class;
                th.appendChild(document.createTextNode(columns[selectedColumns[i]].header));
                tr.appendChild(th);
            }
            thead.appendChild(tr);

            //table body
            var tbdy = document.createElement('tbody');
            var length = this.invoiceInfoList.length;
            for (var i = 0; i < length; i++) {
                var tr = document.createElement('tr');
                var td = document.createElement('td');
                td.appendChild(columns['checkbox'].getValue(this.invoiceInfoList[i]));
                tr.appendChild(td);
                for (var j=0; j < selectedColumns.length; j++){
                    td = document.createElement('td');
                    if (columns[selectedColumns[j]].class) td.className = columns[selectedColumns[j]].class;
                    if (columns[selectedColumns[j]].attr) td.setAttribute(columns[selectedColumns[j]].attr.name, columns[selectedColumns[j]].attr.value)
                    td.appendChild(document.createTextNode(columns[selectedColumns[j]].getValue(this.invoiceInfoList[i])));
                    tr.appendChild(td);
                }
                tbdy.appendChild(tr);
            }

            tbl.appendChild(thead);
            tbl.appendChild(tbdy);
            return tbl;
        }
    };
    
    var columns = {
        checkbox: {
            header: '',
            getValue: function(invL){
                var chkbox = document.createElement('input');
                chkbox.type = 'checkbox';
                chkbox.name = 'invoice_checkbox';
                chkbox.value = invL.invoiceId;
                chkbox.onclick = handleCheckboxClick;
                return chkbox;
            }
        },
        regNumber: {
            header: 'Registration Number',
            attr: {
                name: 'nowrap',
                value: 'nowrap'
            },
            getValue: function(invL){
                return invL.registrationNumber;
            }
        },
        sellerId: {
            header: 'Seller ID',
            getValue: function (invL){
                return invL.invoice.sellers.seller[0].tin;
            }
        },
        sellerName: {
            header: 'Seller name',
            getValue: function (invL){
                return invL.invoice.sellers.seller[0].name;
            }
        },
        type: {
            header: 'Type',
            getValue: function(invL){
                return invL.invoice.invoiceType.replace(/_INVOICE/,'');
            }
        },
        status: {
            header: 'Status',
            getValue: function(invL){
                return invL.invoiceStatus;
            }
        },
        currency: {
            header: 'Curency',
            getValue: function(invL){
                return invL.invoice.productSet.currencyCode;
            }
        },
        totalWithTax: {
            header: 'Total (incl. Tax)',
            class: 'number-cell',
            getValue: function(invL){
                return parseFloat(invL.invoice.productSet.totalPriceWithTax).toFixed(2);
            }
        }
    }
    
    global.EsfTable = EsfTable;
    
}(window));