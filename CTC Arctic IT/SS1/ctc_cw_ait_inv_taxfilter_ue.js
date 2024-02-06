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
 * Project Number: 8887 Arctic IT Tax Code id mapping
 * Script Name: CTC UE Invoice Tax Code ID Mapping
 * Author: karaneta@nscatalyst.com
 * NApiVersion 1.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description CW Invoice conversion filter tax code id mapping
 *
 * CHANGELOGS
 *
 * Version	Date              Author		              Remarks
 * 1.00		Sept 15, 2022	  karaneta@nscatalyst.com	  Initial Build
 * 1.01     Oct 14, 2022      karaneta@nscatalyst.com     Create mapping for cw downpayment item department and location
 */

function beforeSubmit(type) {
    var stLogTitle = 'beforeSubmit';
    var stContext = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('DEBUG',stLogTitle + ' |C: ' + stContext + ' |T: ' + type, '--------------> SCRIPT ENTRY <------------------');


    if (type == 'create' && (stContext == 'scheduled' || stContext == 'suitelet')){
        var totalLineCount = nlapiGetLineItemCount('item');
        var cwInvLink = nlapiGetFieldValue('custbody_ctc_cw_inv_link');
        var cwTaxCodeId;
        var newTaxCode;
        var cwInvType;
        var cwLocId;
        var cwDeptId;
        var cwClassId;
        var dpAppliedAmount;

        if(cwInvLink){
            var invObject = nlapiLookupField('customrecord_ctc_cw_invoices', cwInvLink, ['custrecord_ctc_cw_inv_taxcodeid', 'custrecord_ctc_cw_inv_type', 'custrecord_ctc_cw_inv_locationid', 'custrecord_ctc_cw_inv_departmentid', 'custrecord_ctc_cw_inv_territoryid', 'custrecord_ctc_cw_inv_downpaymentapplied']);
            cwTaxCodeId = invObject.custrecord_ctc_cw_inv_taxcodeid;
            cwInvType = invObject.custrecord_ctc_cw_inv_type;
            cwLocId= invObject.custrecord_ctc_cw_inv_locationid;


            nlapiLogExecution('DEBUG', 'Invoice link', JSON.stringify(invObject));
            nlapiLogExecution('DEBUG', 'CW TAX CODE ID: ' + cwTaxCodeId);
            if(cwTaxCodeId){
                newTaxCode = getTaxCode(cwTaxCodeId);
            }

            nlapiLogExecution('DEBUG', 'NEW TAX CODE ID: ' + newTaxCode);

            if(!isEmpty(newTaxCode) && !isEmpty(totalLineCount)){
                var itemObj = {
                    'quantity': null,
                    'rate': null
                };

                //Get remove CW Sales Tax item
                for (var i = 1; i <= totalLineCount; i++) {

                    var itemId = nlapiGetLineItemValue('item', 'item', i);
                    var qty = nlapiGetLineItemValue('item', 'quantity', i);
                    var desc = nlapiGetLineItemValue('item', 'description', i);
                    var rate = nlapiGetLineItemValue('item', 'rate', i);
                    nlapiLogExecution('DEBUG',stLogTitle, i + ' |ITEM: '+ itemId + ' | QTY:' + qty + ' |DESC:' + desc + ' |RATE:'+rate);

                    if(itemId == '718'){ //CW Sales Tax item
                        itemObj = {
                            'quantity': qty,
                            'rate': rate
                        };
                        //remove CW Sales Tax item
                        nlapiRemoveLineItem('item',i);
                    }
                }//end for loop

                //set new tax line
                if(!isEmpty(itemObj.quantity) && !isEmpty(itemObj.rate)) {
                    nlapiSelectNewLineItem('item');
                    nlapiSetCurrentLineItemValue('item', 'item', newTaxCode);
                    nlapiSetCurrentLineItemValue('item', 'quantity',itemObj.quantity);
                    nlapiSetCurrentLineItemValue('item', 'rate',itemObj.rate);
                    nlapiCommitLineItem('item');
                    nlapiLogExecution('DEBUG','ITEM ADDED', 'ITEM: '+ newTaxCode+ ' | QTY:' + itemObj.quantity + ' |RATE:'+ itemObj.rate);

                }

            }

            //Update CW Downpayment Item details on NS invoice
            if((cwInvType == 'DownPayment' || !isEmpty(dpAppliedAmount)) && !isEmpty(totalLineCount)){
                var statReturn = updateDownpaymentItem(totalLineCount, cwLocId, cwDeptId, cwClassId);
                nlapiLogExecution('DEBUG','DownPayment Update', 'Status Return: ' + statReturn);

            }


        }


    }// end create

    nlapiLogExecution('DEBUG',stLogTitle, '--------------> SCRIPT END <------------------');
}// END beforeSubmit

