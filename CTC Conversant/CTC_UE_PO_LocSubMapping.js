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
 * Script Name: CTC UE PO LOCATION MAPPING
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version    Date            Author            Remarks
 * 1.00       Sept 22, 2023    karaneta            Initial Build
 *
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    //declare variable

    function beforeSubmit(context) {
        var stLogTitle = 'beforeSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        if (context.type === 'create') {
            log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var locationId = null;
            var newSubId = null;
            var currSub = null;
            var itemLineCount = 0;
            var cwPoLink = current_rec.getValue({
                fieldId: 'custbody_ctc_cw_po_link'
            });

            currSub = current_rec.getValue({
                fieldId: 'subsidiary'
            });

            itemLineCount = current_rec.getLineCount({
                sublistId: 'item'
            });


            log.debug(stLogTitle, 'cwPoLink: ' + cwPoLink + ' |currSub' + currSub);
            if (isEmpty(itemLineCount)) {
                log.debug(stLogTitle, 'NO LINE ITEM FOUND');
                //return false;
            }

            if (cwPoLink) {
                var poObj = search.lookupFields({
                    type: 'customrecord_ctc_cw_po',
                    id: cwPoLink,
                    columns: ['custrecord_ctc_cw_po_locationid', 'name']
                });

                log.audit(stLogTitle, 'poObj: ' + JSON.stringify(poObj));
                locationId = poObj.custrecord_ctc_cw_po_locationid;

                if (locationId) {
                    newSubId = getSubLocMapping(locationId);

                }

                //TODO: SET FIELD VALUE
                var itemArray = null;
                var itemCount = null;
                var lineCleared = false;
                log.audit(stLogTitle, 'newSubId: ' + newSubId + ' |currSub: ' + currSub);

                if (!isEmpty(newSubId) && newSubId !== currSub) {
                    if (itemLineCount > 0) {
                        itemArray = getLineItemDetails(current_rec, itemLineCount);
                        itemCount = itemArray.length;
                    }
                    log.debug(stLogTitle, 'itemCount: ' + itemCount);

                    if (itemLineCount > 0 && itemCount > 0) {
                        current_rec.setValue({
                            fieldId: 'subsidiary',
                            value: newSubId
                        });

                        lineCleared = true;
                    }

                }

                log.debug(stLogTitle, 'itemArray: ' + JSON.stringify(itemArray));

                //set back line items
                if (lineCleared === true) {
                    var resetStat = setLineItemDetails(current_rec, itemArray, itemCount);
                    log.debug(stLogTitle, 'setLineItemDetails: ' + resetStat);
                }

            }

        } // END IF CONTEXT

        log.debug(stLogTitle, '-------------> SCRIPT END <------------------');

    } // END BEFORE SUBMIT

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

                var poLink = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ctc_cw_poline_link',
                    line: i
                });

                var itemObj = {
                    'item': itemId,
                    'quantity': qty,
                    'rate': r,
                    'description': desc,
                    'polink': poLink
                };

                log.audit(stLogtitle, i + ' |itemObj' + JSON.stringify(itemObj));

                itemArray.push(itemObj)

            }

        } catch (e) {
            log.error(stLogtitle, 'getLineItemDetails error:' + JSON.stringify(e));
        }

        log.debug(stLogtitle, 'itemArray' + JSON.stringify(itemArray));

        return itemArray;
    }

    function setLineItemDetails(current_rec, itemArray, itemLineCount) {
        var stLogtitle = 'setLineItemDetails';
        var stat = false;
        log.debug(stLogtitle, itemLineCount + ' |itemArray: ' + JSON.stringify(itemArray));
        try {

            for (var i = 0; i < itemLineCount; i++) {
                var itemRow = itemArray[i];
                log.audit(stLogtitle, 'itemRow:' + JSON.stringify(itemRow));
                current_rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                    value: itemRow.item,
                    ignoreFieldChange: true
                });

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
                if (itemRow.polink) {
                    current_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ctc_cw_poline_link',
                        line: i,
                        value: itemRow.polink
                    });
                }

            } //for
            stat = true;


        } catch (e) {
            log.error(stLogtitle, 'error:' + JSON.stringify(e));
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
        beforeSubmit: beforeSubmit
    }
})