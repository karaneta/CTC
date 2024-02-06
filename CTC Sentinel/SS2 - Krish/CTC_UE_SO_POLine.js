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
 * Project Number: Service TODO-
 * Script Name: CTC UE SO PO LINE TEST
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		AUG 10, 2023	karaneta			Initial Build
 *
 */

define(['N/record', 'N/search', 'N/log', 'N/runtime'], function (record, search, log, runtime) {

    //declare variable

    function testpo_afterSubmit(context) {
        var stLogTitle = 'testpo_afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));

        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var currentType = current_rec.type;
            var transAmount = 0;

            current_rec = record.load({
                type: record.Type.SALES_ORDER,
                id: currentID,
                isDynamic: true
            });

            var customerId = current_rec.getValue({
                fieldId: 'entity'
            });
            log.debug(stLogTitle, 'customerId: ' + customerId);
            var itemCount = current_rec.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i <= itemCount - 1; i++) {

                current_rec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                var itemId = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var itemAmount = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount'
                });

                var createpo = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'createpo'
                });

                log.debug(stLogTitle, i + ' |itemId: ' + itemId + ' | createpo:' + createpo);
            }//for

            return true;

        } // END IF CONTEXT

    } // END AFTER SUBMIT


    return {
        afterSubmit: testpo_afterSubmit
    }
})