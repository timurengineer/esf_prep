(function(global) {
    
    var EsfTable = function(pdfButton, messageBox) {
        var self = this;
        self.invoiceInfoList = null;
        self.pdfButton = pdfButton;
        self.messageBox = messageBox;
        self.selectedColumns = [
            'regNumber',
            'sellerId',
            'sellerName',
            'type',
            'status',
            'currency',
            'totalWithTax'
        ];
    }
    
    var updateSelectedCount = function(pdfButton, messageBox) {
        var checkboxes = document.getElementsByName('invoice_checkbox');
        var count = 0;
        for(var i=0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked){
                count++;
            };
        }
        if (count < 251 && count > 1){
            messageBox.textContent = count + ' invoices selected';
            pdfButton.disabled = false;
        } else if (count === 1) {
            messageBox.textContent = count + ' invoice selected';
            pdfButton.disabled = false;
        } else if (count > 250) {
            messageBox.textContent = count + ' invoices selected. Cannot export more that 250 invoices at a time.';
            pdfButton.disabled = true;
        } else {
            messageBox.textContent = '';
            pdfButton.disabled = true;
        }
    };
    
    EsfTable.prototype = {
        getTable: function() {
            var self = this;
            var selectedColumns = self.selectedColumns;
            var tbl = document.createElement('table');
            tbl.className = 'table table-hover table-condensed';

            //table header
            var thead = document.createElement('thead');
            var tr = document.createElement('tr');
            var th = document.createElement('th');
            var chkbox = document.createElement('input');
            chkbox.type = 'checkbox';
            chkbox.name = 'checkall_checkbox';
            chkbox.addEventListener('click', function() {
                var checkboxes = document.getElementsByName('invoice_checkbox');
                for(var i=0; i < checkboxes.length; i++) {
                    checkboxes[i].checked = this.checked;
                }
                updateSelectedCount(self.pdfButton, self.messageBox);
            });
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
            var length = self.invoiceInfoList.length;
            for (var i = 0; i < length; i++) {
                var tr = document.createElement('tr');
                var td = document.createElement('td');
                var chkbox = document.createElement('input');
                chkbox.type = 'checkbox';
                chkbox.name = 'invoice_checkbox';
                chkbox.value = self.invoiceInfoList[i].invoiceId;
                chkbox.addEventListener('click', function() {
                    updateSelectedCount(self.pdfButton, self.messageBox);
                })
                td.appendChild(chkbox);
                tr.appendChild(td);
                for (var j=0; j < selectedColumns.length; j++){
                    td = document.createElement('td');
                    if (columns[selectedColumns[j]].class) td.className = columns[selectedColumns[j]].class;
                    if (columns[selectedColumns[j]].attr) td.setAttribute(columns[selectedColumns[j]].attr.name, columns[selectedColumns[j]].attr.value)
                    td.appendChild(document.createTextNode(columns[selectedColumns[j]].getValue(self.invoiceInfoList[i])));
                    tr.appendChild(td);
                }
                tbdy.appendChild(tr);
            }

            tbl.appendChild(thead);
            tbl.appendChild(tbdy);
            return tbl;
        },
        getSettingsPanel: function() {
            var self = this;
            var settingsPanel = document.createElement('div');
            var heading = document.createElement('h3');
            heading.textContent = 'Select columns';
            settingsPanel.appendChild(heading);
            var saveButton = document.createElement('button');
            saveButton.type = 'button';
            saveButton.className = 'btn  btn-primary';
            saveButton.id = 'save-settings-button';
            saveButton.textContent = 'Save Changes';
            
            for (var column in columns) {
                var chkboxDiv = document.createElement('div');
                chkboxDiv.className = 'checkbox';
                var chkboxLabel = document.createElement('label');
                var chkbox = document.createElement('input');
                chkbox.type = 'checkbox';
                chkbox.name = 'select_columns';
                chkbox.value = column;
                if (self.selectedColumns.indexOf(column) !== -1) {
                    chkbox.checked = true;   
                }
                chkboxLabel.appendChild(chkbox);
                var text = document.createTextNode(columns[column].header);
                chkboxLabel.appendChild(text);
                chkboxDiv.appendChild(chkboxLabel);
                settingsPanel.appendChild(chkboxDiv);
            }
            settingsPanel.appendChild(saveButton);
            return settingsPanel;
        }
    };
    
    var columns = {
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
        customerId: {
            header: 'Customer ID',
            getValue: function (invL){
                return invL.invoice.customers.customer[0].tin;
            }
        },
        customerName: {
            header: 'Customer name',
            getValue: function (invL){
                return invL.invoice.customers.customer[0].name;
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