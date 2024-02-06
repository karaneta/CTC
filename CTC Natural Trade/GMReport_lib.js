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
            } else if (typeof stValue === 'object') {
                for ( var prop in stValue) {
                    if (stValue.hasOwnProperty(prop))
                        return false;
                }

            } else {
                if (stValue instanceof String) {
                    if ((stValue === '')) {
                        return true;
                    }
                } else if (stValue instanceof Array) {
                    if (stValue.length === 0) {
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

           //log.debug(stLogTitle, 'formattedDate: ' + formattedDate + ' |newDate: ' + newDate);
            return formattedDate;

        }

        function getDataSearch2(dateFromFilter,dateToFilter, subdFilter){
            var stLogTitle = 'getDataSearch2';
            var arrSearchResult = [];
            var invoiceLineTotalDataObj = {};
            var invoiceLineDataObj = {};
            var poLineTotalDataObj = {};
            var poLineDataObj = {};
            var poCostingObj = {};
            var soCostingObj = {};
            var totalCostingCost = 0;
            var totalPOCostingCost = 0;
            var totalSOCostingCost = 0;
            var today = new Date();
            var yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if(isEmpty(subdFilter)){
                subdFilter = '2';
            }

            if (isEmpty(dateFromFilter)) {
                dateFromFilter = formatDate(yesterday);
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
                        ["customermain.subsidiary","anyof",subdFilter],
                        "AND",
                        ["closedate","within",dateFromFilter,dateToFilter],
                        "AND",
                        ["status","anyof","CustInvc:B"],
                        "AND",
                        ["mainline","is","T"],
                        "AND",
                        ["custbody_nso_tipoorden","anyof","2"],
                        "AND",
                        ["custbody_nso_po_no","noneof","@NONE@"]
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
                        search.createColumn({name: "custbody_nso_po_no", label: "Created from PO#"}),
                        search.createColumn({name: "createdfrom", label: "Created From"})
                    ]
            });
            var myPagedData = invSearchResult.runPaged();
            var searchResultCount = invSearchResult.runPaged().count;
            log.debug(stLogTitle, "invSearchResult result count: " + searchResultCount);
            if(searchResultCount > 0){
                var supplier = null;
                myPagedData.pageRanges.forEach(function(pageRange){
                    var myPage = myPagedData.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        var itemReceiptId = null;
                        var internalId = result.getValue({
                            name: 'internalid'
                        });
                        var poId = result.getValue({
                            name: 'custbody_nso_po_no'
                        });
                        var soId = result.getValue({
                            name: 'createdfrom'
                        });

                        if (internalId) {
                            invoiceLineTotalDataObj = getInvoiceLineTotal(internalId);
                            invoiceLineDataObj = getInvoiceLineData(internalId);
                            itemReceiptId = invoiceLineDataObj.itemreceiptid;
                        }

                        if (poId) {
                            var poObj = search.lookupFields({
                                type: search.Type.PURCHASE_ORDER,
                                id: poId,
                                columns: ['entity', 'custbody_nso_ntt_total_quanity']
                            });
                            supplier = poObj.entity;
                            poLineTotalDataObj = getPOLineTotalData(poId);
                            poLineDataObj = getPOLineData(poId);
                            var poCostingObjReturn = getPOCostingData(poId,itemReceiptId);
                            poCostingObj = poCostingObjReturn.costingArray;
                            totalPOCostingCost = poCostingObjReturn.poTotalCost;

                        }
                        if(soId){
                            var soCostingObjReturn  = getSOCostingData(soId);
                            soCostingObj = soCostingObjReturn.costingArray;
                            totalSOCostingCost = soCostingObjReturn.soTotalCost;
                        }

                        totalCostingCost = totalPOCostingCost + totalSOCostingCost;
                        var totalInvAmount = invoiceLineTotalDataObj.totalInvAmount;
                        var totalInvVolume = invoiceLineTotalDataObj.totalvolume;
                        var totalPurchaseAmount =((poLineDataObj.pocost * poLineDataObj.totalpovolorig) /poLineDataObj.totalpovuom) *  totalInvVolume;
                        var profit = (totalInvAmount - totalPurchaseAmount) - totalCostingCost;
                        var profitMargin = profit / totalInvAmount;

                        var invoiceResult = {
                            'invoiceHeader': result,
                            'invoiceTotal': invoiceLineTotalDataObj,
                            'invoiceLine': invoiceLineDataObj,
                            'supplier' : supplier,
                            'poTotal' : poLineTotalDataObj,
                            'poLine' : poLineDataObj,
                            'poCosting' : poCostingObj,
                            'soCosting' : soCostingObj,
                            'totalInvAmount': totalInvAmount,
                            'profit': profit,
                            'profitmargin':profitMargin
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

        function  getInvoiceLineTotal(internalId){
            var stLogTitle = 'getInvoiceLineTotal| '+ internalId;
            var lineTotalObj = {
                'totalvolume': null,
                'totalinvamount': null
            };

            try{
                var transactionLineSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid","anyof",internalId],
                            "AND",
                            ["mainline","is","F"],
                            "AND",
                            ["taxline","is","F"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custcolnso_qtyvol",
                                summary: "SUM",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "fxamount",
                                summary: "SUM",
                                label: "Amount (Foreign Currency)"
                            })
                        ]
                });

                var searchResultCount = transactionLineSearchObj.runPaged().count;
                if(searchResultCount > 0){
                    transactionLineSearchObj.run().each(function(result){
                        var invVolume = result.getValue({
                            name: "custcolnso_qtyvol",
                            summary: "SUM",
                        });

                        var invSubtotal = result.getValue({
                            name: "fxamount",
                            summary: "SUM",
                        });

                        lineTotalObj = {
                            'totalvolume': invVolume,
                            'totalinvamount': invSubtotal
                        };
                    });
                }
                
            }catch (e) {
                log.error(stLogTitle, "transactionLineSearchObj error: " + JSON.stringify(e));
            }

            log.debug(stLogTitle, "lineTotalObj result: " + JSON.stringify(lineTotalObj));
            return lineTotalObj;
        }

        function  getInvoiceLineData(internalId){
            var stLogTitle = 'getInvoiceLineData| '+ internalId;
            var lineObj = {
                'salesuom': null,
                'unitprice': null,
                'itemreceiptid': null
            };

            try{
                var transactionLineSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid","anyof",internalId],
                            "AND",
                            ["mainline","is","F"],
                            "AND",
                            ["taxline","is","F"],
                            "AND",
                            ["line","equalto","1"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "custcol_nso_unidad_de_medida", label: "UOM SELL"}),
                            search.createColumn({name: "custcol_nso_costo", label: "PURCHASE COST"}),
                            search.createColumn({name: "custcol_ntt_rent_recepcion", label: "Related Transaction"})

                        ]
                });

                var searchResultCount = transactionLineSearchObj.runPaged().count;
                if(searchResultCount > 0){
                    transactionLineSearchObj.run().each(function(result){
                        var salesUOM = result.getText({
                            name: "custcol_nso_unidad_de_medida"
                        });

                        var unitPrice = result.getValue({
                            name: "custcol_nso_costo"
                        });

                        var itemReceipt = result.getValue({
                            name: 'custcol_ntt_rent_recepcion'
                        });

                        lineObj = {
                            'salesuom': salesUOM,
                            'unitprice': unitPrice,
                            'itemreceiptid': itemReceipt
                        };
                    });
                }

            }catch (e) {
                log.error(stLogTitle, "transactionLineSearchObj error: " + JSON.stringify(e));
            }


            log.debug(stLogTitle, "lineObj result: " + JSON.stringify(lineObj));
            return lineObj;
        }

        function getPOLineTotalData(poId){
            var stLogTitle = 'getPOLineTotalData| '+ poId;
            var lineObj = {
                'purchaseuomvol': null,
                'posubtotal': null
            };
            try{
                var poSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid","anyof",poId],
                            "AND",
                            ["mainline","is","F"],
                            "AND",
                            ["taxline","is","F"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custcolnso_qtyvol",
                                summary: "SUM",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "fxamount",
                                summary: "SUM",
                                label: "Amount (Foreign Currency)"
                            })
                        ]
                });
                var poResultCount = poSearchObj.runPaged().count;
                log.debug(stLogTitle, "poResultCount result count" + poResultCount);
                if(poResultCount > 0){
                    poSearchObj.run().each(function(result){
                        var purchaseUOMVol = result.getValue({
                            name: "custcolnso_qtyvol",
                            summary: "SUM"
                        });

                        var poSubtotal = result.getValue({
                            name: "fxamount",
                            summary: "SUM"
                        });

                        lineObj = {
                            'purchaseuomvol': purchaseUOMVol,
                            'posubtotal': poSubtotal

                        };
                    });
                }

            }catch (e) {
                log.error(stLogTitle, "poSearchObj error: " + JSON.stringify(e));
            }


            log.debug(stLogTitle, "poSearchObj result: " + JSON.stringify(lineObj));
            return lineObj;

        }

        function getPOLineData(poId){
            var stLogTitle = 'getPOLineData| '+ poId;
            var lineObj = {
                'purchaseuom': null,
                'pocost': null,
                'totalpovolorig': null,
                'totalpovuom': null
            };
            try{
                var poSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid","anyof",poId],
                            "AND",
                            ["mainline","is","F"],
                            "AND",
                            ["taxline","is","F"],
                            "AND",
                            ["line","equalto","1"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "custcol_nso_unidad_de_medida", label: "UOM SO"}),
                            search.createColumn({name: "custcol_nso_costo", label: "Sawmill Cost Unit"}),
                            search.createColumn({name: "custcol_piezas_pakete", label: "PCS/PKG"})

                        ]
                });
                var poResultCount = poSearchObj.runPaged().count;
                log.debug(stLogTitle, "poResultCount result count" + poResultCount);
                //log.debug(stLogTitle, "poSearchObj result count" + JSON.stringify(poSearchObj));
                if(poResultCount > 0){
                    poSearchObj.run().each(function(result){
                        //log.debug(stLogTitle, "poSearchObj result line" + JSON.stringify(result));
                        var uomSo = result.getText({
                            name: "custcol_nso_unidad_de_medida"
                        });

                        var sawmillCost = result.getValue({
                            name: "custcol_nso_costo"
                        });

                        var pcspkg = result.getValue({
                            name: "custcolnso_qtyvol",
                            summary: "SUM"
                        });

                        lineObj = {
                            'uomso': uomSo,
                            'sawmillcost': sawmillCost,
                            'pcspkg': pcspkg
                        };
                    });
                }

            }catch (e) {
                log.error(stLogTitle, "poSearchObj error: " + JSON.stringify(e));
            }

            //log.debug(stLogTitle, "poSearchObj result: " + JSON.stringify(lineObj));
            return lineObj;

        }

        function getBillItemAmount(billInternalId,landedCost,itemReceiptId){
            var stLogTitle = 'getBillItemAmount| '+ billInternalId + ' |landedCost:' + landedCost;
            var costingArray = [];
            var billAmount = null;
            var itemId = null;
            try{
                if(!isEmpty(landedCost)){
                    var itemSearchObj = search.create({
                        type: "item",
                        filters:
                            [
                                ["name","is",landedCost]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                    name: "itemid",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                })
                            ]
                    });

                    var itemResultSet = itemSearchObj.run();
                    var itemResultRange = itemResultSet.getRange({
                        start: 0,
                        end: 999
                    });
                    var itemSearchCount = itemResultRange.length;
                    log.debug(stLogTitle, "itemSearchCount result count: " + itemSearchCount);
                    if(itemSearchCount > 0){
                        for(var i = 0; i < itemResultRange.length; i++){
                            var resultRow = itemResultRange[i];
                            log.debug(stLogTitle, i+ " |ITEM resultRow:" + JSON.stringify(resultRow));
                            itemId = resultRow.getValue({
                                name: "internalid"
                            });

                        }
                    }

                }

                log.debug(stLogTitle,'itemId: ' +itemId);

                if(!isEmpty(itemId)){
                    var transactionSearchObj = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["internalid","anyof",billInternalId],
                                "AND",
                                ["mainline","is","F"],
                                "AND",
                                ["item","anyof",itemId],
                                "AND",
                                ["custcol_ntt_rent_recepcion","anyof",itemReceiptId]
                            ],
                        columns:
                            [
                                search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"})
                            ]
                    });
                    var myResultSet = transactionSearchObj.run();
                    var billResultRange = myResultSet.getRange({
                        start: 0,
                        end: 999
                    });
                    var poBillSearchCount = billResultRange.length;
                    log.debug(stLogTitle, "poBillSearchCount result count: " + poBillSearchCount);
                    if(poBillSearchCount > 0){
                        for(var i = 0; i < billResultRange.length; i++){
                            var resultRow = billResultRange[i];
                            log.debug(stLogTitle, "resultRow" + JSON.stringify(resultRow));
                            billAmount = resultRow.getValue({
                                name: "fxamount"
                            });

                        }
                    }
                }

            }catch (e) {
                log.error(stLogTitle, "getBillItemAmount error: " + JSON.stringify(e));
            }
            billAmount = Math.abs(billAmount);
            log.debug(stLogTitle, "billAmount: " + billAmount);

            return billAmount;
        }

        function getPOCostingData(poId,itemReceiptId){
            var stLogTitle = 'getPOCostingData| '+ poId;
            var costingArray = [];
            var poCostingObj = {
                'landedcost': null,
                'amountcost': null,
                'finalbill': null
            };
            var searchResult = null;
            var totalPoCostingAmount = 0;

            try{
                var poCostingSearchObj = search.create({
                    type: "customrecord_ntt_costos_po",
                    filters:
                        [
                            ["custrecord_ntt_no_po","anyof",poId],
                            "AND",
                            ["custrecord_ntt_landend_costo","isnotempty",""]
                        ],
                    columns:
                        [
                            search.createColumn({name: "custrecord_ntt_landend_cost", label: "Landed Cost"}),
                            search.createColumn({name: "custrecord_ntt_landend_costo", label: "Amount of Cost"}),
                            search.createColumn({name: "custrecordfinal_cost_amount_ap", label: "Final Cost Amount (Bill Currency)"}),
                            search.createColumn({name: "custrecordfinal_supplier_bill_costs_ap", label: "Final Supplier Bill"})
                        ]
                });
                var myResultSet = poCostingSearchObj.run();
                var poResultRange = myResultSet.getRange({
                    start: 0,
                    end: 999
                });
                var poCostingCount = poResultRange.length;
                log.debug(stLogTitle, "poCostingCount result count" + poCostingCount);
                //log.debug(stLogTitle, "poCostingCount resultRange" + JSON.stringify(poResultRange));
                if(poCostingCount > 0){
                    var finalCost = null;
                    for(var i = 0; i <= poResultRange.length; i++){
                        var resultRow = poResultRange[i];
                        log.debug(stLogTitle, i +" |resultRow" + JSON.stringify(resultRow));
                        var landedCost = resultRow.getText({
                            name: "custrecord_ntt_landend_cost"
                        });
                        var itemId = resultRow.getValue({
                            name: "custrecord_ntt_landend_cost"
                        });
                        var amountCost = resultRow.getValue({
                            name: "custrecord_ntt_landend_costo"
                        });
                        /*
                        var finalCost = resultRow.getValue({
                            name: "custrecordfinal_cost_amount_ap"
                        });*/
                        var billInternalId = resultRow.getValue({
                            name: "custrecordfinal_supplier_bill_costs_ap"
                        });

                        if(!isEmpty(billInternalId)){
                            finalCost = getBillItemAmount(billInternalId,landedCost,itemReceiptId);
                        }
                        log.debug(stLogTitle, i + " |finalCost" + finalCost);

                        if(isEmpty(finalCost)){
                            totalPoCostingAmount += amountCost
                        }else{
                            totalPoCostingAmount += finalCost
                        }

                        poCostingObj = {
                            'landedcost': landedCost,
                            'amountcost': amountCost,
                            'finalbill': finalCost
                        };
                        costingArray.push(poCostingObj);
                    }

                }



            }catch (e) {
                log.error(stLogTitle, "getPOCostingData error: " + JSON.stringify(e));
            }

            log.debug(stLogTitle, "costingArray: " + JSON.stringify(costingArray));
            var poCostObj = {
                'costingArray' : costingArray,
                'poTotalCost' : totalPoCostingAmount
            }
            return poCostObj;


        }

        function getSOCostingData(soId){
            var stLogTitle = 'getSOCostingData| '+ soId;
            var costingArray = [];
            var costingObj = {
                'landedcost': null,
                'amountcost': null,
                'finalbill': null
            };
            var searchResult = null;
            var totalSoCostingAmount = 0;

            try{
                var soCostingSearchObj = search.create({
                    type: "customrecord_ntt_costos_so",
                    filters:
                        [
                            ["custrecord_ntt_record_so","anyof",soId],
                            "AND",
                            [["custrecord_ntt_landend_costo_so","isnotempty",""],"OR",["custrecordfinal_cost_amount_so_ap","isnotempty",""]]
                        ],
                    columns:
                        [
                            search.createColumn({name: "custrecord_ntt_landend_cost_so", label: "Landed Cost"}),
                            search.createColumn({name: "custrecord_ntt_landend_costo_so", label: "Costo"}),
                            search.createColumn({name: "custrecordbill_currency_costs_so_ap", label: "Bill Currency"}),
                            search.createColumn({name: "custrecordfinal_supplier_bill_cost_so_ap", label: "Final Supplier Bill SO"}),
                            search.createColumn({name: "custrecordfinal_cost_amount_so_ap", label: "Final Cost Amount (Bill Currency)"})
                        ]
                });
                var soResultSet = soCostingSearchObj.run();
                var soResultRange = soResultSet.getRange({
                    start: 0,
                    end: 999
                });
                var soCostingCount = soResultRange.length;
                log.debug("soCostingCount result count",soCostingCount);
                if(soCostingCount > 0){
                    for(var i = 0; i <= soResultRange.length; i++){
                        var soLandedCost = soResultRange[i].getText({
                            name: "custrecord_ntt_landend_cost_so"
                        });
                        var soAmountCost = soResultRange[i].getValue({
                            name: "custrecord_ntt_landend_costo_so"
                        });
                        var soFinalCost = soResultRange[i].getValue({
                            name: "custrecordfinal_cost_amount_so_ap"
                        });

                        if(isEmpty(soFinalCost)){
                            totalSoCostingAmount += soAmountCost
                        }else{
                            totalSoCostingAmount += soFinalCost
                        }

                        costingObj = {
                            'solandedcost': soLandedCost,
                            'soamountcost': soAmountCost,
                            'sofinalcost': soFinalCost
                        };
                        costingArray.push(costingObj);
                    }

                }


            }catch (e) {
                log.error(stLogTitle, "getSOCostingData error: " + JSON.stringify(e));
            }

            log.debug(stLogTitle, "costingArray: " + JSON.stringify(costingArray));

            var soCostingObj = {
                'costingArray' : costingArray,
                'soTotalCost' : totalSoCostingAmount
            }
            return soCostingObj;

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
                if (!isEmpty(objFilters['custpage_filter_subd'])) {
                    objFilters['custpage_filter_subd'] = objFilters['custpage_filter_subd'];
                }
            } catch (err) {
                log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
            }
            //log.debug({title: stLogTitle, details: 'filtered?' + bIsFiltered + ' | ' + JSON.stringify(objFilters)});
            return [bIsFiltered, objFilters];
        }

        function populateFilters(form, objFilters) {
            var stLogTitle = 'populateFilters';

            try {
                if (!isEmpty(objFilters['custpage_filter_subd'])) {
                    //log.debug(stLogTitle,'subdFilter:' + objFilters['custpage_filter_subd']);

                    form.updateDefaultValues({
                        custpage_filter_subd: objFilters['custpage_filter_subd']
                    });
                }

                if (!isEmpty(objFilters['custpage_filter_datefrom'])) {
                    var dateFrom = new Date(objFilters['custpage_filter_datefrom']);
                    // Format the date as 'MM/DD/YYYY'
                    var formattedDateFrom = (dateFrom.getUTCMonth() + 1) + '/' + dateFrom.getUTCDate() + '/' + dateFrom.getUTCFullYear();
                    //log.debug(stLogTitle,'raw: ' + objFilters['custpage_filter_datefrom'] + ' |dateFrom:' + dateFrom + ' |formattedDateFrom: ' + formattedDateFrom);

                    form.updateDefaultValues({
                        custpage_filter_datefrom: dateFrom
                    });

                }

                if (!isEmpty(objFilters['custpage_filter_dateto'])) {
                    var rawDate = objFilters['custpage_filter_dateto'];
                    var dateTo = new Date(objFilters['custpage_filter_dateto']);
                    // Format the date as 'MM/DD/YYYY'
                    var formattedDateTo = (dateTo.getUTCMonth() + 1) + '/' + dateTo.getUTCDate() + '/' + dateTo.getUTCFullYear();
                    //log.debug(stLogTitle, 'raw: ' + objFilters['custpage_filter_dateto'] + ' |dateTo:' + dateTo + ' |formattedDateTo: ' + formattedDateTo);

                    form.updateDefaultValues({
                        custpage_filter_dateto: dateTo
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
            getDataSearch2: getDataSearch2,
            getParams:getParams,
            getFilters:getFilters,
            populateFilters:populateFilters
        };


    });