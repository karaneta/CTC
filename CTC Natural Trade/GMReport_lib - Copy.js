/**
 * Copyright (c) 2020 Catalyst Tech Corp
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Catalyst Tech Corp. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Catalyst Tech.
 *
 * Project Number:
 * Script Name: GMReport_lib.js
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Jun 20, 2022	karaneta			Initial Build
 *
 */

define(['N/record', 'N/search', 'N/log'],

    function (record, search,log) {

        //------------------------------------- UTILS -----------------------------------
        function isEmpty(stValue) {
            if ((stValue === '') || (stValue === null) || (stValue === undefined) || (stValue === '0')|| (stValue === 0)) {
                return true;
            } else if (typeof stValue == 'object') {
                for ( var prop in stValue) {
                    if (stValue.hasOwnProperty(prop))
                        return false;
                }

            } else {
                if (stValue instanceof String) {
                    if ((stValue == '')) {
                        return true;
                    }
                } else if (stValue instanceof Array) {
                    if (stValue.length == 0) {
                        return true;
                    }
                }

                return false;
            }
        }

        function getParams(objScript) {
            var objParams = {};

            for (var x = 0; x < param_ids.length; x++) {
                objParams[param_ids[x]] = objScript.getParameter({name: param_ids[x]});
            }
            log.debug({title: 'getParams', details: JSON.stringify(objParams)});
            return objParams;
        }
        function formatDate(vardate){
            var stLogTitle = 'formatDate| ' + vardate;
            var newDate = vardate;
            var day = ('0' + newDate.getDate()).slice(-2); // Ensure two-digit day
            var monthIndex = newDate.getMonth();
            var monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            var month = monthNames[monthIndex];
            var year = newDate.getFullYear();
            var formattedDate = day + '-' + month + '-' + year;

            log.debug(stLogTitle, 'formattedDate: ' + formattedDate + ' |newDate: ' + newDate);
            return formattedDate;

        }

        function getDataSearch2(dateFromFilter,dateToFilter){
            var stLogTitle = 'getDataSearch2';
            var arrSearchResult = [];
            var invoiceLineDataObj = {};
            var today = new Date();
            var yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            var options = { day: 'numeric', month: 'short', year: '2-digit' };

            if (isEmpty(dateFromFilter)) {
                var inputDate = formatDate(yesterday);
                dateFromFilter = inputDate;
            }else{
                var dateFrom = new Date(dateFromFilter);
                dateFromFilter = formatDate(dateFrom);
            }

            if (isEmpty(dateToFilter)) {
                dateToFilter = formatDate(today);
            }else{
                var dateTo = new Date(dateToFilter);
                dateToFilter = formatDate(dateTo);
            }
            log.debug(stLogTitle, 'dateFromFilter: ' + dateFromFilter + ' |dateToFilter: ' + dateToFilter);

            var invSearchResult = search.create({
                type: "invoice",
                filters:
                    [
                        ["type","anyof","CustInvc"],
                        "AND",
                        ["trandate","within",dateFromFilter,dateToFilter],
                        "AND",
                        ["status","anyof","CustInvc:B"],
                        "AND",
                        ["mainline","is","T"],
                        "AND",
                        ["custbody_nso_tipoorden","anyof","2"]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "custbody_nso_tipoorden", label: "Purchase Order Type"}),
                        search.createColumn({name: "mainline", label: "*"}),
                        search.createColumn({name: "type", label: "Type"}),
                        search.createColumn({name: "statusref", label: "Status"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "entity", label: "Name"}),
                        search.createColumn({
                            name: "salesrep",
                            join: "customer",
                            label: "Sales Rep"
                        }),
                        search.createColumn({
                            name: "subsidiary",
                            join: "customer",
                            label: "Primary Subsidiary"
                        }),
                        search.createColumn({name: "account", label: "Account"}),
                        search.createColumn({name: "memo", label: "Memo"}),
                        search.createColumn({name: "amount", label: "Amount"}),
                        search.createColumn({name: "custbody_nso_po_no", label: "Created from PO#"}),
                        search.createColumn({name: "createdfrom", label: "Created From"}),
                        search.createColumn({name: "custcol_nso_unidad_de_medida", label: "UOM SELL"}),
                        search.createColumn({name: "custcolnso_qtyvol", label: "Quantity"})
                    ]
            });
            var myPagedData = invSearchResult.runPaged();
            var searchResultCount = invSearchResult.runPaged().count;
            log.debug(stLogTitle, "invSearchResult result count: " + searchResultCount);
            //log.debug(stLogTitle, "myPagedData result count: " + JSON.stringify(myPagedData));
            if(searchResultCount > 0){
                myPagedData.pageRanges.forEach(function(pageRange){
                    var myPage = myPagedData.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        var internalId = result.getValue({
                            name: 'internalid'
                        });

                        if (internalId) {
                            invoiceLineDataObj = getInvoiceLineData(internalId);
                        }

                        var invoiceResult = {
                            'invoiceHeader': result,
                            'invoiceLine': invoiceLineDataObj
                        };

                        arrSearchResult.push(invoiceResult);
                    });
                });
            }

            if (!isEmpty(searchResultCount)) {
                log.debug(stLogTitle, "arrSearchResult: " + JSON.stringify(arrSearchResult));
                return arrSearchResult;
            }

            log.debug(stLogTitle, "arrSearchResult: " + JSON.stringify(arrSearchResult));

            return arrSearchResult;
        }

        function  getInvoiceLineData(internalId){
            var stLogTitle = 'getInvoiceLineData| '+ internalId;
            var lineObj = {
                'custcol_nso_unidad_de_medida': null,
                'custcolnso_qtyvol': null,
                'custcol_nso_costo': null
            };
            var transactionLineSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid","anyof",internalId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custcol_nso_unidad_de_medida",
                            summary: "MAX",
                            label: "UOM SELL"
                        }),
                        search.createColumn({
                            name: "custcolnso_qtyvol",
                            summary: "SUM",
                            label: "Quantity"
                        }),
                        search.createColumn({
                            name: "custcol_nso_costo",
                            summary: "SUM",
                            label: "PURCHASE COST"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        })
                    ]
            });
            var searchResultCount = transactionLineSearchObj.runPaged().count;
            //log.debug(stLogTitle, "transactionLineSearchObj result count: " + searchResultCount);

            if(searchResultCount > 0){
                transactionLineSearchObj.run().each(function(result){
                    var salesUOM = result.getValue({
                        name: "custcol_nso_unidad_de_medida",
                        summary: "MAX",
                    });

                    var invVolume = result.getValue({
                        name: "custcolnso_qtyvol",
                        summary: "SUM",
                    });

                    var unitPrice = result.getValue({
                        name: "custcol_nso_costo",
                        summary: "SUM",
                    });

                    lineObj = {
                        'custcol_nso_unidad_de_medida': salesUOM,
                        'custcolnso_qtyvol': invVolume,
                        'custcol_nso_costo': unitPrice
                    };
                });
            }

            log.debug(stLogTitle, "lineObj result: " + JSON.stringify(lineObj));
            //return lineObj;
        }

        function getDataSearch(dateFromFilter,dateToFilter) {
            var stLogTitle = 'getDataSearch';
            var itemList = dateFromFilter ? dateFromFilter : ["9", "11", "10"];
            var projOperator = dateToFilter ? 'anyof' : 'noneof';
            var projList = dateToFilter ? dateToFilter : '@NONE@';

            var transactionSearchObj = search.create({
                type: "transaction",
                filters:[
                    [["type","anyof","VendBill"],"AND"
                        ,["mainline","is","F"],"AND"
                        ,["formulatext: {item.custitem_ctc_gl_reclass_acct}","isnotempty",""],"AND"
                        ,["custcol_ctc_is_jecreated","isempty",""],"AND"
                        ,["customer.internalid",projOperator, projList],"AND"
                        ,["job.status","noneof","1"]],
                    "OR",
                    [["type","anyof","Journal"],"AND"
                        ,["account.custrecord_ctc_gl_reclass_acct","noneof","@NONE@"],"AND"
                        ,["custbody1","is","T"],"AND"
                        ,["custbody_ctc_reclassdone","is","F"],"AND"
                        ,["status","anyof","Journal:B"]]
                ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal Id"}),
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                        search.createColumn({name: "entity", label: "Name"}),
                        search.createColumn({name: "item", label: "Item"}),
                        search.createColumn({name: "amount", label: "Amount"}),
                        search.createColumn({
                            name: "altname",
                            join: "customer",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "entitystatus",
                            join: "customer",
                            label: "Status"
                        }),
                        search.createColumn({name: "projecttask", label: "Project Task"}),
                        search.createColumn({
                            name: "expenseaccount",
                            join: "item",
                            label: "Expense/COGS Account"
                        }),
                        search.createColumn({
                            name: "custitem_ctc_gl_reclass_acct",
                            join: "item",
                            label: "CIP Reclass G/L Account"
                        }),
                        search.createColumn({name: "approvalstatus", label: "Approval Status"}),
                        search.createColumn({name: "type", label: "Type"}),
                        search.createColumn({name: "account", label: "Account"}),
                        search.createColumn({
                            name: "custrecord_ctc_gl_reclass_acct",
                            join: "account",
                            label: "CIP Reclass GL Account"
                        })

                    ]
            });
            var myPagedData = transactionSearchObj.runPaged().count;
            var searchResultCount = transactionSearchObj.count;
            log.debug(stLogTitle, "transactionSearchObj result count: " + searchResultCount);
            log.debug(stLogTitle, "myPagedData result count: " + myPagedData);

            var arrResult = [];

            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({index: pageRange.index});
                myPage.data.forEach(function (result) {
                    var internalID = result.getValue({
                        name: 'internalid'
                    });
                    var transDate = result.getValue({
                        name: 'trandate'
                    });
                    var transNum = result.getValue({
                        name: 'transactionnumber'
                    });
                    var entity = result.getValue({
                        name: 'entity'
                    });
                    var entityName = result.getText({
                        name: 'entity'
                    });
                    var item = result.getValue({
                        name: 'item'
                    });
                    var itemName = result.getText({
                        name: 'item'
                    });
                    var transamount = result.getValue({
                        name: 'amount'
                    });
                    var customer = result.getValue({
                        name: 'altname',
                        join: 'customer'
                    });
                    var customerName = result.getText({
                        name: 'altname',
                        join: 'customer'
                    });
                    var projStatus = result.getText({
                        name: 'entitystatus',
                        join: 'customer'
                    });
                    var expAccnt = result.getValue({
                        name: 'expenseaccount',
                        join: 'item'
                    });
                    var expAccntTxt = result.getText({
                        name: 'expenseaccount',
                        join: 'item'
                    });
                    var reclassAccnt = result.getValue({
                        name: 'custrecord_ctc_gl_reclass_acct', join: 'account'
                    });
                    var reclassAccntTxt = result.getText({
                        name: 'custrecord_ctc_gl_reclass_acct', join: 'account'
                    });
                    var recType = result.getValue({
                        name: 'type'
                    });
                    var transAccount = result.getValue({
                        name: 'account'
                    });
                    var accountTxt = result.getText({
                        name: 'account'
                    });

                    //transamount =  Math.abs(transamount);

                    var myObjData = {
                        'internalid': internalID,
                        'trandate': transDate,
                        'transnum': transNum,
                        'entity': entity,
                        'custname': entityName,
                        'item': item,
                        'itemname': itemName,
                        'transamount': transamount,
                        'customer': customer,
                        'status': projStatus,
                        'expaccount': expAccnt,
                        'exptxt': expAccntTxt,
                        'reclassaccount': reclassAccnt,
                        'reclasstxt': reclassAccntTxt,
                        'rectype': recType,
                        'transaccount': transAccount,
                        'accounttxt' : accountTxt
                    };

                    arrResult.push(myObjData);
                });
            });

            if (!isEmpty(searchResultCount)) {
                log.debug(stLogTitle, "arrResult: " + JSON.stringify(arrResult));
                return arrResult;
            }

        }

        function getFilters(context) {
            var objFilters = {};
            var stLogTitle = 'getFilters';
            var bIsFiltered = false;

            try {
                for (var x = 0; x < filter_ids.length; x++) {
                    var stFilter = filter_ids[x];
                    var stValue = context.request.parameters[stFilter]

                    if (!isEmpty(stValue)) {
                        objFilters[stFilter] = {};
                        objFilters[stFilter] = stValue;
                        bIsFiltered = true;
                    }
                }
                if (!isEmpty(objFilters['custpage_filter_datefrom'])) {
                    objFilters['custpage_filter_datefrom'] = objFilters['custpage_filter_datefrom'];
                }
                if (!isEmpty(objFilters['custpage_filter_dateto'])) {
                    objFilters['custpage_filter_dateto'] = objFilters['custpage_filter_dateto'];
                }
            } catch (err) {
                log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
            }
            log.debug({title: stLogTitle, details: 'filtered?' + bIsFiltered + ' | ' + JSON.stringify(objFilters)});
            return [bIsFiltered, objFilters];
        }

        function populateFilters(form, objFilters) {
            var stLogTitle = 'populateFilters';
            var today = new Date();

            try {

                if (!isEmpty(objFilters['custpage_filter_datefrom'])) {
                    var dateFrom = objFilters['custpage_filter_datefrom'];
                    var today = new Date(dateFrom);
                    // Format the date as 'MM/DD/YYYY'
                    var formattedDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
                    log.debug(stLogTitle,'dateFrom:' + formattedDate);

                    form.updateDefaultValues({
                        custpage_filter_datefrom: formattedDate
                    });
                }
                if (!isEmpty(objFilters['custpage_filter_dateto'])) {
                    var dateTo = objFilters['custpage_filter_dateto'];
                    var today = new Date(dateTo);
                    // Format the date as 'MM/DD/YYYY'
                    var formattedDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
                    log.debug(stLogTitle,'dateTo:' + formattedDate);

                    form.updateDefaultValues({
                        custpage_filter_dateto: formattedDate
                    });
                }
            } catch (err) {
                log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
            }
            return form;
        }


        //------------------------------------- END UTILS -----------------------------------
        return {
            isEmpty: isEmpty,
            getDataSearch: getDataSearch,
            getDataSearch2: getDataSearch2,
            getParams:getParams,
            getFilters:getFilters,
            populateFilters:populateFilters
        };


    });