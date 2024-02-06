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
 * Script Name: CTC CW CS CW Site Link
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description
 *
 * CHANGELOGS
 *
 * Version   Date                Author                   Remarks
 * 1.00      Sept 26, 2022       karaneta            Initial Build, Get CW Site link of updated address
 */
define(['N/currentRecord', 'N/log','N/search'],
    /**
     * @param{currentRecord} currentRecord
     * @param log
     * @param search
     */
    function(currentRecord, log, search) {

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

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            var stLogTitle = 'validateLine';
            //log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(scriptContext));

            var current_rec = scriptContext.currentRecord;
            var current_sublist = scriptContext.sublistId;
            var cwSiteLink = current_rec.getValue({fieldId:'custentity_ctc_cw_sitelinkup'});
            var cwSiteLinkEntity = current_rec.getValue({fieldId:'custrecord_ctc_cw_sitelink'});
            log.debug(stLogTitle,'cwSiteLinkEntity: ' + cwSiteLinkEntity);

            // if sublist is item and not a parent retainer
            if(current_sublist === 'addressbook'){
                var cwSiteInternalId = current_rec.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'custrecord_ctc_cw_sitelink'
                });

                var addressLineId = current_rec.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'internalid'
                });

                var addressid = current_rec.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'addressid'
                });

                var addId = current_rec.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'id'
                });


                //alert('ADDRESS INTERNAL ID: '+ addressLineId + ' |cwSiteInternalId:' + cwSiteInternalId + ' |addressid:' +addressid + ' |addId: ' + addId);

                log.debug(stLogTitle, 'cwSiteInternalId:' + cwSiteInternalId + ' |addressLineId:'+ addressLineId + ' |addId:' + addId);
                if(addressLineId){
                    current_rec.setValue({
                        fieldId: 'custentity_ctc_cw_sitelinkup',
                        value: addressLineId
                    });
                }



              //  return validateChildStat;
            }

            return true;

        }


        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

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
            var stLogTitle = 'Save Record';


        } //save record


        return {
            //pageInit: pageInit,
            //fieldChanged: fieldChanged,
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            //validateField: validateField,
            validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            //saveRecord: saveRecord
        };

    });
