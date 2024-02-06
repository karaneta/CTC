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
 * Script Name: CTC UE SO Retainer
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Jun 20, 2022	karaneta			Initial Build
 *
 */

define(['N/record', 'N/search', 'N/log' , 'N/runtime','SuiteScripts/CTC.Sentinel/CTC.SS2/CTC.Retainer/Retainer_Util.js'], function (record, search,log, runtime,rtnrutil) {

    //declare variable

    function rtnr_afterSubmit(context){
        var stLogTitle = 'rtnr_afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));

        if (context.type === context.UserEventType.CREATE){
            /*
            // GET RETAINER ITEM ID LINKS
            var retainerItemId = runtime.getCurrentScript().getParameter({
                name: 'custscript_ctc_rtnr_item'
            });
            */
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
                fieldId:'entity'
            });

            var isRetainerReference = current_rec.getValue({
                fieldId:'custbody_ctc_is_retainer_reference'
            });

            var retainerId = current_rec.getValue({
                fieldId: 'custbody_ctc_rtnr_inv_retainer'
            });

            var retainerExpiration = current_rec.getValue({
                fieldId: 'custbody_ctc_rtnr_expiration'
            });

            var itemCount = current_rec.getLineCount({
                sublistId: 'item'
            });
            var retainerAmount;


            log.debug(stLogTitle,'isRetainerReference' + isRetainerReference + ' retainerId:' + retainerId + ' itemCount: ' + itemCount);

            for(var i=0; i <= itemCount-1; i++){

                current_rec.selectLine({
                    sublistId:'item',
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

                if(itemId === rtnrutil.fields.retainerItemId){
                    retainerAmount = itemAmount;
                }

                log.debug(stLogTitle,i + ' |itemId: ' + itemId + ' | rate:' + itemAmount);
            }//for


            //Create parent retainer record
            if(isRetainerReference){
                var statCreateId = rtnrutil.createRetainer(customerId, retainerAmount, retainerExpiration);
                if(!rtnrutil.isEmpty(statCreateId)){

                    current_rec.setValue({
                        fieldId: 'custbody_ctc_rtnr_so_retainer',
                        value: statCreateId
                    });

                }
                log.debug(stLogTitle + ' > createRetainer',isRetainerReference + ' |statCreateId: ' + statCreateId);

            }

            //Update child retainer record
            if(!rtnrutil.isEmpty(retainerId)){
                var statUpdate = rtnrutil.updateRetainerCommitted(customerId, retainerId, retainerAmount)

                log.debug(stLogTitle + ' > updateRetainerCommitted',retainerId + ' |statUpdate: ' + statUpdate);

            }

            //Update Retainer Transaction Amount
            current_rec.setValue({
                fieldId: 'custbody_ctc_ret_trans_amount',
                value: retainerAmount,
                ignoreFieldChange: true
            });

            current_rec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            return true;

        } // END IF CONTEXT

    } // END AFTER SUBMIT


    return {
        afterSubmit: rtnr_afterSubmit
    }
})