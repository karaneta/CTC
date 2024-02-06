
/** ######################################### Start Prototype Utilities ######################################### ***/

// Function to check if array element exist
Array.prototype.inArray = function(valueStr)
{
	var convertedValueStr = valueStr.toString();
	
	for(var i = 0; i < this.length; i++)
	{
		if (this[i] === convertedValueStr)
		
		return true;
	
	}
	return false;
};

Object.size = function(obj) {
    var hasOwnProperty = Object.prototype.hasOwnProperty;
	var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

Array.prototype.randomize = function()
{
	var i = this.length, j, temp;
	while ( --i )
	{
		j = Math.floor( Math.random() * (i - 1) );
		temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
}

Array.prototype.sortByObjKey = function(p, pattern)
{
	switch(pattern)
	{
		case 'ASC':
			return this.sort(function(a,b){ return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0; });
		break;
	
		case 'DESC':
			return this.sort(function(a,b){ return (a[p] < b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0; }); break;
		break;
	
		default: return this.sort(function(a,b){ return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0; });
	}
	
}

/** #########################################  End Prototype Utilities  ######################################### ***/


/** ######################################### Start Helper Utilities ######################################### ***/

function isNullOrEmpty(valueStr)
{
   return(valueStr == null || valueStr == "" || valueStr == undefined); 
}

function isNullOrEmptyObject(obj) 
{
   var hasOwnProperty = Object.prototype.hasOwnProperty;
   
   if (obj.length && obj.length > 0) { return false; }   
   for (var key in obj) { if (hasOwnProperty.call(obj, key)) return false; }
   return true;
}

function isObjectExist(objFld)
{
   var isObjExist = (typeof objFld != "undefined") ? true : false;
   return isObjExist;
}


function forceParseFloat(stValue)
{
    var flValue = parseFloat(stValue);
    
    if (isFinite(flValue) == false)
    {
        return 0.00;        
    }
    
    if (isNaN(flValue))
    {
        return 0.00;
    }
    
    return flValue;
}

function cleanArray(dirtyArray)
{
	var newArray = [];
	
	for(var i = 0; i < dirtyArray.length; i++)
	{
		if (dirtyArray[i]) 
		{ 
			newArray.push(dirtyArray[i]);
		}
	}
	return newArray;
}

function formatJsonLog(paramObj)
{
	var functionName = '';
	var processStr = '';
	var stJson = '';
	var formattedJson = '';
	try
	{
		stJson = (!isNullOrEmpty(paramObj)) ? JSON.stringify(paramObj, 'key', '\t') : '';
		formattedJson = stJson.replace(/\n/g, "<br/>");
	}
		catch(ex)
	{
		formattedJson = '';		
	}
	return formattedJson;
}


function removeDuplicateElement(arrayName)
{
	var newArray = [];
	label:for(var i = 0; i < arrayName.length;i++ )
	{  
		for(var j = 0; j < newArray.length;j++ )
		{
			if(newArray[j]==arrayName[i]) 
			continue label;
		}
		newArray[newArray.length] = arrayName[i];
	}
	return newArray;
}

function getArrLimitCount(paramArrRef, paramLimitCount)
{
   var arrNew = [];
   var paramArrRefTotal = (!isNullOrEmpty(paramArrRef)) ? paramArrRef.length : 0;
   var isParamArrRefTotalLessThanLimitCount = (paramArrRefTotal < paramLimitCount) ? true : false;
   var loopTotal = (isParamArrRefTotalLessThanLimitCount) ? paramArrRefTotal : paramLimitCount;
   
   for (var dx = 0; dx < loopTotal; dx++)
   {
	  arrNew.push(paramArrRef[dx])
   }

   return arrNew;
}

function getArrRandomNumbers(paramRefMaxNumber, paramArrTotalNumber)
{
	var arrRandomRef = [];
	var arrTotalRef = (paramRefMaxNumber < paramArrTotalNumber) ? paramRefMaxNumber : paramArrTotalNumber;
	var intArrCtr = 0
	
	while (intArrCtr != arrTotalRef)
	{
		var randomNumber = parseInt(Math.floor(Math.random() * paramRefMaxNumber)).toFixed(0);
		var isRandomNumberInArrRandomRef = arrRandomRef.inArray(randomNumber) ? true : false;
		
		if (!isRandomNumberInArrRandomRef)
		{
			arrRandomRef.push(randomNumber);
			intArrCtr++;
		}
	}
	return arrRandomRef;
}

function stripHtml(paramValueStr)
{
	var newStr = paramValueStr.replace(/(<([^>]+)>)/ig,"");
	return newStr;
}

function replaceChars(valusStr, out, add) 
{
	temp = '' + valusStr; // temporary holder
	
	while (temp.indexOf(out) > -1) 
	{
		pos= temp.indexOf(out);
		temp = "" + (temp.substring(0, pos) + add + 
		temp.substring((pos + out.length), temp.length));
	}
	return temp;
}

function padLeft(s, c, n) 
{
    if (! s || ! c || s.length >= n) { return s; }
    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) { s = c + s; }
    return s;
}

function padRight(s, c, n) 
{
    if (! s || ! c || s.length >= n) { return s; }
    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) { s += c; }
    return s;
}

function roundOffNumber(value, exp)
{
	if (typeof exp === 'undefined' || +exp === 0) return Math.round(value);
	
	value = +value;
	exp  = +exp;
	
	if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
	  return NaN;
	
	// Shift
	value = value.toString().split('e');
	value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
	
	// Shift back
	value = value.toString().split('e');
	return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}



function createRetainerRecord(paramEntityId, paramTotal, paramCreatedDate)
{
	var functionName = '';
	var processStr = '';
	var stReturn = '';
	
	try
	{
		var dateRef = nlapiStringToDate(paramCreatedDate)
		
		var stName = padLeft(paramEntityId.toString(), '0', 6);
		
		var objRec = nlapiCreateRecord('customrecord_ctc_retainer');
		objRec.setFieldValue('name', stName);

		objRec.setFieldValue('custrecord_ctc_rtnr_customer_ref', paramEntityId);
		objRec.setFieldValue('custrecord_ctc_rtnr_total_budget', paramTotal);
		objRec.setFieldValue('custrecord_ctc_rtnr_total_bgt_remaining', paramTotal);
		objRec.setFieldValue('custrecord_ctc_rtnr_start_date', dateRef);
		objRec.setFieldValue('custrecord_ctc_rtnr_end_date', nlapiAddMonths(dateRef, 12));
		
		stReturn = nlapiSubmitRecord(objRec, true);
		
	}
		catch(ex)
	{
        stReturn = '';
		var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('debug', functionName, 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
	}
	
	return stReturn;
	
}


function getCustomerRetainerTotalCommited(paramRetainerItemId, paramCustomerId)
{
	var functionName = 'getCustomerRetainerTotalCommited';
	var processStr = '';
	var returnTotal = 0;
	
	try
	{
		var itemId = paramRetainerItemId;
		var customerId = paramCustomerId;
		
		var hasItemId = (!isNullOrEmpty(itemId)) ? true : false;
		var hasCustomerId = (!isNullOrEmpty(customerId)) ? true : false;
		
		
		
		if (hasItemId && hasCustomerId)
		{
			var arrItemIds = [];
			var arrCustomerIds = [];
			
			arrItemIds.push(itemId);
			arrCustomerIds.push(customerId)
			
			var arrFilters = [   new nlobjSearchFilter('item', null, 'anyof', arrItemIds) // 4722
							   , new nlobjSearchFilter('internalid', 'customermain', 'anyof', arrCustomerIds) // 2543
							   , new nlobjSearchFilter('custbody_ctc_is_retainer_reference', null, 'is', 'F')
			
							   ];
			var arrColumns = [   new nlobjSearchColumn('internalid')
							   , new nlobjSearchColumn('lineuniquekey')
							   , new nlobjSearchColumn('amount')
							 ];
			
			
			var searchResults = nlapiSearchRecord('salesorder', null, arrFilters, arrColumns);
			var searchResultsTotal = (!isNullOrEmpty(searchResults)) ? searchResults.length : 0;
			
			var hasSearchResults = (searchResultsTotal != 0) ? true : false;
			
			if (hasSearchResults)
			{
				for (var dx = 0; dx < searchResultsTotal; dx++)
				{
					var searchResult = searchResults[dx];
					var amount = searchResult.getValue('amount') || 0;
					returnTotal = parseFloat(returnTotal) + parseFloat(amount);
					
				}
			}
			
		}
		
		
	}
		catch(ex)
	{
		returnTotal = 0;
		var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('debug', functionName, 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
	}
	return parseFloat(returnTotal).toFixed(2);
}


function getCustomerRetainerTotalBilled(paramRetainerItemId, paramCustomerId)
{
	var functionName = 'getCustomerRetainerTotalBilled';
	var processStr = '';
	var returnTotal = 0;
	
	try
	{
		var itemId = paramRetainerItemId;
		var customerId = paramCustomerId;
		
		var hasItemId = (!isNullOrEmpty(itemId)) ? true : false;
		var hasCustomerId = (!isNullOrEmpty(customerId)) ? true : false;
		
		
		
		if (hasItemId && hasCustomerId)
		{
			var arrItemIds = [];
			var arrCustomerIds = [];
			
			arrItemIds.push(itemId);
			arrCustomerIds.push(customerId)
			
			var arrFilters = [   new nlobjSearchFilter('item', null, 'anyof', arrItemIds) // 4722
							   , new nlobjSearchFilter('internalid', 'customermain', 'anyof', arrCustomerIds) // 2543
							   //, new nlobjSearchFilter('custbody_ctc_is_retainer_reference', null, 'is', 'F')
			
							   ];
			var arrColumns = [   new nlobjSearchColumn('internalid')
							   , new nlobjSearchColumn('lineuniquekey')
							   , new nlobjSearchColumn('amount')
							 ];
			
			
			var searchResults = nlapiSearchRecord('invoice', null, arrFilters, arrColumns);
			var searchResultsTotal = (!isNullOrEmpty(searchResults)) ? searchResults.length : 0;
			
			var hasSearchResults = (searchResultsTotal != 0) ? true : false;
			
			if (hasSearchResults)
			{
				for (var dx = 0; dx < searchResultsTotal; dx++)
				{
					var searchResult = searchResults[dx];
					var amount = searchResult.getValue('amount') || 0;
					returnTotal = parseFloat(returnTotal) + parseFloat(amount);
					
				}
			}
		}
	}
		catch(ex)
	{
		returnTotal = 0;
		var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('debug', functionName, 'A problem occured whilst ' + processStr + ': ' + '<br>' + errorStr);
	}
	return parseFloat(returnTotal).toFixed(2);
}

/** #########################################  End Helper Utilities  ######################################### ***/
