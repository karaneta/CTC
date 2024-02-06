/**
 * Copyright (c) 2021 Catalyst Tech Corp
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Catalyst Tech Corp. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Catalyst Tech.
 *
 * Project Number: TODO-
 * Script Name: CTC CS Print Retainer
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description
 *
 * CHANGELOGS
 *
 * Version   Date                Author             Remarks
 * 1.00      Jan 12, 2022       karaneta            Initial Build
 *
 */
define(['N/currentRecord','N/url'],
    /**
     * @param{currentRecord} currentRecord
     * @param{url} url
     */
    function(currentRecord,  url) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

        }

        function onPrintClick(customerId){
            var stLogTitle = 'onPrintClick';
            var myRecord = currentRecord.get();
            var customerId = myRecord.id;
            console.log(stLogTitle + 'customerID: ' + customerId);
            log.debug(stLogTitle + 'customerID: ' + customerId);
            if(customerId){
                redirectToSuitelet(customerId);
            }

        }
        function redirectToSuitelet(customerId) {
            var stLogTitle = 'redirectToSuitelet';

            try {
                if (window.onbeforeunload) {
                    window.onbeforeunload = function () {
                        null;
                    };
                }
                var suiteletURL = url.resolveScript({
                    scriptId: 'customscript_ctc_sl_generate_retainerpdf',
                    deploymentId: 'customdeploy_ctc_sl_generate_retainerpdf',
                    returnExternalUrl: false,
                    params: {'custparam_custid':customerId}
                });
                console.log(stLogTitle + ' >>>> ' + suiteletURL);
                window.open(suiteletURL, "_self");
            } catch (err) {
                console.log(stLogTitle + ' >>>> ' + err.toString());
            }
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

        }

        return {
            pageInit: pageInit,
            onPrintClick: onPrintClick,
            saveRecord: saveRecord
        };

    });
