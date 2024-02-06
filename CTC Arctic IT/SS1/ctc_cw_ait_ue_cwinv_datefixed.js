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
 * 1.00		Sept 27, 2022	  karaneta@nscatalyst.com	  Initial Build
 *
 */

function dateFixed(type) {
    var stLogTitle = 'beforeSubmit';
    var stContext = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('DEBUG',stLogTitle + ' ' + stContext, '--------------> SCRIPT ENTRY <------------------');

    // if (type === 'create' && nlapiGetContext().getExecutionContext() === 'scheduled') {
    if (type == 'create' || type == 'edit' ){
        var recType = nlapiGetRecordType();
        nlapiLogExecution('DEBUG',stLogTitle, 'recType: ' + recType);

        if(recType == 'customrecord_ctc_cw_invoices'){
            var pl = nlapiGetFieldValue('custrecord_ctc_cw_inv_payload');
            var dateFixed = nlapiGetFieldValue('custrecord_ctc_date_fixed');
            var dueDateFixed = nlapiGetFieldValue('custrecord_ctc_due_date');
            var plObj = JSON.parse(pl);
            nlapiLogExecution('DEBUG',stLogTitle, 'PAYLOAD OBJ: ' + JSON.stringify(plObj));

            if(isEmpty(dateFixed)){
                dateFixed = plObj.date;
                nlapiSetFieldValue('custrecord_ctc_date_fixed',dateFixed);
            }

            if(isEmpty(dueDateFixed)){
                dueDateFixed = plObj.dueDate;
                nlapiSetFieldValue('custrecord_ctc_due_date', dueDateFixed);
            }
        }

        if(recType == 'customrecord_ctc_cw_expensereport'){
            var payload = nlapiGetFieldValue('custrecord_ctc_cw_exprep_payload');
            var dateStartFixed = nlapiGetFieldValue('custrecord_ctc_cw_date_start_fixed');
            var dateEndFixed = nlapiGetFieldValue('custrecord_ctc_cw_date_end_fixed');
            var dueFixed = nlapiGetFieldValue('custrecord_ctc_cw_er_due_date_fixed');
            var payloadObj = JSON.parse(payload);
            nlapiLogExecution('DEBUG',stLogTitle, 'PAYLOAD OBJ: ' + JSON.stringify(payloadObj));

            if(isEmpty(dateStartFixed)){
                dateStartFixed = payloadObj.dateStart;
                nlapiSetFieldValue('custrecord_ctc_cw_date_start_fixed',dateStartFixed);
            }
            if(isEmpty(dateEndFixed)){
                dateEndFixed = payloadObj.dateEnd;
                nlapiSetFieldValue('custrecord_ctc_cw_date_end_fixed',dateEndFixed);
            }
            if(isEmpty(dueFixed)){
                dueFixed = payloadObj.dueDate;
                nlapiSetFieldValue('custrecord_ctc_cw_er_due_date_fixed', dueFixed);
            }
        }

        if(recType == 'customrecord_ctc_cw_expense'){
            var payload = nlapiGetFieldValue('custrecord_ctc_cw_expense_payload');
            var dateFixed = nlapiGetFieldValue('custrecord_ctc_cw_exp_date_fixed');
            var payloadObj = JSON.parse(payload);
            nlapiLogExecution('DEBUG',stLogTitle, 'PAYLOAD OBJ: ' + JSON.stringify(payloadObj));

            if(isEmpty(dateFixed)){
                dateFixed = payloadObj.date;
                nlapiSetFieldValue('custrecord_ctc_cw_exp_date_fixed',dateFixed);
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