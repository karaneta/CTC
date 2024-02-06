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
 * Project Number: 8032
 * Script Name: CTC UE PO CW Location Mapping
 * Author: karaneta@nscatalyst.com
 * NApiVersion 1.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description
 *
 * CHANGELOGS
 *
 * Version    Date              Author                      Remarks
 * 1.00       June 19, 2022      karaneta@nscatalyst.com      Initial Build=
 */

function beforeSubmit(type) {
    var stLogTitle = 'beforeSubmit';
    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT ENTRY <------------------');


    //if (type == 'create' && nlapiGetContext().getExecutionContext() == 'scheduled') {
    if (type == 'create') {
        var cwPOlink = nlapiGetFieldValue('custbody_ctc_cw_po_link');
        var totalLineCount = nlapiGetLineItemCount('item');

        if (cwPOlink) {
            var poObject = nlapiLookupField('customrecord_ctc_cw_po', cwPOlink, ['custrecord_ctc_cw_po_warehouseid', 'custrecord_ctc_cw_po_locationid', 'custrecord_ctc_cw_po_warehousename']);
            var warehouseId = poObject.custrecord_ctc_cw_po_warehouseid;
            var poLocationId = poObject.custrecord_ctc_cw_po_locationid;
            var warehouseName = poObject.custrecord_ctc_cw_po_warehousename;
            var newLocationId = null;

            nlapiLogExecution('DEBUG', stLogTitle, 'poObject > ' + JSON.stringify(poObject));
            nlapiLogExecution('DEBUG', 'CW PO LINK ' + cwPOlink + ' LOCATION: ' + poLocationId + ' |totalLineCount: ' + totalLineCount);
            if (!isEmpty(warehouseName)) {
                newLocationId = getWarehouseMapping(warehouseName);
            }

            if (isEmpty(newLocationId)) {
                nlapiLogExecution('DEBUG', stLogTitle, 'CW PO LINK ' + cwPOlink + 'NO LOCATION MAPPING FOUND');
                return false;
            }
            nlapiLogExecution('DEBUG', stLogTitle, 'SET MAIN LOCATION TO newLocationId: ' + newLocationId);
            nlapiSetFieldValue('location', newLocationId);

            var itemArray = [];
            var itemObj = {
                'item': null,
                'quantity': null,
                'description': null,
                'rate': null,
                'custcol_ctc_cw_prodentrylink': null,
                'custcol_ctc_cw_expentrylink': null,
                'custcol_ctc_cw_timeentrylink': null,
                'custcol_ctc_cw_agreementlink': null
            };

            //Get line item field value
            for (var i = 1; i <= totalLineCount; i++) {
                nlapiSelectLineItem('item', i);
                var itemId = nlapiGetCurrentLineItemValue('item', 'item');
                var qty = nlapiGetCurrentLineItemValue('item', 'quantity');
                var desc = nlapiGetCurrentLineItemValue('item', 'description');
                var rate = nlapiGetCurrentLineItemValue('item', 'rate');
                var loc = nlapiGetCurrentLineItemValue('item', 'location');
                var cwPOLineLink = nlapiGetCurrentLineItemValue('item', 'custcol_ctc_cw_poline_link');
                var poLineLoc;

                var poLineObject = nlapiLookupField('customrecord_ctc_cw_poline', cwPOLineLink, ['name', 'custrecord_ctc_cw_poline_polink', 'custrecord_ctc_cw_poline_lastupdated', 'custrecord_ctc_cw_poline_binname']);
                var poLineWarehouseBin = poLineObject.custrecord_ctc_cw_poline_binname;
                nlapiLogExecution('DEBUG', stLogTitle, 'poLineObject > ' + JSON.stringify(poLineObject));
                if (poLineWarehouseBin) {
                    poLineLoc = getWarehouseMapping(poLineWarehouseBin);
                }

                if (poLineLoc) {
                    nlapiLogExecution('DEBUG', stLogTitle, 'SET PO LINE LOCATION TO poLineLoc: ' + poLineLoc);
                    nlapiSetCurrentLineItemValue('item', 'location', poLineLoc);
                }


                nlapiLogExecution('DEBUG', stLogTitle + ' SETTING LINE LOCATION', i + ' |ITEM: ' + itemId + ' | QTY:' + qty + ' |RATE:' + rate + ' |LOC:' + loc + ' |NEW LOC ID: ' + poLineLoc);
                nlapiCommitLineItem('item');

                /*
                if (!isEmpty(itemId) && !isEmpty(qty) && !isEmpty(rate)) {
                    itemObj = {
                        'item': itemId,
                        'quantity': qty,
                        'description': desc,
                        'rate': rate,
                        'custcol_ctc_cw_poline_link': cwPOLineLink
                    };
                    itemArray.push(itemObj);

                }*/

            }//end for loop

            /*
            //nlapiLogExecution('DEBUG', stLogTitle, 'Item Array Length: ' + itemArray.length);

            if (!isEmpty(itemArray)) {

                if (newLocationId) {
                    var stat = setLineItem(itemArray);
                }

                nlapiLogExecution('DEBUG', 'setLineItem', 'RETURN NEW LOC STAT ' + newLocationId + ' SET LINE ITEM STAT ' + stat);
            }
            */

        }
    }// end if create

    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT END <------------------');
}// END beforeSubmit

