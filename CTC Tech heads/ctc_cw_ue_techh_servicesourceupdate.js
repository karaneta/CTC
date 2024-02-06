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
 * Service Number:
 * Script Name: CTC CW UE Customer Record Update
 * Author: karaneta@nscatalyst.com
 * NApiVersion 1.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description CWM service ticket source id update from email connector to NetSuite
 *
 * CHANGELOGS
 *
 * Version	Date              Author		              Remarks
 * 1.00		Sept 29, 2022	  karaneta@nscatalyst.com	  Initial Build
 *
 */
var customerFields = ['companyname', 'entitystatus', 'phone', 'fax', 'url', 'custentity_alerts', 'custentity_marketarea', 'custentity_maintenance','custentity_microsoftclientid'];
var contactFields = ['firstname', 'lastname', 'email', 'phone', 'title', 'isinactive', 'company'];
var addressFields = ['addr1', 'addr2', 'city', 'state', 'country', 'zip'];
function afterSubmit(type) {
    var stLogTitle = 'afterSubmit';
    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT ENTRY <------------------');
    //var testCust = '44055'; //Tech Heads, Inc.
    var testCust = null;
    var recType = nlapiGetRecordType();
    var nsRecId = nlapiGetRecordId();
    nlapiLogExecution('DEBUG', stLogTitle, ' recType: ' + recType + ' |nsRecId: ' + nsRecId);

    if(type == 'edit'){
        if(recType == 'customer' || recType == 'prospect'){
            testCust = '44138'; //Test Company 1
            var cwCustLink = nlapiGetFieldValue('custentity_ctc_cw_cmp_link');
            nlapiLogExecution('DEBUG', stLogTitle, ' nsRecId: ' + nsRecId + ' |cwCustLink: ' + cwCustLink);
            var cwTypeId = '23'; // customer
            if(recType == 'prospect'){
                cwTypeId = '26'; //Prospect
            }
            if(testCust){
                if(!isEmpty(cwCustLink)){
                    var returnObj = updateCustomer(cwCustLink, cwTypeId,nsRecId,recType);
                    nlapiLogExecution('DEBUG', stLogTitle, ' updateCustomer > returnObj: ' + JSON.stringify(returnObj));
                    if(returnObj.addrupdate){
                        nlapiLogExecution('DEBUG', stLogTitle, 'set the CW SITE LINK SYNC to blank');
                        nlapiSubmitField(recType,nsRecId,'custentity_ctc_cw_sitelinkup', ['']);
                    }

                }
            }
        }

        if(recType == 'contact'){
            testCust = '47062'; //Test Company 1
            var cwContLink = nlapiGetFieldValue('custentity_ctc_cw_cnt_link');
            nlapiLogExecution('DEBUG', stLogTitle, ' nsRecId: ' + nsRecId + ' |cwContLink: ' + cwContLink);
            if(testCust){
                if(!isEmpty(cwContLink)){
                    var returnObj = updateContact(cwContLink,nsRecId, recType);
                    nlapiLogExecution('DEBUG', stLogTitle, ' updateContact > returnObj: ' + JSON.stringify(returnObj));
                    if(returnObj.addrupdate){
                        nlapiLogExecution('DEBUG', stLogTitle, 'set the CW SITE LINK SYNC to blank');
                        nlapiSubmitField(recType,nsRecId,'custentity_ctc_cw_sitelinkup', ['']);
                    }
                }
            }
        }
    } // if edit

    nlapiLogExecution('DEBUG', stLogTitle, '--------------> SCRIPT END <------------------');

} //AFTER SUBMIT END

function updateCustomer(cwCustLink, cwTypeId,nsRecId,recType){
    var stLogTitle = 'updateCustomer';
    var isAddressChange = false;
    var isChange = false;
    var cwSiteId = null;
    var fieldChangeArray;
    var custupdate = false;
    var addrupdate = false;

    var cwCustObj = nlapiLookupField('customrecord_ctc_cw_cmp', cwCustLink, ['name', 'custrecord_ctc_cw_cmp_id', 'custrecord_ctc_cw_cmp_cwaccount','custrecord_ctc_cw_cmp_siteid']);
    nlapiLogExecution('DEBUG', stLogTitle, 'cwCustObj > ' + JSON.stringify(cwCustObj));
    var cmp_cwId = cwCustObj.custrecord_ctc_cw_cmp_id;
    var cwAccountId = cwCustObj.custrecord_ctc_cw_cmp_cwaccount;
    cwSiteId = cwCustObj.custrecord_ctc_cw_cmp_siteid;

    //check which fields change in system notes
    var isChangeObj = getSystemNotes(nsRecId,recType);
    isAddressChange = isChangeObj.isAddress;
    isChange = isChangeObj.isChange;
    fieldChangeArray = isChangeObj.fieldsChange;
    var fieldCount = fieldChangeArray.length;
    var addressLineInternalId = nlapiGetFieldValue('custentity_ctc_cw_sitelinkup'); //sublist internal id to pull up address line value
    nlapiLogExecution('DEBUG', stLogTitle, 'addressLineInternalId > ' + addressLineInternalId);

    if ((isChange && fieldCount > 0) || !isEmpty(addressLineInternalId)) {
        //Syncback customer header fields
        var addressLineObj = null;
        if(addressLineInternalId){
            addressLineObj = getAddressObjCust(addressLineInternalId,nsRecId,recType); //change to getAddObjCust
            nlapiLogExecution('DEBUG', stLogTitle, 'addressLineObj > ' + JSON.stringify(addressLineObj));
            if(addressLineObj){
                //update cw site id
                var stat = syncbackCwSite(cmp_cwId, cwSiteId, cwAccountId, addressLineObj)
                addrupdate = stat;
            }


        }
        //update cw customer and address
        stat = syncbackCwCustomer(cmp_cwId, cwAccountId, cwTypeId, fieldChangeArray,addressLineObj);
        custupdate = stat;
        nlapiLogExecution('DEBUG', stLogTitle, 'syncbackCwCustomer RETURN > ' + JSON.stringify(stat));
    }

    var stat = {
        'custupdate': custupdate,
        'addrupdate': addrupdate
    };
    nlapiLogExecution('DEBUG', stLogTitle, 'stat > ' + JSON.stringify(stat));

    return stat

}

