/**
 * Copyright (c) 2021 Catalyst Tech Corp
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Catalyst Tech Corp. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Catalyst Tech.
 *
 * Description: Search invoice by date filter, update date and send email
 * Script Name: CTC SL GM Report
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @Description Post Time Suitelet
 *
 * CHANGELOGS
 *
 * Version    Date                Author                   Remarks
 * 1.00      Nov 06, 2023        karaneta@nscatalyst.com      Initial Build
 *
 */
var filter_ids = ['custpage_filter_datefrom', 'custpage_filter_dateto', 'custpage_filter_subd'];
var cs_path = 'SuiteScripts/CTC.NaturalTrade/CTC.SS2/CTC GM Report/CTC_CS_GMReport.js';

define(['N/log', 'N/ui/serverWidget', 'N/search', 'N/runtime', 'N/task', 'N/format','SuiteScripts/CTC.NaturalTrade/CTC.SS2/CTC GM Report/GMReport_lib.js'],
    function (log, serverWidget, search, runtime, task, format, gmreplib) {
        'use strict';

        /**
         * @memberOf ${moduleName}
         * @param {Object} context
         **/
        function onRequest(context) {
            var stLogTitle = 'onRequest';
            var stRequestMethod = context.request.method;
            log.debug({
                title: stLogTitle,
                details: '------------> Script entry | ' + stRequestMethod + ' <------------'
            });

            try {
                var objScript = runtime.getCurrentScript();
                var objForm = createForm();
                var form = objForm.form;

                if (stRequestMethod === 'GET') {
                    var sublist = objForm.sublist;

                    var arrFilters = gmreplib.getFilters(context);
                    var bIsFiltered = arrFilters[0];
                    var objFilters = arrFilters[1];
                    var subdFilter = objFilters.custpage_filter_subd;
                    var dateFromFilter = objFilters.custpage_filter_datefrom;
                    var dateToFilter = objFilters.custpage_filter_dateto;
                    //log.debug(stLogTitle, 'arrFilters: ' + JSON.stringify(arrFilters));
                    //log.debug(stLogTitle, 'objFilters: ' + JSON.stringify(objFilters));

                    if(!gmreplib.isEmpty(bIsFiltered)){
                        gmreplib.populateFilter
                        s(form, objFilters);
                    }
                    var arrInvoices = gmreplib.getDataSearch2(dateFromFilter,dateToFilter,subdFilter);
                    log.debug(stLogTitle, 'arrInvoices: ' + JSON.stringify(arrInvoices));

                    //add data to the form
                    populateForm(form, sublist, arrInvoices);

                } else if (stRequestMethod === 'POST') {
                    //todo: add export functionality for possible request/enhancement
                    //form = postProcess(context, runtime);
                }
                context.response.writePage(form);

            } catch (err) {
                log.debug({title: stLogTitle, details: 'Error:' + err.toString()});
            }
            log.debug({
                title: stLogTitle,
                details: '------------> SCRIPT END  <------------'
            });
        }//on request

        function createForm() {
            var stLogTitle = 'createForm';
            var form = serverWidget.createForm({
                title: 'GM Report'
            });

            form.addButton({
                id: 'custpage_filter_btn',
                label: 'Search',
                functionName: 'filter()'
            });

            /*
            form.addSubmitButton({
                label: 'Search'
            });
            form.addButton({
                id: 'custpage_select_all',
                label: 'Select All',
                functionName: 'selectAll()'
            });

            */
            //----add filters

            form.addFieldGroup({
                id: 'fieldgroup_filters',
                label: 'Search Filters'
            });

            form.addField({
                id: 'custpage_filter_subd',
                type: serverWidget.FieldType.SELECT,
                source: 'subsidiary',
                label: 'Subsidiary',
                container: 'fieldgroup_filters'
            });

            form.addField({
                id: 'custpage_filter_datefrom',
                type: serverWidget.FieldType.DATE,
                label: 'Date From',
                container: 'fieldgroup_filters'
            });

            form.addField({
                id: 'custpage_filter_dateto',
                type: serverWidget.FieldType.DATE,
                label: 'Date To',
                container: 'fieldgroup_filters'
            });
            //----end of filters

            //-- hidden fields---
            form.addField({
                id: 'custpage_selected_id',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Selected Internal IDs'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            form.addField({
                id: 'custpage_page_size',
                type: serverWidget.FieldType.TEXT,
                label: 'Page size'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            //-- hidden fields---

            //--- create sublist ---
            var sublist = form.addSublist({
                id: 'custpage_trans',
                type: serverWidget.SublistType.LIST,
                label: 'Transactions'
            });
            sublist.addField({
                id: 'custpage_internalid',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal ID'
            });
            sublist.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            });
            sublist.addField({
                id: 'custpage_transtype',
                type: serverWidget.FieldType.TEXT,
                label: 'Type of Transaction'
            });
            sublist.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.DATE,
                label: 'Invoice Date'
            });
            sublist.addField({
                id: 'custpage_transid',
                type: serverWidget.FieldType.TEXT,
                label: 'Invoice #'
            });
            sublist.addField({
                id: 'custpage_subd',
                type: serverWidget.FieldType.TEXT,
                label: 'Subsidiary'
            });
            sublist.addField({
                id: 'custpage_salesrep',
                type: serverWidget.FieldType.TEXT,
                label: 'Salesman Id'
            });
            sublist.addField({
                id: 'custpage_customername',
                type: serverWidget.FieldType.TEXT,
                label: 'Customer'
            });
            sublist.addField({
                id: 'custpage_salesuom',
                type: serverWidget.FieldType.TEXT,
                label: 'Sales UOM'
            });
            sublist.addField({
                id: 'custpage_invvolume',
                type: serverWidget.FieldType.TEXT,
                label: 'Invoice Volume'
            });
            sublist.addField({
                id: 'custpage_unitprice',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Unit Price'
            });
            sublist.addField({
                id: 'custpage_totalamount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Invoice Amount'
            });
            sublist.addField({
                id: 'custpage_poid',
                type: serverWidget.FieldType.TEXT,
                label: 'PO #'
            });
            sublist.addField({
                id: 'custpage_soid',
                type: serverWidget.FieldType.TEXT,
                label: 'SO #'
            });
            sublist.addField({
                id: 'custpage_supplier',
                type: serverWidget.FieldType.TEXT,
                label: 'Supplier Name'
            });
            sublist.addField({
                id: 'custpage_purchaseuom',
                type: serverWidget.FieldType.TEXT,
                label: 'Purchase UOM'
            });
            sublist.addField({
                id: 'custpage_costunit',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Sawmill Cost Unit'
            });
            sublist.addField({
                id: 'custpage_totalpovoluom',
                type: serverWidget.FieldType.TEXT,
                label: 'Total Purchase Vol in original UOM'
            });
            sublist.addField({
                id: 'custpage_totalpovoluomsale',
                type: serverWidget.FieldType.TEXT,
                label: 'Total Purchase Volume in Sale UOM'
            });
            sublist.addField({
                id: 'custpage_totalpoamount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Purchase Amount'
            });
            sublist.addField({
                id: 'custpage_suppdiscount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Supplier Discount'
            });
            sublist.addField({
                id: 'custpage_pocosting1',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Costing #1'
            });
            sublist.addField({
                id: 'custpage_pocamount1',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #1'
            });
            sublist.addField({
                id: 'custpage_pocosting2',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Costing #2'
            });
            sublist.addField({
                id: 'custpage_pocamount2',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #2'
            });
            sublist.addField({
                id: 'custpage_pocosting3',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Costing #3'
            });
            sublist.addField({
                id: 'custpage_pocamount3',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #3'
            });
            sublist.addField({
                id: 'custpage_pocosting4',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Costing #4'
            });
            sublist.addField({
                id: 'custpage_pocamount4',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #4'
            });
            sublist.addField({
                id: 'custpage_pocosting5',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Costing #5'
            });
            sublist.addField({
                id: 'custpage_pocamount5',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #5'
            });
            sublist.addField({
                id: 'custpage_socosting1',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Costing #1'
            });
            sublist.addField({
                id: 'custpage_soamount1',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #1'
            });
            sublist.addField({
                id: 'custpage_socosting2',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Costing #2'
            });
            sublist.addField({
                id: 'custpage_soamount2',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #2'
            });
            sublist.addField({
                id: 'custpage_socosting3',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Costing #3'
            });
            sublist.addField({
                id: 'custpage_soamount3',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #3'
            });
            sublist.addField({
                id: 'custpage_socosting4',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Costing #4'
            });
            sublist.addField({
                id: 'custpage_soamount4',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #4'
            });
            sublist.addField({
                id: 'custpage_socosting5',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Costing #5'
            });
            sublist.addField({
                id: 'custpage_soamount5',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #5'
            });
            sublist.addField({
                id: 'custpage_coface',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Coface Total Invoiced + IVA *0.35%'
            });
            sublist.addField({
                id: 'custpage_profit',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Profit'
            });.0
            sublist.addField({
                id: 'custpage_profitmargin',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Profit Margin'
            });
            sublist.addField({
                id: 'custpage_profitt',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Profit T'
            });
            sublist.addField({
                id: 'custpage_percentcom',
                type: serverWidget.FieldType.CURRENCY,
                label: '% Commission Sales'
            });
            sublist.addField({
                id: 'custpage_comsales',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Commission Sales'
            });
            sublist.addField({
                id: 'custpage_idcomprador',
                type: serverWidget.FieldType.TEXT,
                label: 'ID Comprador'
            });


            //-- hidden sublist fields---
            sublist.addField({
                id: 'custpage_linenum',
                type: serverWidget.FieldType.TEXT,
                label: 'Line Num'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            form.clientScriptModulePath = cs_path;

            return {form: form, sublist: sublist};
        }

        // populate form based on the  bill proj search result
        function populateForm(form, sublist, arrInvoices) {
            var stLogTitle = 'populateForm';
            //log.debug(stLogTitle, "arrInvoices: " + JSON.stringify(arrInvoices));

            try {
                var isEmpty = gmreplib.isEmpty;
                if (arrInvoices.length > 0) {
                    for (var x = 0; x < arrInvoices.length; x++) {
                        var objResult = arrInvoices[x];
                        var objHeader = objResult.invoiceHeader;
                        var objTotal = objResult.invoiceTotal;
                        var objLine = objResult.invoiceLine;
                        var objPoTotal = objResult.poTotal;
                        var objPoLine = objResult.poLine;
                        var objPoCosting = objResult.poCosting;
                        var objSoCosting = objResult.soCosting;

                        log.debug(stLogTitle, x + " |objResult: " + JSON.stringify(objResult));
                        log.debug(stLogTitle, x + " |objPoCosting: " + JSON.stringify(objPoCosting));
                        log.debug(stLogTitle, x + " |objSoCosting: " + JSON.stringify(objSoCosting));

                        sublist.setSublistValue({
                            id: 'custpage_linenum',
                            line: x,
                            value: x
                        });
                        sublist.setSublistValue({
                            id: 'custpage_internalid',
                            line: x,
                            value: objHeader.getValue({
                                name: 'internalid'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_status',
                            line: x,
                            value:  objHeader.getValue({
                                name: 'statusref'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_transtype',
                            line: x,
                            value: objHeader.getText({
                                name: 'type'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_date',
                            line: x,
                            value:  objHeader.getValue({
                                name: 'trandate'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_transid',
                            line: x,
                            value: objHeader.getValue({
                                name: 'tranid'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_subd',
                            line: x,
                            value: objHeader.getText({
                                name: "subsidiary",
                                join: "customer",
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_salesrep',
                            line: x,
                            value: objHeader.getText({
                                name: "salesrep",
                                join: "customer",
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_customername',
                            line: x,
                            value: objHeader.getText({
                                name: 'entity'
                            })
                        });

                        sublist.setSublistValue({
                            id: 'custpage_poid',
                            line: x,
                            value: objHeader.getText({
                                name: 'custbody_nso_po_no'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_soid',
                            line: x,
                            value: objHeader.getText({
                                name: 'createdfrom'
                            })
                        });

                        //inv line start
                        sublist.setSublistValue({
                            id: 'custpage_salesuom',
                            line: x,
                            value: objLine.salesuom
                        });
                        var invVol =objLine.custcolnso_qtyvol;
                        var unitPrice =objLine.unitprice;
                        if(!gmreplib.isEmpty(objTotal.totalvolume)){
                            sublist.setSublistValue({
                                id: 'custpage_invvolume',
                                line: x,
                                value: objTotal.totalvolume
                            });
                        }
                        if(!gmreplib.isEmpty(objLine.unitprice)){
                            sublist.setSublistValue({
                                id: 'custpage_unitprice',
                                line: x,
                                value: objLine.unitprice
                            });
                        }

                        var totalAmount = invVol*unitPrice;

                        if(!gmreplib.isEmpty(objTotal.totalinvamount)) {
                            sublist.setSublistValue({
                                id: 'custpage_totalamount',
                                line: x,
                                value: objTotal.totalinvamount
                            });
                        }
                        var supplierObj = objResult.supplier;

                        if(objResult.supplier){
                            sublist.setSublistValue({
                                id: 'custpage_supplier',
                                line: x,
                                value: objResult.supplier[0].text
                            });
                        }
                        if(objPoLine.uomso){
                            sublist.setSublistValue({
                                id: 'custpage_purchaseuom',
                                line: x,
                                value: objPoLine.uomso
                            });
                        }

                        var poCost = objPoLine.pocost;
                        if(objPoLine.sawmillcost){
                            sublist.setSublistValue({
                                id: 'custpage_costunit',
                                line: x,
                                value: objPoLine.sawmillcost
                            });
                        }
                        var qty = objPoLine.totalpovolorig;
                        if(objTotal.totalvolume){
                            sublist.setSublistValue({
                                id: 'custpage_totalpovoluom',
                                line: x,
                                value:objTotal.totalvolume
                            });
                        }
                        var totalPoVol = objPoLine.totalpovuom;
                        if(objPoTotal.purchaseuomvol){
                            sublist.setSublistValue({
                                id: 'custpage_totalpovoluomsale',
                                line: x,
                                value: objPoTotal.purchaseuomvol
                            });
                        }
                        //Todo: calculate Total Purchase Amount custpage_totalpoamount
                        var totalPurchaseAmount = ((poCost*qty)/totalPoVol)*objTotal.totalvolume
                        if(objPoTotal.posubtotal){
                            sublist.setSublistValue({
                                id: 'custpage_totalpoamount',
                                line: x,
                                value: objPoTotal.posubtotal
                            });
                        }

                        //Todo: PO COSTING
                        var poCostingCount = objPoCosting.length;
                        log.debug(stLogTitle, 'poCostingCount: ' + poCostingCount)
                        if(poCostingCount > 0){
                            var c = 1;
                            for (var i= 0; i < poCostingCount; i++){
                                var costingRow = objPoCosting[i];
                                log.debug(stLogTitle+ ' |c:' + c,i + ' |costingRow: ' + JSON.stringify(costingRow));

                                var landedCost = costingRow.landedcost;
                                var amountCost = costingRow.amountcost;
                                var finalCost = costingRow.finalbill;
                                if(!gmreplib.isEmpty(amountCost) || !gmreplib.isEmpty(finalCost)){
                                    sublist.setSublistValue({
                                        id: 'custpage_pocosting'+c,
                                        line: x,
                                        value: landedCost
                                    });
                                    if(!gmreplib.isEmpty(finalCost)){
                                        sublist.setSublistValue({
                                            id: 'custpage_pocamount'+c,
                                            line: x,
                                            value: finalCost
                                        });
                                    }else{
                                        sublist.setSublistValue({
                                            id: 'custpage_pocamount'+c,
                                            line: x,
                                            value: amountCost
                                        });
                                    }


                                }
                                c = c+1;


                            }
                        }

                        //Todo: SO COSTING
                        var soCostingCount = objSoCosting.length;
                        log.debug(stLogTitle, 'soCostingCount: ' + soCostingCount)
                        if(soCostingCount > 0){
                            var c = 1;
                            for (var i= 0; i < soCostingCount; i++){
                                var costingRow = objSoCosting[i];
                                log.debug(stLogTitle+ ' |c:' + c,i + ' |costingRow: ' + JSON.stringify(costingRow));

                                var landedCost = costingRow.solandedcost;
                                var amountCost = costingRow.soamountcost;
                                var finalCost = costingRow.sofinalcost;
                                if(!gmreplib.isEmpty(amountCost) || !gmreplib.isEmpty(finalCost)){
                                    sublist.setSublistValue({
                                        id: 'custpage_socosting'+c,
                                        line: x,
                                        value: landedCost
                                    });
                                    if(!gmreplib.isEmpty(finalCost)){
                                        sublist.setSublistValue({
                                            id: 'custpage_soamount'+c,
                                            line: x,
                                            value: finalCost
                                        });
                                    }else{
                                        sublist.setSublistValue({
                                            id: 'custpage_socamount'+c,
                                            line: x,
                                            value: amountCost
                                        });
                                    }


                                }
                                c = c+1;


                            }
                        }

                        if(objResult.profit){
                            sublist.setSublistValue({
                                id: 'custpage_profit',
                                line: x,
                                value: objResult.profit
                            });
                        }

                        if(objResult.profitmargin){
                            sublist.setSublistValue({
                                id: 'custpage_profitmargin',
                                line: x,
                                value: objResult.profitmargin
                            });
                        }

                    }
                }

            } catch (err) {
                log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
            }
            return form;
        } //populate form

        // invoke sched script
        function postProcess(context, runtime) {
            var stLogTitle = 'postProcess';

            log.debug({title: stLogTitle, details: 'start POST processing...'});
            var objSelectedBill = getSelectedBill(context);

            invokeSchedScript(objSelectedBill);

            form = createMessage();

            return form;
        }

        function createMessage() {
            var form = serverWidget.createForm({
                title: 'GM Report'
            });

            form.addField({
                id: 'custpage_message',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'message'
            });

            var stMessage = '<div style="width: 100%; height: 70px; border: 1px solid blue; background-color: #72a0c1; padding: 15px 15px">';
            //stMessage += '<p style="font-size: 20px;"> Creation of Journal Entry reclassification is currently ongoing, please check <a href="https://4830110.app.netsuite.com/app/common/scripting/scriptstatus.nl?daterange=TODAY&datefrom=3%2F6%2F2023&dateto=3%2F6%2F2023&scripttype=386&primarykey=383&queueid=&jobstatefilterselect=&runtimeversion=&sortcol=dcreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=acY5AvtgXRO6jmbhNrgkPgZEVPLzj004Pz2PqSkoC5OdtjZg-qkl0aVN1FfyHKZ1wXBtpLx1XXYHSg0wZZC3Qn8EAyt5U6TGOTFgcc0-BP95cBSgbrJRHxfjJvnDbnbsvUh7p4PGhpkkhO0lMQkDFB8i0usIKAiQE4PiCs-XU20%3D&datemodi=WITHIN&date=TODAY">scheduled script status.</a></p>';
            stMessage += '<p style="font-size: 20px;"> One or more search data error, please contact your administrator. </p>';
            stMessage += '</div>';

            form.updateDefaultValues({
                custpage_message: stMessage
            });

            return form;
        }

        function invokeSchedScript(objSelectedBill) {
            var stLogTitle = 'invokeSchedScript';
            try {

                var schedTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ctc_ss_createcipreversalje',
                    params: {
                        custscript_ctc_ss_createcipreversalje: JSON.stringify(objSelectedBill)
                    }
                });
                schedTask.submit();
                log.debug({
                    title: stLogTitle,
                    details: 'invoked scheduled script | ' + JSON.stringify(schedTask.params)
                });
            } catch (err) {
                log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
            }
        }

        function getSelectedBill(context) {
            var stLogTitle = 'getSelectedBill';
            var selectedData = [];
            var lineData = {};

            var lineCount = context.request.getLineCount({group: "custpage_bill"});
            log.debug({title: "getSelectedBill", details: 'Total Line Count ' + lineCount});

            for (var x = 0; x < lineCount; x++) {
                var isSelected = context.request.getSublistValue({
                    group: 'custpage_bill',
                    name: 'custpage_select',
                    line: x
                });

                if (isSelected === 'T' || isSelected === true) {
                    var intTransId = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_internalid',
                        line: x
                    });
                    var custId = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_customer',
                        line: x
                    });
                    var itemId = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_item',
                        line: x
                    });
                    var transNum = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_transid',
                        line: x
                    });
                    var projName = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_customername',
                        line: x
                    });
                    var expAccnt = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_expaccnt',
                        line: x
                    });
                    var rcAccnt = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_reclassaccnt',
                        line: x
                    });
                    var amnt = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_amount',
                        line: x
                    });
                    var rectype = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_rectype',
                        line: x
                    });
                    var transaccount = context.request.getSublistValue({
                        group: 'custpage_bill',
                        name: 'custpage_account',
                        line: x
                    });

                    if(rectype === 'Journal'){
                        itemId = transaccount;
                    }

                    var stKey = intTransId + '_' + transaccount;
                    lineData[stKey] = {
                        p: projName,
                        t: transNum,
                        r: rcAccnt,
                        a: amnt,
                        c: custId,
                        rt: rectype,
                        itd: itemId
                    };
                    selectedData.push(lineData);
                }
            }

            log.debug({title: "getSelectedBill", details: 'selectedData=' + JSON.stringify(lineData)});
            return lineData;
        }

        return {
            onRequest: onRequest
        }

    });
