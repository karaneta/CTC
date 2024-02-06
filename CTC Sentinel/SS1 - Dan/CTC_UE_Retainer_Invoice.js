

function beforeLoad_Retainer_SalesOrder(type, form)
{
	var functionName = 'beforeLoad_Retainer_SalesOrder';
	var processStr = '';
	var ctxObj = nlapiGetContext();
	var isExecutionCtxUserInterface = (!isNullOrEmpty(ctxObj.getExecutionContext()) && ctxObj.getExecutionContext() == 'userinterface') ? true : false;
	var isExecutionCtxCustomMassUpdate = (!isNullOrEmpty(ctxObj.getExecutionContext()) && ctxObj.getExecutionContext() == 'custommassupdate') ? true : false;

	var isCreateMode = (!isNullOrEmpty(type) && type == 'create') ? true : false;
	var isEditMode = (!isNullOrEmpty(type) && type == 'edit') ? true : false;
	var isViewMode = (!isNullOrEmpty(type) && type == 'view') ? true : false;
	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	var recNew = nlapiGetNewRecord();
	var recOld = nlapiGetOldRecord();
	
	nlapiLogExecution('debug', functionName, '-- start ' + functionName + ' --');

	try
	{

		if (isExecutionCtxUserInterface)
		{
			var objRec = recNew;

			var isRetainerRefValue = objRec.getFieldValue('custbody_ctc_is_retainer_reference');
			var isRetainerRef = (isRetainerRefValue == 'T') ? true : false;
			
			if (isEditMode)
			{
				if (!isRetainerRef)
				{
					
				}
			}
		


			if (isViewMode)
			{

			}
		}
	}
		catch(ex)
	{
        var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('debug', functionName, 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
	}
	nlapiLogExecution('debug', functionName, '-- end ' + functionName + ' --');
}


function beforeSubmit_Retainer_SalesOrder(type)
{
	var functionName = 'beforeSubmit_Retainer_SalesOrder';
	var processStr = '';
	var ctxObj = nlapiGetContext();
	var isExecutionCtxUserInterface = (!isNullOrEmpty(ctxObj.getExecutionContext()) && ctxObj.getExecutionContext() == 'userinterface') ? true : false;
	var isExecutionCtxCustomMassUpdate = (!isNullOrEmpty(ctxObj.getExecutionContext()) && ctxObj.getExecutionContext() == 'custommassupdate') ? true : false;

	var isCreateMode = (!isNullOrEmpty(type) && type == 'create') ? true : false;
	var isEditMode = (!isNullOrEmpty(type) && type == 'edit') ? true : false;
	var isViewMode = (!isNullOrEmpty(type) && type == 'view') ? true : false;
	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	var recNew = nlapiGetNewRecord();
	var recOld = nlapiGetOldRecord();
	
	nlapiLogExecution('debug', functionName, '-- start ' + functionName + ' --');

	try
	{

		if (isExecutionCtxUserInterface || isExecutionCtxCustomMassUpdate)
		{
			if (isCreateMode || isEditMode)
			{
				//===============

				//===============
			}
		}
	}
		catch(ex)
	{
        var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('debug', functionName, 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
	}
	nlapiLogExecution('debug', functionName, '-- end ' + functionName + ' --');
}


function afterSubmit_Retainer_SalesOrder(type)
{
	var functionName = 'afterSubmit_Retainer_SalesOrder';
	var processStr = '';
	var ctxObj = nlapiGetContext();
	var isExecutionCtxUserInterface = (!isNullOrEmpty(ctxObj.getExecutionContext()) && ctxObj.getExecutionContext() == 'userinterface') ? true : false;
	var isExecutionCtxCustomMassUpdate = (!isNullOrEmpty(ctxObj.getExecutionContext()) && ctxObj.getExecutionContext() == 'custommassupdate') ? true : false;

	var isCreateMode = (!isNullOrEmpty(type) && type == 'create') ? true : false;
	var isEditMode = (!isNullOrEmpty(type) && type == 'edit') ? true : false;
	var isViewMode = (!isNullOrEmpty(type) && type == 'view') ? true : false;
	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	var recNew = nlapiGetNewRecord();
	var recOld = nlapiGetOldRecord();
	
	nlapiLogExecution('debug', functionName, '-- start ' + functionName + ' --');

	try
	{
		if (isExecutionCtxUserInterface) 
		{
			var objRec = nlapiLoadRecord(recType, recId);
			var entityId = objRec.getFieldValue('entity');

			var hasEntity = (!isNullOrEmpty(entityId)) ? true : false;
			
			if (isCreateMode)
			{
				//===============
				
				if (hasEntity)
				{
					var customerRetainerRef = nlapiLookupField('customer', entityId, 'custentity_ctc_retainer_reference');
					var hasCustomerRetainerRef = (!isNullOrEmpty(customerRetainerRef)) ? true : false;
					
					if (hasCustomerRetainerRef)
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
						
						
						
						var computedTotalCommitted = getCustomerRetainerTotalCommited(4722, entityId);
						var computedTotalBilled = getCustomerRetainerTotalBilled(4722, entityId);
						
						var newRetainerRemaingBudget = parseFloat(retainerBudget) - parseFloat(computedTotalBilled);
						
						var updateRetainerRecord = nlapiSubmitField('customrecord_ctc_retainer', retainerRefId, ['custrecord_ctc_rtnr_total_committed', 'custrecord_ctc_rtnr_total_billed', 'custrecord_ctc_rtnr_total_bgt_remaining']
																											  , [computedTotalCommitted, computedTotalBilled, newRetainerRemaingBudget]
																											  )
						
					}
					
				}
				
				
				//===============
				
			}
		}
	}
		catch(ex)
	{
        var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('debug', functionName, 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
	}
	nlapiLogExecution('debug', functionName, '-- end ' + functionName + ' --');
}