function updateContact(cwContLink,nsRecId,recType){
    var stLogTitle = 'updateContact';
    var cmpId = null
    var isAddressChange = false;
    var isChange = false;
    var cwSiteId = null;
    var fieldChangeArray;
    var contupdate = false;
    var addrupdate = false;


    var cwContObj = nlapiLookupField('customrecord_ctc_cw_contacts', cwContLink, ['name', 'custrecord_ctc_cw_contacts_id', 'custrecord_ctc_cw_contacts_cwaccount','custrecord_ctc_cw_contacts_siteid','custrecord_ctc_cw_contacts_company']);
    nlapiLogExecution('DEBUG', stLogTitle, 'cwContObj > ' + JSON.stringify(cwContObj));
    var cnt_cwId = cwContObj.custrecord_ctc_cw_contacts_id;
    var cwAccountId = cwContObj.custrecord_ctc_cw_contacts_cwaccount;
    cwSiteId = cwContObj.custrecord_ctc_cw_contacts_siteid
    var cwCntCompany = cwContObj.custrecord_ctc_cw_contacts_company;
    if(cwCntCompany){
        var cwCustObj = nlapiLookupField('customrecord_ctc_cw_cmp', cwCntCompany, ['name', 'custrecord_ctc_cw_cmp_id', 'custrecord_ctc_cw_cmp_cwaccount','custrecord_ctc_cw_cmp_siteid']);
        cmpId = cwCustObj.custrecord_ctc_cw_cmp_id;

    }

    //check which fields change in system notes
    var isChangeObj = getSystemNotes(nsRecId, recType);
    isAddressChange = isChangeObj.isAddress;
    isChange = isChangeObj.isChange;
    fieldChangeArray = isChangeObj.fieldsChange;
    var fieldCount = fieldChangeArray.length;
    var addressLineInternalId = nlapiGetFieldValue('custentity_ctc_cw_sitelinkup');

    if ((isChange && fieldCount > 0) || !isEmpty(addressLineInternalId)) {
        //Syncback contact header fields
        var addressLineObj = null;
        if(addressLineInternalId){
            var cwSiteObj = null;
            //cwSiteObj = getCwSiteObject(cwSiteId);
            //var nsAddressIntId = cwSiteObj.nsaddId;

            addressLineObj = getAddressObjCont(addressLineInternalId,nsRecId,recType);
            nlapiLogExecution('DEBUG', stLogTitle, 'addressLineObj > ' + JSON.stringify(addressLineObj));

            if(addressLineObj){
                //update cw site id
                var stat = syncbackCwSite(cmpId,cwSiteId, cwAccountId, addressLineObj)
                addrupdate = stat;
            }

        }
        stat = syncbackCwContact(cnt_cwId, cwAccountId, fieldChangeArray,addressLineObj);
        contupdate = stat;
        nlapiLogExecution('DEBUG', stLogTitle, 'syncbackCwContact RETURN > ' + JSON.stringify(stat));
    }

   //sublist internal id to pull up address line value

    if(addressLineInternalId){
        var cwSiteObj = null;
        cwSiteObj = getCwSiteObject(cwSiteId);
        var nsAddressIntId = cwSiteObj.nsaddId;
        if(nsAddressIntId){
            //addressLineChange = searchNsAddressObj(nsAddressIntId,companyId);
            var addressLineObj = getAddressObjCont(addressLineInternalId,nsRecId,recType);
            nlapiLogExecution('DEBUG', stLogTitle, 'addressLineObj > ' + JSON.stringify(addressLineObj));
            if(addressLineObj){
                var stat = syncbackCwSite(cmpId,cwSiteId, cwAccountId, addressLineObj)
                addrupdate = stat;
            }
        }
    }

    var stat = {
        'contupdate': contupdate,
        'addrupdate': addrupdate
    };
    // nlapiLogExecution('DEBUG', stLogTitle, 'SITE UPDATE RETURN > ' + stat);

    return stat
}

