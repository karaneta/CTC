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
 * Script Name: CTC UE INV Retainer
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Sept 26, 2022	karaneta			Initial Build
 *
 */
define(['N/record', 'N/search', 'N/log' , 'N/runtime', 'SuiteScripts/CTC.Sentinel/CTC.SS2/CTC.Retainer/Retainer_Util.js'],
    function (record, search,log,  runtime, rtnrutil) {

    //declare variable

    function rtnr_afterSubmit(context){
        var stLogTitle = 'rtnr_afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));

        //if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE){
        if (context.type === context.UserEventType.CREATE){

            // GET RETAINER ITEM ID LINKS
            /*
            var retainerItemId = runtime.getCurrentScript().getParameter({
                name: 'custscript_ctc_rtnr_item'
            });
            log.debug(stLogTitle, 'retainerItemId ' + retainerItemId);

             */

            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var currentType = current_rec.type;
            var retItemAmount = 0;
            var retainerAmount = 0;
            var transAmount = 0;

            current_rec = record.load({
                type: record.Type.INVOICE,
                id: currentID,
                isDynamic: true
            });

            var customerId = current_rec.getValue({
                fieldId:'entity'
            });

            var isRetainerReference = current_rec.getValue({
                fieldId:'custbody_ctc_is_retainer_reference'
            });

            var parentRetainerId = current_rec.getValue({
                fieldId: 'custbody_ctc_rtnr_so_retainer'
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

            var totalTax = current_rec.getValue({
                fieldId: 'taxtotal'
            });

            var retTransAmount =  current_rec.getValue({
                fieldId: 'custbody_ctc_ret_trans_amount'
            });


            log.debug(stLogTitle,'isRetainerReference' + isRetainerReference + ' |parentRetainerId:' + parentRetainerId +' |retainerId:' + retainerId + ' itemCount: ' + itemCount + ' |totalTax:' + totalTax);

            for(var i=0; i <= itemCount-1; i++){

                current_rec.selectLine({
                    sublistId:'item',
                    line: i
                });

                var itemId = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                retItemAmount = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount'
                });

                if(itemId === rtnrutil.fields.retainerItemId){
                    retItemAmount = Math.abs(retItemAmount);
                }
                log.debug(stLogTitle,i + ' |itemId: ' + itemId + ' | retItemAmount:' + retItemAmount);
            }//end for

            retainerAmount = retItemAmount;
            log.debug(stLogTitle,'retainerAmount:' + retainerAmount);

            //Update/activate parent retainer record
            if(isRetainerReference){
                if(!rtnrutil.isEmpty(parentRetainerId)){
                    var statUpdatePRId = rtnrutil.updateActivateParentRetainer(parentRetainerId, retainerAmount, retainerExpiration);

                    log.debug(stLogTitle + ' > updateActivateParentRetainer',isRetainerReference + ' |statCreateId: ' + statUpdatePRId);
                }

            }

            //Update billed retainer record
            if(!rtnrutil.isEmpty(retainerId) && !rtnrutil.isEmpty(retainerAmount)){
                /*
                if(totalTax !== 0 || totalTax !== '0'){
                    retainerAmount =  Math.abs(retainerAmount);
                    totalTax = Math.abs(totalTax);
                    retainerAmount = retainerAmount + totalTax;
                    retainerAmount = -retainerAmount;
                }

                 */
                var statUpdate = rtnrutil.updateRetainerBilled(retainerId, retainerAmount)

                log.debug(stLogTitle + ' > updateRetainerBilled',retainerId + ' |statUpdate: ' + statUpdate);

            }

            //Update customer total retainer balance
            if(!rtnrutil.isEmpty(customerId)){
                var custRetUpdate = rtnrutil.getCustomerRetainerBalance(customerId)

                log.debug(stLogTitle + ' > updateBilled',retainerId + ' | getCustomerRetainerBalance: ' + custRetUpdate);

            }

            log.debug(stLogTitle,'transAmount:' + retainerAmount);

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
