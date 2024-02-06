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
 * 1.01        Aug 26, 2023    karaneta            Change agreement amount based on Service Total
 *
 */
    //declare variable
var defaultAgreementId = '9727'; //CW Agreement Applied
var defaultCWFixedFee = '9732'; //CW Fixed Fee
var defaultCWTimeEntry = '9726'; //CW Time Entry
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {



    function afterSubmit(context) {
        var stLogTitle = 'afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));
        var cwAgreementApplied = '9727';

        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {

            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var currentType = current_rec.type;
            var applyToType = '';
            var projectId;
            var ticketId;
            var serviceTotal = 0;
            var agreementId;

            var currentAgreementId = '9727'; //CW Agreement Applied
            var agreementMappingItem;
            var projMappingItem;
            var invLocationName;
            var newLocId;
            var agreementArray = [];

            current_rec = record.load({
                type: record.Type.INVOICE,
                id: currentID,
                isDynamic: true
            });

            var cwInvLink = current_rec.getValue({
                fieldId: 'custbody_ctc_cw_inv_link'
            });

            var itemLineCount = current_rec.getLineCount({
                sublistId: 'item'
            });

            log.audit(stLogTitle, 'itemLineCount: ' + itemLineCount);

            if (cwInvLink) {
                var invObj = search.lookupFields({
                    type: 'customrecord_ctc_cw_invoices',
                    id: cwInvLink,
                    columns: ['custrecord_ctc_cw_inv_applytotype', 'custrecord_ctc_cw_inv_projectid', 'custrecord_ctc_cw_inv_applytoid', 'custrecord_ctc_cw_inv_servicetotal', 'custrecord_ctc_cw_inv_agreementlink', 'custrecord_ctc_cw_inv_locationname', 'custrecord_ctc_cw_inv_agreementid', 'custrecord_ctc_cw_inv_ticketid', 'custrecord_ctc_cw_inv_type']
                });

                log.audit(stLogTitle, 'invObj: ' + JSON.stringify(invObj));
                applyToType = invObj.custrecord_ctc_cw_inv_applytotype;
                var invType = invObj.custrecord_ctc_cw_inv_type;
                projectId = invObj.custrecord_ctc_cw_inv_projectid;
                serviceTotal = invObj.custrecord_ctc_cw_inv_servicetotal;
                ticketId = invObj.custrecord_ctc_cw_inv_ticketid;
                invLocationName = invObj.custrecord_ctc_cw_inv_locationname;
                //agreementId = invObj.custrecord_ctc_cw_inv_agreementid;
                agreementArray = invObj.custrecord_ctc_cw_inv_agreementlink;

                var agreementLength = agreementArray.length;
                if (agreementLength > 0) {
                    agreementId = agreementArray[0].value;
                }

                if (isEmpty(itemLineCount)) {
                    log.debug(stLogTitle, 'NO LINE ITEM FOUND');
                    return false;
                }

                //GET LOCATION NAME MAPPING
                if (!isEmpty(invLocationName)) {
                    newLocId = getLocationMapping(invLocationName);

                    if (!isEmpty(newLocId)) {
                        log.debug(stLogTitle, 'SET INVOICE HEADER LOCATION: ' + newLocId);
                        current_rec.setValue({
                            fieldId: 'location',
                            value: newLocId
                        });
                    }
                }

                //GET AGREEMENT ITEM MAPPING
                if (isEmpty(agreementId)) {
                    log.debug(stLogTitle, 'NO AGREEMENT LINK FOUND');
                } else {
                    agreementMappingItem = getAgreementTypeMapping(agreementId);
                }

                //GET AGREEMENT NAME FROM TICKET ID
                if (isEmpty(ticketId)) {
                    log.debug(stLogTitle, 'NO TICKET ID FOUND');
                } else {
                    currentAgreementId = '9733' //CW Block Time
                    var ticketAgreementId = getTicketAgreementId(ticketId);
                    if (ticketAgreementId) {
                        agreementMappingItem = getAgreementTypeMapping(ticketAgreementId);
                    }

                }

                //GET PROJECT TYPE MAPPING
                if (!isEmpty(projectId)) {
                    projMappingItem = getProjTypeMapping(projectId);

                    if (!isEmpty(projMappingItem)) {
                        //update for fixed fee item
                        var updateProjStat = updateInvoiceLineFixedProj(projMappingItem, current_rec, itemLineCount, serviceTotal, newLocId, cwAgreementApplied);
                        log.debug(stLogTitle, 'updateInvoiceLineFixedProj > updateProjStat:' + updateProjStat);
                        //return false;
                    } else {
                        log.debug(stLogTitle, 'NO PROJECT TYPE ITEM MAPPING FOUND');
                    }
                }

                //update for inv location and agreement item
                if (!isEmpty(agreementMappingItem)) {
                    var updateInvoiceLocAgreement = updateInvoiceLineItem(newLocId, current_rec, itemLineCount, agreementMappingItem, defaultAgreementId, currentAgreementId, serviceTotal, invType);
                    log.debug(stLogTitle, 'updateInvoiceLineItem > updateInvoiceLocAgreement:' + updateInvoiceLocAgreement);
                } else {
                    log.debug(stLogTitle, 'NO AGREEMENT ID FOUND');
                }

                current_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

            }

            log.debug(stLogTitle, '-------------> SCRIPT END <------------------');


        } // END IF CONTEXT

    } // END BEFORE SUBMIT

    function getLocationMapping(invLocationName) {
        var stLogTitle = 'getLocationMapping';
        var newLocId = null;
        log.debug(stLogTitle, 'invLocationName ' + invLocationName);

        if (!isEmpty(invLocationName)) {
            var cwmiInvLocSearchObj = search.create({
                type: 'customrecord_ctc_location_map',
                filters:
                    [
                        ["name", "is", invLocationName]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name"
                        }),
                        search.createColumn({name: 'custrecord_ctc_ns_location'})
                    ]
            });
            var searchResultCount = cwmiInvLocSearchObj.runPaged().count;
            log.debug("cwmiInvLocSearchObj result count", searchResultCount);

            cwmiInvLocSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                newLocId = result.getValue({
                    name: 'custrecord_ctc_ns_location'
                });

                var typeName = result.getValue({
                    name: 'name'
                });

                log.debug(stLogTitle, 'search result: ' + newLocId + JSON.stringify(result));
            });

        }

        return newLocId;

    }

    function getProjTypeMapping(projectId) {
        var stLogTitle = 'getProjTypeMapping |' + projectId;
        var projMappingItem = null;
        var projType = null;
        /*
        var projObj = search.lookupFields({
            type: 'customrecord_ctc_cw_projects',
            id: projectId,
            columns: ['name', 'custrecord_ctc_cw_projects_typename']
        });
        */

        var projSearch = search.create({
            type: "customrecord_ctc_cw_projects",
            filters:
                [
                    ["custrecord_ctc_cw_projects_id", "equalto", projectId]
                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                    }),
                    search.createColumn({
                        name: "custrecord_ctc_cw_projects_id",
                    }),
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({name: 'custrecord_ctc_cw_projects_typename'})
                ]
        });

        var projSearchResultCount = projSearch.runPaged().count;
        log.debug("projSearch result count", projSearchResultCount);

        projSearch.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            projType = result.getValue({
                name: 'custrecord_ctc_cw_projects_typename'
            });
            var projName = result.getValue({
                name: 'name'
            });

            log.debug(stLogTitle, 'proj search result: ' + JSON.stringify(result));

        });
        log.debug(stLogTitle, 'projType: ' + projType);


        if (!isEmpty(projType)) {
            var cwmiProjTypeSearchObj = search.create({
                type: "customrecord_ctc_cwmi_project_type",
                filters:
                    [
                        ["name", "is", projType]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: 'custrecord_ctc_service_project'})
                    ]
            });
            var searchResultCount = cwmiProjTypeSearchObj.runPaged().count;
            log.debug("customrecord_ctc_cwmi_project_typeSearchObj result count", searchResultCount);

            cwmiProjTypeSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                projMappingItem = result.getValue({
                    name: 'custrecord_ctc_service_project'
                });
                var typeName = result.getValue({
                    name: 'name'
                });

                log.debug(stLogTitle, 'search result: ' + JSON.stringify(result));

            });

        }

        return projMappingItem;

    }

    function getAgreementTypeMapping(agreementId) {
        var stLogTitle = 'getAgreementTypeMapping|' + agreementId;
        var agreementMappingItem = null;
        var agreementType = null;

        var agreementObj = search.lookupFields({
            type: 'customrecord_ctc_cw_agreement',
            id: agreementId,
            columns: ['name', 'custrecord_ctc_cw_agreement_typename']
        });

        log.audit(stLogTitle, 'agreementObj: ' + JSON.stringify(agreementObj));
        if (agreementObj) {
            agreementType = agreementObj.custrecord_ctc_cw_agreement_typename;
        }

        if (!isEmpty(agreementType)) {

            var cwmiAgreeTypeSearchObj = search.create({
                type: "customrecord_ctc_cwmi_agreement_type",
                filters:
                    [
                        ["name", "contains", agreementType]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name"
                        }),
                        search.createColumn({name: 'custrecord_ctc_cwmi_agreement_type'})
                    ]
            });
            var searchResultCount = cwmiAgreeTypeSearchObj.runPaged().count;
            log.debug("cwmiAgreeTypeSearchObj result count", searchResultCount);

            cwmiAgreeTypeSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                agreementMappingItem = result.getValue({
                    name: 'custrecord_ctc_cwmi_agreement_type'
                });
                var typeName = result.getValue({
                    name: 'name'
                });

                log.debug(stLogTitle, 'search result: ' + agreementMappingItem + JSON.stringify(result));

            });
        }
        return agreementMappingItem;
    }

    function getTicketAgreementId(ticketId) {
        var stLogTitle = 'getTicketAgreementId|' + ticketId;
        var ticketAgreementId = null;

        var ticketObj = search.create({
            type: "customrecord_ctc_cw_servicetickets",
            filters:
                [
                    ["custrecord_ctc_cw_servticket_id", "equalto", ticketId]
                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                    }),
                    search.createColumn({
                        name: "custrecord_ctc_cw_servticket_id"
                    }),
                    search.createColumn({
                        name: "name"
                    }),
                    search.createColumn({
                        name: "custrecord_ctc_cw_servticket_agreement"
                    })
                ]
        });

        var searchResultCount = ticketObj.runPaged().count;
        log.debug("ticketObj result count", searchResultCount);

        ticketObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            ticketAgreementId = result.getValue({
                name: 'custrecord_ctc_cw_servticket_agreement'
            });
            var typeName = result.getValue({
                name: 'name'
            });

            log.debug(stLogTitle, 'search result: ' + JSON.stringify(result));

        });

        log.debug(stLogTitle, 'ticketAgreementId: ' + ticketAgreementId);

        return ticketAgreementId;
    }

    function updateInvoiceLineFixedProj(projMappingItem, current_rec, itemLineCount, serviceTotal, newLocId, cwAgreementApplied) {
        var stLogtitle = 'updateInvoiceLineFixedProj';
        var stat = false;
        try {

            for (var i = itemLineCount - 1; i >= 0; i--) {
                current_rec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                var timeEntryLineLinkId = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ctc_cw_timeentrylink',
                    line: i
                });

                var itemId = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var itemName = current_rec.getCurrentSublistText({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                log.debug(stLogtitle, i + ' |itemId:' + itemId + ' |itemName' + itemName);

                if (timeEntryLineLinkId) {
                    log.debug(stLogtitle, 'Time entry to remove' + timeEntryLineLinkId + ' | item:' + itemName + ' line ' + i);
                    nlapiRemoveLineItem('item', i);
                    current_rec.removeLine({
                        sublistId: 'item',
                        line: i
                    });
                }

                if (itemId === '9733' || itemId === defaultCWFixedFee) { //CW Block Time
                    current_rec.removeLine({
                        sublistId: 'item',
                        line: i
                    });
                }

            }

            log.debug(stLogtitle, 'Adding new item:' + projMappingItem + ' |newLocId' + newLocId);
            current_rec.selectNewLine({
                sublistId: 'item'
            });
            current_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: projMappingItem
            });
            current_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: 1
            });
            current_rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: serviceTotal
            });
            if (!isEmpty(newLocId)) {
                current_rec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    value: newLocId
                });
            }

            current_rec.commitLine({
                sublistId: 'item'
            });
            stat = true;

        } catch (e) {
            log.error(stLogtitle, 'updateInvoiceLineItem error:' + JSON.stringify(e));
        }

        return stat;
    }

    function updateInvoiceLineItem(newLocId, current_rec, itemLineCount, agreementMappingItem, defaultAgreementId, currentAgreementId, serviceTotal, invType) {
        var stLogtitle = 'updateInvoiceLineItem';
        var stat = false;
        log.debug(stLogtitle, 'agreementMappingItem: ' + agreementMappingItem + ' |newLocId: ' + newLocId + ' |itemLineCount:' + itemLineCount);
        log.debug(stLogtitle, 'currentAgreementId: ' + currentAgreementId + '|defaultAgreementId: ' + defaultAgreementId + ' |itemLineCount:' + itemLineCount);
        try {
            for (var i = 0; i < itemLineCount; i++) {
                current_rec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                var itemId = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var itemName = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var loc = current_rec.getCurrentSublistText({
                    sublistId: 'item',
                    fieldId: 'location'
                });

                var qty = current_rec.getCurrentSublistText({
                    sublistId: 'item',
                    fieldId: 'quantity'
                });

                var rate = current_rec.getCurrentSublistText({
                    sublistId: 'item',
                    fieldId: 'rate'
                });


                if (agreementMappingItem) {
                    //change default agreement item to agreement item
                    if ((itemId === defaultAgreementId) && (invType !== 'Standard')) {
                        log.debug(stLogtitle, i + ' |change cw agreement time agreement id: ' + agreementMappingItem);
                        /*
                        current_rec.removeLine({
                            sublistId: 'item',
                            line: i
                        });

                         */

                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: agreementMappingItem,
                            ignoreFieldChange: true
                        });
                        /*
                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: qty
                        });

                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: rate
                        });

                         */

                        if (!isEmpty(newLocId)) {
                            current_rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: newLocId,
                                ignoreFieldChange: true
                            });
                        }

                    }

                    if (itemId === currentAgreementId) { //change blocktime
                        log.debug(stLogtitle, i + ' |change block time agreement id: ' + agreementMappingItem);
                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: agreementMappingItem
                        });

                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: serviceTotal
                        });

                        itemName = current_rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });

                        if (!isEmpty(newLocId)) {
                            current_rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: newLocId,
                                ignoreFieldChange: true
                            });
                        }
                    }

                    if(itemId === defaultCWTimeEntry){
                        log.debug(stLogtitle, i + ' |change cw time entry: ' + agreementMappingItem);
                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: agreementMappingItem
                        });

                        current_rec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: serviceTotal
                        });

                        itemName = current_rec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });

                        if (!isEmpty(newLocId)) {
                            current_rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: newLocId,
                                ignoreFieldChange: true
                            });
                        }

                    }


                } else {
                    if ((itemId === defaultAgreementId) && invType === 'Standard') {
                        current_rec.removeLine({
                            sublistId: 'item',
                            line: i
                        });
                    }
                }


                //update line location
                if (!isEmpty(newLocId)) {
                    current_rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: newLocId,
                        ignoreFieldChange: true
                    });
                }

                log.debug(stLogtitle, i + ' |current item: ' + itemName + '|loc: ' + loc);

                current_rec.commitLine({
                    sublistId: 'item'
                });

            }

            stat = true;
        } catch (e) {
            log.error(stLogtitle, 'updateInvoiceLineItem error:' + JSON.stringify(e));
        }

        return stat;

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
        afterSubmit: afterSubmit
    }
})