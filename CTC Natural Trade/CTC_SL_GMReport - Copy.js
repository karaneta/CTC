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
var filter_ids = ['custpage_filter_datefrom', 'custpage_filter_dateto'];
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
                    var dateFromFilter = objFilters.custpage_filter_datefrom;
                    var dateToFilter = objFilters.custpage_filter_dateto;
                    log.debug(stLogTitle, 'arrFilters: ' + JSON.stringify(arrFilters));
                    log.debug(stLogTitle, 'objFilters: ' + JSON.stringify(objFilters));

                    if(!isEmpty(bIsFiltered)){
                        gmreplib.getFilters(form, objFilters);
                    }
                    var arrInvoices = gmreplib.getDataSearch2(dateFromFilter,dateToFilter);
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
            var today = new Date();

// Format the date as 'MM/DD/YYYY'
            var formattedDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
            log.debug({
                title: stLogTitle,
                details: 'formattedDate: ' + formattedDate
            });


            form.addFieldGroup({
                id: 'fieldgroup_filters',
                label: 'Search Filters'
            });

            form.addField({
                id: 'custpage_filter_datefrom',
                type: serverWidget.FieldType.DATE,
                source: 'Invoice',
                label: 'Date From',
                container: 'fieldgroup_filters',
                defaultValue: formattedDate
            });

            form.addField({
                id: 'custpage_filter_dateto',
                type: serverWidget.FieldType.DATE,
                source: 'Invoice',
                label: 'Date From',
                container: 'fieldgroup_filters',
                defaultValue: formattedDate
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
                type: serverWidget.FieldType.INTEGER,
                label: 'Total Purchase Vol in original UOM'
            });
            sublist.addField({
                id: 'custpage_totalpovoluomsale',
                type: serverWidget.FieldType.INTEGER,
                label: 'Total Purchase Volume in Sale UOM'
            });
            sublist.addField({
                id: 'custpage_totalpoamoutn',
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
                type: serverWidget.FieldType.CURRENCY,
                label: 'PO Costing #2'
            });
            sublist.addField({
                id: 'custpage_pocamount2',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #2'
            });
            sublist.addField({
                id: 'custpage_pocosting3',
                type: serverWidget.FieldType.CURRENCY,
                label: 'PO Costing #3'
            });
            sublist.addField({
                id: 'custpage_pocamount3',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #3'
            });
            sublist.addField({
                id: 'custpage_pocosting4',
                type: serverWidget.FieldType.CURRENCY,
                label: 'PO Costing #4'
            });
            sublist.addField({
                id: 'custpage_pocamount4',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #4'
            });
            sublist.addField({
                id: 'custpage_pocosting5',
                type: serverWidget.FieldType.CURRENCY,
                label: 'PO Costing #5'
            });
            sublist.addField({
                id: 'custpage_pocamount5',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount #5'
            });

            //-- hidden sublist fields---
            sublist.addField({
                id: 'custpage_proj',
                type: serverWidget.FieldType.TEXT,
                label: 'Project'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_itemname',
                type: serverWidget.FieldType.TEXT,
                label: 'Item'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.TEXT,
                label: 'Item Id'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_expaccnttxt',
                type: serverWidget.FieldType.TEXT,
                label: 'Expense/COGS Account ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_linenum',
                type: serverWidget.FieldType.TEXT,
                label: 'Line Num'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.TEXT,
                label: 'Cust Id'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_expaccnt',
                type: serverWidget.FieldType.TEXT,
                label: 'Expense Account ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_reclassaccnt',
                type: serverWidget.FieldType.TEXT,
                label: 'Selected Reclass G/L Account ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_rectype',
                type: serverWidget.FieldType.TEXT,
                label: 'Type'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'custpage_account',
                type: serverWidget.FieldType.TEXT,
                label: 'Account ID'
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
                        log.debug(stLogTitle, x + " |objResult: " + JSON.stringify(objResult));
                        var objValue = objResult.getValue({
                            name: 'internalid'
                        })

                        log.debug(stLogTitle, x + " |objValue: " + JSON.stringify(objValue));
                        sublist.setSublistValue({
                            id: 'custpage_linenum',
                            line: x,
                            value: x
                        });
                        sublist.setSublistValue({
                            id: 'custpage_internalid',
                            line: x,
                            value: objResult.getValue({
                                name: 'internalid'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_status',
                            line: x,
                            value:  objResult.getValue({
                                name: 'statusref'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_transtype',
                            line: x,
                            value: objResult.getText({
                                name: 'type'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_date',
                            line: x,
                            value:  objResult.getValue({
                                name: 'trandate'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_transid',
                            line: x,
                            value: objResult.getValue({
                                name: 'tranid'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_subd',
                            line: x,
                            value: objResult.getValue({
                                name: 'subsidiarynohierarchy'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_salesrep',
                            line: x,
                            value: objResult.getText({
                                name: 'salesrep'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_customername',
                            line: x,
                            value: objResult.getText({
                                name: 'entity'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_salesuom',
                            line: x,
                            value: objResult.getValue({
                                name: 'custcol_nso_unidad_de_medida'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_invvolume',
                            line: x,
                            value: objResult.getValue({
                                name: 'custcolnso_qtyvol'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_unitprice',
                            line: x,
                            value: objResult.getValue({
                                name: 'custcol_nso_costo'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_totalamount',
                            line: x,
                            value:objResult.getValue({
                                name: 'amount'
                            })
                        });
                        sublist.setSublistValue({
                            id: 'custpage_poid',
                            line: x,
                            value: objResult.getValue({
                                name: 'tranid'
                            })
                        });
                        /*
                        sublist.setSublistValue({
                            id: 'custpage_soid',
                            line: x,
                            value:
                        });
                        sublist.setSublistValue({
                            id: 'custpage_supplier',
                            line: x,
                            value:
                        });*/


                    }
                }


                /* if(arrInvoices.length > 0){
                    for (var x = 0; x < arrInvoices.length; x++) {
                        var objResult = {};
                        objResult = arrInvoices[x].values;

                        log.debug(stLogTitle,x + " |objResult: " + JSON.stringify(objResult));
                        // Check if values property exists
                        if (objResult) {
                            var transType = objResult.type && objResult.type.length > 0 ? objResult.type[0].text : "N/A";
                            log.debug(stLogTitle, x + " |objResult: " + JSON.stringify(objResult));
                            log.debug(stLogTitle, x + " |transType: " + transType);
                        } else {
                            log.error(stLogTitle, x + " |Values data not available for row");
                        }

                        //var internalId =  objResult.internalid[0].value;
                        //log.debug(stLogTitle, "internalId: " + internalId + ' |transType: ' + transType);

                        var transType = objResult.recordType;
                        var transAmount = objResult.transamount;




                    } //for
                }*/



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
