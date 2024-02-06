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
 * Script Name: CTC SS Update Expired Retainer
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Dec 1, 2022 	karaneta		Initial Build
 *
 */
define(['N/record', 'N/search', 'N/log'],
    /**
     * @param{record} record
     * @param{search} search
     * @param log
     */
    function (record, search, log) {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} context
         * @param {string} context.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        function execute(context) {
            var stLogTitle = "CTC SS Update expired retainer > Execute";
            log.debug({
                title: stLogTitle,
                details: '-----------------> Script entry <------------------'
            });

            try {
                var dateToday = new Date();
                /*
                var dd = String(dateToday.getDate()).padStart(2, '0');
                var mm = String(dateToday.getMonth() + 1).padStart(2, '0'); //January is 0!
                var yyyy = dateToday.getFullYear();
                dateToday = mm + '/' + dd + '/' + yyyy;
                */

                log.debug({
                    title: stLogTitle,
                    details: 'dateToday: ' + dateToday
                });

                var retainerSearch = search.create({
                    type: 'customrecord_ctc_retainer',
                    columns: ['internalid', 'name', 'custrecord_ctc_rtnr_status', 'custrecord_ctc_rtnr_end_date'],
                    filters: [search.createFilter({
                        name: 'custrecord_ctc_rtnr_end_date',
                        operator: search.Operator.BEFORE,
                        values: 'today'
                    }),
                    search.createFilter({
                        name: 'custrecord_ctc_rtnr_status',
                        operator: search.Operator.NONEOF,
                        values: ['4', '3'] //EXPIRED AND CLOSED
                    })]
                });

                var retainerResult = retainerSearch.run().getRange({
                    start: 0,
                    end: 999
                });

                var updateExpiredArray = [];


                if (!isEmpty(retainerResult)) {
                    for (var i = 0; i < retainerResult.length; i++) {
                        var retainerId = retainerResult[0].getValue('internalid');
                        var retainerName = retainerResult[0].getValue('name');
                        var retainerStatus = retainerResult[0].getValue('custrecord_ctc_rtnr_status');
                        var retainerEndDate = retainerResult[0].getValue('custrecord_ctc_rtnr_end_date');

                        log.debug({
                            title: stLogTitle,
                            details: i+ ' EXPIRED RETAINER RESULT: ' + retainerName + ' |End date:' + retainerEndDate
                        });

                        // update set to status expired
                        var retId = record.submitFields({
                            type: 'customrecord_ctc_retainer',
                            id: retainerId,
                            values: {
                                'custrecord_ctc_rtnr_status': '4' //expired
                            },
                            options: {
                                enableSourcing: true
                            }
                        });

                        updateExpiredArray.push(retId);
                    }
                }

                if(!isEmpty(updateExpiredArray)){
                    log.debug({
                        title: 'Updated Expired Retainer',
                        details: updateExpiredArray
                    });
                }

            }catch (e) {
                log.error({
                    title: stLogTitle,
                    details: e
                });
            }

            log.debug({
                title: stLogTitle,
                details: '-----------------> Script end <------------------'
            });

        }// end execute

        function isEmpty(stValue) {
            if ((stValue === '') || (stValue === null)
                || (stValue === undefined) || (stValue === 0)) {
                return true;
            } else {
                if (typeof stValue === 'string') {
                    if ((stValue === '')) {
                        return true;
                    }
                } else if (typeof stValue === 'object') {
                    if (stValue.length === 0
                        || stValue.length === 'undefined') {
                        return true;
                    }
                }

                return false;
            }
        } // END IS EMPTY

        return {
            execute: execute
        };

    });
