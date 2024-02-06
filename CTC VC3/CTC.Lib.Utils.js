/**
 * CTC.Lib.Utils
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(function() {
	'use strict';
	
	/************************************************
	 * 				START PROTOTYPES
	 ***********************************************/
	// Date Prototype
    Date.prototype.cloneDate = function () {
        return new Date(this.getTime());
    }

    Date.prototype.lastDayOfPreviousMonth = function () {
        return new Date(this.getFullYear(), this.getMonth(), 0);
    }

    Date.prototype.lastDayOfCurrentMonth = function () {
        return new Date(this.getFullYear(), this.getMonth() + 1, 0);
    }

    Date.prototype.firstDayOfCurrentMonth = function () {
        return new Date(this.getFullYear(), this.getMonth(), 1);
    }

    Date.prototype.numberOfDaysInCurrentMonth = function () {
        return this.lastDayOfCurrentMonth().getDate();
    }

    Date.prototype.getMonthDiff_fractional = function (d) {
        var fDate = null;
        var tDate = null;
        var thisRoundDate = new Date(this.getFullYear(), this.getMonth(), this.getDate());
        var dRoundDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (thisRoundDate == dRoundDate) {
            return 0;
        } else if (thisRoundDate.getTime() < dRoundDate.getTime()) {
            fDate = thisRoundDate;
            tDate = dRoundDate;
        } else {
            console.log(5);
            fDate = dRoundDate;
            tDate = thisRoundDate;
        }
        var isSkipped = false;
        var months = 0;
        while (!isSkipped) {
            if (fDate.lastDayOfCurrentMonth().getTime() >= tDate.getTime()) {
                if (fDate.getTime() != tDate.getTime()) {
                    if (fDate.getTime() > tDate.getTime()) {
                        if (fDate.getMonth() != tDate.getMonth()) {
                            fDate = fDate.lastDayOfPreviousMonth();
                        }
                    }
                    var dayDiff = tDate.getDate() - fDate.getDate();
                    var daysInMonth = tDate.numberOfDaysInCurrentMonth();
                    var partial = dayDiff / daysInMonth;
                    months += partial;
                }
                isSkipped = true;
            } else {
                months += 1;
                fDate.setMonth(fDate.getMonth() + 1);
            }
        }
        return Math.floor(months * 100) / 100;
    }

    // Numbers Prototype
    
    Number.prototype.toCurrencyString = function(symbol) {
		var res = this.toFixedFloat(2).toFixed(2).replace(/(\d)(?=(\d{3})+\b)/g, '$1,');
		if(!isNullOrEmpty(symbol)) {
			return symbol + res;
		}
		return res;
	};

    /**
     * Returns an formatted string
     *
     * @param {Integer} decimal places : Number of decimal places. Default 2.
     * @param {String} decimal separator : default "."
     * @param {String} thousands separator : default ","
     * @returns {String} Formated string
     */
    Number.prototype.formatCurrencyValue = function (c, d, t) {
        var n = this,
            c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t,
            s = n < 0 ? "-" : "",
            i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    }

    Number.prototype.toFixedFloat = function (n) {
        return parseFloat(parseFloat(this).toFixed(2));
    }

    // String Prototype
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    }

    String.prototype.trimAll = function () {
        return this.replace(/ /g, '');
    }
    
    String.prototype.startsWith = function(substring, position) {
		position = position || 0;
		return this.indexOf(substring, position) === position;
	};

	String.prototype.endsWith = function(substring, position) {
		substring = String(substring);

		var subLen = substring.length | 0;

		if(!subLen)
			return true;//Empty string

		var strLen = this.length;

		if(position === void 0)
			position = strLen;
		else
			position = position | 0;

		if(position < 1)
			return false;

		var fromIndex = (strLen < position ? strLen : position) - subLen;

		return (fromIndex >= 0 || subLen === -fromIndex) 
			&& (position === 0 || this.charCodeAt(fromIndex) === substring.charCodeAt(0)) 
			&& this.indexOf(substring, fromIndex) === fromIndex;
	};

    String.prototype.reverse = function reverse() {
        return this.split('').reverse().join('');
    }

    String.prototype.capitalize = function () {
        if (this.length > 0) {
            return this.charAt(0).toUpperCase() + this.substring(1);
        }
        return this;
    }

    String.prototype.leftPad = function (pchar, plength) {
        var newStr = this;
        var deltaPad = plength - newStr.length;
        if (deltaPad > 0) {
            while (newStr.length < plength) {
                newStr = pchar + newStr;
            }
        }
        return newStr;
    }

    String.prototype.rightPad = function (pchar, plength) {
        var newStr = this;
        var deltaPad = plength - newStr.length;
        if (deltaPad > 0) {
            while (newStr.length < plength) {
                newStr = newStr + pchar;
            }
        }
        return newStr;
    }    
    
    if(!String.prototype.format) {
    	String.prototype.format = function() {
        	var args = arguments;
        	return this.replace(/{(\d+)}/g, function(match, number) { 
              return typeof args[number] != 'undefined'
                ? args[number]
                : match
              ;
        	});
        };	
    }
    
    String.prototype.escapeHtml = function() {
		return this.replace(/[&<>"'\/]/g, function (s) {
			var entityMap = {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': '&quot;',
				"'": '&#39;',
				"/": '&#x2F;'
			};

	      return entityMap[s] || s;
	    });
	};
	
	String.prototype.unEscapeHtml = function() {
		return this.replace(/&(amp|lt|gt|quot|#39|#x2F);/g, function (s) {
			var entityMap = {
				"&amp;": "&",
				"&lt;": "<",
				"&gt;": ">",
				'&quot;': '"',
				'&#39;': "'",
				'&#x2F;': "/"
			};

	      return entityMap[s] || s;
	    });
	};
	
	// StringBuilder
	function StringBuilder(value) {
        this.strings = [];
        this.append(value);
    }

    StringBuilder.prototype.append = function (value) {
        if (value) {
            this.strings.push(value);
        }
    }

    StringBuilder.prototype.clear = function () {
        this.strings = [];
    }

    StringBuilder.prototype.toString = function () {
        return this.strings.join('');
    }

    // Array Prototype

    /**
     * Returns an array with distinct value - Only for primitive same type (===)
     * @returns {Array} Array of distinct values
     */
    Array.prototype.getUnique = function () {
        var u = {},
            a = [];
        for (var i = 0, l = this.length; i < l; ++i) {
            if (u.hasOwnProperty(this[i])) {
                continue;
            }
            a.push(this[i]);
            u[this[i]] = 1;
        }
        return a;
    }
    Object.defineProperty(Array.prototype, 'getUnique', { enumerable: false });

    /**
     * Returns an array without empty or null items (===)
     * @param {Object} (optional) Value to remove
     * @param {Boolean} (optional) Defaults to true. If true, removes empty and null values from array
     * @returns {Array} Array of defined values
     */
    Array.prototype.removeValues = function (deleteValue, removeEmptyAndNull) {
        if (isNullOrEmpty(removeEmptyAndNull)) {
            removeEmptyAndNull = true;
        }
        for (var i = 0; i < this.length; i++) {
            if (!isNullOrEmpty(deleteValue) && this[i] == deleteValue) {
                this.splice(i, 1);
                i--;
            } else if (removeEmptyAndNull && isNullOrEmpty(this[i])) {
                this.splice(i, 1);
                i--;
            }
        }
    }
    Object.defineProperty(Array.prototype, 'removeValues', { enumerable: false });

    Array.prototype.addRange = function (arr2) {
        for (var i = 0; i < arr2.length; i++) {
            this.push(arr2[i]);
        }
    }
    Object.defineProperty(Array.prototype, 'addRange', { enumerable: false });
    
    Array.prototype.addHashTableRange = function (hashtable2) {
        for (var key in hashtable2) {
            if (hashtable2.hasOwnProperty(key)) {
                this[key] = hashtable2[key];
            }
        }
    }
    Object.defineProperty(Array.prototype, 'addHashTableRange', { enumerable: false });
    
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (fun) {
            var len = this.length;
            if (typeof fun != 'function')
                throw new TypeError();

            var thisp = arguments[1];
            for (var i = 0; i < len; i++) {
                if (i in this)
                    fun.call(thisp, this[i], i, this);
            }
        };
        Object.defineProperty(Array.prototype, 'forEach', { enumerable: false });
    }
    
    Array.prototype.compact = function (callback, thisArg) {
    	var retObj = [], len = this.length;
    	for(var i = 0; i < len; i++) {
    		var retVal = callback.call(thisArg, this[i], i, this);
    		if(undefined !== retVal) {
    			retObj.push(retVal)
    		}
    	}
    	return retObj;
    };
    Object.defineProperty(Array.prototype, 'compact', { enumerable: false });
    
    /************************************************
	 * 				END PROTOTYPES
	 ***********************************************/
    
    /************************************************
     * 				START JQUERY EXTENSIONS
     ***********************************************/
    
    if(typeof jQuery !== 'undefined') {
    	jQuery.fn.wrapEvent = function(eventName, wrapper) {
            var self = this,
                orgnFn = jQuery._data(this[0], 'events')[eventName][0].handler;

            self.off(eventName);


            return self[eventName](function() {
                wrapper.apply(self, [orgnFn].concat(Array.prototype.slice.call(arguments)));
            });

        };
    }
    
    /************************************************
     * 				END JQUERY EXTENSIONS
     ***********************************************/
    
    
    /**
	 * isNullOrUndefined
	 * @memberOf CTC.Lib.Utils
	 * @returns {Boolean}
	**/
    function isNullOrUndefined(val) {
		return (typeof val === 'undefined' || val === null);
	}
	
	/**
	 * isNullOrEmpty
	 * @memberOf CTC.Lib.Utils
	 * @returns {Boolean}
	**/
	function isNullOrEmpty(val) {
		if (typeof (val) == 'undefined' || val == null || (typeof (val) == 'string' && val.length == 0)) {
			return true;
		}
		return false;
	}
	
	/**
	 * emptyIfNull
	 * @memberOf CTC.Lib.Utils
	 * @returns {Object}
	**/
	function emptyIfNull(val) {
		if (typeof (val) == 'undefined' || val == null) {
			return '';
		}
		return val;
	}

	/**
	 * emptyIfNoData
	 * @memberOf CTC.Lib.Utils
	 * @returns {Object}
	**/
	function emptyIfNoData(data) {
		if (isNullOrEmpty(data)) {
			return '';
		}

		if (typeof (data) == 'string') {
			var trimData = data.toLowerCase().trim();
			if (trimData === '' || trimData === '- none -' || trimData === '-none-' || trimData === 'null'
					|| trimData === 'undefined') {
				return '';
			}
		}
		return data;
	}

	/**
	 * nullIfNoData
	 * @memberOf CTC.Lib.Utils
	 * @returns {Object}
	**/
	function nullIfNoData(data) {
		if (isNullOrEmpty(emptyIfNoData(data))) {
			return null;
		}
		return data;
	}

	/**
	 * emptyIfNullOrZero
	 * @memberOf CTC.Lib.Utils
	 * @returns {Object}
	**/
	function emptyIfNullOrZero(val) {
		if (typeof (val) == 'undefined' || val == null || val == 0) {
			return '';
		}
		return val;
	}
	
	/**
	 * tryParseInt
	 * @memberOf CTC.Lib.Utils
	 * @returns {Integer}
	**/
	function tryParseInt(val) {
		if (isNullOrEmpty(val) || isNaN(val)) {
			return 0;
		} else {
			return parseInt(val);
		}
	}

	/**
	 * tryParseFloat
	 * @memberOf CTC.Lib.Utils
	 * @returns {Float}
	**/
	function tryParseFloat(val) {
		if (isNullOrEmpty(val) || isNaN(val)) {
			return 0.00;
		} else {
			return parseFloat(val);
		}
	}
	
	/**
	 * isArray
	 * @memberOf CTC.Lib.Utils
	**/
	function isArray(val) {
		var type = Object.prototype.toString.call(val);
		return type === '[object Array]';
	}
	
	/**
	 * isObject
	 * @memberOf CTC.Lib.Utils
	**/
	function isObject(val) {
		var type = Object.prototype.toString.call(val);
		return type === '[object Object]';
	}
	
	/**
	 * isArrayOrObject
	 * @memberOf CTC.Lib.Utils
	 * @returns {Boolean}
	**/
	function isArrayOrObject(val) {
		var type = Object.prototype.toString.call(val);
		return type === '[object Array]' || type === '[object Object]';
	}

	/**
	 * isArrayAndNotEmpty
	 * @memberOf CTC.Lib.Utils
	 * @param {String|object} val
	 * @returns {Boolean}
	 */
	function isArrayAndNotEmpty(val) {
		try {
			if (val && val instanceof Array && val.length > 0) {
				return true;
			}
			return false;
		} catch (err) {
			return false;
		}
	}
	
	/**
	 * isRegExp
	 * @memberOf CTC.Lib.Utils
	 * @returns {Boolean}
	**/
	function isRegExp(val) {
		var type = Object.prototype.toString.call(val);
		return type === '[object RegExp]';
	}

	/**
	 * isDate
	 * @memberOf CTC.Lib.Utils
	 * @returns {Boolean}
	**/
	function isDate(val) {
		var type = Object.prototype.toString.call(val);
		return type === '[object Date]';
	}
	
	/**
	 * isJSON
	 * @memberOf CTC.Lib.Utils
	 * @param {String|object} val
	 * @returns {Boolean}
	 */
	function isJSON(val) {
		return !!(val && typeof val === 'string' && /^(\[|{).*(}|\])$/.test(val.trim()));				
	}
	
	/**
	 * clone
	 * @memberOf CTC.Lib.Utils
	 * @param srcobj {Object}
	 * @returns {Object}
	 */
	function clone() {
		var clone = function(srcobj) {
			if(srcobj == null) return srcobj;
			if(typeof(srcobj) != 'object') return srcobj;
			if(Array.isArray(srcobj) || srcobj instanceof Array) return Array.prototype.slice.call(srcobj, 0);
			if(srcobj instanceof Date) return new Date(srcobj.getTime());

			var newObj = {};

			for(var i in srcobj)
				newObj[i] = clone(srcobj[i]);

			return newObj;
		};
		return clone;
	}
	
	/**
	 * extend
	 * @memberOf CTC.Lib.Utils
	 * @param a {Object} -target object
	 * @param b {Object} -source object
	 * @returns {Object}
	 */
	function extend(a, b) {
		var extProp = clone(b);
	    for (var c in extProp) {
	        a[c] = extProp[c];
	    }
	    return a;
	}
	
	/**
	 * round
	 * @memberOf CTC.Lib.Utils
	 * @param {Number} value 
	 * @param {Number} decimals
	 * @returns {number}
	 */
	function round(value, decimals) {
        if(isNaN(decimals) || decimals == null) {
            return value;
        }
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }
    
	/**
	 * values
	 * @memberOf CTC.Lib.Utils
	 * returns {array}
	 */
	function values(obj) {
		var returnObj = [];
		if(obj) {
			for(var key in obj) {
				if(obj.hasOwnProperty(key)) {
					returnObj.push(obj[key]);
				}
			}
		}
		return returnObj;
	}
	
	/**
	 * pluck
	 * @memberOf CTC.Lib.Utils
	 * returns {array} 
	 */
	function pluck(arrayList, propertyName) {
		if(arrayList) {
			var arrLen = arrayList.length || 0, retObj = [];
			for(var i = 0; i < arrLen; i++) {
				var elem = arrayList[i];
				if(elem && elem.hasOwnProperty(propertyName)) {
					retObj.push(elem[propertyName]);
				}
			}
			return retObj;
		}	
		return null;
	}
	
	/**
	 * wrap
	 * @memberOf CTC.Lib.Utils
	 * @param fn
	 * @param wrapper
	 * @returns {Function}
	 */
	function wrap(fn, wrapper) {
		return function () {
			return wrapper.apply(this, [fn].concat(Array.prototype.slice.call(arguments)));
		};
	}
	
	/**
	 * resolveHtmlNewLines
	 * @memberOf CTC.Lib.Utils
	 * @param txt
	 * @returns
	 */
	function resolveHtmlNewLines(txt) {
		if(txt != null) {
			return txt.replace(/\r\n|\n\r|\n|\r/gi, '<br/>');
		}
		return txt;
	}
	
	/**
	 * escapeXMLString
	 * @memberOf CTC.Lib.Utils
	 * @param str
	 * @returns
	 */
	function escapeXMLString(str) {
		if(str) {
			var ampersand = /&(?!(?:apos|quot|[gl]t|amp|nbsp);|#)/gi;
			return str.replace(ampersand, '&amp;');
		}
		return str;
	}
	
	/**
	 * escapeSQLString
	 * @memberOf CTC.Lib.Utils
	 * @param str
	 * @returns
	 */
	function escapeSQLString(str) {
		var regex = new RegExp(/[\0\x08\x09\x1a\n\r"'\\\%]/g);
		var escaper = function escaper(char){
		    var m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', "'", '"', "\\", '\\\\', "%"];
		    var r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', "''", '""', '\\\\', '\\\\\\\\', '\\%'];
		    return r[m.indexOf(char)];
		};
		
		return str.replace(regex, escaper);
	}
	
	/**
	 * formatCurrency
	 * @memberOf CTC.Lib.Utils
	 * @param num
	 * @returns {String}
	 */
	function formatCurrency(num) {
		return (Number(num) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
	}
	
	/**
	 * formatCurrency
	 * @memberOf CTC.Lib.Utils
	 * @param str
	 * @returns {Float}
	 */
	function percentToNumber(str){
		return tryParseFloat(str.substring(0, str.length - 1)) || 0;
	}
	
	/**
	 * getFileExtension
	 * @memberOf CTC.Lib.Utils
	 * @param fileName
	 * @returns {String}
	 */
	function getFileExtension(fileName) {
		return fileName.split('.').pop();
	}
	
	/**
	 * getConstructorName
	 * @memberOf CTC.Lib.Utils
	 * @param obj
	 * @returns
	 */
	function getConstructorName(obj) {
		if (typeof obj.getClassName != 'undefined') {
			return obj.getClassName();
		} 
		else {
			return obj.constructor.name;
		}
	}
	
	/**
	 * serializeUrlParameters
	 * @memberOf CTC.Lib.Utils
	 * @param {Object} obj
	 * @returns {String}
	 */
	function serializeUrlParameters(obj) {
		if(obj && typeof obj === 'object') {
		    var params = [];
		    for(var key in obj) {
		    	if(obj.hasOwnProperty(key)) {
		    		var val = obj[key];
		    		!isNullOrUndefined(val) && params.push(key + '=' + obj[key]);
		    	}
		    }
		    if(params.length > 0)
		        return params.join('&');
		}    
	    return '';
	}
	
	/**
	 * deserializeUrlParameters
	 * @memberOf CTC.Lib.Utils
	 * @param {String} params
	 * @returns {Object}
	 */
	function deserializeUrlParameters(params) {
		if(params) {
			var retObj = {},
				temp = ~params.indexOf('?')? params.split('?')[1] : params,
		    	keyValueArray = temp.split('&');
		    
		    for(var i = 0; i < keyValueArray.length; i++) {
		        var keyValue = keyValueArray[i].split('=');
		        String(keyValue[0]).length && (retObj[keyValue[0]] = keyValue[1]); 
		    }        
		    return retObj;		
		}
		return {};
	}
	
	/**
	 * executeTemplate
	 * @memberOf CTC.Lib.Utils
	 * @param {String} template
	 * @param {Object} context
	 * @returns {String}
	 */
	function executeTemplate(template, context) {
		return template.replace(/\$\{.+?\}/g, function(match, index, source) {
		    var path = match.replace(/[${}]+/g, ''),
	        	result = match;

		    try {
		    	var res = eval('context.' + path);
		        result = res === undefined? result : res;
		    }
		    catch(ex) {}
	
		    return result;
		});
	}
	
    
	return {
		clone:						clone,
		emptyIfNoData:				emptyIfNoData,
		emptyIfNull:				emptyIfNull,
		emptyIfNullOrZero: 			emptyIfNullOrZero,
		escapeSQLString: 			escapeSQLString,
		escapeXMLString: 			escapeXMLString,
		executeTemplate:			executeTemplate,
		extend:						extend,
		formatCurrency:				formatCurrency,
		percentToNumber:			percentToNumber,
		getConstructorName:			getConstructorName,
		getFileExtension:			getFileExtension,
		isArray: 					isArray,
		isArrayAndNotEmpty:			isArrayAndNotEmpty,
		isArrayOrObject: 			isArrayOrObject,
		isDate:						isDate,
		isJSON: 					isJSON,
		isNullOrEmpty: 				isNullOrEmpty,
		isNullOrUndefined: 			isNullOrUndefined,
		isObject: 					isObject,
		isRegExp:					isRegExp,
		nullIfNoData:				nullIfNoData,
		pluck: 						pluck,
		resolveHtmlNewLines: 		resolveHtmlNewLines,
		round:						round,
		tryParseFloat:				tryParseFloat,
		tryParseInt:				tryParseInt,
		values:						values,
		wrap: 						wrap,
		serializeUrlParameters: 	serializeUrlParameters,
		deserializeUrlParameters: 	deserializeUrlParameters
	};
});