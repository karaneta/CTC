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
 * Project Number:
 * Script Name: CTC CS GM Report
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Post Time Suitelet
 *
 * CHANGELOGS
 *
 * Version  Date                Author                  Remarks
 * 1.00     Nov 6, 2023        karaneta@nscatalyst.com  Initial Build
 *
 */

var filter_ids = ['custpage_filter_datefrom',
    'custpage_filter_dateto','custpage_filter_subd'];

define(['N/log', 'N/url', 'N/currentRecord'],
    function (log, url, currentRecord) {


    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function pageInit(context) {

    }

    function filter() {
        var record = currentRecord.get();
        var objParams = getAllFieldValues(record);
        redirectToSuitelet(objParams);
    }

    function getAllFieldValues(record) {
        var stLogTitle = 'getAllFieldValues';
        var objValues = {};

        for (var x = 0; x < filter_ids.length; x++) {
            try {
                var stFieldId = filter_ids[x];
                var stValue = record.getValue(stFieldId);
                objValues[stFieldId] = {};
                objValues[stFieldId] = stValue;
            } catch (err) {
                console.log(stLogTitle + ' >>>> ' + err.toString());
            }
        }
        console.log(stLogTitle + ' >>>> ' + JSON.stringify(objValues));
        return objValues;
    }

    function redirectToSuitelet(objParams) {
        var stLogTitle = 'redirectToSuitelet';

        try {
            if (window.onbeforeunload) {
                window.onbeforeunload = function () {
                    null;
                };
            }
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_ctc_sl_gmreport',
                deploymentId: 'customdeploy_ctc_sl_gmreport',
                returnExternalUrl: false,
                params: objParams
            });
            console.log(stLogTitle + ' >>>> suiteletURL: ' + suiteletURL);
            window.open(suiteletURL, "_self");
        } catch (err) {
            console.log(stLogTitle + ' >>>> ' + err.toString());
        }
    }


    function selectAll(stParam) {
        var stLogTitle = 'selectAll';

        try {
            console.log('fillAllDates  --->>> ' + stParam);
            var record = currentRecord.get();
            console.log('select all line');

            var intCount = record.getLineCount({sublistId: 'custpage_trans'});
            for (var x = 0; x < intCount; x++) {
                record.selectLine({sublistId: 'custpage_trans', line: x});

                record.setCurrentSublistValue({
                    sublistId: 'custpage_trans',
                    fieldId: 'custpage_select',
                    value: true
                });

                record.commitLine({sublistId: 'custpage_trans'});

            }

        } catch (err) {
            console.log(stLogTitle + ' >>>> ' + err.toString());
        }
    }


    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function saveRecord(context) {

    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function validateField(context) {

    }

    function custpage_timeMarkAll() {
        alert('mark all');
    }


    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function fieldChanged(context) {
        try {
            var stSublistId = context.sublistId;
            var stField = context.fieldId;
            var intLine = context.line;
            var record = currentRecord.get();

            if (stField == 'custpage_select') {
                var bIsChecked = record.getSublistValue({sublistId: stSublistId, fieldId: stField, line: intLine});
                var intId = record.getSublistValue({
                    sublistId: stSublistId,
                    fieldId: 'custpage_linenum',
                    line: intLine
                });
                // intId = parseInt(intId.toString());
                console.log('fieldChanged >>> ' + bIsChecked + ', id=' + intId);

                if (bIsChecked) {
                    addToList(record, intId);
                } else {
                    removeToList(record, intId);
                }
            } else if (stField == 'custpage_page') {
                var intPageNum = record.getValue(stField);
                console.log('fieldChanged >>> page number ' + intPageNum);

                var objParams = getAllFieldValues(record);
                redirectToSuitelet(objParams);
            }
        } catch (err) {
            console.log('fieldChanged >>> ' + err.toString());
        }
    }

    function addToList(record, intId) {

        var arrID = record.getValue({fieldId: 'custpage_selected_id'});
        console.log('addToList >>> ' + intId + ', existing=' + arrID.toString());

        if (!isEmpty(arrID)) {
            arrID = arrID.split(',');
        } else {
            arrID = [];
        }
        arrID.push(intId);

        record.setValue({
            fieldId: 'custpage_selected_id',
            value: arrID.toString()
        });
    }

    function removeToList(record, intId) {
        var arrID = record.getValue({fieldId: 'custpage_selected_id'});
        console.log('removeToList >>> ' + intId + ', existing=' + arrID.toString());

        if (isEmpty(arrID)) return;

        arrID = arrID.split(',');
        var index = arrID.indexOf(intId.toString());

        if (index > -1) {
            arrID.splice(index, 1);
        }

        record.setValue({
            fieldId: 'custpage_selected_id',
            value: arrID.toString()
        });
    }

    function dateToString(date) {
        date = new Date(date);
        return ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear();
    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function postSourcing(context) {

    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function lineInit(context) {

    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function validateDelete(context) {

    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function validateInsert(context) {

    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function validateLine(context) {

    }

    /**
     * @memberOf ${moduleName}
     * @param {Object} context
     **/
    function sublistChanged(context) {

    }

    //----------------- util functions ------------------
    function isEmpty(stValue) {
        return (
            (stValue === '' || stValue == null || stValue == undefined || stValue == 'undefined' || stValue == 'null') ||
            (util.isArray(stValue) && stValue.length == 0) ||
            (util.isObject(stValue) && (function (v) {
                for (var k in v) return false;
                return true;
            })(stValue)));
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        filter: filter,
        selectAll: selectAll
    }
});
