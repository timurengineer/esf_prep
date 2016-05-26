"use strict";

module.exports = function esfObjectToHtml(invoiceInfo){
    var additional_invoice_checkmark = '';
    var additional_invoice_num = '';
    var additional_invoice_date = '';
    var additional_invoice_reg_num = '';
    var fixed_invoice_checkmark = '';
    var fixed_invoice_num = '';
    var fixed_invoice_date = '';
    var fixed_invoice_reg_num = '';
    if (invoiceInfo.invoice.invoiceType === "ADDITIONAL_INVOICE") {
        additional_invoice_checkmark = '&#x2713;';
        additional_invoice_num = invoiceInfo.invoice.relatedInvoice.num;
        additional_invoice_date = invoiceInfo.invoice.relatedInvoice.date;
        additional_invoice_reg_num = invoiceInfo.invoice.relatedInvoice.registrationNumber;
    } else if (invoiceInfo.invoice.invoiceType === "FIXED_INVOICE"){
        fixed_invoice_checkmark = '&#x2713;';
        fixed_invoice_num = invoiceInfo.invoice.relatedInvoice.num;
        fixed_invoice_date = invoiceInfo.invoice.relatedInvoice.date;
        fixed_invoice_reg_num = invoiceInfo.invoice.relatedInvoice.registrationNumber;
    };

    var esf_html_start = 
    '<!DOCTYPE html>\
    <html lang="ru"><head>\
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
        <meta name="viewport" content="width=device-width, initial-scale=1.0">\
        <title>Информационная Система Электронных Счетов-Фактур</title>\
        <link rel="stylesheet" href="file://' + __dirname + '/print.css">\
    </head>\
    <body class="print-bg">\
    <div class="print-page">\
    <div class="sector_title_big">СЧЕТ-ФАКТУРА</div>';

    var esf_html_end = '</div></body></html>';

    var esf_section_a =
            '<!-- Section A -->\
            <div class="sectionContainer first_section">\
                <h3>Раздел А. Общий раздел</h3>\
                <div>\
                    <table border="0">\
                        <tbody>\
                        <tr>\
                            <td>\
                                <b>1.</b><span class="field-name bold">Регистрационный номер</span><span class="field-value">' + invoiceInfo.registrationNumber + '</span>\
                            </td>\
                            <td>\
                                <b>1.1.</b><span class="field-name bold">Номер учетной системы</span><span class="field-value">'+ invoiceInfo.invoice.num +'</span>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td style="width:50%;">\
                                <b>2.</b><span class="field-name bold">Дата выписки</span>\
                                <span class="field-value">'+ invoiceInfo.invoice.date +'</span>\
                            </td>\
                            <td>\
                                <b>3.</b><span class="field-name bold">Дата совершения оборота</span>\
                                <span class="field-value">'+ invoiceInfo.invoice.turnoverDate +'</span>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td>\
                                <!-- исправленный -->\
                                <table class="no_border_table">\
                                    <tbody><tr>\
                                        <td class="first_td">\
                                            <b>4.</b><span class="field-name">Исправленный</span>\
                                            <span class="field-value">'+ fixed_invoice_checkmark +'</span>\
                                            </span>\
                                        </td>\
                                        <td>\
                                            <b>4.1</b><span class="field-name">Дата</span>\
                                            <span class="field-value">'+ fixed_invoice_date +'</span>\
                                        </td>\
                                    </tr>\
                                    <tr>\
                                        <td class="first_td">\
                                            <b>4.2</b><span class="field-name">Номер</span>\
                                            <span class="field-value">'+ fixed_invoice_num +'</span>\
                                        </td>\
                                        <td>\
                                            <b>4.3</b><span class="field-name">Регистрационный номер</span>\
                                            <span class="field-value">'+ fixed_invoice_reg_num +'</span>\
                                        </td>\
                                    </tr>\
                                </tbody></table>\
                            </td>\
                            <td>\
                                <!-- допольнительный -->\
                                <table class="no_border_table">\
                                    <tbody>\
                                        <tr>\
                                            <td class="first_td">\
                                                <b>5.</b><span class="field-name">Дополнительный</span>\
                                                <span class="field-value">'+ additional_invoice_checkmark +'</span>\
                                                </span>\
                                            </td>\
                                            <td>\
                                                <b>5.1</b><span class="field-name">Дата</span><span class="field-value">'+ additional_invoice_date +'</span>\
                                            </td>\
                                        </tr>\
                                        <tr>\
                                            <td class="first_td">\
                                                <b>5.2</b><span class="field-name">Номер</span><span class="field-value">'+  additional_invoice_num+'</span>\
                                            </td>\
                                            <td>\
                                                <b>5.3</b><span class="field-name">Регистрационный номер</span><span class="field-value">'+ additional_invoice_reg_num +'</span>\
                                            </td>\
                                        </tr>\
                                    </tbody>\
                                </table>\
                            </td>\
                        </tr>\
                        </tbody>\
                    </table>\
                </div>\
            </div>';
    var esf_section_b =
        '<!-- Section B -->\
        <div class="sectionContainer">\
            <h3>Раздел B. Реквизиты поставщика</h3>\
            <div>\
                <table class="container" border="0">\
                    <tbody><tr>\
                        <td style="width:55%;">\
                            <table class="no_border_table">\
                                <tbody><tr>\
                                    <td class="first_td">\
                                        <b>6.</b><span class="field-name">ИИН/БИН</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].tin || '') +'</span>\
                                    </td>\
                                    <td>\
                                        <b>6.1</b><span class="field-name">РНН реорганизованного лица</span><span class="field-value"></span>\
                                    </td>\
                                </tr>\
                            </tbody></table>\
                        </td>\
                        <td rowspan="4">\
                            <b>10.</b><span class="field-name">Категория поставщика</span>\
                            <ul class="select">\
                                <!--<li>Комитент</li>-->\
                                <li class="clearfix"><div class="status_letter">A</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Комитент</label></li>\
                                <li class="clearfix"><div class="status_letter">B</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Комиссионер</label></li>\
                                <li class="clearfix"><div class="status_letter">C</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Экспедитор</label></li>\
                                <li class="clearfix"><div class="status_letter">D</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Лизингодатель</label></li>\
                                <li class="clearfix"><div class="status_letter">E</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Участник договора о совместной деятельности</label></li>\
                                <li class="clearfix"><div class="status_letter">F</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Экспортер или участник СРП</label></li>\
                            </ul>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>7.</b><span class="field-name">Поставщик</span><span class="field-value">'+ invoiceInfo.invoice.sellers.seller[0].name +'</span>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>8.</b><span class="field-name">Адрес места нахождения</span><span class="field-value">'+ invoiceInfo.invoice.sellers.seller[0].address +'</span>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>9.</b><span class="field-name">Свидетельство плательщика НДС:</span><br>\
                            <b>9.1.</b><span class="field-name">серия</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].certificateSeries || '') +'</span><br>\
                            <b>9.2.</b><span class="field-name">Номер</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].certificateNum || '') +'</span>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>11.</b><span class="field-name">Документы, подтверждающие поставку товаров, работ, услуг:</span><br>\
                            <b>11.1.</b><span class="field-name">Номер</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].deliveryDocNum || '') +'</span><br>\
                            <b>11.2.</b><span class="field-name">Дата</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].deliveryDocDate || '') +'</span>\
                        </td>\
                        <td>\
                            <b>12.</b><span class="field-name">Дополнительные сведения</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].trailer || '') +'</span>\
                        </td>\
                    </tr>\
                </tbody></table>\
                <table>\
                    <tbody><tr>\
                        <td style="width:50%">\
                            <b>13.</b><span class="field-name">КБе</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].kbe || '') +'</span>\
                        </td>\
                        <td>\
                            <b>14.</b><span class="field-name">ИИК</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].iik || '') +'</span>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>15.</b><span class="field-name">БИК</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].bik || '') +'</span>\
                        </td>\
                        <td>\
                            <b>16.</b><span class="field-name">Наименование банка</span><span class="field-value">'+ (invoiceInfo.invoice.sellers.seller[0].bank || '') +'</span>\
                        </td>\
                    </tr>\
                </tbody></table>\
            </div>\
        </div>';

        var esf_section_c = 
            '<!-- Section C -->\
            <div class="sectionContainer">\
                <h3>Раздел C. Реквизиты получателя</h3>\
                <div>\
                    <table border="0">\
                        <tbody><tr>\
                            <td style="width:55%">\
                                <table class="no_border_table">\
                                    <tbody><tr>\
                                        <td class="first_td display_none">\
                                            <b>17.</b><span class="field-name">Страна</span><span class="field-value"></span>\
                                        </td>\
                                        <td class="first_td ">\
                                            <b>17.</b><span class="field-name">ИИН/БИН</span><span class="field-value">'+ (invoiceInfo.invoice.customers.customer[0].tin || '') +'</span>\
                                        </td>\
                                        <td>\
                                            <b>17.1</b><span class="field-name">РНН реорганизованного лица</span><span class="field-value"></span>\
                                        </td>\
                                    </tr>\
                                </tbody></table>\
                            </td>\
                            <td rowspan="4">\
                                <b>21.</b><span class="field-name">Категория получателя</span>\
                                <ul class="select">\
                                    <li class="clearfix"><div class="status_letter">A</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Комитент</label></li>\
                                    <li class="clearfix"><div class="status_letter">B</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Комиссионер</label></li>\
                                    <li class="clearfix"><div class="status_letter">C</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Лизингополучатель</label></li>\
                                    <li class="clearfix"><div class="status_letter">D</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Участник договора о совместной деятельности</label></li>\
                                    <li class="clearfix"><div class="status_letter">E</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Государственное учреждение</label></li>\
                                    <li class="clearfix"><div class="status_letter">F</div><input class="status_input" onclick="return false" onkeydown="return false" type="checkbox"><label class="status_label">Нерезидент/розница</label></li>\
                                    <!--<li class="clearfix"><div class="status_letter">G</div><input class="status_input" type="checkbox" onclick="return false" onkeydown="return false" /><label class="status_label">Физическое лицо</label></label></li>-->\
                                </ul>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td>\
                                <b>18.</b><span class="field-name">Получатель</span><span class="field-value">'+ (invoiceInfo.invoice.customers.customer[0].name || '') +'</span>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td>\
                                <b>19.</b><span class="field-name">Адрес места нахождения</span><span class="field-value">'+ (invoiceInfo.invoice.customers.customer[0].address || '') +'</span>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td>\
                                <b>20.</b><span class="field-name">Дополнительные сведения</span><span class="field-value">'+ (invoiceInfo.invoice.customers.customer[0].trailer || '') +'</span>\
                            </td>\
                        </tr>\
                    </tbody></table>\
                </div>\
            </div>';

        var esf_section_d = '';
        try {
            esf_section_d = 
                '<!-- Section D -->\
                <div class="sectionContainer">\
                    <h3>Раздел D. Реквизиты грузоотправителя и грузополучателя</h3>\
                    <div>\
                        <table border="0">\
                            <tbody><tr>\
                                <td>\
                                    <b>22.</b><span class="field-name">Грузоотправитель</span><br>\
                                    <b>22.1</b><span class="field-name">ИИН/БИН</span><span class="field-value">'+ (invoiceInfo.invoice.consignor.tin || '') +'</span><br>\
                                    <b>22.2</b><span class="field-name">Наименование</span><span class="field-value">'+ (invoiceInfo.invoice.consignor.name || '') +'</span><br>\
                                    <b>22.3</b><span class="field-name">Адрес отправки</span><span class="field-value">'+ (invoiceInfo.invoice.consignor.address || '') +'</span><br>\
                                </td>\
                                <td style="width:50%;">\
                                    <b>23.</b><span class="field-name">Грузополучатель</span><br>\
                                    <b>23.1</b><span class="field-name">ИИН/БИН</span><span class="field-value">'+ (invoiceInfo.invoice.consignee.tin || '') +'</span><br>\
                                    <b>23.2</b><span class="field-name">Наименование</span><span class="field-value">'+ (invoiceInfo.invoice.consignee.name || '') +'</span><br>\
                                    <b>23.3</b><span class="field-name">Адрес доставки</span><span class="field-value">'+ (invoiceInfo.invoice.consignee.address || '') +'</span><br>\
                                </td>\
                            </tr>\
                        </tbody></table>\
                    </div>\
                </div>';
        } catch(err){
              console.log("YO",err)
        }

        var esf_section_e = '';
        try {
            esf_section_e =
        '<!-- Section E -->\
        <div class="sectionContainer">\
            <h3 class="section_customers">Раздел E. Условия поставки</h3>\
            <div>\
                <table border="0">\
                    <tbody><tr>\
                        <td style="width:50%;">\
                            <b>24</b><span class="field-name">Договор (контракт) на поставку товаров, работ, услуг</span><br>\
                            <b>24.1</b><span class="field-name">Номер</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.contractNum || '') +'</span><br>\
                            <b>24.2</b><span class="field-name">Дата</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.contractDate || '') +'</span>\
                        </td>\
                        <td>\
                            <b>27</b><span class="field-name">Поставка товаров осуществлена по доверенности</span><br>\
                            <b>27.1</b><span class="field-name">Номер</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.warrant || '') +'</span><br>\
                            <b>27.2</b><span class="field-name">Дата</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.warrantDate || '') +'</span>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>25.</b><span class="field-name">Условия оплаты по договору</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.term || '') +'</span>\
                        </td>\
                        <td rowspan="2">\
                            <b>28.</b><span class="field-name">Пункт назначения</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.destination || '') +'</span>\
                        </td>\
                    </tr>\
                    <tr>\
                        <td>\
                            <b>26.</b><span class="field-name">Способ отправления</span><span class="field-value">'+ (invoiceInfo.invoice.deliveryTerm.exerciseWay || '') +'</span>\
                        </td>\
                    </tr>\
                </tbody></table>\
            </div>\
        </div>';
        } catch(err){
              console.log("YO",err)
        }

        var esf_section_g_header = 
        '<!-- Section G -->\
        <div class="sectionContainer">\
            <h3 class="section_product">Раздел G. Данные&nbsp;по&nbsp;товарам, работам,&nbsp;услугам</h3>\
            <div>\
                <table class="kursTable" border="0">\
                    <tbody><tr>\
                        <td style="width:100px;">\
                            <b>33.</b>\
                        </td>\
                        <td style="width:50%;">\
                            <b>33.1</b><span class="field-name">Код валюты</span>\
                            <span class="field-value">\
                                KZT\
                            </span>\
                        </td>\
                        <td>\
                            <b>33.2</b><span class="field-name">Курс валюты</span><span class="field-value"></span>\
                        </td>\
                    </tr>\
                </tbody></table>\
                <table class="ServiceTable" border="0">\
                    <thead>\
                        <tr>\
                            <th rowspan="2">№ п/п</th>\
                            <th rowspan="2">Наименование товаров, работ, услуг</th>\
                            <th rowspan="2">Код товара (ТН ВЭД)</th>\
                            <th rowspan="2">Ед. изм.</th>\
                            <th rowspan="2">Кол-во (объем)</th>\
                            <th rowspan="2">Цена (тариф) за единицу товара, работы, услуги без косвенных налогов</th>\
                            <th rowspan="2">Стоимость товаров, работ, услуг без косвенных налогов</th>\
                            <th colspan="2">Акциз</th>\
                            <th rowspan="2">Размер оборота по реализации (облагаемый/необлагаемый оборот)</th>\
                            <th colspan="2">НДС</th>\
                            <th rowspan="2">Стоимость товаров, работ, услуг с учетом косвенных налогов</th>\
                            <th rowspan="2">№ заявления в рамках ТС или Декларации на товары</th>\
                            <th rowspan="2">Дополнительные данные</th>\
                        </tr>\
                        <tr>\
                            <th>Ставка</th>\
                            <th>Сумма</th>\
                            <th>Ставка</th>\
                            <th>Сумма</th>\
                        </tr>\
                    </thead>\
                    <tbody><tr>\
                        <td class="num-cell">1</td>\
                        <td class="num-cell">2</td>\
                        <td class="num-cell">3</td>\
                        <td class="num-cell">4</td>\
                        <td class="num-cell">5</td>\
                        <td class="num-cell">6</td>\
                        <td class="num-cell">7</td>\
                        <td class="num-cell">8</td>\
                        <td class="num-cell">9</td>\
                        <td class="num-cell">10</td>\
                        <td class="num-cell">11</td>\
                        <td class="num-cell">12</td>\
                        <td class="num-cell">13</td>\
                        <td class="num-cell">14</td>\
                        <td class="num-cell">15</td>\
                    </tr>';

        var esf_section_g_body = '';
        try {
            for (var j = 0; j < invoiceInfo.invoice.productSet.product.length; j++) {
                esf_section_g_body = esf_section_g_body + 
                '<tr class="service_grid">\
                <td class="first" value="'+ (j+1) +'">'+ (j+1) +'</td>\
                <td class="long" style="width: 200px;"><span>'+ (invoiceInfo.invoice.productSet.product[j].description || '') +'</span></td>\
                <td class="long"><span>'+ (invoiceInfo.invoice.productSet.product[j].unitCode || '') +'</span></td>\
                <td><span>'+ (invoiceInfo.invoice.productSet.product[j].unitNomenclature || '') +'</span></td>\
                <td><span>'+ (invoiceInfo.invoice.productSet.product[j].quantity || '') +'</span></td>\
                <td><span>'+ (invoiceInfo.invoice.productSet.product[j].unitPrice || '') +'</span></td>\
                <td>\
                    <span class="calculable" data-field="priceWithoutTax">'+ (invoiceInfo.invoice.productSet.product[j].priceWithoutTax || '') +'</span>\
                </td>\
                <td>\
                    <span>'+ (invoiceInfo.invoice.productSet.product[j].exciseRate || '') +'</span>\
                </td>\
                <td>\
                    <span class="calculable" data-field="exciseAmount">'+ (invoiceInfo.invoice.productSet.product[j].exciseAmount || '') +'</span>\
                </td>\
                <td>\
                    <span class="calculable" data-field="turnoverSize">'+ (invoiceInfo.invoice.productSet.product[j].turnoverSize || '') +'</span>\
                </td>\
                <td>\
                    <span>'+ (invoiceInfo.invoice.productSet.product[j].ndsRate || '') +'%</span>\
                </td>\
                <td>\
                    <span class="calculable" data-field="ndsAmount">'+ (invoiceInfo.invoice.productSet.product[j].ndsAmount || '') +'</span>\
                </td>\
                <td>\
                    <span class="calculable" data-field="priceWithTax">'+ (invoiceInfo.invoice.productSet.product[j].priceWithTax || '') +'</span>\
                </td>\
                <td class="long"><span>'+ (invoiceInfo.invoice.productSet.product[j].applicationNumberInCustomsUnion || '') +'</span></td>\
                <td class="long"><span>'+ (invoiceInfo.invoice.productSet.product[j].additional || '') +'</span></td>\
            </tr>'
                
            }
        } catch(err){
              console.log("YO",err)
        }
        
        var esf_section_g_footer ='';
        try {
        var esf_section_g_footer = 
                '<tr class="totalRow">\
                        <td></td>\
                        <td></td>\
                        <td colspan="4" style="text-align: right;">Всего по счету:</td>\
                        <!--<td></td>-->\
                        <!--<td></td>-->\
                        <!--<td></td>-->\
                        <td class="priceWithoutTax">'+ (invoiceInfo.invoice.productSet.totalPriceWithoutTax || '') +'</td>\
                        <td></td>\
                        <td class="exciseAmount">'+ (invoiceInfo.invoice.productSet.totalExciseAmount || '') +'</td>\
                        <td class="turnoverSize">'+ (invoiceInfo.invoice.productSet.totalTurnoverSize || '') +'</td>\
                        <td></td>\
                        <td class="ndsAmount">'+ (invoiceInfo.invoice.productSet.totalNdsAmount || '') +'</td>\
                        <td class="priceWithTax">'+ (invoiceInfo.invoice.productSet.totalPriceWithTax || '') +'</td>\
                        <td></td>\
                        <td></td>\
                    </tr>\
                </tbody></table>\
            </div>\
        </div>';
        } catch(err){
              console.log("YO",err)
        }

        var esf_section_j ='';
        try {
        var esf_section_j = 
        '<!-- Section J -->\
        <div class="sectionContainer">\
            <h3>Раздел J. Сведения по ЭЦП</h3>\
            <div>\
                <table border="0">\
                    <tbody><tr>\
                        <td>\
                            <table class="j-table" border="0">\
                               <tbody><tr>\
                                   <td style="width:50%;"><b>36.</b><span class="field-name bold">ЭЦП юридического лица (структурного подразделения юридического лица) или индивидуального предпринимателя</span></td>\
                                   <td style="width:30%;"><p></p></td>\
                                   <td style="width:20%; text-align: center" rowspan="2">М.П.</td>\
                               </tr>\
                                <tr>\
                                    <td><b>37.</b><span class="field-name bold">ЭЦП лица, уполномоченного подписывать счета-фактуры</span></td>\
                                    <td><p>'+ (invoiceInfo.invoice.signature || '') +'</p></td>\
                                </tr>\
                                <tr>\
                                    <td><b>38.</b><span class="field-name bold">Ф.И.О. лица, уполномоченного подписывать счета-фактуры</span></td>\
                                    <td><p>'+ (invoiceInfo.invoice.operatorFullname || '') +'</p></td>\
                                </tr>\
                            </tbody></table>\
                        </td>\
                    </tr>\
                </tbody></table>\
            </div>\
        </div>';
        } catch(err){
              console.log("YO",err)
        }
    return esf_html_start + esf_section_a + esf_section_b + esf_section_c+ esf_section_d + esf_section_e + esf_section_g_header + esf_section_g_body + esf_section_g_footer + esf_section_j + esf_html_end;
};