function syncbackCwCustomer(cwId, cwAccountId, cwTypeId, fieldChangeArray,addressLineObj) {
    var stLogTitle = 'syncbackCwCustomer > cwId:' + cwId + ' |cwAccountId:' + cwAccountId;
    var stat = false;
    var returnObject = {};
    var returnMessage = '';
    var postResponseCode;
    var postResponse;
    nlapiLogExecution('AUDIT', stLogTitle, 'fieldChangeArray: ' + JSON.stringify(fieldChangeArray));

    try {
        if (cwAccountId && cwId) {
            //get field value
            var companyname = nlapiGetFieldValue('companyname');
            var entitystatus = nlapiGetFieldValue('entitystatus');
            var type = cwTypeId;
            var phone = nlapiGetFieldValue('phone');
            //var email = nlapiGetFieldValue('email');
            var fax = nlapiGetFieldValue('fax');
            var website = nlapiGetFieldValue('url');

            //custom fields
            var alert = nlapiGetFieldValue('custentity_alerts');
            var marketarea = nlapiGetFieldText('custentity_marketarea');
            var maintenance = nlapiGetFieldValue('custentity_maintenance');
            var microsoft = nlapiGetFieldValue('custentity_microsoftclientid');

            //grab some existing info first in manage
            //var cwCompanyObject = getJSONData('company/companies/'+cwId, 1, 1000, 1, null, null, null, cwAccountId);
            var cwCompanyObject = getJSONData('company/companies/' + cwId, 1, 1, 1, null, null, null, cwAccountId);
            var JSONPostObject;
            nlapiLogExecution('AUDIT', 'JSON GET DATA for CW Account ID: ' + cwAccountId + ' ' + JSON.stringify(cwCompanyObject));

            if (cwCompanyObject) {
                if (cwCompanyObject.id == cwId) {
                    var additionalHeaders = {"id": cwId};
                    var cwCustomFieldObj = cwCompanyObject.customFields;
                    //chech fields with changes and assign new value
                    if(fieldChangeArray){
                        for (var i = 0; i < fieldChangeArray.length; i++) {
                            var fieldId = fieldChangeArray[i];
                            nlapiLogExecution("debug", stLogTitle, "Value at index " + i + ": " + fieldId);
                            if(fieldId == 'companyname'){
                                cwCompanyObject.name = companyname;
                            }

                            if(fieldId == 'entitystatus'){
                                cwCompanyObject.status = type;
                            }

                            if(fieldId == 'phone'){
                                cwCompanyObject.phoneNumber = phone;
                            }

                            if(fieldId == 'fax'){
                                cwCompanyObject.faxNumber = fax;
                            }

                            if(fieldId == 'type'){
                                cwCompanyObject.types = type;
                            }

                            if(fieldId == 'url'){
                                cwCompanyObject.website = website;
                            }

                            if(fieldId == 'custentity_alerts'){
                                var fieldId = 8;
                                cwCustomFieldObj = assignCustomField(cwCustomFieldObj,fieldId, alert);
                                nlapiLogExecution('AUDIT', stLogTitle, 'custentity_alerts > cwCustomFieldObj: '+ cwCustomFieldObj);
                            }

                            if(fieldId == 'custentity_marketarea'){
                                var fieldId = 59;
                                cwCustomFieldObj = assignCustomField(cwCustomFieldObj,fieldId, marketarea);
                                nlapiLogExecution('AUDIT', stLogTitle, 'custentity_marketarea > cwCustomFieldObj: '+ JSON.stringify(cwCustomFieldObj));

                            }

                            if(fieldId == 'custentity_maintenance'){
                                var fieldId = 17;
                                cwCustomFieldObj = assignCustomField(cwCustomFieldObj,fieldId, maintenance);
                                nlapiLogExecution('AUDIT', stLogTitle, 'custentity_maintenance > cwCustomFieldObj: '+ cwCustomFieldObj);
                            }

                            if(fieldId == 'custentity_microsoftclientid'){
                                var fieldId = 58;
                                cwCustomFieldObj = assignCustomField(cwCustomFieldObj,fieldId, microsoft);
                                nlapiLogExecution('AUDIT', stLogTitle, 'custentity_microsoftclientid > cwCustomFieldObj: '+ cwCustomFieldObj);
                            }

                        }
                    }

                    if(addressLineObj){
                        if(addressLineObj.nsAddr1){
                            cwCompanyObject.addressLine1 = addressLineObj.nsAddr1
                        }

                        if(addressLineObj.nsAddr2){
                            cwCompanyObject.addressLine2 = addressLineObj.nsAddr2
                        }

                        if(addressLineObj.nsCity){
                            cwCompanyObject.city = addressLineObj.nsCity
                        }

                        if(addressLineObj.nsState){
                            cwCompanyObject.state = addressLineObj.nsState;
                        }

                        if(addressLineObj.nsCountry){
                            cwCompanyObject.country.name = addressLineObj.nsCountry;
                        }

                        if(addressLineObj.nsZip){
                            cwCompanyObject.zip = addressLineObj.nsZip;
                        }
                    }

                    nlapiLogExecution('AUDIT', stLogTitle, 'DEBUG NEW CUSTOM FIELD VALUES: ' + JSON.stringify(cwCompanyObject.customFields));

                    delete cwCompanyObject.types;

                    nlapiLogExecution('AUDIT', stLogTitle, 'DEBUG NEWcwCustomFieldObj: ' + JSON.stringify(cwCompanyObject));

                    JSONPostObject = cwCompanyObject;

                    nlapiLogExecution('AUDIT', 'cwCompanyObject.name: ' + cwCompanyObject.name);
                    //nlapiLogExecution('AUDIT', 'JSON PUT for CW Account ID: ' + cwAccountId, JSON.stringify(JSONPostObject));

                    //POST
                    postResponse = postJSONData('company/companies/' + cwId, JSONPostObject, additionalHeaders, 'PUT', cwAccountId);

                    postResponseCode = postResponse.getCode();
                    var responseObject = JSON.parse(postResponse.getBody());
                    //var postResponseErrors = getPostErrors(responseObject);
                    nlapiLogExecution('DEBUG', 'POST Response Code: ' + postResponseCode);
                    //create return message
                    if (responseObject.id) {
                        //POST
                        returnMessage = returnMessage + '\n' + nlapiDateToString(new Date(), 'datetime') + ':Company successfully updated on CW Manage with CW ID: ' + cwCompanyObject.name + ' - ' + responseObject.id + ' CW ID: ' + cwId + ' Message: ' + responseObject.message;
                    }
                    nlapiLogExecution('DEBUG', 'Return Message', returnMessage);
                }
            }

        }
    } catch (err) {
        nlapiLogExecution('ERROR', 'Could not update CW Manage Customer record on ' + cwId, err);
        return err;
    }
    returnObject.postcode = postResponseCode;
    returnObject.message = returnMessage;
    //returnObject.errors = postResponseErrors;
    returnObject.id = responseObject.id;
    returnObject.poststring = JSON.stringify(JSONPostObject);
    return returnObject;

}