function getWarehouseMapping(warehouseName) {
    var stLogTitle = 'getWarehouseMapping';
    nlapiLogExecution('DEBUG', stLogTitle, 'WAREHOUSE NAME: ' + warehouseName);
    var newLoc = null;
    if (warehouseName) {
        var cwmiLocMapSearch = nlapiSearchRecord("customrecord_cwmi_location_map_po", null,
            [
                ["name", "is", warehouseName]
            ],
            [
                new nlobjSearchColumn("name"),
                new nlobjSearchColumn("custrecord_ctc_po_location")
            ]
        );
        if (isEmpty(cwmiLocMapSearch)) {
            return newLoc;
        }
        nlapiLogExecution('DEBUG', stLogTitle, 'cwmiLocMapSearch RESULT: ' + JSON.stringify(cwmiLocMapSearch));
        for (var i = 0; i < cwmiLocMapSearch.length; i++) {
            newLoc = cwmiLocMapSearch[i].getValue('custrecord_ctc_po_location');
            var poName = cwmiLocMapSearch[i].getValue('name');
        }

    }


    return newLoc;

}

function setLineItem(itemArray, locId) {
    var stLogTitle = 'setLineItem';
    var stat = false;
    nlapiLogExecution('DEBUG', stLogTitle, 'ITEM ARRAY: ' + itemArray);
    try {
        for (x = 0; x <= itemArray.length - 1; x++) {
            var itemId = itemArray[x].item;
            var qty = itemArray[x].quantity;
            var desc = itemArray[x].description;
            var rate = itemArray[x].rate;
            var cwPOLineLink = itemArray[x].custcol_ctc_cw_poline_link;

            nlapiSelectNewLineItem('item');
            nlapiSetCurrentLineItemValue('item', 'item', itemId);
            nlapiSetCurrentLineItemValue('item', 'quantity', qty);
            //nlapiSetCurrentLineItemValue('item', 'description',desc); //auto populated
            nlapiSetCurrentLineItemValue('item', 'rate', rate);
            nlapiSetCurrentLineItemValue('item', 'location', locId);
            nlapiSetCurrentLineItemValue('item', 'custcol_ctc_cw_poline_link', cwPOLineLink);
            nlapiCommitLineItem('item');

            nlapiLogExecution('DEBUG', stLogTitle, x + ' |ITEM: ' + itemId + ' | QTY:' + qty + ' |DESC:' + desc + ' |RATE:' + rate);

        }
        stat = true;


    } catch (e) {
        nlapiLogExecution('DEBUG', stLogTitle, e + ' ' + e.message);
    }

    return stat;

}


//------------------------util functions -------------------------------------


function isEmpty(stValue) {

    if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
        return true;
    } else if (typeof stValue == 'object') {
        for (var prop in stValue) {
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