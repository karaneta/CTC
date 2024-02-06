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
 * Script Name: CTC CS SO Retainer
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
 * 1.01      Jan 18, 2024       karaneta            Greyed out parent retainer if not empty
 *
 */
var isParentRetainer;
var retainerBalance;
var retainerBudget;
var retainerItemAmount;
define(['N/currentRecord', 'N/log','N/search', 'N/runtime', 'SuiteScripts/CTC.Sentinel/CTC.SS2/CTC.Retainer/Retainer_Util.js'],
    /**
     * @param{currentRecord} currentRecord
     * @param log
     * @param search
     */
    function(currentRecord, log, search,  runtime,rtnrutil) {

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
            var stLogTitle = 'pageInit';
            var context = scriptContext.mode;

            if(context === 'edit'){
                var current_rec = scriptContext.currentRecord;
                var isRetainerReference = current_rec.getValue({
                    fieldId: 'custbody_ctc_is_retainer_reference'
                });

                var isRetainerField = current_rec.getField({
                    fieldId: 'custbody_ctc_is_retainer_reference'
                });

                var retainer = current_rec.getValue({
                    fieldId: 'custbody_ctc_rtnr_inv_retainer'
                });

                var retainerField = current_rec.getField({
                    fieldId: 'custbody_ctc_rtnr_inv_retainer'
                });

                var parentRetainer = current_rec.getField({
                    fieldId: 'custbody_ctc_rtnr_so_retainer'
                });

                if(isRetainerReference){
                    isRetainerField.isDisabled = true;
                    retainerField.isDisabled = true;
                    log.debug(stLogTitle,'isRetainerReference:' + isRetainerReference);
                }

                if(!rtnrutil.isEmpty(retainer)){
                    isRetainerField.isDisabled = true;
                    log.debug(stLogTitle,'retainer:' + retainer);
                }
                //01/18/2024 Greyed out parent retainer when asigned/not empty.
                if(!rtnrutil.isEmpty(parentRetainer)){
                    parentRetainer.isDisabled = true;
                    log.debug(stLogTitle,'parent retainer:' + parentRetainer);
                }

            }

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

            var current_rec = scriptContext.currentRecord;
            var fieldId = scriptContext.fieldId;

            if(fieldId === 'custbody_ctc_is_retainer_reference'){
                var isRetainer = current_rec.getValue({
                    fieldId: 'custbody_ctc_is_retainer_reference'
                });

                var rtnrExpiration = current_rec.getField({fieldId: 'custbody_ctc_rtnr_expiration'});
                var retainer = current_rec.getField({fieldId: 'custbody_ctc_rtnr_inv_retainer'});

                log.debug(stLogTitle, 'isRetainer ' + isRetainer + ' | rtnrExpiration:' +  rtnrExpiration + ' | retainer:' + retainer);

                if(isRetainer){
                    rtnrExpiration.isDisabled = false;
                    rtnrExpiration.isMandatory = true;
                    retainer.isDisabled = true;
                    current_rec.setValue({
                        fieldId:'custbody_ctc_rtnr_inv_retainer',
                        value: null
                    });

                    isParentRetainer = true;
                    log.debug(stLogTitle, 'isParentRetainer ' + isParentRetainer);

                    alert('Please add retainer item for this parent retainer record.');
                }else{
                    rtnrExpiration.isDisabled = true;
                    rtnrExpiration.isMandatory = false;
                    retainer.isDisabled = false;
                    isParentRetainer = false;

                }

            }

            /*
              if(fieldId === 'entity'){
                  var customerId = current_rec.getValue({
                      fieldId: 'entity'
                  });

                  rtnrutil.searchOpenRetainerByCustomerId(customerId);
              }*/

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
            log.debug(stLogTitle, 'CONTEXT ' + JSON.stringify(scriptContext));
            log.debug(stLogTitle, 'isParentRetainer:' + isParentRetainer);

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
            // GET RETAINER ITEM ID LINKS
            var retainerItemId = runtime.getCurrentScript().getParameter({
                name: 'custscript_ctc_rtnr_item'
            });

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

            log.debug(stLogTitle,'itemCount: ' + itemCount);

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

                if(itemId === rtnrutil.fields.retainerItemId){ //OLD RETAINER ID: 4722
                    retainerItemFound = true;
                }

                log.debug(stLogTitle,i + ' |itemId: ' + itemId + ' | rate:' + rate);
            }//for

            if(isRetainerReference){
                if(!retainerItemFound){
                    alert('You were saving a parent retainer, but no retainer item found. Please add a retainer item');
                    return false;

                }else{
                    return true;
                }
            }

            if(!rtnrutil.isEmpty(retainerId)){
                if(retainerItemFound){

                    alert('You were using retainer ' + retainerName + ' with the amount of ' + retainerItemAmount + ' from the remaining retainer balance of ' + retainerBalance + '. Do you want to proceed?');
                    return true;

                    log.debug(stLogTitle, 'Saving retainer Item: ' + itemId + ' | ' + retainerItemAmount);
                }else{
                    alert('You were saving a retainer transaction, but no retainer item found. Please add a retainer item');
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
