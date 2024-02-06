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
 * Project Number: Service TODO-10630 VC3 | Matrix Mapping
 * Script Name: CTC UE INV Project Service Filter
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version    Date            Author            Remarks
 * 1.00       Jan 26, 2024    karaneta            Initial Build
 *
 */
var cwBlocktime = '18015'; //BLOCK TIME/RETAINER ITEM
var cwTimeEntry = '18008'; //Default Service Item
var cwSalesTax = '18012'; //CW Sales Tax Item
var cwAgreement = '18009'; //CW Agreement Applied
var cwFixedFee = '18014'; //CW Fixed Fee
var cwDownPayment = 99; //CW Downpayment
define(['N/record', 'N/search', 'N/log','N/task','SuiteScripts/CTC.VC3/CTC.SS2/CTC.CWFILTER/CTC.Model.js'], function (record, search, log, task,model) {

    function beforeSubmit(context) {
        var stLogTitle = 'beforeSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        if (context.type === 'create') {
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var billingMethod = null;
            var serviceTotal = 0;
            var processOnScheduled = false;
            var cwInvLink = current_rec.getValue({
                fieldId: 'custbody_ctc_cw_inv_link'
            });
            var itemLineCount = current_rec.getLineCount({
                sublistId: 'item'
            });
            log.debug(stLogTitle, 'cwInvLink: ' + cwInvLink + ' |itemLineCount:' + itemLineCount);
            if (model.isEmpty(itemLineCount)) {
                log.debug(stLogTitle, 'NO LINE ITEM FOUND');
                return;
            }

            if (!model.isEmpty(cwInvLink) && itemLineCount > 0) {
                var invObj = search.lookupFields({
                    type: 'customrecord_ctc_cw_invoices',
                    id: cwInvLink,
                    columns: ['custrecord_ctc_cw_inv_applytotype', 'custrecord_ctc_cw_inv_applytoid','custrecord_ctc_cw_inv_projectid', 'custrecord_ctc_cw_inv_ticketid', 'custrecord_ctc_cw_inv_servicetotal']
                });

                log.audit(stLogTitle, 'invObj: ' + JSON.stringify(invObj));
                var applyToType = invObj.custrecord_ctc_cw_inv_applytotype;
                serviceTotal = invObj.custrecord_ctc_cw_inv_servicetotal;
                var projectId = invObj.custrecord_ctc_cw_inv_projectid;
                var ticketId = invObj.custrecord_ctc_cw_inv_ticketid;
                log.audit(stLogTitle, 'applyToType: ' + applyToType);

                billingMethod = model.getBillingMethod(applyToType,ticketId,projectId);
                log.debug(stLogTitle, 'billingMethod: ' + billingMethod);

                //ACTUAL RATES SCENARIO
                if(billingMethod === 'ActualRates' || billingMethod === 'OverrideRates' ){
                    var arStatus = doARScenario(current_rec, itemLineCount);
                    log.debug(stLogTitle, 'doARScenario stat: ' + arStatus);
                }

                //FIXED FEE SCENARIO
                if(billingMethod === 'FixedFee'){
                    var ffStatus = doFFScenario(current_rec, itemLineCount,cwInvLink,applyToType);
                    log.debug(stLogTitle, 'doARScenario stat: ' + ffStatus);


                }




            }

        } // END IF CONTEXT

        log.debug(stLogTitle, '-------------> SCRIPT END <------------------');

    } // END BEFORE SUBMIT

    function doFFScenario(current_rec,itemLineCount,cwInvLink, applyToType){
        var stLogTitle = 'doFFScenario';
        var mappedItem = null;
        var updateStat = false;
        var itemArray = [];

        try{
            if(cwInvLink){
                var timeEntryArray = model.getLineTicketId(cwInvLink,applyToType);
                log.debug(stLogTitle, "timeEntryArray: " + JSON.stringify(timeEntryArray));

                var newItemArray = model.consolidateItem2(timeEntryArray);
                log.debug(stLogTitle, "newItemArray: " + JSON.stringify(newItemArray));
                var clearStat = model.clearLine(current_rec);

                if(clearStat){
                    //set line item
                    for(var i=0; i < newItemArray.length; i++){
                        var itemRow = newItemArray[i];
                        var itemId = itemRow.item;

                        current_rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i,
                            value: itemId
                        });

                        current_rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i,
                            value: itemRow.quantity
                        });

                        current_rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i,
                            value: itemRow.rate
                        });

                    }
                    //return false;
                }


            }

            updateStat = true;
        }catch (e) {
            log.error(stLogTitle, 'fixed fee error:' + JSON.stringify(e));
        }

        return updateStat;

    }

    function doARScenario(current_rec,itemLineCount){
        var stLogTitle = 'doActualRates';
        var mappedItem = null;
        var updateStat = false;

        try{
            for(var i= 0; i < itemLineCount; i++){
                var itemId = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var qty = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                var rate = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                });

                var description = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: i
                });

                var timeEntryLink = current_rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ctc_cw_timeentrylink',
                    line: i
                });

                if(!model.isEmpty(timeEntryLink)){
                    var timeObj = model.getTimeEntryData(timeEntryLink);
                    var status = timeObj.status;
                    if(status){
                        mappedItem = model.getMappingItem(timeObj,applyToType);
                    }
                }

                if(!model.isEmpty(mappedItem)){
                    log.debug(stLogTitle, i + ' |replace item line: ' + itemId + ' |newItem: ' + mappedItem);
                    current_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i,
                        value: mappedItem
                    });
                    current_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i,
                        value: qty
                    });
                    current_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i,
                        value: rate
                    });
                    current_rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i,
                        value: description
                    });
                }

            }//END FOR
            updateStat = true;
        }catch (e) {
            log.error(stLogTitle, 'actual rates error:' + JSON.stringify(e));
        }

        return updateStat;
    }

    function afterSubmit(context){
        var stLogTitle = 'afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));
        if (context.type === context.UserEventType.CREATE){
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var currentType = current_rec.type;

            var processOnSched =  current_rec.getValue({
                fieldId: 'custbody_ctc_cw_maponsched'
            });
            log.debug(stLogTitle, 'ID:'+ currentID + ' | processOnSched:' + processOnSched);

            if(processOnSched){
                invokeSchedScript(currentID);
            }

            return true;


        }

    }

    function invokeSchedScript(currentID) {
        var stLogTitle = 'invokeSchedScript: '+ currentID;
        try {

            var schedTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_ctc_ss_mapindiline',
                params: {
                    custscript_ctc_ss_mapindiline: currentID
                }
            });
            schedTask.submit();
            log.debug({
                title: stLogTitle,
                details: 'invoked scheduled script params| ' + JSON.stringify(schedTask.params)
            });
        } catch (err) {
            log.debug({title: stLogTitle, details: 'Error=' + err.toString()});
        }
    }


    return {
        beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    }
})