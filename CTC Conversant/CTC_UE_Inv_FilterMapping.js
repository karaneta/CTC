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
 * Project Number: Service TODO-9875 Custom scripts
 * Script Name: CTC UE INV PROJECT MAPPING
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version    Date            Author            Remarks
 * 1.00        Jun 15, 2023    karaneta            Initial Build
 *
 */
var cwBlocktime = '101';
var cwSalesTax = '98'; //CW Sales Tax Item
var cwAgreement = '95'; //CW Agreement Applied
var cwDownPayment = 99; //CW Downpayment
var cwFixedFee = 100; //CW Fixed Fee
define(['N/record', 'N/search', 'N/log','N/task'], function (record, search, log, task) {

    function beforeSubmit(context) {
        var stLogTitle = 'beforeSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        if (context.type === 'create') {
            // log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var applyToType = '';
            var cwinvType = '';
            var serviceItem = null;
            var serviceItemSummary = null;
            var serviceTotal = 0;
            var agreementId;
            var invLocationName;
            var newSubId;
            var currSub = null;
            var agreementArray = [];
            var boardName = null;
            var itemLineCount = 0;
            var processOnScheduled = false;
            var cwInvLink = current_rec.getValue({
                fieldId: 'custbody_ctc_cw_inv_link'
            });

            currSub = current_rec.getValue({
                fieldId: 'subsidiary'
            });

            itemLineCount = current_rec.getLineCount({
                sublistId: 'item'
            });

            //log.debug(stLogTitle, 'cwInvLink: ' + cwInvLink + ' |currSub' + currSub + ' |itemLineCount:' + itemLineCount);
            if (isEmpty(itemLineCount)) {
                log.debug(stLogTitle, 'NO LINE ITEM FOUND');
            }

            if (!isEmpty(cwInvLink) && itemLineCount > 0) {
                var invObj = search.lookupFields({
                    type: 'customrecord_ctc_cw_invoices',
                    id: cwInvLink,
                    columns: ['custrecord_ctc_cw_inv_applytotype', 'custrecord_ctc_cw_inv_projectid', 'custrecord_ctc_cw_inv_applytoid', 'custrecord_ctc_cw_inv_ticketid', 'custrecord_ctc_cw_inv_servicetotal', 'custrecord_ctc_cw_inv_agreementlink', 'custrecord_ctc_cw_inv_locationname', 'custrecord_ctc_cw_inv_agreementid', 'custrecord_ctc_cw_inv_locationid', 'custrecord_ctc_cw_inv_type', 'custrecord_ctc_cw_inv_phasename' , 'custrecord_ctc_cw_inv_agreementamountbdy']
                });

                log.audit(stLogTitle, 'invObj: ' + JSON.stringify(invObj));
                applyToType = invObj.custrecord_ctc_cw_inv_applytotype;
                cwinvType = invObj.custrecord_ctc_cw_inv_type;
                serviceTotal = invObj.custrecord_ctc_cw_inv_servicetotal;
                var projectId = invObj.custrecord_ctc_cw_inv_projectid;
                var projectPhase = invObj.custrecord_ctc_cw_inv_phasename;
                var ticketId = invObj.custrecord_ctc_cw_inv_ticketid;
                var locationId = invObj.custrecord_ctc_cw_inv_locationid;
                invLocationName = invObj.custrecord_ctc_cw_inv_locationname;
                agreementArray = invObj.custrecord_ctc_cw_inv_agreementlink;
                var agreementAmount = invObj.custrecord_ctc_cw_inv_agreementamountbdy;
                var agreementLength = agreementArray.length;
                if (agreementLength > 0) {
                    agreementId = agreementArray[0].value;
                }
                //agreementId = invObj.custrecord_ctc_cw_inv_agreementid;
                log.audit(stLogTitle, 'applyToType: ' + applyToType);

                if (locationId) {
                    newSubId = getSubLocMapping(locationId);
                }
                log.audit(stLogTitle, 'newSubId: ' + newSubId + ' |currSub: ' + currSub);

                var itemArray;
                var itemCount;
                var lineCleared = false;
                if (itemLineCount > 0) {
                    itemArray = getLineItemDetails(current_rec, itemLineCount);
                    itemCount = itemArray.length;
                    log.debug(stLogTitle, 'itemCount: ' + itemCount);
                }

                if (!isEmpty(newSubId) && newSubId !== currSub) {
                    current_rec.setValue({
                        fieldId: 'subsidiary',
                        value: newSubId
                    });
                    lineCleared = true;
                }

                //log.debug(stLogTitle, 'itemArray: ' + JSON.stringify(itemArray));

                if (applyToType === '' && (cwinvType !== 'CreditMemo' && cwinvType !== 'Miscellaneous')) {
                    // 9/9/23 New scenario: ticket mapping per line and add ticket no on the description
                    if(itemLineCount > 30){
                        //set to scheduled process
                        processOnScheduled = true;
                        current_rec.setValue({
                            fieldId: 'custbody_ctc_cw_maponsched',
                            value: true
                        });

                    }else{
                        var stat = mappedIndividualLine(current_rec, itemArray, itemLineCount);
                        if (stat === true) {
                            //consolidate similar line item
                            var newItemLineCount = current_rec.getLineCount({
                                sublistId: 'item'
                            });
                            var newItemArray = getLineItemDetails(current_rec, newItemLineCount);
                            var consolidatedItemArray = consolidateItem(newItemArray);
                            var consolidatedItemCount = consolidatedItemArray.length;
                            log.debug(stLogTitle, 'consolidatedItemCount: ' + consolidatedItemCount);
                            log.debug(stLogTitle, 'consolidatedItemArray: ' + JSON.stringify(consolidatedItemArray));
                            if (consolidatedItemCount > 0) {
                                var clearStat = clearLine(consolidatedItemCount, current_rec);
                                //unset existing item and set consolidated item
                                var resetStat = setLineItemDetails(current_rec, consolidatedItemArray, consolidatedItemCount, agreementAmount, agreementId);

                                log.debug(stLogTitle, 'setLineItemDetails: ' + resetStat);

                            }
                            lineCleared = false;
                        }
                        log.debug(stLogTitle, 'mappedIndividualLine >stat: ' + stat);
                    }

                }

                //set back line items
                if (lineCleared === true) {
                    var resetStat = setLineItemDetails(current_rec, itemArray, itemLineCount,agreementAmount,agreementId);
                    log.debug(stLogTitle, 'setLineItemDetails: ' + resetStat);
                }

                if ((applyToType === 'Service' || applyToType === 'Ticket') && !isEmpty(ticketId) && cwinvType !== 'DownPayment') {
                    //get boardname from service ticket
                    var ticketObj = getServiceBoardName(ticketId);
                    log.debug(stLogTitle, 'ticketObj: ' + JSON.stringify(ticketObj));
                    boardName = ticketObj.servBoardName;
                    serviceItemSummary = ticketObj.ticketSummary;
                }

                if ((applyToType === 'ProjectPhase' || applyToType === 'Project') && !isEmpty(projectId) && cwinvType !== 'DownPayment') {
                    //get boardname from project record
                    var projObj = getProjBoardName(projectId);
                    boardName = projObj.projBoardName;
                    serviceItemSummary = projObj.projDesc + ' |' + projectPhase;
                }

                if (applyToType === 'Agreement' && !isEmpty(agreementId)) {
                    //get boardname from service ticket
                    serviceItem = getAgreementTypeMapping(agreementId);
                }

                log.debug(stLogTitle, 'boardName: ' + boardName);

                if (!isEmpty(boardName)) {
                    //Get item from board mapping
                    serviceItem = getBoardNameMapping(boardName);
                }

                if (!isEmpty(serviceItem)) {
                    //update invoice line item
                    var stat = updateInvoiceLineItem(current_rec, itemLineCount, serviceItem, serviceTotal, serviceItemSummary,applyToType);
                    log.debug(stLogTitle, 'updateInvoiceLineItem > ' + stat);
                } else {
                    log.debug(stLogTitle, 'NO SERVICE ITEM MAPPING FOUND');
                    if(!processOnScheduled){
                        var stat = removeZeroAmountBlocktime(current_rec, itemLineCount,serviceTotal,applyToType);
                    }
                    log.debug(stLogTitle, 'removeZeroAmountBlocktime stat: ' + stat);

                }

            }

        } // END IF CONTEXT

        log.debug(stLogTitle, '-------------> SCRIPT END <------------------');

    } // END BEFORE SUBMIT

    function clearLine(newItemLineCount, current_rec) {
        var stLogTitle = 'clearLine';
        var clearStat = false;
        log.debug(stLogTitle, 'newItemLineCount:' + newItemLineCount);

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
                var prodEntryLink = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ctc_cw_prodentrylink',
                    line: i
                });
                log.debug(stLogTitle, i + ' |itemrow: ' + itemId + ' |prodEntryLink:' + prodEntryLink);


                if (!isEmpty(timeEntryLink)) {
                    log.debug(stLogTitle, i + ' |remove time entry link: ' + itemId);
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

    function getServiceBoardName(ticketId) {
        var stLogTitle = 'getServiceBoardName |' + ticketId;
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
                    search.createColumn({name: 'custrecord_ctc_cw_servticket_boardname'}),
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

    function getAgreementTypeMapping(agreementId) {
        var stLogTitle = 'getAgreementTypeMapping';
        var agreementMappingItem = null;

        var agreementObj = search.lookupFields({
            type: 'customrecord_ctc_cw_agreement',
            id: agreementId,
            columns: ['name', 'custrecord_ctc_cw_agreement_typename']
        });

        log.audit(stLogTitle, 'agreementObj: ' + JSON.stringify(agreementObj));
        var agreementType = agreementObj.custrecord_ctc_cw_agreement_typename;

        if (!isEmpty(agreementType)) {

            var cwmiAgreeTypeMapping = search.create({
                type: "customrecord_ctc_cwmi_agreement_map",
                filters:
                    [
                        ["name", "contains", agreementType]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name"
                        }),
                        search.createColumn({name: 'custrecord_ctc_cwmi_service_agreement'})
                    ]
            });
            var searchResultCount = cwmiAgreeTypeMapping.runPaged().count;
            log.debug("cwmiAgreeTypeMapping result count", searchResultCount);

            cwmiAgreeTypeMapping.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                agreementMappingItem = result.getValue({
                    name: 'custrecord_ctc_cwmi_service_agreement'
                });
                var typeName = result.getValue({
                    name: 'name'
                });
                log.debug(stLogTitle, 'search result: ' + agreementMappingItem + JSON.stringify(result));

            });

        }
        log.debug(stLogTitle, 'agreementMappingItem: ' + agreementMappingItem);
        return agreementMappingItem;
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

    function getTimeEntryTicketId(timeId) {
        var stLogTitle = 'getTimeEntryTicketId |' + timeId;
        var ticketId = null;
        var timeObj = {
            'ticketId': null,
            'ticketSummary': null,
            'isbillable': null
        };

        if (timeId) {
            var timeObj = search.lookupFields({
                type: 'customrecord_ctc_cw_time',
                id: timeId,
                columns: ['custrecord_ctc_cw_time_ticketid', 'name', 'custrecord_ctc_cw_time_ticketsummary', 'custrecord_ctc_cw_time_billableoption']
            });
            if (timeObj) {
                var ticketId = timeObj.custrecord_ctc_cw_time_ticketid;
                var ticketSum = timeObj.custrecord_ctc_cw_time_ticketsummary;
                var isBillable = timeObj.custrecord_ctc_cw_time_billableoption;

                timeObj = {
                    'ticketId': ticketId,
                    'ticketSummary': ticketSum,
                    'isbillable': isBillable
                };
            }


        }
        //log.debug(stLogTitle, 'timeObj: ' + JSON.stringify(timeObj));
        return timeObj;
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

    function invokeSchedScript(currentID) {
        var stLogTitle = 'invokeSchedScript: '+ currentID;
        try {

            var schedTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_ctc_ss_mapindiline',
                params: {
                    custscript_ctc_ss_mapindiline: currentID
                }
            });
            schedTask.submit();
            log.debug({
                title: stLogTitle,
                details: 'invoked scheduled script params| ' + JSON.stringify(schedTask.params)
            });
        } catch (err) {
            log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
        }
    }

    function afterSubmit(context){
        var stLogTitle = 'afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));
        if (context.type === context.UserEventType.CREATE){
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var currentType = current_rec.type;

            var processOnSched =  current_rec.getValue({
                fieldId: 'custbody_ctc_cw_maponsched'
            });
            log.debug(stLogTitle, 'ID:'+ currentID + ' | processOnSched:' + processOnSched);

            if(processOnSched){
                invokeSchedScript(currentID);
            }

            return true;


        }

    }

    function isEmpty(stValue) {
        if ((stValue === '') || (stValue === null) || (stValue === undefined)) {
            return true;
        } else if (typeof stValue == 'object') {
            for (var prop in stValue) {
                if (stValue.hasOwnProperty(prop))
                    return false;
            }

            return;
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


    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
})