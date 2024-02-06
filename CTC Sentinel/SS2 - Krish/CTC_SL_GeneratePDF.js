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
 * Project Number: Service TODO-
 * Script Name: CTC SL Generate Retainer PDF
 * Author: karaneta@nscatalyst.com
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description
 *
 * CHANGELOGS
 *
 * Version	Date            Author		    Remarks
 * 1.00		Jan 26, 2023	karaneta		Initial Build
 *
 */
var retainerItem = '99047' //Retainer - NetSuite
define(['N/file', 'N/render', 'N/search', 'N/log', 'N/redirect', 'N/record',
        'N/config'],
    function (file, render, search, log, redirect, record, config) {

        function onRequest(context) {
            var stLogTitle = 'Generate PDF Suitelet';
            var request = context.request;
            var response = context.response;
            var datasource;

            var custId = context.request.parameters.custparam_custid;

            log.debug({
                title: stLogTitle,
                details: 'custId: ' + custId
            });
            var companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
            });

            var logo = companyInfo.getText({
                fieldId: 'pagelogo'
            });

            var clogo = file.load({
                id: 'Images/' + logo
            });

            if (context.request.method == 'GET') {
                var custobj = getCustomerInfo(custId);
                var invoiceResult = getInvoices(custId);
                var creditMemoResult = getCreditMemo(custId);
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                today = mm + '/' + dd + '/' + yyyy;
                var retainerobj = getOpenRetainerDetails(custId);

                datasource = {
                    logo: clogo.url,
                    today: today,
                    custobj: custobj,
                    invobj: invoiceResult,
                    cmobj: creditMemoResult,
                    retainer: retainerobj
                };

                var htmlTemplate = file
                    .load({
                        id: 'SuiteScripts/CTC.Sentinel/CTC.SS2/CTC.Retainer/CTC_RetainerTemplate.html'
                    });

                var retainerReport = renderPDF(htmlTemplate, datasource, response,custId);
                context.response.setHeader({name: 'Content-Type', value: 'application/pdf'});
                context.response.setHeader({
                    name: 'Content-Disposition',
                    value: 'inline; filename="' + retainerReport.fileName + '"'
                });
                context.response.writeFile(retainerReport.file);

            }

        }

        function renderPDF(htmlTemplate, datasource, response,custId) {
            log.debug('renderPDF ');
            log.debug({
                title: 'datasource',
                details: JSON.stringify(datasource)
            });

            var pageRenderer = render.create();
            pageRenderer.templateContent = htmlTemplate.getContents();
            var returnValue;

            pageRenderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'ds',
                data: datasource
            });

            returnValue = {
                fileName: ['RetainerReport#', custId, '.pdf'].join(),
                file: pageRenderer.renderAsPdf()
            };

            var retainerStatement = pageRenderer.renderAsPdf();
            //response.writeFile(retainerStatement, false);
            return returnValue;

        }

        function getCustomerInfo(custId) {
            var stLogTitle = 'getCustomerInfo';
            var custObj = null;
            if (!isEmpty(custId)) {
                try {
                    var customerSearch = search.create({
                        type: search.Type.CUSTOMER,
                        columns: ['entityid', 'attention', 'addressee', 'address1', 'address2', 'city', 'state', 'zipcode', 'custentity_ctc_custret_totalbalance', 'email'],
                        filters: [search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.ANYOF,
                            values: custId
                        }),
                            search.createFilter({
                                name: 'isdefaultbilling',
                                operator: search.Operator.IS,
                                values: 'T'
                            })]
                    });

                    custObj = customerSearch.run().getRange({
                        start: 0,
                        end: 999
                    });

                    log.debug({
                        title: 'customer search result',
                        details: JSON.stringify(custObj)
                    });

                    if (!isEmpty(custObj)) {
                        for (var i = 0; i < custObj.length; i++) {
                            var entityID = custObj[i].getValue({name: 'entityid'});
                            var at = custObj[i].getValue({name: 'attention'});
                            log.debug(custObj[i], ' entityID:' + entityID + ' - attention: ' + at);

                        }
                        // return custObj;
                    }

                } catch (e) {
                    log.error({
                        title: stLogTitle,
                        details: e
                    });

                }
            }

            return custObj;
        }

        function getInvoices(custId) {
            var stLogTitle = 'getInvoices';
            var invoiceResult = null;

            if (!isEmpty(custId)) {
                try {
                    var invoiceSearch = search.create({
                        type: search.Type.TRANSACTION,
                        columns: ['internalid', 'type', 'trandate', 'tranid', 'entity', 'amount', 'custbody_ctc_ret_trans_amount'],
                        filters: [search.createFilter({
                            name: 'type',
                            operator: search.Operator.ANYOF,
                            values: 'CustInvc'
                        }),
                            search.createFilter({
                                name: 'internalid',
                                join: 'customermain',
                                operator: search.Operator.ANYOF,
                                values: custId
                            }),
                            search.createFilter({
                                name: 'internalid',
                                join: 'item',
                                operator: search.Operator.ANYOF,
                                values: '99047' //Retainer - NetSuite
                            })
                        ]
                    });

                    invoiceResult = invoiceSearch.run().getRange({
                        start: 0,
                        end: 10
                    });

                    log.debug({
                        title: 'invoice search result',
                        details: JSON.stringify(invoiceResult)
                    });

                    if (!isEmpty(invoiceResult)) {
                        for (var i = 0; i < invoiceResult.length; i++) {
                            var inv = invoiceResult[i].getValue({name: 'tranid'});
                            var a = invoiceResult[i].getValue({name: 'amount'});
                            log.debug(invoiceResult[i], ' inv:' + inv + ' - a: ' + a);
                        }
                    }

                    return invoiceResult;

                } catch (e) {
                    log.error({
                        title: stLogTitle,
                        details: e
                    });

                }

            }

        }

        function getCreditMemo(custId){
            var stLogTitle = 'getCreditMemo';
            var creditMemoResult = null;

            if (!isEmpty(custId)) {
                try {
                    var creditSearch = search.create({
                        type: search.Type.TRANSACTION,
                        columns: ['internalid', 'type', 'trandate', 'tranid', 'entity', 'amount', 'custbody_ctc_ret_trans_amount'],
                        filters: [search.createFilter({
                            name: 'type',
                            operator: search.Operator.ANYOF,
                            values: 'CustCred'
                        }),
                            search.createFilter({
                                name: 'internalid',
                                join: 'customermain',
                                operator: search.Operator.ANYOF,
                                values: custId
                            }),
                            search.createFilter({
                                name: 'internalid',
                                join: 'item',
                                operator: search.Operator.ANYOF,
                                values: retainerItem
                            })
                        ]
                    });

                    creditMemoResult = creditSearch.run().getRange({
                        start: 0,
                        end: 999
                    });

                    log.debug({
                        title: 'credit memo search result',
                        details: JSON.stringify(creditMemoResult)
                    });

                    if (!isEmpty(creditMemoResult)) {
                        for (var i = 0; i < creditMemoResult.length; i++) {
                            var cm = creditMemoResult[i].getValue({name: 'tranid'});
                            var a = creditMemoResult[i].getValue({name: 'custbody_ctc_ret_trans_amount'});
                            log.debug(creditMemoResult[i], ' cm:' + cm + ' - a: ' + a);
                        }
                    }


                } catch (e) {
                    log.error({
                        title: stLogTitle,
                        details: e
                    });

                }

            }
            return creditMemoResult;

        }

        function getOpenRetainerDetails(custId) {
            var stLogTitle = 'getOpenRetainerDetails';
            var retainerResult;
            var retainerObj = {
                'retainerStart': null,
                'retainerEnd': null,
                'retainerBudget': null
            };

            if (!isEmpty(custId)) {
                try {
                    //Load retainer record and get balance
                    var customerRetainerSearch = search.create({
                        type: 'customrecord_ctc_retainer',
                        filters: [search.createFilter({
                            name: 'custrecord_ctc_rtnr_customer_ref',
                            operator: search.Operator.ANYOF,
                            values: custId
                        }), search.createFilter({
                            name: 'custrecord_ctc_rtnr_status',
                            operator: search.Operator.ANYOF,
                            values: ['1', '2']  // Open or partially used
                        })],
                        columns: ['internalid', 'name', 'custrecord_ctc_rtnr_total_budget', 'custrecord_ctc_rtnr_start_date', 'custrecord_ctc_rtnr_end_date']
                    });

                    retainerResult = customerRetainerSearch.run().getRange({
                        start: 0,
                        end: 1
                    });

                    log.debug({
                        title: 'retainer search result',
                        details: JSON.stringify(retainerResult)
                    });

                    if (!isEmpty(retainerResult)) {
                        for (var i = 0; i < retainerResult.length; i++) {
                            var retName = retainerResult[i].getValue({name: 'name'});
                            var startDate = retainerResult[i].getValue({name: 'custrecord_ctc_rtnr_start_date'});
                            var endDate = retainerResult[i].getValue({name: 'custrecord_ctc_rtnr_end_date'});
                            var totalBudget = retainerResult[i].getValue({name: 'custrecord_ctc_rtnr_total_budget'});
                            log.debug(retainerResult[i], 'retName: ' + retName + ' -startDate:' + startDate + ' - endDate: ' + endDate + ' - custrecord_ctc_rtnr_total_budget:' + totalBudget);
                            retainerObj = {
                                'retainerStart': startDate,
                                'retainerEnd': endDate,
                                'retainerBudget': totalBudget
                            }
                        }
                    }

                    return retainerObj;

                } catch (e) {
                    log.error({
                        title: stLogTitle,
                        details: e
                    });

                }

            }

        }

        function isEmpty(stValue) {
            if ((stValue === '') || (stValue === null) || (stValue === undefined)) {
                return true;
            } else {
                if (typeof stValue === 'string') {
                    if ((stValue === '')) {
                        return true;
                    }
                } else if (typeof stValue === 'object') {
                    if (stValue.length === 0 || stValue.length === 'undefined') {
                        return true;
                    }
                }

                return false;
            }
        }


        return {
            onRequest: onRequest
        };

    });
