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
     * Project Number: Service TODO-10630 VC3 | Matrix Mapping
     * Script Name: CTC.Model.js
     * Author: karaneta@nscatalyst.com
     * @NApiVersion 2.0
     * @NModuleScope SameAccount
     * @description
     *
     * CHANGELOGS
     *
     * Version	Date            Author		    Remarks
     * 1.00       Jan 26, 2024    karaneta            Initial Build
     */
    var cwBlocktime = '18015'; //BLOCK TIME/RETAINER ITEM
    var cwTimeEntry = '18008'; //Default Service Item
    var cwSalesTax = '18012'; //CW Sales Tax Item
    var cwAgreement = '18009'; //CW Agreement Applied
    var cwFixedFee = '18014'; //CW Fixed Fee
    var cwDownPayment = 99; //CW Downpayment
    var stLogTitle = null;
    define(['N/record', 'N/search', 'N/log', 'N/currentRecord'],
    
        function (record, search,log, currentRecord) {
    
            //------------------------------------- UTILS -----------------------------------
            function isEmpty(stValue) {
                if ((stValue === '') || (stValue === null) || (stValue === undefined) || (stValue === '0')|| (stValue === 0)) {
                    return true;
                } else if (typeof stValue == 'object') {
                    for ( var prop in stValue) {
                        if (stValue.hasOwnProperty(prop))
                            return false;
                    }
    
                    return;
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
    
            //------------------------------------- UTILS -----------------------------------
            function getBillingMethod(applyToType, ticketId, projectId){
                stLogTitle = 'getBillingMethod';
                var billingMethod = null;
                if ((applyToType === 'Service' || applyToType === 'Ticket') && !isEmpty(ticketId)) {
                    var cwticket_search = search.create({
                        type: "customrecord_ctc_cw_servicetickets",
                        filters:
                            [
                                ["custrecord_ctc_cw_servticket_id","equalto",ticketId]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "custrecord_ctc_cw_servticket_billmethod", label: "Billing Method"})
                            ]
                    });
                    var searchResultCount = cwticket_search.runPaged().count;
                    log.debug(stLogTitle, "cwticket_search count: " + searchResultCount);
                    cwticket_search.run().each(function(result){
                        log.debug(stLogTitle, "cwticket_search result: " + JSON.stringify(result));
                        billingMethod = result.getValue({
                            name: 'custrecord_ctc_cw_servticket_billmethod'
                        });
                    });
                }
                if ((applyToType === 'ProjectPhase' || applyToType === 'Project') && !isEmpty(projectId)) {
                    var cwproj_search = search.create({
                        type: "customrecord_ctc_cw_projects",
                        filters:
                            [
                                ["custrecord_ctc_cw_projects_id","equalto",projectId]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "custrecord_ctc_cw_projects_billingmethod", label: "Billing Method"})
                            ]
                    });
                    var searchResultCountP = cwproj_search.runPaged().count;
                    log.debug(stLogTitle, "cwproj_search count: " + searchResultCountP);
    
                    cwproj_search.run().each(function(result){
                        log.debug(stLogTitle, "cwproj_search result: " + JSON.stringify(result));
                        billingMethod =  result.getValue({
                            name: 'custrecord_ctc_cw_projects_billingmethod'
                        });
    
                    });
    
                }
                log.debug(stLogTitle, "billingMethod: " + billingMethod);
                return billingMethod;
    
            }
            function getTimeEntryData(timeId) {
                stLogTitle = 'getTimeEntryData |' + timeId;
                var ticketId = null;
                var timeObj = {
                    'status': false,
                    'ticketId': null,
                    'businessUnitId': null,
                    'workRoleId': null,
                    'workTypeId': null,
                    'ticketSummary': null,
                    'isbillable': null
                };
    
                if(!isEmpty(timeId)) {
                    var timeObj = search.lookupFields({
                        type: 'customrecord_ctc_cw_time',
                        id: timeId,
                        columns: ['custrecord_ctc_cw_time_businessunitid', 'custrecord_ctc_cw_time_workroleid','custrecord_ctc_cw_time_worktypeid','custrecord_ctc_cw_time_ticketid', 'name', 'custrecord_ctc_cw_time_ticketsummary', 'custrecord_ctc_cw_time_billableoption']
                    });
                    if (timeObj) {
                        var ticketId = timeObj.custrecord_ctc_cw_time_ticketid;
                        var ticketSum = timeObj.custrecord_ctc_cw_time_ticketsummary;
                        var isBillable = timeObj.custrecord_ctc_cw_time_billableoption;
                        var businessUnitId = timeObj.custrecord_ctc_cw_time_businessunitid;
                        var workRoleId = timeObj.custrecord_ctc_cw_time_workroleid;
                        var workTypeId = timeObj.custrecord_ctc_cw_time_worktypeid;
    
                        timeObj = {
                            'status': true,
                            'ticketId': ticketId,
                            'businessUnitId': businessUnitId,
                            'workRoleId': workRoleId,
                            'workTypeId': workTypeId,
                            'ticketSummary': ticketSum,
                            'isbillable': isBillable
                        };
                    }
    
    
                }
                log.debug(stLogTitle, 'timeObj: ' + JSON.stringify(timeObj));
                return timeObj;
            }
    
            function getMappingItem(timeObj,applyToType){
                stLogTitle = 'getMappingItem: ' + applyToType;
                var newItem = null;
                if(!isEmpty(timeObj)){
                    log.debug(stLogTitle, "timeObj: " + JSON.stringify(timeObj));
                    var businessUnitId = timeObj.businessUnitId;
                    var workRoleId = timeObj.workRoleId;
                    var workTypeId = timeObj.workTypeId;
    
                    if ((applyToType === 'Service' || applyToType === 'Ticket')) {
                        var customrecord_ctc_cw_ticket_actual_rateSearchObj = search.create({
                            type: "customrecord_ctc_cw_ticket_actual_rate",
                            filters:
                                [
                                    ["custrecord_ctc_cw_bus_unit_id_tar","equalto", businessUnitId],
                                    "AND",
                                    ["custrecord_ctc_cw_work_role_id_tar","is",workRoleId],
                                    "AND",
                                    ["custrecord_ctc_cw_work_type_id_tar","is", workTypeId]
                                ],
                            columns:
                                [
                                    search.createColumn({name: "custrecord_ctc_cw_bus_unit_id_tar", label: "Business Unit ID"}),
                                    search.createColumn({name: "custrecord_ctc_cw_work_type_tar", label: "CW Work Type"}),
                                    search.createColumn({name: "custrecord_ctc_cw_work_role_tar", label: "CW Work Role"}),
                                    search.createColumn({name: "custrecord_ctc_cw_ns_item_tar", label: "NS Item"})
                                ]
                        });
                        var searchResultCount = customrecord_ctc_cw_ticket_actual_rateSearchObj.runPaged().count;
                        log.debug(stLogTitle, "customrecord_ctc_cw_ticket_actual_rateSearchObj result count: "+ searchResultCount);
                        customrecord_ctc_cw_ticket_actual_rateSearchObj.run().each(function(result){
                            log.debug(stLogTitle, "result",JSON.stringify(result));
                            newItem =  result.getValue({
                                name: 'custrecord_ctc_cw_ns_item_tar'
                            });
                        });
    
                    }
    
                    if ((applyToType === 'ProjectPhase' || applyToType === 'Project')) {
                        var customrecord_cwproj_search= search.create({
                            type: "customrecord_ctc_cw_project_actual_rate",
                            filters:
                                [
                                    ["custrecord_ctc_cw_bus_unit_id_par","equalto", businessUnitId],
                                    "AND",
                                    ["custrecord_ctc_cw_work_par","anyof",workRoleId],
                                    "AND",
                                    ["custrecord_ctc_cw_work_type_par","anyof", workTypeId]
                                ],
                            columns:
                                [
                                    search.createColumn({name: "custrecord_ctc_cw_bus_unit_id_par", label: "Business Unit ID"}),
                                    search.createColumn({name: "custrecord_ctc_cw_work_type_par", label: "CW Work Type"}),
                                    search.createColumn({name: "custrecord_ctc_cw_work_par", label: "CW Work Role"}),
                                    search.createColumn({name: "custrecord_ctc_cw_ns_item_par", label: "NS Item"})
                                ]
                        });
                        var searchResultCountP = customrecord_cwproj_search.runPaged().count;
                        log.debug(stLogTitle, "searchResultCountP: "+ searchResultCountP);
                        customrecord_cwproj_search.run().each(function(result){
                            log.debug(stLogTitle, "result",JSON.stringify(result));
                            newItem = result.getValue({
                                name: 'custrecord_ctc_cw_ns_item_par'
                            });
                        });
    
    
                    }
    
                }
                log.debug(stLogTitle, "newItem: " + newItem);
    
                return newItem;
            }

            function getLineTicketId(cwInvLink,applyToType){
                var stLogTitle = 'getLineTicketId|' + cwInvLink;
                var ticketId = null;
                //var lineItemCount =  nlapiGetLineItemCount('item');
                var timeEntryId = null;
                var timeEntryArray = [];
                var searchResult = null;

               if(!isEmpty(cwInvLink)){
                    //GET qty, rate, BU, work type, work role
                    var customrecord_ctc_cw_timeSearchObj = search.create({
                        type: "customrecord_ctc_cw_time",
                        filters:
                            [
                                ["custrecord_ctc_cw_time_invlink","anyof",cwInvLink]
                            ],
                        columns:
                            [
                                search.createColumn({name: "name",label: "Name"}),
                                search.createColumn({name: "custrecord_ctc_cw_time_businessunitid", label: "Business Unit ID"}),
                                search.createColumn({name: "custrecord_ctc_cw_time_workroleid", label: "Work Role ID"}),
                                search.createColumn({name: "custrecord_ctc_cw_time_worktypeid", label: "Work Type ID"}),
                                search.createColumn({name: "custrecord_ctc_cw_time_invlink", label: "NS CW Invoice Link"}),
                                search.createColumn({name: "custrecord_ctc_cw_time_invoicehours", label: "Actual Hours"}),
                                search.createColumn({name: "custrecord_ctc_cw_time_hourlyrate", label: "Rate"})
                            ]
                    });
                   var timeObjResult = customrecord_ctc_cw_timeSearchObj.run();

                   var resultRange = timeObjResult.getRange({
                       start: 0,
                       end: 999
                   });

                   if(!isEmpty(timeObjResult)){
                       for (var c = 0; c < resultRange.length; c++) {
                           var resultRow = resultRange[c];
                           var businessUnitId = resultRow.getValue({
                               name: 'custrecord_ctc_cw_time_businessunitid'
                           });
                           var workRoleId = resultRow.getValue({
                               name: 'custrecord_ctc_cw_time_workroleid'
                           });
                           var workTypeId = resultRow.getValue({
                               name: 'custrecord_ctc_cw_time_worktypeid'
                           });

                           var qty = resultRow.getValue({
                               name: 'custrecord_ctc_cw_time_invoicehours'
                           });

                           var hourlyRate = resultRow.getValue({
                               name: 'custrecord_ctc_cw_time_hourlyrate'
                           });

                           var rate = hourlyRate * qty;
                           var timeObj = {
                               'businessUnitId': businessUnitId,
                               'workRoleId': workRoleId,
                               'workTypeId': workTypeId
                           }
                           var nsItem = getMappingItem(timeObj,applyToType);

                           var itemObj = {
                               'item': nsItem,
                               'quantity': 1,
                               'rate': rate
                           };

                           log.debug(stLogTitle, c + ' Result Row qty:' + qty + ' |rate:' + rate);
                           log.debug(stLogTitle, 'Row: ' + JSON.stringify(resultRow));
                           log.debug(stLogTitle, 'Row: ' + JSON.stringify(itemObj));
                           timeEntryArray.push(itemObj);
                       }

                   }

                }

                log.debug("timeEntryArray: ",JSON.stringify(timeEntryArray));

                return timeEntryArray;
            }
    
            function clearLine(current_rec){
                var stLogTitle = 'clearLine';
                var clearStat = false;

                var itemLineCount = current_rec.getLineCount({
                    sublistId: 'item'
                });
                log.debug(stLogTitle, 'itemLineCount:' + itemLineCount);

                try {
                    //remove time entry
                    for (var i = itemLineCount - 1; i > 0; i--) {
    
                        var itemId = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
    
                        var qty = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
    
                        var desc = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: i
                        });
    
                        var r = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });
    
                        var timeEntryLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_timeentrylink',
                            line: i
                        });

                        log.debug(stLogTitle, i + ' |itemrow: ' + itemId );

                        if (itemId === cwFixedFee) {
                            log.debug(stLogTitle, i + ' |remove fixed fee default: ' + itemId);
                            current_rec.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                        }
    
                    }//for
                    clearStat = true;
                } catch (e) {
                    log.error(stLogTitle, 'clearLine error:' + JSON.stringify(e));
                }
    
                return clearStat;
    
            }

            function getLineItemDetails(current_rec, itemLineCount) {
                var stLogtitle = 'getLineItemDetails';
                var itemArray = [];
    
                try {
                    for (var i = 0; i < itemLineCount; i++) {
                        var itemId = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
    
                        var qty = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
    
                        var r = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });
    
                        var desc = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: i
                        });
    
                        var ticketId = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_ticket',
                            line: i
                        });
    
                        var timeEntryLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_timeentrylink',
                            line: i
                        });
                        var cwAgreementLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_agreementlink',
                            line: i
                        });
    
                        var expenseLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_expentrylink',
                            line: i
                        });
    
                        var prodLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_prodentrylink',
                            line: i
                        });
    
                        var itemObj = {
                            'item': itemId,
                            'quantity': qty,
                            'rate': r,
                            'description': desc,
                            'ticketid': ticketId,
                            'timelink': timeEntryLink,
                            'agreementlink': cwAgreementLink,
                            'expenselink': expenseLink,
                            'productlink': prodLink
                        };
    
                        //log.audit(stLogtitle, i + ' |itemObj' + JSON.stringify(itemObj));
    
                        itemArray.push(itemObj)
    
                    }
    
                } catch (e) {
                    log.error(stLogtitle, 'getLineItemDetails error:' + JSON.stringify(e));
                }
                //log.debug(stLogtitle, 'itemArray' + JSON.stringify(itemArray));
    
                return itemArray;
    
    
            }
    
            function setLineItemDetails(current_rec, itemArray, itemLineCount,agreementAmount, agreementId) {
                var stLogtitle = 'setLineItemDetails';
                var stat = false;
                log.debug(stLogtitle, itemLineCount + ' |itemArray: ' + JSON.stringify(itemArray));
                log.debug(stLogtitle, agreementAmount + ' |agreementId: ' +agreementId);
                try {
    
                    for (var i = 0; i < itemLineCount; i++) {
                        var itemRow = itemArray[i];
                        var itemId = itemRow.item;
                        // log.audit(stLogtitle, 'itemRow:' + JSON.stringify(itemRow));
    
                        //added 01/18/2024 replace agreement default item to agreement mapping item.
                        if(itemId === cwAgreement && !isEmpty(agreementId)){
                            var agreementItem = getAgreementTypeMapping(agreementId);
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i,
                                value: agreementItem,
                                ignoreFieldChange: true
                            });
    
                        }else{
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i,
                                value: itemRow.item,
                                ignoreFieldChange: true
                            });
                        }
    
                        current_rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i,
                            value: itemRow.quantity
                        });
    
                        current_rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i,
                            value: itemRow.rate
                        });
                        current_rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: i,
                            value: itemRow.description
                        });
                        if (itemRow.timelink) {
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ctc_cw_timeentrylink',
                                line: i,
                                value: itemRow.timelink
                            });
    
                        }
                        if (itemRow.ticketid) {
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ctc_cw_ticket',
                                line: i,
                                value: itemRow.ticketid
                            });
    
                        }
                        if (itemRow.agreementlink) {
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ctc_cw_agreementlink',
                                line: i,
                                value: itemRow.agreementlink
                            });
    
                        }
                        if (itemRow.expenselink) {
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ctc_cw_expentrylink',
                                line: i,
                                value: itemRow.expenselink
                            });
    
                        }
                        if (itemRow.productlink) {
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ctc_cw_prodentrylink',
                                line: i,
                                value: itemRow.productlink
                            });
    
                        }
    
                    }
                    stat = true;
    
    
                } catch (e) {
                    log.error(stLogtitle, 'error:' + JSON.stringify(e));
                }
    
                return stat;
            }
            function consolidateItem2(timeEntryArray){
                stLogTitle ='consolidateItem2';
                var sumRatesByItem = {};
                var itemArray = [];

                if(!isEmpty(timeEntryArray)){
                    // Iterate through timeentryarray
                    for (var i = 0; i < timeEntryArray.length; i++) {
                        var entry = timeEntryArray[i];
                        var itemId = entry.item;

                        // If the item ID already exists in sumRatesByItem, update the sum of rates
                        if (sumRatesByItem[itemId]) {
                            sumRatesByItem[itemId] += entry.rate;
                        }else {
                            sumRatesByItem[itemId] = entry.rate;
                        }
                    }

                    // Convert the sumRatesByItem object into an array of objects
                     for (var itemId in sumRatesByItem) {
                        itemArray.push({
                            item: itemId,
                            quantity: 1,
                            rate: sumRatesByItem[itemId]
                        });
                    }
                }

                return itemArray;

            }
    
            function consolidateItem(itemArray) {
                var stLogTitle = 'consolidateItem';
                var consolidatedArray = [];
                var consolidatedItems = {};
                var agreement = {};
    
                // Iterate through the itemArray
                //for (var i = itemArray.length - 1; i >= 0; i--) {
                for (var i = 0; i < itemArray.length; i++) {
                    var currentItem = itemArray[i];
                    var itemKey = currentItem.item;
                    var itemTicketId = currentItem.ticketid;
    
                    if(itemKey === cwAgreement || itemKey === cwBlocktime || itemKey === cwFixedFee){
                        consolidatedItems[itemTicketId] = {
                            item: itemKey,
                            quantity: 1, // Initialize quantity to 1
                            rate: currentItem.rate, // Retain other fields
                            description: currentItem.description, // Retain other fields
                            ticketid: currentItem.ticketid, // Retain other fields
                            timelink: currentItem.timelink, // Retain other fields
                            agreementlink: currentItem.agreementlink, // Retain other fields
                            expenselink: currentItem.expenselink, // Retain other fields
                            productlink: currentItem.productlink, // Retain other fields
                        };
                    }else{
                        if (!consolidatedItems[itemTicketId]) {
    
                            consolidatedItems[itemTicketId] = {
                                item: itemKey,
                                quantity: 1, // Initialize quantity to 1
                                rate: 0.00, // Initialize rate to 0
                                description: currentItem.description, // Retain other fields
                                ticketid: currentItem.ticketid, // Retain other fields
                                timelink: currentItem.timelink, // Retain other fields
                                agreementlink: currentItem.agreementlink, // Retain other fields
                                expenselink: currentItem.expenselink, // Retain other fields
                                productlink: currentItem.productlink, // Retain other fields
                            };
    
    
                        }
                    }
    
                    var lineTotal = 0.00;
    
                    var parsedQuantity = parseFloat(currentItem.quantity);
                    var parsedRate = parseFloat(currentItem.rate);
                    lineTotal = parsedQuantity * parsedRate;
    
                    if (!isNaN(lineTotal)) {
                        consolidatedItems[itemTicketId].rate += parseFloat(lineTotal.toFixed(2));
                    }
    
                }
    
                // Convert the consolidatedItems object to an array
                for (var key in consolidatedItems) {
                    if (consolidatedItems.hasOwnProperty(key)) {
                        consolidatedArray.push(consolidatedItems[key]);
                    }
                }
    
                log.debug(stLogTitle, 'consolidatedArray ' + JSON.stringify(consolidatedArray)); // Use JSON.stringify to log the array
                return consolidatedArray;
            }
    
            function mappedIndividualLine(current_rec, itemArray, itemLineCount) {
                var stLogTitle = 'mappedIndividualLine|itemLineCount: '+ itemLineCount;
                var stat = false;
                var defaultAgreement = '95';
                //var cwBlocktime = '101';
                //log.debug(stLogTitle);
                //log.debug(stLogTitle, itemLineCount + ' |itemArray: ' + JSON.stringify(itemArray));
                try {
    
                    for (var i = itemLineCount - 1; i >= 0; i--) {
                        var itemRow = itemArray[i];
                        log.debug(stLogTitle, i + ' of ' + itemLineCount + ' |itemRow:' + JSON.stringify(itemRow));
                        var timeId = itemRow.timelink;
                        var serviceItem = itemRow.item;
                        var servDesc = itemRow.description;
                        var isBillable = null;
                        var servBoardName = null;
                        var ticketId = null;
                        var ticketSummary = null
                        log.debug(stLogTitle, 'timeId: ' + timeId + " |isBillable: " + isBillable);
                        var qty = itemRow.quantity;
                        var rate = itemRow.rate;
                        if(isEmpty(qty)){
                            qty = '1';
                        }
    
                        if (timeId) {
                            var timeObj = getTimeEntryTicketId(timeId);
                            ticketId = timeObj.ticketId;
                            ticketSummary = timeObj.ticketSummary;
                            isBillable = timeObj.isbillable;
                            log.debug(stLogTitle, 'timeObj: ' + JSON.stringify(timeObj));
                            log.debug(stLogTitle, 'timeId: ' + timeId + " |isBillable: " + isBillable);
    
                            //add only billable line
                            if (isBillable === 'Billable' || (serviceItem === defaultAgreement || serviceItem === cwBlocktime) ) {
                                if (ticketId) {
                                    servDesc = ticketId + ' ' + ticketSummary;
                                    var ticketObj = getServiceBoardName(ticketId);
                                    var boardName = ticketObj.servBoardName;
                                    if (boardName) {
                                        servBoardName = boardName;
                                    }
                                    //servDesc = ticketObj.typeName;
                                }
                                if (servBoardName) {
                                    var newItem = getBoardNameMapping(servBoardName);
                                    if (newItem) {
                                        serviceItem = newItem;
                                    }
                                }
                                log.debug(stLogTitle, 'Add item: ' + ticketId + " |isBillable: " + isBillable + ' |serviceItem:' + serviceItem);
    
                                current_rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: i,
                                    value: serviceItem,
                                    ignoreFieldChange: true
                                });
    
                                current_rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: i,
                                    value: qty,
                                    ignoreFieldChange: true
                                });
    
                                current_rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    line: i,
                                    value: rate,
                                    ignoreFieldChange: true
                                });
    
                                current_rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'description',
                                    line: i,
                                    value: servDesc
                                });
                                if (ticketId) {
                                    current_rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_ctc_cw_ticket',
                                        line: i,
                                        value: ticketId
                                    });
                                }
                                if (timeId) {
                                    current_rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_ctc_cw_timeentrylink',
                                        line: i,
                                        value: timeId
                                    });
    
                                }
                                if (itemRow.agreementlink) {
                                    current_rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_ctc_cw_agreementlink',
                                        line: i,
                                        value: itemRow.agreementlink
                                    });
    
                                }
                                if (itemRow.expenselink) {
                                    current_rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_ctc_cw_expentrylink',
                                        line: i,
                                        value: itemRow.expenselink
                                    });
    
                                }
                                if (itemRow.productlink) {
                                    current_rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_ctc_cw_prodentrylink',
                                        line: i,
                                        value: itemRow.productlink
                                    });
    
                                }
                            } else {//is not billable
    
                                log.debug(stLogTitle, i + ' REMOVE ITEM: ' + serviceItem + " |isBillable: " + isBillable);
                                current_rec.removeLine({
                                    sublistId: 'item',
                                    line: i
                                });
                                log.debug(stLogTitle, 'remove item: i' + i + " |itemLineCount: " + itemLineCount);
    
                            }//is billable
    
                            stat = true;
    
                        }else {
                            stat = false
                        }
    
                    }//for
    
    
                } catch (e) {
                    log.error(stLogTitle, 'mappedIndividualLine error:' + JSON.stringify(e));
                }
    
                return stat;
    
    
            }
    
            function getProjBoardName(projectId) {
                var stLogTitle = 'getProjTypeMapping |' + projectId;
                var projBoardName = null;
                var projObj = {
                    'projBoardName': null,
                    'projDesc': null
                }
    
                var projSearch = search.create({
                    type: "customrecord_ctc_cw_projects",
                    filters:
                        [
                            ["custrecord_ctc_cw_projects_id", "equalto", projectId]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid"}),
                            search.createColumn({name: "custrecord_ctc_cw_projects_id"}),
                            search.createColumn({name: "name"}),
                            search.createColumn({name: 'custrecord_ctc_cw_projects_boardname'})
                        ]
                });
    
                var projSearchResultCount = projSearch.runPaged().count;
                //log.debug("projSearch result count", projSearchResultCount);
    
                projSearch.run().each(function (result) {
                    projBoardName = result.getValue({
                        name: 'custrecord_ctc_cw_projects_boardname'
                    });
                    var projName = result.getValue({
                        name: 'name'
                    });
                    projObj = {
                        'projBoardName': projBoardName,
                        'projDesc': projName
                    }
                    //log.debug(stLogTitle, 'proj search result: ' + JSON.stringify(result));
                });
    
                log.debug(stLogTitle, 'projObj: ' + projObj);
    
                return projObj;
            }
    
            function getTicketDetails(ticketId) {
                var stLogTitle = 'getTicketDetails |' + ticketId;
                var servBoardName = null;
                var servObj = {
                    'servBoardName': servBoardName,
                    'name': null,
                    'ticketSummary': null
                }
    
                var serviceSearch = search.create({
                    type: "customrecord_ctc_cw_servicetickets",
                    filters:
                        [
                            ["custrecord_ctc_cw_servticket_id", "equalto", ticketId]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid"}),
                            search.createColumn({name: "custrecord_ctc_cw_servticket_id"}),
                            search.createColumn({name: "name"}),
                            search.createColumn({name: "custrecord_ctc_cw_servticket_summary"}),
                            search.createColumn({name: 'custrecord_ctc_cw_servticket_busunitid'}),
                            search.createColumn({name: 'custrecord_ctc_cw_servticket_billmethod'})
                        ]
                });
    
                var servSearchResultCount = serviceSearch.runPaged().count;
                log.debug(stLogTitle, "serviceSearch result count" + servSearchResultCount);
    
                serviceSearch.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    servBoardName = result.getValue({
                        name: 'custrecord_ctc_cw_servticket_boardname'
                    });
                    var typeName = result.getValue({
                        name: 'name'
                    });
                    var summary = result.getValue({
                        name: 'custrecord_ctc_cw_servticket_summary'
                    });
    
                    var billingMethod = result.getValue({
                        name: 'custrecord_ctc_cw_servticket_billmethod'
                    });
    
                    //if(billingMethod !== 'FixedFee'){ 01/24/2024 remove fixed fee exemption
                    servObj = {
                        'servBoardName': servBoardName,
                        'typeName': typeName,
                        'ticketSummary': ticketId + ' ' + summary
                    }
                    // }
    
    
                    //log.debug(stLogTitle, 'service search result: ' + JSON.stringify(result));
                });
    
                log.debug(stLogTitle, 'servObj: ' + JSON.stringify(servObj));
    
                return servObj;
            }
    
            function getBoardNameMapping(boardname) {
                var stLogTitle = 'getBoardNameMapping';
                var serviceItem = null;
    
                var cwmiboarnNameMapping = search.create({
                    type: "customrecord_ctc_cwmi_board_map",
                    filters:
                        [
                            ["name", "is", boardname]
                        ],
                    columns:
                        [
                            search.createColumn({name: "name"}),
                            search.createColumn({name: 'custrecord_ctc_cwmi_service_board'})
                        ]
                });
                var searchResultCount = cwmiboarnNameMapping.runPaged().count;
                //log.debug("cwmiboarnNameMapping result count", searchResultCount);
    
                cwmiboarnNameMapping.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    serviceItem = result.getValue({
                        name: 'custrecord_ctc_cwmi_service_board'
                    });
                    var typeName = result.getValue({
                        name: 'name'
                    });
    
                    // log.debug(stLogTitle, 'search result: ' + JSON.stringify(result));
    
                });
    
                log.debug(stLogTitle, 'serviceItem: ' + serviceItem);
    
                return serviceItem;
            }
    
            function getSubLocMapping(locationId) {
                var stLogTitle = 'getSubLocMapping';
                var newSubId = null;
                log.debug(stLogTitle, 'locationId ' + locationId);
    
                if (!isEmpty(locationId)) {
                    var cwmiInvLocSearchObj = search.create({
                        type: 'customrecord_ctc_cwmi_location_map',
                        filters:
                            [
                                ["custrecord_ctc_location_id", "equalto", locationId]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name"
                                }),
                                search.createColumn({name: 'custrecord_ctc_cwmi_subsidiary'})
                            ]
                    });
                    var searchResultCount = cwmiInvLocSearchObj.runPaged().count;
                    log.debug("cwmiInvLocSearchObj result count", searchResultCount);
    
                    cwmiInvLocSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        newSubId = result.getValue({
                            name: 'custrecord_ctc_cwmi_subsidiary'
                        });
    
                        var typeName = result.getValue({
                            name: 'name'
                        });
    
                        log.debug(stLogTitle, 'search result: ' + newSubId + JSON.stringify(result));
                    });
    
                }
    
                return newSubId;
    
            }
    
            function removeZeroAmountBlocktime(current_rec, itemLineCount,serviceTotal,applyToType){
                var stLogtitle = 'removeZeroAmountBlocktime';
                var stat = false;
                var removeItemCount = 0;
                var removeCwBlockTime = 0;
                //log.debug(stLogtitle,'cwBlocktime: ' + cwBlocktime + ' |serviceTotal:' +serviceTotal);
                itemLineCount = current_rec.getLineCount({
                    sublistId: 'item'
                });
                try {
                    //remove time entry
                    if(itemLineCount > 1){
                        for (var i = itemLineCount - 1; i >= 0; i--) {
    
                            var itemId = current_rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });
    
                            var timeEntryLink = current_rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ctc_cw_timeentrylink',
                                line: i
                            });
    
                            log.debug(stLogtitle, i + ' |itemId: ' + itemId + ' |timeEntryLink:' + timeEntryLink);
    
                            if((itemId !== '99' || itemId !== '98' || itemId !== '100') && isEmpty(serviceTotal)){
                                if (isEmpty(timeEntryLink) && applyToType !== 'SalesOrder') {
                                    log.debug(stLogtitle, i + ' |remove time entry link: ' + itemId);
                                    removeItemCount += 1;
                                    current_rec.removeLine({
                                        sublistId: 'item',
                                        line: i
                                    });
    
                                }
                            }
    
                            if((isEmpty(serviceTotal)  || serviceTotal !== '0.00')  && itemId === cwBlocktime){
                                log.debug(stLogtitle, i + ' |remove empty cw block time line: ' + itemId);
                                current_rec.removeLine({
                                    sublistId: 'item',
                                    line: i
                                });
                                removeCwBlockTime += 1;
                            }
                        }//for
                    }
    
                    log.debug(stLogtitle, 'removeCwBlockTime: ' + removeCwBlockTime + ' |removeItemCount: ' + removeItemCount);
    
                    stat = true;
                } catch (e) {
                    log.error(stLogtitle, 'removeZeroAmountBlocktime error:' + JSON.stringify(e));
                }
    
                return stat;
            }
    
            function updateInvoiceLineItem(current_rec, itemLineCount, serviceItem, serviceTotal, serviceItemSummary,applyToType) {
                var stLogtitle = 'updateInvoiceLineItem';
                var stat = false;
                var cwBlocktime = '101';
                var cwAgreement = '95';
                var cwFixedFeeItem = '100';
                log.debug(stLogtitle, 'serviceItem: ' + serviceItem + ' |serviceTotal: ' + serviceTotal );
                try {
                    //remove time entry
                    for (var i = itemLineCount - 1; i >= 0; i--) {
    
                        var itemId = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
    
                        var qty = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
    
                        var rate = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });
    
                        var desc = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: i
                        });
    
                        var r = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });
    
                        var timeEntryLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_timeentrylink',
                            line: i
                        });
                        var prodEntryLink = current_rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ctc_cw_prodentrylink',
                            line: i
                        });
                        log.debug(stLogtitle, i + ' |itemrow: ' + itemId + ' |prodEntryLink:' + prodEntryLink);
    
    
                        if (!isEmpty(timeEntryLink)) {
                            log.debug(stLogtitle, i + ' |remove time entry link: ' + itemId);
                            current_rec.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                        }
    
                        if((isEmpty(serviceTotal)  || serviceTotal === '0.00')  && itemId === cwBlocktime){
                            log.debug(stLogtitle, i + ' |remove empty cw block time line: ' + itemId);
                            current_rec.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                        }
    
                        if(applyToType === 'Agreement' && (itemId === cwAgreement || itemId === cwBlocktime)){
                            log.debug(stLogtitle, i + ' |replace agreement item line: ' + itemId);
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i,
                                value: serviceItem,
                                ignoreFieldChange: true
                            });
    
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: '1'
                            });
                            if (serviceItemSummary) {
                                current_rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'description',
                                    line: i,
                                    value: serviceItemSummary
                                });
                            }
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i,
                                value: serviceTotal
                            });
                        }
    
                        //remove fixed fee and service item will retain the lumpsum value
                        if(!isEmpty(serviceItem) && itemId === cwFixedFeeItem){
                            log.debug(stLogtitle, i + ' |remove cw fixed fee line: ' + itemId);
                            current_rec.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                        }
    
                    }//for
    
                    //add service line item on last line
                    var newItemLineCount = current_rec.getLineCount({
                        sublistId: 'item'
                    });
                    var i = 0;
                    if (newItemLineCount > 0) {
                        i = newItemLineCount;
                    }
    
                    if(applyToType !== 'Agreement'){
                        if(serviceTotal > 0 || serviceTotal !== '0.00' ||  serviceTotal !== 0){
                            log.debug(stLogtitle, i + ' |adding service item: ' + serviceItem + ' |serviceTotal:' + serviceTotal);
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i,
                                value: serviceItem,
                                ignoreFieldChange: true
                            });
    
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: '1'
                            });
                            if (serviceItemSummary) {
                                current_rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'description',
                                    line: i,
                                    value: serviceItemSummary
                                });
                            }
                            current_rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i,
                                value: serviceTotal
                            });
                        }
                    }
    
    
    
                    stat = true;
                } catch (e) {
                    log.error(stLogtitle, 'updateInvoiceLineItem error:' + JSON.stringify(e));
                }
    
                return stat;
            }
    
    
            //------------------------------------- END UTILS -----------------------------------
            return {
                isEmpty: isEmpty,
                getBillingMethod: getBillingMethod,
                getLineTicketId: getLineTicketId,
                clearLine: clearLine,
                getLineItemDetails:getLineItemDetails,
                setLineItemDetails: setLineItemDetails,
                consolidateItem2: consolidateItem2,
                consolidateItem: consolidateItem,
                mappedIndividualLine: mappedIndividualLine,
                getMappingItem:getMappingItem,
                getProjBoardName: getProjBoardName,
                getTicketDetails: getTicketDetails,
                getBoardNameMapping: getBoardNameMapping,
                getTimeEntryData: getTimeEntryData,
                removeZeroAmountBlocktime: removeZeroAmountBlocktime,
                updateInvoiceLineItem: updateInvoiceLineItem,
                getSubLocMapping:getSubLocMapping,
                fields:{
                    cwFixedFee:  '18014',
                    cwBlocktime: '18015'
                }
            };
    
    
        });