function syncbackCwContact(cnt_cwId, cwAccountId, fieldChangeArray,addressLineObj) {
    var stLogTitle = 'syncbackCwContact > cnt_cwId:' + cnt_cwId + ' |cwAccountId:' + cwAccountId;
    var stat = false;
    var returnObject = {};
    var returnMessage = '';
    var postResponseCode;
    var postResponse;
    var cwCmpID = null;
    var cwCmpIntId = null;
    nlapiLogExecution('AUDIT', stLogTitle, 'fieldChangeArray: ' + JSON.stringify(fieldChangeArray));

    try {
        if (cwAccountId && cnt_cwId) {
            //get field value
            var firstname = nlapiGetFieldValue('firstname');
            var lastname = nlapiGetFieldValue('lastname');
            var phone = nlapiGetFieldValue('phone');
            var email = nlapiGetFieldValue('email');
            var jobtitle = nlapiGetFieldValue('title');
            var isinactive = nlapiGetFieldValue('isinactive');
            var nscompanyid = nlapiGetFieldValue('company');
            if(nscompanyid){
                var nsCustObj = nlapiLookupField('customer', nscompanyid, ['companyname', 'custentity_ctc_cw_cmp_link']);
                cwCmpIntId = nsCustObj.custentity_ctc_cw_cmp_link;
            }

            if(cwCmpIntId){
                var cwCustObj = nlapiLookupField('customrecord_ctc_cw_cmp', cwCmpIntId, ['name', 'custrecord_ctc_cw_cmp_id', 'custrecord_ctc_cw_cmp_cwaccount','custrecord_ctc_cw_cmp_siteid']);
                cwCmpID = cwCustObj.custrecord_ctc_cw_cmp_id;
            }

            //grab some existing info first in manage
            var cwContactObject = getJSONData('/company/contacts/' + cnt_cwId, 1, 1, 1, null, null, null, cwAccountId);
            var JSONPostObject;
            nlapiLogExecution('AUDIT', 'JSON GET DATA for CW Account ID: ' + cwAccountId + ' ' + JSON.stringify(cwContactObject));

            if (cwContactObject) {
                if (cwContactObject.id == cnt_cwId) {
                    var additionalHeaders = {"id": cnt_cwId};

                    //check fields with changes and assign new value
                    for (var i = 0; i < fieldChangeArray.length; i++) {
                        var fieldId = fieldChangeArray[i];
                        nlapiLogExecution("debug", stLogTitle, "Value at index " + i + ": " + fieldId);
                        if(fieldId == 'firstName'){
                            cwContactObject.firstName = firstName;
                        }
                        if(fieldId == 'lastName'){
                            cwContactObject.lastName = lastName;
                        }

                        if(fieldId == 'phone'){
                            cwContactObject.defaultPhoneNbr = phone;
                        }

                        if(fieldId == 'title'){
                            cwContactObject.title = jobtitle;
                        }

                        if(fieldId == 'isinactive'){
                            cwContactObject.inactiveFlag = isinactive;
                        }

                        if(fieldId == 'company'){
                            cwContactObject.company.id = cwCmpID;
                        }

                        if(addressLineObj){
                            if(addressLineObj.nsAddr1){
                                cwContactObject.addressLine1 = addressLineObj.nsAddr1
                            }

                            if(addressLineObj.nsAddr2){
                                cwContactObject.addressLine2 = addressLineObj.nsAddr2
                            }

                            if(addressLineObj.nsCity){
                                cwContactObject.city = addressLineObj.nsCity
                            }

                            if(addressLineObj.nsState){
                                cwContactObject.state = addressLineObj.nsState;
                            }

                            if(addressLineObj.nsCountry){
                                cwContactObject.country.name = addressLineObj.nsCountry;
                            }

                            if(addressLineObj.nsZip){
                                cwContactObject.zip = addressLineObj.nsZip;
                            }
                        }

                        if(fieldId == 'email'){
                            var cwCommItems = cwContactObject.communicationItems;
                            for( var i= 0; i < cwCommItems.length; i++){
                                var commItemRow = cwCommItems[i];
                                var commType = commItemRow.type;
                                nlapiLogExecution('AUDIT', stLogTitle, 'commType: ' + commType);
                                if(commType == 'Email'){
                                    cwCommItems.type.value = email;
                                }
                            }
                        }
                    }

                    nlapiLogExecution('AUDIT', stLogTitle, 'DEBUG NEW CUSTOM FIELD VALUES: ' + JSON.stringify(cwContactObject.customFields));

                    delete cwContactObject.types;

                    nlapiLogExecution('AUDIT', stLogTitle, 'DEBUG NEW cwContactObject: ' + JSON.stringify(cwContactObject));

                    JSONPostObject = cwContactObject;

                    nlapiLogExecution('AUDIT', 'cwContactObject.firstName: ' + cwContactObject.firstName);
                    nlapiLogExecution('AUDIT', 'JSON PUT for CW Account ID: ' + cwAccountId, JSON.stringify(JSONPostObject));

                    //POST
                    postResponse = postJSONData('company/contacts/' + cnt_cwId, JSONPostObject, additionalHeaders, 'PUT', cwAccountId);

                    postResponseCode = postResponse.getCode();
                    var responseObject = JSON.parse(postResponse.getBody());
                    //var postResponseErrors = getPostErrors(responseObject);
                    nlapiLogExecution('DEBUG', 'POST Response Code: ' + postResponseCode);
                    //create return message
                    if (responseObject.id) {
                        //POST
                        returnMessage = returnMessage + '\n' + nlapiDateToString(new Date(), 'datetime') + ':Contact successfully updated on CW Manage with CW ID: ' + cwContactObject.firstName + ' - ' + responseObject.id + ' CW ID: ' + cnt_cwId + ' Message: ' + responseObject.message;
                    }
                    nlapiLogExecution('DEBUG', 'Return Message', returnMessage);
                }
            }

        }
    } catch (err) {
        nlapiLogExecution('ERROR', 'Could not update CW Manage Contact record on ' + cnt_cwId, err);
        return err;
    }
    returnObject.postcode = postResponseCode;
    returnObject.message = returnMessage;
    //returnObject.errors = postResponseErrors;
    returnObject.id = responseObject.id;
    returnObject.poststring = JSON.stringify(JSONPostObject);
    return returnObject;

}

