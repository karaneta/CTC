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
 * Project Number: Service TODO-8639 Script for Prepaid schedule JE's
 * Script Name: CTC UE Amortization JE
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description The script will check the time entry and flag billable whenever the task was tagged as billable regardless of the function copy from previous week.
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Jun 20, 2022	karaneta			Initial Build
 *
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    //declare variable

    function afterSubmit(context) {
        var stLogTitle = 'afterSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));

        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {

            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            var currentType = current_rec.type;

            current_rec = record.load({
                type: record.Type.JOURNAL_ENTRY,
                id: currentID,
                isDynamic: true
            });

            var jeStatus = current_rec.getValue({
                fieldId: 'status'
            });

            var fromAmortization = current_rec.getValue({
                fieldId: 'isfromamortization'
            });

            var jeForSched = current_rec.getValue({
                fieldId: 'custbody_ctc_je_amort_sched'
            });

            var jeAmortDone = current_rec.getValue({
                fieldId: 'custbody_ctc_je_amort_done'
            });

            log.debug(stLogTitle, 'ID:' + currentID + ' | TYPE:' + currentType + ' | JE STATUS:' + jeStatus + ' | IS FROM AMORTIZATION:' + fromAmortization);

            if (jeAmortDone) {
                log.debug({
                    title: stLogTitle,
                    details: 'This Amortization Journal Entry memo was already updated'
                });
                return false;
            }

            if (!(fromAmortization === 'T' || fromAmortization === true)) {
                log.error(stLogTitle, 'NOT FROM AMORTIZATION SCHEDULE');
                return false;
            }

            if (jeForSched) {
                log.debug({
                    title: stLogTitle,
                    details: 'This Journal entry is for Scheduled Script run'
                });
                return false;
            }

            var lineItemCount = current_rec.getLineCount('line');
            log.debug({
                title: stLogTitle,
                details: 'Line count: ' + lineItemCount
            });

            if (isEmpty(lineItemCount)) {
                log.error({
                    title: stLogTitle,
                    details: ' NO LINE ITEM ' + lineItemCount
                });
                return false;
            }

            var lineChanged = false;

            if (lineItemCount > 30) {
                current_rec.setValue({
                    fieldId: 'custbody_ctc_je_amort_sched',
                    value: true
                });

                var recId = current_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug({
                    title: 'SAVE RECORD for Scheduled Script',
                    details: 'RECORD SAVE RETURN: ' + recId
                }); // END IF

            } else {
                lineChanged = processJELines(current_rec, lineItemCount);
            }


            if (lineChanged) {
                current_rec.setValue({
                    fieldId: 'custbody_ctc_je_amort_done',
                    value: true
                });

                var recordID = current_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug({
                    title: 'SAVE RECORD',
                    details: 'RECORD SAVE RETURN: ' + recordID
                }); // END IF
            }

            //return lineChanged;

        } // END IF CONTEXT

    } // END BEFORE SUBMIT


    function processJELines(current_rec, lineItemCount) {
        var stLogTitle = 'processJELines';
        var jeLineChange = false;
        var prevSchedNum;
        var currSchedNum;
        var prevSchedMemo = '';
        var memo;
        var transType;
        var statusReturn = false;
        var loadAmortizationStat;
        //load JE APPROVED FOR POSTING CREATED FROM AMORTIZATION SCHEDULE record
        var amortizationObj, sourceTransactionId, scheduleNum;

        //Process each line get memo form VB item description or JE line memo
        //for (var x = 0; x <= 3; x++) { // for quick test
        for (var x = 0; x <= lineItemCount - 1; x++) {
            current_rec.selectLine({
                sublistId: 'line',
                line: x
            });

            var lineId = current_rec.getCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'department'
            });

            var amortScheduleId = current_rec.getCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'schedulenum'
            });

            currSchedNum = amortScheduleId;

            log.debug({
                title: stLogTitle,
                details: 'LINE: ' + lineId + ' | ' + x + ' of ' + lineItemCount + ' |CURRENT SCHED NO: ' + amortScheduleId + ' |PREV SCHED NO: ' + prevSchedNum
            });


            if (!isEmpty(amortScheduleId) && currSchedNum !== prevSchedNum) {
                //loadAmortizationSched
                amortizationObj = loadAmortizationSched(amortScheduleId, x); //return status, trans type, transid, schednum
                loadAmortizationStat = amortizationObj.returnStatus;
                transType = amortizationObj.transType;
                sourceTransactionId = amortizationObj.sourceTransactionId;
                scheduleNum = amortizationObj.scheduleNum;

                //LOAD SOURCE TRANSACTION = VENDOR BILL
                if (transType === 'VendBill') {
                    var statVB = loadVB(sourceTransactionId, scheduleNum);
                    var vbStatus = statVB.status;
                    log.debug({
                        title: 'LOAD VB RETURN > ' + vbStatus,
                        details: JSON.stringify(statVB)
                    })

                    if (vbStatus) {
                        memo = statVB.vbmemo;
                        statusReturn = vbStatus;
                    }

                }

                //LOAD SOURCE TRANSACTION = JOURNAL ENTRY
                if (transType === 'Journal') {
                    var statJE = loadJE(sourceTransactionId, scheduleNum);
                    var jeSrcStatus = statJE.status;
                    log.debug({
                        title: 'LOAD JE RETURN > ' + jeSrcStatus,
                        details: JSON.stringify(statJE)
                    })

                    if (jeSrcStatus) {
                        //set memo value
                        memo = statJE.jeMemo;
                        statusReturn = jeSrcStatus;
                    }
                }
            } //END IF


            log.debug({
                title: stLogTitle + ' > LINE: ' + lineId + ' | ' + x + ' of ' + lineItemCount + ' |SCHED NO: ' + amortScheduleId,
                details: statusReturn + ' | Memo: ' + memo
            });

            if (!isEmpty(memo) && statusReturn === true) {

                current_rec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: memo,
                    ignoreFieldChange: true
                });

                current_rec.commitLine({
                    sublistId: 'line'
                });

                jeLineChange = true;
            }

            prevSchedNum = currSchedNum;
            prevSchedMemo = memo;

        }// end for loop

        return jeLineChange;

    }

    function loadAmortizationSched(amortScheduleId, x) {
        var stLogTitle = 'loadAmortizationSched';
        var recordMemo;
        var returnStatus = false;
        var amortizationObj = {};

        var amortizationScheduleSearch = search.create({
            type: search.Type.AMORTIZATION_SCHEDULE,
            columns: ['internalid', 'schedulenumber', 'srctran', 'transaction.type'],
            filters: [search.createFilter({
                name: 'internalid',
                join: null,
                operator: search.Operator.IS,
                values: amortScheduleId
            })]
        });

        var resultSet = amortizationScheduleSearch.run();
        var firstResult = resultSet.getRange({
            start: 0,
            end: 1
        })[0];

        log.debug({
            title: stLogTitle,
            details: 'Line Item:' + x + 'Result:' + JSON.stringify(firstResult)
        });

        if (isEmpty(resultSet)) {
            amortizationObj = {
                'returnStatus': false,
                'transType': '',
                'sourceTransactionId': '',
                'scheduleNum': ''
            }
        }

        var scheduleNum = firstResult.getValue(resultSet.columns[1]);
        var sourceTransactionId = firstResult.getValue(resultSet.columns[2]);
        var transType = firstResult.getValue(resultSet.columns[3]);


        log.debug({
            title: stLogTitle,
            details: 'Line Item:' + x + ' | sourceTransactionId: ' + sourceTransactionId + ' | transType: ' + transType
        });

        amortizationObj = {
            'returnStatus': true,
            'transType': transType,
            'sourceTransactionId': sourceTransactionId,
            'scheduleNum': scheduleNum
        }

        return amortizationObj;


    }

    function loadJE(sourceTransactionId, scheduleNum) {
        var stLogTitle = 'loadJE';
        var jeReturnStat = {};

        log.debug({
            title: stLogTitle,
            details: 'JE:' + sourceTransactionId + ' | SCHEDULE NO:' + scheduleNum
        });

        var jeSourceSearch = search.create({
            type: search.Type.JOURNAL_ENTRY,
            columns: ['internalid', 'amortizationSchedule.schedulenumber', 'memo'],
            filters: [search.createFilter({
                name: 'internalid',
                operator: search.Operator.IS,
                values: sourceTransactionId
            }),
                search.createFilter({
                    name: 'schedulenumber',
                    join: 'amortizationschedule',
                    operator: search.Operator.EQUALTO,
                    values: scheduleNum
                })]
        });

        var jeSrcResultSet = jeSourceSearch.run();
        var jefirstResult = jeSrcResultSet.getRange({
            start: 0,
            end: 999
        })[0];

        log.debug({
            title: stLogTitle,
            details: 'vbResultSet:' + JSON.stringify(jefirstResult)
        });

        if (isEmpty(jefirstResult)) {
            jeReturnStat = {
                'status': false,
                'jeAmortSchedule': '',
                'jeMemo': ''
            }
        }

        var amortizationSchedNo = jefirstResult.getValue(jeSrcResultSet.columns[1]);
        var itemDescription = jefirstResult.getValue(jeSrcResultSet.columns[2]);

        jeReturnStat = {
            'status': true,
            'jeAmortSchedule': amortizationSchedNo,
            'jeMemo': itemDescription
        }

        log.debug({
            title: stLogTitle,
            details: 'JE:' + sourceTransactionId + ' | itemDescription:' + amortizationSchedNo + ' | itemDescription' + itemDescription
        });

        return jeReturnStat;

    }

    function loadVB(sourceTransactionId, scheduleNum) {
        var stLogTitle = 'loadVB';
        var vbReturnStat = {};

        var vbSearch = search.create({
            type: search.Type.VENDOR_BILL,
            columns: ['internalid', 'amortizationSchedule.schedulenumber', 'memo'],
            filters: [search.createFilter({
                name: 'internalid',
                operator: search.Operator.IS,
                values: sourceTransactionId
            }),
                search.createFilter({
                    name: 'schedulenumber',
                    join: 'amortizationschedule',
                    operator: search.Operator.EQUALTO,
                    values: scheduleNum
                })]
        });

        var vbResultSet = vbSearch.run();
        var vbfirstResult = vbResultSet.getRange({
            start: 0,
            end: 999
        })[0];


        log.debug({
            title: stLogTitle,
            details: 'vbResultSet:' + JSON.stringify(vbfirstResult)
        });

        if (isEmpty(vbfirstResult)) {
            vbReturnStat = {
                'status': false,
                'vbAmortSchedule': '',
                'vbmemo': ''
            }
        }

        var amortizationSchedNo = vbfirstResult.getValue(vbResultSet.columns[1]);
        var itemDescription = vbfirstResult.getValue(vbResultSet.columns[2]);

        vbReturnStat = {
            'status': true,
            'vbAmortSchedule': amortizationSchedNo,
            'vbmemo': itemDescription
        }

        log.debug({
            title: stLogTitle,
            details: 'VB:' + sourceTransactionId + ' | itemDescription:' + amortizationSchedNo + ' | itemDescription' + itemDescription
        });

        return vbReturnStat;

    }

    function isEmpty(stValue) {
        if ((stValue === '') || (stValue === null) || (stValue === undefined)) {
            return true;
        } else if (typeof stValue == 'object') {
            for (var prop in stValue) {
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
        afterSubmit: afterSubmit
    }
})