
(function (global) {
	"use strict";

	var validators = {},

		// helpers
		hasOwnProp = Object.prototype.hasOwnProperty;


	/***************************** 
		Base validators
		NOTE: Primitives created via constructors will not validate properly
	*****************************/

	validators.notNull = function (x) {
		return x !== null;
	};

	validators.isNaN = function (x) {
		return isNaN(x);
	};
	
	validators.isInteger = function (x) {
		return (x|0) === x;
	};

	validators.finite = function (x) {
		return isFinite(x);
	};
	
	validators.isInteger = function (x) {
		return (x|0) === x;
	};

	// Types

	validators.typeIsNumber = function (x) {
		return typeof x === "number";
	};

	validators.typeIsString = function (x) {
		return typeof x === "string";
	};

	validators.typeIsObject = function (x) {
		return typeof x === "object";
	};

	validators.typeIsFunction = function (x) {
		return typeof x === "function";
	};

	validators.isArray = function (x) {
		return Array.isArray(x);
	};

	// Properties of the value

	validators.positiveLength = function (x) {
		return x.length > 0;
	};

	validators.hasNonWhitespaceCharacters = function (x) {
		return validate(x.trim(), "positiveLength");
	};

	validators.hasAProperty = function (x) {
		var prop;

		for (prop in x) {
			if (hasOwnProp.call(x, prop)) {
				return true;
			}
		}

		return false;
	};

	validators.hasNoProperties = function (x) {
		return !validate(x, "hasAProperty");
	};

	/***************************** 
		Composite validators
	*****************************/

	var compositeValidators = {
		// Numbers
		isNotNullFiniteNumeric: ["notNull", "finite"],
		isNotNullFiniteNumber: ["notNullFiniteNumeric", "typeIsNumber"],		// same as above but cannot be a string
		isNotNullFiniteIntegerish: ["notNullFiniteNumeric", "isInteger"],
		isNotNullFiniteInteger: ["notNullFiniteNumber", "isInteger"],			// same as above but cannot be a string

		isNonEmptyString: ["typeIsString", "positiveLength", "hasNonWhitespaceCharacters"],
		isNonEmptyArray: ["isArray", "positiveLength"],
		isNonEmptyObject: ["typeIsObject", "notNull", "hasAProperty"],
	};

	/***************************** 
		Aliases
	*****************************/

	var aliases = {
		"number": "typeIsNumber",
		"integer": "isInteger",
		"isFinite": "finite",
		"object": "typeIsObject",
		"function": "typeIsFunction",
		"string": "typeIsString",
		"array": "isArray",

		// composite
		"validNumeric": "isNotNullFiniteNumeric",
		"validNumber": "isNotNullFiniteNumber",

		"validIntegerish": "isNotNullFiniteIntegerish",
		"validInteger": "isNotNullFiniteInteger",
	};


	/***************************** 
		Main validation function
	*****************************/

	var 
		// If the value is optional, what values of it will we allow assuming it is not set?
		ALLOWED_OPTIONAL_VALUES = [undefined],

		// rules can either be an array or a comma separated string
		// whitespace will be trimmed
		RULE_DELIMITER = ",";	

	/**
	 * Validate a value with the provide rules
	 * @param {Anything} value
	 * @param {String|Array} rules to validate 
	 *		 can be comma delimited string or Array of rules
	 *		 if first rule is "optional", 
	 *		 the value is allowed to be undefined but if it isn't, it has to match the rest of the rules
	 * @param {String} throwErrorMessage description of value to include when throwing a TypeError on validation failure
	 *		  (optional) and error will not be thrown if this is not included
	 * @param {JSON} optional object which can contain any of the following:
	 *				 allowedOptionalValues Array
	 *				 ruleDelimiter character
	 * @throws Error if rule cannot be found
	 * @throws TypeError if throwError is true and validation failed
	 */
	var validate = function (value, rules, throwErrorMessage, options) {
		var isValid = true;

		options = options || {};
		ruleDelimiter = options.ruleDelimiter || RULE_DELIMITER;
		allowedOptionalValues = options.allowedOptionalValues || ALLOWED_OPTIONAL_VALUES;

		if (validators.typeIsString(rules)) {
			rules = rules.split(ruleDelimiter);
		}

		if (rules[0].trim() === "optional") {
			// Allow undefined values if they are optional
			if (allowedOptionalValues.indexOf(value) !== -1) {
				return true;
			} else {
				rules = rules.slice(1);	// remove optional value from further validation
			}
		}

		// Apply each validation rule to value
		rules.forEach(function (rule) {
			rule = rule.trim();
			var validator = validators[rule],
				compositeRule;

			// Check if rule is a base validator
			if (!validators.typeIsFunction(validator)) {
				// Check if it's an alias
				validator = validators[aliases[rule]];

				if (!validators.typeIsFunction(validator)) {
					// Check if it's a composite validator
					compositeRule = compositeValidators[rule];

					if (compositeRule !== undefined) {
						// Recursively apply composite rule
						isValid = isValid && validate(value, compositeRule, throwErrorMessage, options);
						return; // break out of forEach iteration to continue to next top level rule
					} else {
						throw new Error("Rule: " + rule + " is not an available validator");
					}
				}
			}

			// Is valid means all rules have to be met
			isValid = isValid && validator.apply(null, [value]);
			if (!isValid && throwErrorMessage) {
				throw new TypeError("Validation for " + throwErrorMessage + " failed on rule " +  rule + 
								    ".\nValue was " + value);
			}
		});

		return isValid;
	};

	validate.validators = validators;
	validate.aliases = aliases;
	validate.compositeValidators = compositeValidators;

	global.validate = validate;

} (this));