function syncbackCwSite(cmpId, cwSiteId, cwAccountId, fieldObjValue) {
    var stLogTitle = 'syncbackCwSite > cwSiteId:' + cwSiteId + ' |cmpId:' + cmpId;
    var stat = false;
    var returnObject = {};
    var returnMessage = '';
    var postResponseCode;
    var postResponse;

    try {
        if (cwAccountId && cwSiteId) {

            var cwSiteObject = getJSONData('company/companies/'+ cmpId + '/sites/' + cwSiteId, 1, 1, 1, null, null, null, cwAccountId);
            var JSONPostObject;
            nlapiLogExecution('AUDIT', 'JSON GET DATA for CW Account ID: ' + cwAccountId + ' ' + JSON.stringify(cwSiteObject));

            if (cwSiteObject) {
                if (cwSiteObject.id == cwSiteId) {
                    var additionalHeaders = {"id": cwSiteId};
                    cwSiteObject.name = fieldObjValue.nsLabel;
                    if(fieldObjValue.nsAddr1){
                        cwSiteObject.addressLine1 = fieldObjValue.nsAddr1
                    }

                    if(fieldObjValue.nsAddr2){
                        cwSiteObject.addressLine2 = fieldObjValue.nsAddr2
                    }

                    if(fieldObjValue.nsCity){
                        cwSiteObject.city = fieldObjValue.nsCity
                    }

                    if(fieldObjValue.nsState){
                        cwSiteObject.stateReference.identifier = fieldObjValue.nsState;
                    }

                    if(fieldObjValue.nsCountry){
                        cwSiteObject.country.name = fieldObjValue.nsCountry;
                    }

                    if(fieldObjValue.nsZip){
                        cwSiteObject.zip = fieldObjValue.nsZip;
                    }

                    JSONPostObject = cwSiteObject;
                    nlapiLogExecution('AUDIT', 'cwSiteObject.name: ' + cwSiteObject.name);
                    //nlapiLogExecution('AUDIT', 'JSON PUT for CW Account ID: ' + cwAccountId, JSON.stringify(JSONPostObject));

                    //PUT
                    postResponse = postJSONData('company/companies/'+ cmpId + '/sites/' + cwSiteId, JSONPostObject, additionalHeaders, 'PUT', cwAccountId);

                    postResponseCode = postResponse.getCode();
                    var responseObject = JSON.parse(postResponse.getBody());
                    //var postResponseErrors = getPostErrors(responseObject);
                    nlapiLogExecution('DEBUG', 'POST Response Code: ' + postResponseCode);
                    //create return message
                    if (responseObject.id) {
                        //POST
                        returnMessage = returnMessage + '\n' + nlapiDateToString(new Date(), 'datetime') + ':CW Site successfully updated on CW Manage with CW ID: ' + cwSiteObject.name + ' - ' + responseObject.id + ' CW ID: ' + cwSiteId + ' Message: ' + responseObject.message;
                    }
                    nlapiLogExecution('DEBUG', 'Return Message', returnMessage);
                }
            }

        }
    } catch (err) {
        nlapiLogExecution('ERROR', 'Could not update CW Manage Customer record on ' + cwSiteId, err);
        return err;
    }
    returnObject.postcode = postResponseCode;
    returnObject.message = returnMessage;
    //returnObject.errors = postResponseErrors;
    returnObject.id = responseObject.id;
    returnObject.poststring = JSON.stringify(JSONPostObject);
    return returnObject;

}

function getSystemNotes(nsRecId, recType) {
    var stLogTitle = 'getSystemNotes| '+ recType;
    var isChange = false;
    var isAddress = false;
    var fieldsChange = [];
    var dateNow = new Date();
    var month = dateNow.getMonth() + 1; // Months are 0-based
    var day = dateNow.getDate();
    var year = dateNow.getFullYear();
    var hours = dateNow.getHours();
    var minutes = dateNow.getMinutes();
    var fieldsToFind = null;

    // Ensure single-digit months and days are padded with a leading zero
    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + day;
    }

    // Ensure single-digit hours and minutes are padded with a leading zero
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    var formattedDate = month + "/" + day + "/" + year + " " + hours + ":" + minutes;

    nlapiLogExecution("debug", stLogTitle, "dateNow: " + dateNow + ' |formattedDate:' +formattedDate);

    if(recType == 'contact'){
        fieldsToFind = contactFields;

    }else{
        fieldsToFind = customerFields;

    }

    var sysnoteSearchResult = nlapiSearchRecord(recType,null,
        [
            ["systemnotes.type","is","F"],
            "AND",
            ["systemnotes.date","within",formattedDate]
        ],
        [
            new nlobjSearchColumn("entityid").setSort(false),
            new nlobjSearchColumn("phone"),
            new nlobjSearchColumn("field","systemNotes",null),
            new nlobjSearchColumn("oldvalue","systemNotes",null),
            new nlobjSearchColumn("newvalue","systemNotes",null)
        ]
    );

    nlapiLogExecution("debug", stLogTitle,  " |resultRow:" + JSON.stringify(resultRow));

    if (sysnoteSearchResult) {
        for (var x = 0; x < sysnoteSearchResult.length; x++) {
            var resultRow =  sysnoteSearchResult[x];
            nlapiLogExecution("debug", stLogTitle, x + " |resultRow:" + JSON.stringify(resultRow));
            var fieldId = resultRow.getValue("field", "systemnotes");
            var newValue = resultRow.getValue("newvalue", "systemnotes");

            // Check if fieldId is in the customerFields array
            var isFieldIncluded = false;
            for (var i = 0; i < fieldsToFind.length; i++) {
                if (fieldId === fieldsToFind[i]) {
                    isFieldIncluded = true;
                    break;
                }

            }

            if(fieldId == 'address'){
                isAddress = true;
            }

            if (isFieldIncluded && fieldsChange.indexOf(fieldId) === -1) {
                // Check if the fieldId is not already in the fieldsChange array
                nlapiLogExecution("debug", stLogTitle, "isChange: " + isChange + " | Field: ID: " + fieldId + " | new value: " + newValue);
                isChange = true;
                fieldsChange.push(fieldId);
            }
        }

    } else {
        nlapiLogExecution("debug", "No search results found.");
    }

    var isChangeObj = {
        'isChange': isChange,
        'isAddress': isAddress,
        'fieldsChange': fieldsChange
    };

    nlapiLogExecution("debug", stLogTitle,"isChangeObj: " + JSON.stringify(isChangeObj));

    return isChangeObj;

}

