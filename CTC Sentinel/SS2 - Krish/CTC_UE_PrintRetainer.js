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
* Project Number: TODO-
* Script Name: CTC UE PRINT Retainer
* Author: karaneta@nscatalyst.com
* @NApiVersion 2.0
* @NScriptType UserEventScript
* @NModuleScope SameAccount
* @description
*
* CHANGELOGS
*
* Version	Date            Author		    Remarks
* 1.00		Sept 9, 2022	karaneta			Initial Build
*
*/


define(['N/record', 'N/search', 'N/currentRecord', 'N/log','N/redirect'], function (record, search,currentRecord,log, redirect ) {


    function beforeLoad(context) {
        var stLogTitle = 'CTC_UE_PRINTINVOICE > beforeLoad';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');

        if (context.type === context.UserEventType.VIEW ){
            var current_rec = context.newRecord;
            var customerId = current_rec.id;
            var currentType = current_rec.type

            log.debug(stLogTitle, customerId + ' | ' + currentType);
            context.form.clientScriptModulePath = './CTC_CS_PrintRetainer.js';

            try{
                context.form.addButton({
                    id: 'custpage_print_pdfinvoice',
                    label: 'Print Retainer',
                    functionName: 'onPrintClick("'+customerId+'")'
                });

            }catch (e) {
                log.error({
                    title: stLogTitle,
                    details: e
                });
            }


        }

    }


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
        beforeLoad: beforeLoad
    }
})