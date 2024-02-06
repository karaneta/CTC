function fieldChanged_Reatiner_SalesOrder(type, name)
{
	var functionName = 'fieldChanged_Reatiner_SalesOrder';
	var processStr = '';
	
	try
	{
		switch(name)
		{
			case 'entity':
				/**
				var currencyValue = nlapiGetFieldValue(FLDID_SL_BODY_CURRENCY);
				var hasCurrencyValue = (!isNullOrEmpty(currencyValue)) ? true : false;

				if (hasCurrencyValue)
				{
					var objProject = getObjProjectFromCurrency(currencyValue);
					var hasObjProject = (!isNullOrEmptyObject(objProject)) ? true : false;
					
					if (hasObjProject)
					{
						nlapiRemoveSelectOption(FLDID_SL_BODY_PROJECT, null);
						
						for (var dx in objProject)
						{
							nlapiInsertSelectOption(FLDID_SL_BODY_PROJECT, dx, objProject[dx], false);
						}
					}
					
					if (!hasObjProject)
					{
						nlapiRemoveSelectOption(FLDID_SL_BODY_PROJECT, null);
					}
				}
				
				if (!hasCurrencyValue)
				{
					nlapiRemoveSelectOption(FLDID_SL_BODY_PROJECT, null);
				}
				**/
				console.log('fieldChanged_Reatiner_SalesOrder');
				
				var entityIdRef = nlapiGetFieldValue('entity');
				var hasEntityIdRef = (!isNullOrEmpty(entityIdRef)) ? true : false;
				
				if (hasEntityIdRef)
				{
					var retainerRefId = nlapiLookupField('customer', entityIdRef, 'custentity_ctc_retainer_reference');
					var hasRetainerRef = (!isNullOrEmpty(retainerRefId)) ? true : false;
					
					if (hasRetainerRef)
					{
						var retainerLookUp = nlapiLookupField('customrecord_ctc_retainer', retainerRefId, [ 'custrecord_ctc_rtnr_total_budget'
																										   , 'custrecord_ctc_rtnr_total_committed'
																										   , 'custrecord_ctc_rtnr_total_billed'
																										   , 'custrecord_ctc_rtnr_total_bgt_adjustment'
																										   , 'custrecord_ctc_rtnr_total_bgt_remaining']
															  );
						
						
						var retainerBudget = retainerLookUp.custrecord_ctc_rtnr_total_budget;
						var totalCommitted = retainerLookUp.custrecord_ctc_rtnr_total_committed;
						var totalBilled = retainerLookUp.custrecord_ctc_rtnr_total_billed;
						var totalAdjustment = retainerLookUp.custrecord_ctc_rtnr_total_bgt_adjustment;
						var totalRemaining = retainerLookUp.custrecord_ctc_rtnr_total_bgt_remaining;
						
						
						var alertWriter = '';
						alertWriter += 'Retainer Record Details: ' + '\n\n';
						alertWriter += 'Retainer Budget: ' + addCurrencyComma(retainerBudget.toString(), '') + '\n';
						alertWriter += 'Total Committed: ' + addCurrencyComma(totalCommitted.toString(), '') + '\n';
						alertWriter += 'Total Billed: ' + addCurrencyComma(totalBilled.toString(), '') + '\n';
						alertWriter += 'Total Adjustment: ' + addCurrencyComma(totalAdjustment.toString(), '') + '\n';
						alertWriter += 'Total Remaining: ' + addCurrencyComma(totalRemaining.toString(), '') + '\n\n';
						
						alert(alertWriter)
					}
					
				}
				
			break;
		
		}
	}
		catch(ex)
	{
		var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
		nlapiLogExecution('Debug', functionName, 'vsdvsdb' + 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
		
		alert(errorStr)		
	}
	
}