function getCwSiteObject(cwSiteId,nsRecId){
    var stLogTitle = 'getCwSiteObject';
    var cwSiteObject = {
        'cwsiteid':null,
        'cwsitename': null,
        'nsaddId' : null,
        'cwaddr1' : null,
        'cwaddr2' : null,
        'cwcity': null,
        'cwstate': null,
        'cwcountry': null,
        'cwzip': null
    };

    if(cwSiteId){
        var cwSiteSearchResult = nlapiSearchRecord("customrecord_ctc_cw_site",null,
            [
                ["custrecord_ctc_cw_siteid","equalto",cwSiteId]
            ],
            [
                new nlobjSearchColumn("custrecord_ctc_cw_siteid"),
                new nlobjSearchColumn("name").setSort(false),
                new nlobjSearchColumn("custrecord_ctc_cw_site_nslink"),
                new nlobjSearchColumn("custrecord_ctc_cw_site_addr1"),
                new nlobjSearchColumn("custrecord_ctc_cw_site_addr2"),
                new nlobjSearchColumn("custrecord_ctc_cw_site_city"),
                new nlobjSearchColumn("custrecord_ctc_cw_site_stateid"),
                new nlobjSearchColumn("custrecord_ctc_cw_site_country"),
                new nlobjSearchColumn("custrecord_ctc_cw_site_zip")
            ]
        );

        if(cwSiteSearchResult){
            for (var x = 0; x < cwSiteSearchResult.length; x++) {
                var resultRow =  cwSiteSearchResult[x];
                //nlapiLogExecution("debug", "Field: " + x, 'RESULT: ' + JSON.stringify(resultRow));
                var cwid = resultRow.getValue('custrecord_ctc_cw_siteid');
                var cwsitename = resultRow.getValue('name');
                var nsaddId = resultRow.getValue('custrecord_ctc_cw_site_nslink');
                var cwaddr1 = resultRow.getValue('custrecord_ctc_cw_site_addr1');
                var cwaddr2 = resultRow.getValue('custrecord_ctc_cw_site_addr2');
                var cwcity = resultRow.getValue('custrecord_ctc_cw_site_city');
                var cwstate = resultRow.getValue('custrecord_ctc_cw_site_stateid');
                var cwcountry = resultRow.getValue('custrecord_ctc_cw_site_country');
                var cwzip = resultRow.getValue('custrecord_ctc_cw_site_zip');

                cwSiteObject = {
                    'cwsiteid':cwid,
                    'cwsitename': cwsitename,
                    'nsaddId' : nsaddId,
                    'cwaddr1' : cwaddr1,
                    'cwaddr2' : cwaddr2,
                    'cwcity': cwcity,
                    'cwstate': cwstate,
                    'cwcountry': cwcountry,
                    'cwzip': cwzip
                };

            }
        }

        nlapiLogExecution('AUDIT', stLogTitle, 'cwSiteObject: '+ JSON.stringify(cwSiteObject));

        return cwSiteObject;


    }

}

function getNsAddressObj(nsAddressIntId,nsRecId){
    var stLogTitle = 'getNsAddressObj';
    var nsAddressObject = {
        'intid':null,
        'cwsitename': null,
        'nsaddId' : null,
        'cwaddr1' : null,
        'cwaddr2' : null,
        'cwcity': null,
        'cwstate': null,
        'cwcountry': null,
        'cwzip': null
    };

    var lineChange = null;
    // Load the record in dynamic mode
    var customer_record = nlapiLoadRecord('customer', nsRecId, {recordmode: 'dynamic'});

    //var record = nlapiLoadRecord('customer', nsRecId, );
    var addressLineCount = nlapiGetLineItemCount('addressbook');
    nlapiLogExecution('DEBUG', stLogTitle, 'addressLineInternalId: ' +addressLineInternalId);

    if(addressLineCount > 0){
        for(var i=0; i < addressLineCount; i++){

            var addressId = nlapiGetLineItemValue('addressbook', 'internalid', i);
            var countryName = nlapiGetLineItemValue('addressbook', 'country', i);
            nlapiLogExecution('DEBUG', stLogTitle, 'addressId: ' + addressId + ' |countryName:' + countryName);
            if(addIntId == addressLineInternalId){
                lineChange = i;
                nlapiLogExecution('DEBUG', stLogTitle, 'ADDRESS FOUND MATCH');

            }

        }
    }
    nlapiLogExecution('DEBUG', stLogTitle, 'lineChange: ' +lineChange);


    return lineChange;

}

