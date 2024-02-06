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
 * Script Name: CTC UE Retainer
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Dec 12, 2022	karaneta	    Initial Build
 *
 */
define(['N/record', 'N/search', 'N/log' ,'SuiteScripts/CTC.Sentinel/CTC.SS2/CTC.Retainer/Retainer_Util.js'],
    function (record, search,log, rtnrutil) {

        //declare variable

        function rtnr_afterSubmit(context){
            var stLogTitle = 'rtnr_afterSubmit';
            log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
            log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));

            //if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE){
            if (context.type === 'create' || context.type === 'edit'){

                var current_rec = context.newRecord;
                var retainerId = current_rec.id;
                var currentType = current_rec.type; //customrecord_ctc_retainer
                var retainerAmount;

                current_rec = record.load({
                    type: 'customrecord_ctc_retainer',
                    id: retainerId,
                    isDynamic: true
                });

                var retainerName = current_rec.getValue({
                    fieldId:'name'
                });

                var customerId = current_rec.getValue({
                    fieldId:'custrecord_ctc_rtnr_customer_ref'
                });

                var retainerExpiration = current_rec.getValue({
                    fieldId: 'custrecord_ctc_rtnr_end_date'
                });

                var retainerStatus = current_rec.getValue({
                    fieldId: 'custrecord_ctc_rtnr_status'
                });

                var retainerBudget = current_rec.getValue({
                    fieldId: 'custrecord_ctc_rtnr_total_budget'
                });
                retainerBudget = Math.abs(retainerBudget);

                var retainerBudgAdj = current_rec.getValue({
                    fieldId: 'custrecord_ctc_rtnr_total_bgt_adjustment'
                });
                retainerBudgAdj =  Math.abs(retainerBudgAdj);

                var retainerBilled = current_rec.getValue({
                    fieldId: 'custrecord_ctc_rtnr_total_billed'
                });
                retainerBilled =  Math.abs(retainerBilled);

                var retainerRemaining = current_rec.getValue({
                    fieldId: 'custrecord_ctc_rtnr_total_bgt_remaining'
                });

                if(retainerStatus !== '4'){
                    log.debug(stLogTitle, retainerBudget + ' | Retainer billed: '+ retainerBilled);
                    retainerAmount = retainerBudget + retainerBudgAdj;
                    retainerAmount = retainerAmount - retainerBilled;
                    log.debug(stLogTitle, 'RETAINER AMOUNT:' + retainerAmount);

                    //Update billed retainer record
                    var retId = record.submitFields({
                        type: 'customrecord_ctc_retainer',
                        id: retainerId,
                        values: {
                            'custrecord_ctc_rtnr_total_bgt_remaining': retainerAmount
                        },
                        options: {
                            enableSourcing: true
                        }
                    });
                    log.debug(stLogTitle, 'RETAINER UPDATE:' + retId);


                    //Update customer total retainer balance
                    if(!rtnrutil.isEmpty(customerId)){
                        var custRetUpdate = rtnrutil.getCustomerRetainerBalance(customerId)
                        if(!rtnrutil.isEmpty(custRetUpdate)){
                            return true;
                        }

                        log.debug(stLogTitle + ' > updateBilled',retainerId + ' | getCustomerRetainerBalance: ' + custRetUpdate);

                    }

                }      // end if expired or closed


            } // END IF CONTEXT

        } // END AFTER SUBMIT

        return {
            afterSubmit: rtnr_afterSubmit
        }
    })
