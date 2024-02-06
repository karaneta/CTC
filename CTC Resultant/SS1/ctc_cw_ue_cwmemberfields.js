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
 * Script Name:
 * Author: karaneta@nscatalyst.com
 * NApiVersion 1.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * CHANGELOGS
 *
 * Version	Date              Author		              Remarks
 * 1.00		Jan 05, 2024	  karaneta@nscatalyst.com	  Initial Build
 *
 */

function beforeSubmit(type) {
    var stLogTitle = 'beforeSubmit';
    var stContext = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('DEBUG',stLogTitle + ' ' + stContext, '--------------> SCRIPT ENTRY <------------------');

    // if (type === 'create' && nlapiGetContext().getExecutionContext() === 'scheduled') {
    if (type == 'create' || type == 'edit' ){
        var recType = nlapiGetRecordType();
        nlapiLogExecution('DEBUG',stLogTitle, 'recType: ' + recType);

        if(recType == 'customrecord_ctc_cw_member'){
            var pl = nlapiGetFieldValue('custrecord_ctc_cw_member_payload');
            var identifier = nlapiGetFieldValue('custrecord_ctc_cw_member_identifier');
            var empIdentifier = nlapiGetFieldValue('custrecord_ctc_cw_member_empidentifier');
            var plObj = JSON.parse(pl);
            nlapiLogExecution('DEBUG',stLogTitle, 'PAYLOAD OBJ: ' + JSON.stringify(plObj));

            if(isEmpty(identifier)){
                identifier = plObj.identifier;
                nlapiSetFieldValue('custrecord_ctc_cw_member_identifier',identifier);
            }

            if(isEmpty(empIdentifier)){
                empIdentifier = plObj.employeeIdentifer;
                nlapiSetFieldValue('custrecord_ctc_cw_member_empidentifier', empIdentifier);
            }
        }

    }// end create

    nlapiLogExecution('DEBUG',stLogTitle, '--------------> SCRIPT END <------------------');
}// END beforeSubmit

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