function getAddressObjCust(nsAddressIntId,nsRecId,recType){
    var stLogTitle= 'getAddressObjCust|nsAddressIntId:' + nsAddressIntId + ' |nsRecId: ' +nsRecId ;
    var nsAddressObject = {
        'nsAddId': null,
        'nsLabel': null,
        'nsAddr1' : null,
        'nsAddr2' : null,
        'nsCity' : null,
        'nsState': null,
        'nsCountry': null,
        'nsZip': null,
        'nsAddbookId': null
    };

    var addressSearchResult = nlapiSearchRecord(recType,null,
        [
            ["internalidnumber","equalto",nsRecId]
        ],
        [
            new nlobjSearchColumn("entityid").setSort(false),
            new nlobjSearchColumn("addressinternalid"),
            new nlobjSearchColumn("addresslabel"),
            new nlobjSearchColumn("address1"),
            new nlobjSearchColumn("address2"),
            new nlobjSearchColumn("city"),
            new nlobjSearchColumn("state"),
            new nlobjSearchColumn("country"),
            new nlobjSearchColumn("zipcode"),
            new nlobjSearchColumn("internalid","Address",null)
        ]
    );

    if(addressSearchResult){
        nlapiLogExecution("debug", stLogTitle, "addressSearchResult: " + JSON.stringify(addressSearchResult));
        for (var x = 0; x < addressSearchResult.length; x++) {
            var resultRow =  addressSearchResult[x];

            var nsAddId = resultRow.getValue('addressinternalid');
            var nsLabel = resultRow.getValue('addresslabel');
            var nsAddr1 = resultRow.getValue('address1');
            var nsAddr2 = resultRow.getValue('address2');
            var nsCity = resultRow.getValue('city');
            var nsState = resultRow.getValue('state');
            var nsCountry = resultRow.getText('country');
            var nsZip = resultRow.getValue('zipcode');
            var nsAddbookId = resultRow.getValue('internalid','Address');

            if(nsAddId == nsAddressIntId){
                nsAddressObject = {
                    'nsAddId': nsAddId,
                    'nsLabel': nsLabel,
                    'nsAddr1' : nsAddr1,
                    'nsAddr2' : nsAddr2,
                    'nsCity' : nsCity,
                    'nsState': nsState,
                    'nsCountry': nsCountry,
                    'nsZip': nsZip,
                    'nsAddbookId': nsAddbookId
                };
                nlapiLogExecution('DEBUG', stLogTitle,   'nsAddressObject > ' + JSON.stringify(nsAddressObject));

            }
        }


    }


    return nsAddressObject;
}
function getAddressObjCont(nsAddressIntId,nsRecId,recType){
    var stLogTitle= 'getAddressObjCont|nsAddressIntId:' + nsAddressIntId + ' |nsRecId: ' +nsRecId ;
    var nsAddressObject = {
        'nsAddId': null,
        'nsLabel': null,
        'nsAddr1' : null,
        'nsAddr2' : null,
        'nsCity' : null,
        'nsState': null,
        'nsCountry': null,
        'nsZip': null,
        'nsAddbookId': null
    };

    var addressSearchResult = nlapiSearchRecord("contact",null,
        [
            ["internalidnumber","equalto",nsRecId]
        ],
        [
            new nlobjSearchColumn("entityid").setSort(false),
            new nlobjSearchColumn("addressinternalid"),
            new nlobjSearchColumn("addresslabel"),
            new nlobjSearchColumn("address1"),
            new nlobjSearchColumn("address2"),
            new nlobjSearchColumn("city"),
            new nlobjSearchColumn("state"),
            new nlobjSearchColumn("country"),
            new nlobjSearchColumn("zipcode"),
            new nlobjSearchColumn("internalid","Address",null)
        ]
    );

    if(addressSearchResult){
        nlapiLogExecution("debug", stLogTitle, "addressSearchResult: " + JSON.stringify(addressSearchResult));
        for (var x = 0; x < addressSearchResult.length; x++) {
            var resultRow =  addressSearchResult[x];

            var nsAddId = resultRow.getValue('addressinternalid');
            var nsLabel = resultRow.getValue('addresslabel');
            var nsAddr1 = resultRow.getValue('address1');
            var nsAddr2 = resultRow.getValue('address2');
            var nsCity = resultRow.getValue('city');
            var nsState = resultRow.getValue('state');
            var nsCountry = resultRow.getText('country');
            var nsZip = resultRow.getValue('zipcode');
            var nsAddbookId = resultRow.getValue('internalid','Address');

            if(nsAddId == nsAddressIntId){
                nsAddressObject = {
                    'nsAddId': nsAddId,
                    'nsLabel': nsLabel,
                    'nsAddr1' : nsAddr1,
                    'nsAddr2' : nsAddr2,
                    'nsCity' : nsCity,
                    'nsState': nsState,
                    'nsCountry': nsCountry,
                    'nsZip': nsZip,
                    'nsAddbookId': nsAddbookId
                };
                nlapiLogExecution('DEBUG', stLogTitle,   'nsAddressObject > ' + JSON.stringify(nsAddressObject));

            }
        }


    }


    return nsAddressObject;
}
function getAddressObj(nsAddressIntId,companyId,recType){
    var stLogTitle= 'getAddressObj';
    var isChange = false;
    var addressLineCount = nlapiGetLineItemCount('addressbook');
    nlapiLogExecution('DEBUG', stLogTitle, 'nsAddressIntId: ' + nsAddressIntId);

    var customerRecord = nlapiLoadRecord(recType, companyId); // Replace 'customerId' with the internal ID of the customer

    // Get the number of addresses on the customer record
    var addressCount = customerRecord.getLineItemCount('addressbook');
    // Loop through each address
    for (var i = 1; i <= addressCount; i++) {
        var addressId = customerRecord.getLineItemValue('addressbook', 'id', i);
        var addressIntId = customerRecord.getLineItemValue('addressbook', 'addressinternalid', i);
        var defaultShipping = customerRecord.getLineItemValue('addressbook', 'defaultshipping', i);
        var defaultBilling = customerRecord.getLineItemValue('addressbook', 'defaultbilling', i);
        nlapiLogExecution('DEBUG', stLogTitle,   i + ' |Address Id: ' + addressId + ', |nsAddressIntId 1: ' + nsAddressIntId + ' |addressIntId: ' + addressIntId);
        if(addressId == nsAddressIntId){
            // Get the address fields directly from the customer record
            var addr1 = customerRecord.getLineItemValue('addressbook', 'addr1', i);
            var addr2 = customerRecord.getLineItemValue('addressbook', 'addr2', i);
            var city = customerRecord.getLineItemValue('addressbook', 'city', i);
            var state = customerRecord.getLineItemValue('addressbook', 'state', i);
            var country = customerRecord.getLineItemValue('addressbook', 'country', i);
            var zip = customerRecord.getLineItemValue('addressbook', 'zip', i);

            // Perform actions with the address information
            // For example, log the address details
            nlapiLogExecution('DEBUG', stLogTitle,   i + 'Address Id: ' + addressId + ', |Address 1: ' + addr1 + ', City: ' + city + ', State: ' + state + ', Country: ' + country + ', ZIP: ' + zip);
        }


    }
    /*
    if(addressLineCount > 0){

        for(var i=0; i < addressCount; i++){
            var addressId = customerRecord.getLineItemValue('addressbook', 'id', i);
            var defaultShipping = customerRecord.getLineItemValue('addressbook', 'defaultshipping', i);
            var defaultBilling = customerRecord.getLineItemValue('addressbook', 'defaultbilling', i);


            var addressSubrecord = customerRecord.viewLineItemSubrecord('addressbook', 'addressbookaddress', i);

            if (addressSubrecord) {
                var addr1 = addressSubrecord.getFieldValue('addr1');
                var city = addressSubrecord.getFieldValue('city');
                var state = addressSubrecord.getFieldValue('state');
                var country = addressSubrecord.getFieldValue('country');
                var zip = addressSubrecord.getFieldValue('zip');

                // Perform actions with the address information
                // For example, log the address details
                nlapiLogExecution('DEBUG', stLogTitle, 'Address ' + i, 'Address Id: ' + addressId + ', Address 1: ' + addr1 + ', City: ' + city + ', State: ' + state + ', Country: ' + country + ', ZIP: ' + zip);
            }
            if(addressId == nsAddressIntId){
                nlapiLogExecution('DEBUG', stLogTitle, 'ADDRESS FOUND MATCH');
            }

        }
    }

     */

    return isChange;
}

