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
 * Script Name:CTC CW Expense Status Check
 * Author: karaneta@nscatalyst.com
 * NApiVersion 1.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * CHANGELOGS
 *
 * Version	Date              Author		              Remarks
 * 1.00		Aug 16, 2023	  karaneta@nscatalyst.com	  Initial Build
 * 1.01		Aug 16, 2023	  karaneta@nscatalyst.com	  Process only records start after Oct 1, 2023
 *
 */

function afterSubmit(type) {
    var stLogTitle = 'afterSubmit';
    var context = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT ENTRY <------------------');
    //nlapiLogExecution('AUDIT', stLogTitle, 'CONTEXT > ' + context);
    //nlapiLogExecution('AUDIT', stLogTitle, 'type > ' + type);
    var currRecordId = nlapiGetRecordId();
    nlapiLogExecution("DEBUG", stLogTitle, 'EXPENSE ID:' + currRecordId);
    var expenseReportId = nlapiGetFieldValue('custrecord_ctc_cw_expense_expreportname');
    nlapiLogExecution("DEBUG", stLogTitle, 'expenseReportId:' + expenseReportId);

    if (type == 'create' || type == 'edit') {

        if (!isEmpty(expenseReportId)) {
            var isDoNotConvert = false;
            var erStatus = 'ReadyToBill';
            var erObj = nlapiLookupField('customrecord_ctc_cw_expensereport', expenseReportId, ['custrecord_ctc_cw_exprep_conversionstat', 'custrecord_ctc_cw_exprep_link', 'name', 'custrecord_ctc_cw_exprep_datestart']);
            var erConversionStat = erObj.custrecord_ctc_cw_exprep_conversionstat;
            var erNSLink = erObj.custrecord_ctc_cw_exprep_link;
            var erStartDate = erObj.custrecord_ctc_cw_exprep_datestart;
            nlapiLogExecution('AUDIT', stLogTitle, 'erObj > ' + JSON.stringify(erObj));
            var toProcess = false;

            if(!isEmpty(erStartDate)){
                var dateToCheck = new Date(erStartDate);
                var dateValid = new Date('10/1/2023');

                if (dateToCheck >= dateValid) {
                    toProcess = true;
                    nlapiLogExecution('DEBUG', 'Date Check', 'The date is on or after October 1, 2023.');
                }
            }

            if(toProcess){
                var erSearchResult = nlapiSearchRecord("customrecord_ctc_cw_expensereport", null,
                    [
                        ["internalid", "anyof", expenseReportId]
                    ],
                    [
                        new nlobjSearchColumn("name").setSort(false),
                        new nlobjSearchColumn("name", "CUSTRECORD_CTC_CW_EXPENSE_EXPREPORTNAME", null),
                        new nlobjSearchColumn("custrecord_ctc_cw_expense_billamount", "CUSTRECORD_CTC_CW_EXPENSE_EXPREPORTNAME", null),
                        new nlobjSearchColumn("custrecord_ctc_cw_expense_status", "CUSTRECORD_CTC_CW_EXPENSE_EXPREPORTNAME", null)
                    ]
                );
                //nlapiLogExecution('AUDIT', stLogTitle, 'erSearchResult > ' + JSON.stringify(erSearchResult));

                for (var i = 0; i < erSearchResult.length; i++) {
                    var result = erSearchResult[i];
                    var expName = result.getValue("custrecord_ctc_cw_expense_billamount", "CUSTRECORD_CTC_CW_EXPENSE_EXPREPORTNAME");
                    var expStat = result.getValue("custrecord_ctc_cw_expense_status", "CUSTRECORD_CTC_CW_EXPENSE_EXPREPORTNAME");

                    if (expStat !== erStatus) {
                        isDoNotConvert = true;
                    }

                    nlapiLogExecution('AUDIT', stLogTitle, 'expName: ' + expName + ' |expStat:' + expStat);

                }

                nlapiLogExecution('AUDIT', stLogTitle, 'isDoNotConvert > ' + isDoNotConvert);

                if (isEmpty(erNSLink) && erConversionStat !== '3') {
                    if (isDoNotConvert == true) {
                        //set conversion stat to do not convert
                        nlapiSubmitField('customrecord_ctc_cw_expensereport', expenseReportId, 'custrecord_ctc_cw_exprep_conversionstat', '4');
                    } else {
                        nlapiSubmitField('customrecord_ctc_cw_expensereport', expenseReportId, 'custrecord_ctc_cw_exprep_conversionstat', '1');
                    }

                }
            }

        }

    }
    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT END <------------------');

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