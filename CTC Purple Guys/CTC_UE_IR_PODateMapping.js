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
 * Script Name: CTC UE IR CW PO Date Mapping
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
    if (type == 'create' || type == 'edit') {
        var poId = nlapiGetFieldValue('createdfrom');
        nlapiLogExecution('DEBUG', stLogTitle, 'CREATED FROM ' + poId);

        if (poId) {
            var poObject = nlapiLookupField('purchaseorder', poId, ['custbody_ctc_cw_po_link', 'trandate']);
            var cwPOlink = poObject.custbody_ctc_cw_po_link;
            var poDate = poObject.trandate;
            var itemCount = nlapiGetLineItemCount('item');
            var maxDate = new Date(poDate);


            nlapiLogExecution('DEBUG', stLogTitle, 'poObject > ' + JSON.stringify(poObject));
            nlapiLogExecution('DEBUG', stLogTitle, 'maxDate > ' + maxDate);


            if (!isEmpty(cwPOlink)) {
                for (var i = 1; i <= itemCount; i++) {
                    var itemId = nlapiGetLineItemValue('item', 'item', i);
                    var cwPOLineLink = nlapiGetLineItemValue('item', 'custcol_ctc_cw_poline_link', i);
                    nlapiLogExecution('DEBUG', stLogTitle, 'itemId > ' + itemId + ' |cwPOLineLink: ' + cwPOLineLink);


                    var poLineObject = nlapiLookupField('customrecord_ctc_cw_poline', cwPOLineLink, ['name', 'custrecord_ctc_cw_poline_polink', 'custrecord_ctc_cw_poline_lastupdated']);
                    var poLineLastUpdate = poLineObject.custrecord_ctc_cw_poline_lastupdated;
                    nlapiLogExecution('DEBUG', stLogTitle, 'poLineObject > ' + JSON.stringify(poLineObject));
                    poLineLastUpdate = convertJSONStringToDate(poLineLastUpdate);

                    nlapiLogExecution('DEBUG', stLogTitle, 'poLineLastUpdate > ' + poLineLastUpdate);
                    if (maxDate < poLineLastUpdate) {
                        maxDate = poLineLastUpdate;
                        nlapiLogExecution('DEBUG', stLogTitle, 'poLineLastUpdate > ' + poLineLastUpdate + ' |maxDate:' + maxDate);
                    }

                }
            }
            /*
                        var poRecord = nlapiLoadRecord('purchaseorder', poId);
                        var cwPOlink = poRecord.getFieldValue('custbody_ctc_cw_po_link');
                        var poDate = poRecord.getFieldValue('trandate');
                        var itemCount = poRecord.getLineItemCount('item');
                        nlapiLogExecution('DEBUG', stLogTitl 'poRecord > ' + JSON.stringify(poRecord));


                        /*
                        var poObject = nlapiLookupField('purchaseorder', poId, ['custbody_ctc_cw_po_link', 'trandate']);
                        var cwPOlink = poObject.custbody_ctc_cw_po_link;
                        var poDate = poObject.trandate;

                        nlapiLogExecution('DEBUG', stLogTitle, 'poObject > ' + JSON.stringify(poObject));

                         */
            if (!isEmpty(cwPOlink) && !isEmpty(maxDate)) {
                nlapiSetFieldValue('trandate', maxDate);
            }


        }
    }// end if create

    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT END <------------------');
}// END beforeSubmit

//------------------------util functions -------------------------------------
function convertJSONStringToDate(json_date) {
    var stLogTitle = 'convertJSONStringToDate';

    var returnDate = new Date();

    //time format will be in 2005-05-02T00:00:00Z
    var dateString = json_date.split("T")[0];
    //nlapiLogExecution('DEBUG', 'split json date: ' + dateString);
    var newDateString = dateString.replace('-', '/');
    //nlapiLogExecution('DEBUG', 'new date: ' + newDateString);
    newDateString = newDateString.replace('-', '/');
    //nlapiLogExecution('DEBUG', 'new date 2nd: ' + newDateString);

    var finalDate = Date.parse(newDateString);
    returnDate = new Date(finalDate);
    nlapiLogExecution('DEBUG', stLogTitle, 'returnDate > ' + returnDate);
    //returnDate = formatDate(returnDate);
    //nlapiLogExecution('DEBUG', stLogTitle, 'returnDate >formatDate ' + returnDate);

    return returnDate;
}

function formatDate(dateString) {
    var stLogTitle = 'formatDate';

    //dateString = "Wed Jun 07 2023 00:00:00 GMT-0700 (PDT)";
    var date = new Date(dateString);

    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    // Add leading zeros if necessary
    if (day < 10) {
        day = "0" + day;
    }

    if (month < 10) {
        month = "0" + month;
    }

    var formattedDate = day + "/" + month + "/" + year;
    nlapiLogExecution('DEBUG', stLogTitle, 'formattedDate > ' + formattedDate);

    return formattedDate;
}

function convertNSDateToATDateFormat(nsDate, addDays) {
    var returnDate = '';
    try {
        //accepts a netsuite date object
        //output should be YYYY-DD-MMT00:00:00Z
        //// yyyy-mm-ddThh:mm:ss.ms.
        //the standard is called ISO-8601 and the format is: YYYY-MM-DDTHH:mm:ss.sssZ
        if (nsDate) {
            var newdate = nlapiStringToDate(nsDate);
            if (addDays) {
                newdate.setDate(newdate.getDate() + addDays);
            }
            var returnDateTemp = newdate.toISOString();
            if (returnDateTemp) {
                //remove last zero
                returnDate = returnDateTemp.substr(0, 10) + "T00:00:00";
            }
        }
    } catch (err) {
        nlapiLogExecution('ERROR', err);
    }

    return returnDate;
}


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