//------------------------util functions -------------------------------------
function getTaxCode(cwTaxCodeId){
    var stLogTitle = 'getTaxCode';
    nlapiLogExecution('DEBUG',stLogTitle, 'TAX CODE ID=> ' + cwTaxCodeId);
    var taxCode;

    switch (cwTaxCodeId) { //custrecord_ctc_cw_inv_taxcodename
        case '16': //FEDWAYWA
            taxCode = '476'; //Sales Tax Payable - WA
            break;
        case '19': //EVERETWA
            taxCode = '476'; //Sales Tax Payable - WA
            break;
        case '20': //SEAWA
            taxCode = '476'; //Sales Tax Payable - WA
            break;
        case '21': //PASCOWA
            taxCode = '476'; //Sales Tax Payable - WA
            break;
        case '22': //GEGWA
            taxCode = '476'; //Sales Tax Payable - WA
            break;
        case '23': //TACWA
            taxCode = '476'; //Sales Tax Payable - WA
            break;
        case '25': //TL TX
            taxCode = '475'; //Sales Tax Payable - TX
            break;
        case '26': //FW TX
            taxCode = '475'; //Sales Tax Payable - TX
            break;
        case '8': //FL
            taxCode = '474'; //Sales Tax Payable - TX
            break;
        default:
            taxCode = '';
    }// END SWITCH

    return taxCode;
}

function updateDownpaymentItem(totalLineCount, cwLocId, cwDeptId, cwClassId){
    var stLogTitle = 'updateDownpaymentItem';

    //Update cw downpayment item details
    for (var i = 1; i <= totalLineCount; i++) {

        var itemId = nlapiGetLineItemValue('item', 'item', i);
        nlapiLogExecution('DEBUG',stLogTitle, i + ' |ITEM: '+ itemId);

        if(itemId == '719'){ //CW Downpayment

            nlapiSelectLineItem('item', i);
            //if(cwClassId) { nlapiSetCurrentLineItemValue('item', 'class',cwClassId); }
            if(cwLocId) {
                var locationId = getLocationId(cwLocId);
                if(locationId)
                nlapiSetCurrentLineItemValue('item', 'location', locationId); }
            if(cwDeptId){
                var deptId = getDepartmentId(cwDeptId);
                if(deptId)
                nlapiSetCurrentLineItemValue('item', 'department',deptId); }
            nlapiCommitLineItem('item');
            nlapiLogExecution('DEBUG',stLogTitle, 'ITEM: '+ itemId+ ' | CLASS:' + cwClassId+ ' |DEPT:'+ deptId + ' |LOC:' + locationId);
            return true;
        }
    }//end for loop

    return false;
}

function getLocationId(cwLocId){
    var stLogTitle = 'getLocationId';
    var locId;

    switch (cwLocId) { //custrecord_ctc_cw_inv_locationid
        case '31':
            locId = '1'; //Corporate
            break;
        case '11':
            locId = '2'; //ANC
            break;
        case '30':
            locId = '3'; //National
            break;
        case '32':
            locId = '4'; //DFW
            break;
    }// END SWITCH

    nlapiLogExecution('DEBUG',stLogTitle, 'CW Location Id=> ' + cwLocId + ' |locId:' + locId);

    return locId;
}

function getDepartmentId(cwDeptId){
    var stLogTitle = 'getDepartmentId';
    var deptId;

    switch (cwDeptId) { //custrecord_ctc_cw_inv_departmentid
        case '20':
            deptId = '1'; //Corporate
            break;
        case '23':
            deptId = '2'; //Internal Operations
            break;
        case '26':
            deptId = '3'; //Executive
            break;
        case '10':
            deptId = '6'; //ArcticCare
            break;
        case '22':
            deptId = '7'; //ArcticAscend
            break;
        case '18':
            deptId = '8'; //Professional Services
            break;
        case '25':
            deptId = '8'; //Professional Services
            break;
        case '24':
            deptId = '8'; //Professional Services
            break;
        case '19':
            deptId = '9'; //Marketing
            break;
        case '14':
            deptId = '10'; //Tech Sales
            break;
        case '21':
            deptId = '12'; //Product
            break;
        case '28':
            deptId = '17'; //Tribal Platforms
            break;
    }// END SWITCH
    nlapiLogExecution('DEBUG',stLogTitle, 'CW Department id=> ' + cwDeptId + ' |deptId:' + deptId);

    return deptId;

}

function isEmpty(stValue) {

    if ((stValue == '') || (stValue == null) || (stValue == undefined) || (stValue == '0') || (stValue == 0)) {
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