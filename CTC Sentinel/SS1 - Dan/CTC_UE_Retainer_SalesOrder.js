

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
			
			if (isViewMode)
			{
				var isRetainerRefValue = objRec.getFieldValue('custbody_ctc_is_retainer_reference');
				var isRetainerRef = (isRetainerRefValue == 'T') ? true : false;
				
				nlapiLogExecution('debug', functionName, 'isRetainerRef: ' + isRetainerRef);
				
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
			
			var isRetainerRefValue = objRec.getFieldValue('custbody_ctc_is_retainer_reference');
			var isRetainerRef = (isRetainerRefValue == 'T') ? true : false;
			
			var entityId = objRec.getFieldValue('entity');
			var createdDate = objRec.getFieldValue('createddate');
			var soTotal = objRec.getFieldValue('total');
			
			
			
			if (isCreateMode)
			{
				//===============
				
				if (isRetainerRef)
				{
					var retainerId = createRetainerRecord(entityId, soTotal, createdDate);
					var hasRetainerId = (!isNullOrEmpty(retainerId)) ? true : false;
					
					if (hasRetainerId)
					{
						updateCustomerRec = nlapiSubmitField('customer', entityId, 'custentity_ctc_retainer_reference', retainerId)
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