function searchCustomerAddresses2(recId,addressLineInternalId) {
    var stLogTitle = 'searchCustomerAddresses2';
    var intid = null;

    try{

        var searchId = 'customsearch_ctc_custom_comaddress';
        var search = nlapiLoadSearch('customer', searchId);
        var resultSet = search.runSearch();

        // Process the results
        resultSet.forEachResult(function (searchResult) {
            nlapiLogExecution('DEBUG', stLogTitle, 'RESULT: '+ JSON.stringify(searchResult));
            var name = searchResult.getValue('name');
            intid = searchResult.getValue('internalid');

            nlapiLogExecution('DEBUG', stLogTitle, 'name: ' + name);
            nlapiLogExecution('DEBUG', stLogTitle, 'intid: ' + intid);


        });

        nlapiLogExecution('DEBUG', 'Script Complete', 'Finished processing saved search results');

    }catch (e) {
        nlapiLogExecution('ERROR', stLogTitle,  'searchCustomerAddresses2 error' + e.message);
    }


    return intid;
}

function searchNsAddressObj(nsAddressIntId,nsRecId){
    var stLogTitle = 'searchNsAddressObj| '+ nsAddressIntId;
    var nsAddressObj = {
        'intid':null,
        'nsaddr1': null,
        'nsaddr2' : null,
        'nscity': null,
        'nsstate': null,
        'nscountry': null,
        'nszip': null
    };

    try{
        var customerRecord = nlapiLoadRecord('customer', nsRecId, {recordmode: 'dynamic'});
        var lineCount = nlapiGetLineItemCount('addressbook');

        for (var line = 1; line <= lineCount; line++) {
            // Get the subrecord for the address book
            var addressBookSubrecord = customerRecord.getSubListSubrecord('addressbook', 'addressbookaddress', line);

            //var addressBookSubrecord = customerRecord.viewLineItemSubrecord('addressbook', 'addressbookaddress', line);
            nlapiLogExecution('DEBUG', stLogTitle, 'addressBookSubrecord: ' + JSON.stringify(addressBookSubrecord));

            if (addressBookSubrecord) {
                // Retrieve the internal ID of the subrecord
                var subrecordInternalId = addressBookSubrecord.getId();

                // Get the address details from the subrecord
                var addr1 = addressBookSubrecord.getFieldValue('addr1');
                var city = addressBookSubrecord.getFieldValue('city');
                var state = addressBookSubrecord.getFieldValue('state');
                var country = addressBookSubrecord.getFieldValue('country');
                var zip = addressBookSubrecord.getFieldValue('zip');
                /*
                var addInternalId = addressBookSubrecord.getFieldValue('internalid');
                var address1 = addressBookSubrecord.addr1;
                var address2 = addressBookSubrecord.addr2;
                var city = addressBookSubrecord.city;
                var state = addressBookSubrecord.state;
                var country = addressBookSubrecord.country;
                var zip = addressBookSubrecord.zip;
                var cwSiteLink = addressBookSubrecord.getFieldValue('custentity_ctc_cw_sitelinkup');

                 */
                nlapiLogExecution('DEBUG', stLogTitle,   line + ' |Address 1: ' + addr1 + ', City: ' + city + ', State: ' + state + ', Country: ' + country + ', ZIP: ' + zip);

                // Log the internal ID of the subrecord

                if(nsAddressIntId == subrecordInternalId){
                    nlapiLogExecution('DEBUG', stLogTitle, 'Subrecord Internal ID (Line: ' + line + ')' + subrecordInternalId);
                    nsAddressObj = {
                        'intid':addInternalId,
                        'nsaddr1': address1,
                        'nsaddr2' : address2,
                        'nscity': city,
                        'nsstate': state,
                        'nscountry': country,
                        'nszip': zip,
                        'addressBookSubrecord': addressBookSubrecord
                    };
                }

            } else {
                nlapiLogExecution('DEBUG', 'No Address Book Subrecord (Line ' + line + ')', 'The customer record does not have an Address Book subrecord on this line.');
            }
        }

    }catch (e) {
        nlapiLogExecution('ERROR', searchNsAddressObj,'Could not get NS address record on ' + nsRecId, e);
        return e;
    }


    nlapiLogExecution('DEBUG', stLogTitle,'nsAddressObj: ' + JSON.stringify(nsAddressObj));


    return nsAddressObj

}



function updateAddress(){
    var stLogTitle = 'updateAddress';


    var addressObjValue  ={
        'address1': null,
        'address2': null,
        'city': null,
        'state': null,
        'country': null,
        'zipcode': null
    }

}

function assignCustomField(cwCustomFieldObj,fieldId, fieldValue){
    var stLogTitle = 'assignCustomField|' +fieldId;
    var count = cwCustomFieldObj.length;
    //nlapiLogExecution('AUDIT', stLogTitle,'count: ' + count + '|cwCustomFieldObj: ' + JSON.stringify(cwCustomFieldObj));

    for( var i= 0; i < cwCustomFieldObj.length; i++){
        nlapiLogExecution('AUDIT', stLogTitle, 'INSIDE FOR LOOP');
        var customFieldRow = cwCustomFieldObj[i];
        //nlapiLogExecution('AUDIT', stLogTitle, 'customFieldRow: '+ JSON.stringify(customFieldRow));
        var customFieldId = customFieldRow.id;
        var caption = customFieldRow.caption;
        var customFieldValue = customFieldRow.value;

        nlapiLogExecution('AUDIT', stLogTitle, 'customFieldId: '+ customFieldId +' |caption: ' + caption + ' |fieldId: ' + fieldId);
        nlapiLogExecution('AUDIT', stLogTitle, 'customFieldValue: '+ customFieldValue );
        if(customFieldId == fieldId){
            nlapiLogExecution('AUDIT', stLogTitle, 'FIELD ID MATCH');
            customFieldRow.value = fieldValue;
            nlapiLogExecution('AUDIT', stLogTitle, 'fieldValue: '+ fieldValue );
        }
    }

    return cwCustomFieldObj;
}


function isEmpty(stValue) {

    if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
        return true;
    } else if (typeof stValue == 'object') {
        for (var prop in stValue) {
            if (stValue.hasOwnProperty(prop))
                return false;
        }

        return;
    } else {
        if (stValue instanceof String) {
            if ((stValue == '')) {
                return true;
            }
        } else if (stValue instanceof Array) {
            if (stValue.length == 0) {
                return true;
            }
        }

        return false;
    }
}