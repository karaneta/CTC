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
 * Project Number: Service TODO-9875 Custom scripts
 * Script Name: CTC UE CW Company Field Mapping
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version    Date            Author            Remarks
 * 1.00       Sept 21, 2023    karaneta            Initial Build
 *
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    //declare variable

    function beforeSubmit(context) {
        var stLogTitle = 'beforeSubmit';
        log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
        if (context.type === 'edit') {
            log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(context));
            var current_rec = context.newRecord;
            var currentID = current_rec.id;
            log.debug(stLogTitle, 'currentID ' + currentID);
            var cmpLink = current_rec.getValue({
                fieldId: 'custrecord_ctc_cw_cmp_link'
            });

            var cmpConversionStat = current_rec.getValue({
                fieldId: 'custrecord_ctc_cw_cmp_conversionstatus'
            });

            log.debug(stLogTitle, 'cmpLink: ' + cmpLink);

            if (!isEmpty(cmpLink) && cmpConversionStat === '3') {

                var cmpObj = search.lookupFields({
                    type: 'customer',
                    id: cmpLink,
                    columns: ['entityid', 'phone', 'isinactive']
                });

                log.audit(stLogTitle, 'Customer Obj: ' + JSON.stringify(cmpObj));

                var cmpPhone = cmpObj.phone;
                var cmpName = cmpObj.entityid;

                var cwCmpPone = current_rec.getValue({
                    fieldId: 'custrecord_ctc_cw_cmp_primaryphone'
                });


                var forUpdate = false;
                //TODO: Update Field Value
                if (cwCmpPone !== cmpPhone) {
                    log.audit(stLogTitle, 'update phone' + cwCmpPone);
                    forUpdate = true;
                }
                
                if (forUpdate === true) {
                    var cust_rec = record.load({
                        type: record.Type.CUSTOMER,
                        id: cmpLink,
                        isDynamic: false
                    });

                    cust_rec.setValue({
                        fieldId: 'phone',
                        value: cwCmpPone
                    });

                    cust_rec.save();

                }


            }

        } // END IF CONTEXT

        log.debug(stLogTitle, '-------------> SCRIPT END <------------------');

    } // END BEFORE SUBMIT

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
        beforeSubmit: beforeSubmit
    }
})