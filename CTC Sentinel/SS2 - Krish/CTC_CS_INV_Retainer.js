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
 * Script Name: CTC CS INV Retainer
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description
 *
 * CHANGELOGS
 *
 * Version   Date                Author                   Remarks
 * 1.00      Sept 26, 2022       karaneta            Initial Build
 * 1.01      Feb 14, 2023       karaneta            Remove saved pop-up for retainer amount to be used.
 * 1.01      Feb 15, 2023       karaneta            Show pop up and change content.
 */
var isParentRetainer;
var retainerBalance;
var retainerBudget;
var retainerItemAmount;
define(['N/currentRecord', 'N/log','N/search', 'SuiteScripts/CTC.Sentinel/CTC.SS2/CTC.Retainer/Retainer_Util.js'],
    /**
     * @param{currentRecord} currentRecord
     * @param log
     * @param search
     */
    function(currentRecord, log, search, rtnrutil) {

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

            var stLogTitle = 'CTC CS INV Retainer > pageInit';
            log.debug(stLogTitle, '-------------> SCRIPT ENTRY <------------------');
            log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(scriptContext));
            var stContext = scriptContext.mode;
            var current_rec = scriptContext.currentRecord;
            var current_recId = current_rec.id;
            var isRetainerReference;
            var isRetainerField;
            var retainerId;
            var retainerField;
            var customerId;

            log.debug(stLogTitle, 'current_recId ' + current_recId);

            if(!rtnrutil.isEmpty(current_recId)){
                isRetainerReference = current_rec.getValue({
                    fieldId: 'custbody_ctc_is_retainer_reference'
                });

                isRetainerField = current_rec.getField({
                    fieldId: 'custbody_ctc_is_retainer_reference'
                });

                retainerId = current_rec.getValue({
                    fieldId: 'custbody_ctc_rtnr_inv_retainer'
                });

                retainerField = current_rec.getField({
                    fieldId: 'custbody_ctc_rtnr_inv_retainer'
                });

                customerId = current_rec.getValue({
                    fieldId: 'entity'
                });


            }


            if(stContext === 'copy' || stContext === 'edit'){
                customerId = current_rec.getValue({
                    fieldId: 'entity'
                });

                if(isRetainerReference){
                    isRetainerField.isDisabled = true;
                    retainerField.isDisabled = true;
                    log.debug(stLogTitle,'isRetainerReference:' + isRetainerReference);
                }

                if(!rtnrutil.isEmpty(retainerId)){
                    isRetainerField.isDisabled = true;
                    log.debug(stLogTitle,'retainer:' + retainerId);
                }
            }

            if(!rtnrutil.isEmpty(customerId)){
                rtnrutil.searchOpenRetainerByCustomerId(customerId);
            }


            log.debug({
                title: stLogTitle,
                details: '--------------------> SCRIPT END <------------------'
            });
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
            var stLogTitle = 'fieldChanged';
            var fieldId = scriptContext.fieldId;
            var current_rec = scriptContext.currentRecord;

            if(fieldId === 'entity'){
                var customerId = current_rec.getValue({
                    fieldId: 'entity'
                });

                rtnrutil.searchOpenRetainerByCustomerId(customerId);
            }

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
            var isRetainerReference = current_rec.getValue({fieldId:'custbody_ctc_is_retainer_reference'});
            var retainerId = current_rec.getValue({
                fieldId: 'custbody_ctc_rtnr_inv_retainer'
            });

            var retainerName = current_rec.getText({
                fieldId: 'custbody_ctc_rtnr_inv_retainer'
            });

            log.debug(stLogTitle, 'isRetainerReference:' + isRetainerReference + ' retainerId:' + retainerId );

            // if sublist is item and not a parent retainer
            if(current_sublist === 'item' && isRetainerReference === false && !rtnrutil.isEmpty(retainerId)){
                var validateChildStat = rtnrutil.validateChildRetainerItem(current_rec, retainerId, retainerName);
                log.debug(stLogTitle, 'validateChildStat:' + validateChildStat);
                return validateChildStat;
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
            var current_rec = scriptContext.currentRecord;
            var retainerItemFound = false;

            //log.debug(stLogTitle, 'Context: ' + JSON.stringify(current_rec));

            var isRetainerReference = current_rec.getValue({
                fieldId:'custbody_ctc_is_retainer_reference'
            });

            var retainerId = current_rec.getValue({
                fieldId: 'custbody_ctc_rtnr_inv_retainer'
            });

            var retainerName = current_rec.getText({
                fieldId: 'custbody_ctc_rtnr_inv_retainer'
            });

            var itemCount = current_rec.getLineCount({
                sublistId: 'item'
            });

            log.debug(stLogTitle,'itemCount: ' + itemCount + ' |retainerId:' + retainerId);

            for(var i=0; i <= itemCount-1; i++){

                current_rec.selectLine({
                    sublistId:'item',
                    line: i
                });

                var itemId = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                var rate = current_rec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate'
                });

                if(itemId === rtnrutil.fields.retainerItemId){
                    retainerItemFound = true;
                }

                rate = Math.abs(rate);

                log.debug(stLogTitle,i + ' |itemId: ' + itemId + ' | rate:' + rate);
            }//for

            if(isRetainerReference){
                if(!retainerItemFound){
                    alert('You are saving a parent retainer, but no retainer item found. Please add a retainer item');
                    return false;

                }else{
                    return true;
                }
            }

            if(!rtnrutil.isEmpty(retainerId)){
                if(retainerItemFound){
                    if(rtnrutil.isEmpty(retainerBalance)){
                        var retainerObj = rtnrutil.getRetainerBalance(retainerId);
                        retainerBalance = retainerObj.custrecord_ctc_rtnr_total_bgt_remaining;
                        retainerBalance = Math.abs(retainerBalance);
                    }

                    alert('There is a retainer record for this customer. You are using retainer ' + retainerName);

                    return true;

                }else{
                    alert('You are saving a retainer transaction, but no retainer item found. Please add a retainer item');
                    return false;
                }
            }
            return true;

        } //save record

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            //validateField: validateField,
            validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
