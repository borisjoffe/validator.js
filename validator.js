
(function (global) {
	"use strict";

	var 
		// Each property on this object is a validator function
		// that we call from validate() based on the rules passed in
		validators = {},

		// helpers
		hasOwnProp = Object.prototype.hasOwnProperty;

	/**
	 * Iterate over own properties invoking a callback on each one
	 * callback gets passed key and value of obj
	 * e.g. each({a: "b"}, myFunction) would call myFunction as myFunction("b", a)
	 * @param {Object} obj
	 * @param {Function} callback gets passed (value, key) of each object property
	 */
	function each(obj, callback) {
		var prop;

		for (prop in obj) {
			if (hasOwnProp.call(obj, prop)) {
				callback(obj[prop], prop);
			}
		}
	}

	/***************************** 
	Base validators
	NOTE: Primitives created via constructors will not validate properly
	*****************************/

	// Numeric validation
	validators.isNaN = function (x) {
		return isNaN(x);
	};
	
	validators.isInteger = function (x) {
		return (x|0) === x;
	};

	validators.isFinite = function (x) {
		return isFinite(x);
	};
	
	validators.isInteger = function (x) {
		return (x|0) === x;
	};

	validators.isZero = function (x) {
		return x === 0;
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

	validators.isNull = function (x) {
		return x === null;
	};

	validators.typeIsBoolean = function (x) {
		return typeof x === "boolean";
	};

	validators.isArray = function (x) {
		return Array.isArray(x);
	};

	validators.isUndefined = function (x) {
		return x === undefined;
	};


	// Properties of the value

	validators.positiveLength = function (x) {
		return x.length > 0;
	};

	validators.hasNonWhitespace = function (x) {
		return validate(x.trim(), "positiveLength");
	};

	validators.hasNoTemplateStrings = function (x) {
		return ((x.indexOf("{{") === -1) &&
				(x.indexOf("}}") === -1));
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

	validators.min = function (x, options) {
		return x >= options.min;
	};

	validators.strictMin = function (x, options) {
		return x > options.strictMin;
	};

	validators.max = function (x, options) {
		return x <= options.max;
	};

	validators.strictMax = function (x, options) {
		return x < options.strictMax;
	};

	validators.length = function (x, options) {
		if (validators.typeIsObject(x)) {
			return Object.keys(x).length === options.length;
		} else {
			return x.length === options.length;
		}
	};

	validators.minLength = function (x, options) {
		if (validators.typeIsObject(x)) {
			return Object.keys(x).length >= options.minLength;
		} else {
			return x.length >= options.minLength;
		}
	};

	validators.strictMinLength = function (x, options) {
		if (validators.typeIsObject(x)) {
			return Object.keys(x).length > options.strictMinLength;
		} else {
			return x.length > options.strictMinLength;
		}
	};

	validators.maxLength = function (x, options) {
		if (validators.typeIsObject(x)) {
			return Object.keys(x).length < options.maxLength;
		} else {
			return x.length < options.maxLength;
		}
	};

	validators.strictMaxLength = function (x, options) {
		if (validators.typeIsObject(x)) {
			return Object.keys(x).length < options.strictMaxLength;
		} else {
			return x.length < options.strictMaxLength;
		}
	};

	/***************************** 
	More advanced validators
	*****************************/

	/**
	 * Validate each element of an array or object
	 * @param {Anything} x
	 * @param {JSON} options
	 *				 options.rules must be a string or array of rules
	 * @param {String} throwErrorMessage
	 */
	validators.eachElement = function (x, options, throwErrorMessage) {
		var prop,
			rules = options.rules,	// rules for each element
			allValid = true;

		if (validators.isArray(x)) {
			// Check each element of array
			x.forEach(function (el) {
				allValid = allValid && validate(el, rules, throwErrorMessage, options);
			});
		} else if (validators.typeIsObject(x)) {
			// Check each property of object
			each(x, function (val, prop) {
				allValid = allValid && validate(val, rules, throwErrorMessage, options);
			});
		} else {
			throw new TypeError("Cannot perform eachElement validation on non-array or non-object value");
		}

		return allValid;
	};

	/**
	 * Validate a property on each element of an array or object
	 * @param {Anything} x
	 * @param {JSON} options
	 *				 options.rules must be a string or array of rules
	 *				 options.propertyName must be string property to check on each element
	 * @param {String} throwErrorMessage
	 */
	validators.eachElementProperty = function (x, options, throwErrorMessage) {
		var prop,
			rules = options.rules,					// rules for the property that we're checking
			propertyName = options.propertyName,	// property name to check on each element
			allValid = true;

		if (validators.isArray(x)) {
			// Check each element of array
			x.forEach(function (el) {
				allValid = allValid && validate(el[propertyName], options.rules, throwErrorMessage, options);
			});
		} else if (validators.typeIsObject(x)) {
			// Check each property of object
			each(x, function (val) {
				allValid = allValid && validate(val[propertyName], options.rules, throwErrorMessage, options);
			});
		} else {
			throw new TypeError("Cannot perform eachElementProperty validation on non-array or non-object value");
		}

		return allValid;
	};


	/***************************** 
	Composite validators
	*****************************/

	var compositeValidators = {

		// Negation
		notNull: "!isNull",
		isDefined: "!isUndefined",
		notZero: "!isZero",
		notBoolean: "!typeIsBoolean",
		notArray: "!isArray",
		hasNoProperties: "!hasAProperty",

		// Numerics
		validNumeric: ["!null", "!boolean", "!array", "isFinite"],
		validNumber: ["validNumeric", "number"],		// same as above but cannot be a string
		validIntegerish: ["validNumeric", "integer"],
		validInteger: ["validNumber", "integer"],			// same as above but cannot be a string

		// Object-ish
		strictObject: ["object", "!null", "!array"],
		isNonEmptyString: ["string", "positiveLength", "hasNonWhitespace"],
		isNonEmptyArray: ["array", "positiveLength"],
		isNonEmptyObject: ["strictObject", "hasAProperty"],

	};

	/***************************** 
	Aliases
	*****************************/

	var aliases = {
		// builtin types
		"number": "typeIsNumber",
		"object": "typeIsObject",
		"function": "typeIsFunction",
		"string": "typeIsString",
		"boolean": "typeIsBoolean",
		"array": "isArray",
		"undefined": "isUndefined",
		"null": "isNull",

		// my aliases
		"finite": "isFinite",
		"integer": "isInteger",

		// composite
		"validString": "isNonEmptyString",
		"validArray": "isNonEmptyArray",
		"validObject": "isNonEmptyObject",
	};


	/***************************** 
	Main validation function
	*****************************/

	var 
		// If the value is optional, what values of it will we allow assuming it is not set?
		ALLOWED_OPTIONAL_VALUES = [undefined],

		// rules can either be an array or a comma separated string
		// whitespace will be trimmed
		RULE_DELIMITER = ",",

		// return opposite of a rule if it starts with a negate character
		NEGATE_CHARACTER = "!",

		// For certain rules like `length` for example where we have to specify
		// the actual length, allow users to not have to add it as a rule since
		// they're already putting it in the options object where we can find it
		RULES_REQUIRING_ARGS = ["minLength", "strictMinLength", "maxLength", "strictMaxLength", "length", "min", "strictMin", "max", "strictMax"],

		// validators that require an option.rules containing rules to be applied to children
		VALIDATORS_WITH_CHILD_RULES = ["eachElement", "eachElementProperty"];

	/**
	 * Add rules that require an additional argument to the rules array
	 * if they're not already there
	 */
	var addRulesRequiringArgs = function (rules, options, rulesRequiringArgs) {
		each(options, function (value, prop) {
			if (rulesRequiringArgs.indexOf(prop) !== -1 &&
				rules.indexOf(prop) === -1) {
				rules.push(prop);
			}
		});
	};

	/**
	 * Validate a value with the provide rules
	 * @param {Anything} value
	 * @param {String|Array} rules to validate 
	 *		 can be comma delimited string or Array of rules
	 *		 if first rule is "optional", 
	 *		 the value is allowed to be undefined but if it isn't, it has to match the rest of the rules
	 * @param {String} throwErrorMessage description of value to include when throwing a TypeError on validation failure
	 *		  (optional) and error will not be thrown if this is not included
	 * @param {JSON} optional object (always last arg) which can contain any of the following:
	 *				 allowedOptionalValues Array
	 *				 ruleDelimiter character(s)
	 *				 rulesRequiring arguments - shortcut to avoid adding a rule when you can leave it in the options argument
	 *				 rules - array or string with rules to be applied to eachElement or eachElementProperty
	 * @throws Error if rule cannot be found
	 * @throws TypeError if throwError is true and validation failed
	 */
	var validate = function (value, rules, throwErrorMessage, options) {
		var isValid = true;

		options = Array.prototype.slice.call(arguments, -1)[0];
		options = validators.typeIsObject(options) ? options : {};

		var ruleDelimiter = options.ruleDelimiter || RULE_DELIMITER,
			allowedOptionalValues = options.allowedOptionalValues || ALLOWED_OPTIONAL_VALUES,
			rulesRequiringArgs = options.rulesRequiringArgs || RULES_REQUIRING_ARGS,
			negateCharacter = options.negateCharacter || NEGATE_CHARACTER;

		// Transform rules string(s) into an array
		if (validators.typeIsString(rules)) {
			rules = rules.split(ruleDelimiter);
		} else if (validators.typeIsObject(rules)) {
			// treat rules as a validation schema for value
			// WARN: what if 2 args passed in? (options is rules) 
			// do we treat rules as schema or rules as the options argument?
			// TODO: code
		}
		if (validators.typeIsString(options.rules)) {
			options.rules = options.rules.split(ruleDelimiter);
		}

		throwErrorMessage = validators.typeIsString(throwErrorMessage) && throwErrorMessage ? throwErrorMessage : false;

		if (rules[0].trim() === "optional") {
			// Allow undefined values if they are optional
			if (allowedOptionalValues.indexOf(value) !== -1) {
				return true;
			} else {
				rules = rules.slice(1);	// remove optional value from further validation
			}
		}

		addRulesRequiringArgs(rules, options, rulesRequiringArgs);

		// Apply each validation rule to value
		rules.forEach(function (rule) {
			var negate, compositeRule,
				validator;

			rule = rule.trim();

			if (rule.slice(0,1) === negateCharacter) {
				negate = true;
				rule = rule.slice(1);	// remove negation character
			} else {
				negate = false;
			}

			validator = validators[rule];

			// Check if rule is a base validator
			if (!validators.typeIsFunction(validator)) {
				// Check if it's an alias
				validator = validators[aliases[rule]];

				if (!validators.typeIsFunction(validator)) {
					// Check if it's a composite validator or if it's an alias for a composite validator
					compositeRule = compositeValidators[rule] || compositeValidators[aliases[rule]];

					if (compositeRule !== undefined) {
						// Recursively apply composite rule
						isValid = isValid && validate(value, compositeRule, throwErrorMessage, options);
						isValid = negate ? !isValid : isValid;	// apply negation if necessary
						return; // break out of forEach iteration to continue to next top level rule
					} else {
						throw new Error("Rule: " + rule + " is not an available validator. \nMake sure rules are separated by: '" + ruleDelimiter + "'");
					}
				}
			}

			// Is valid means all rules have to be met
			isValid = isValid && validator.apply(null, [value, options, throwErrorMessage]);
			isValid = negate ? !isValid : isValid;	// apply negation if necessary
			if (!isValid && throwErrorMessage) {
				throw new TypeError("Validation failed on rule \"" +  (negate ? "!" : "") + rule + 
								    "\".\n" + throwErrorMessage+ " was: " + JSON.stringify(value) +
									"\noptions were: " + JSON.stringify(options));
			}
		});

		return isValid;
	};

	validate.validators = validators;
	validate.aliases = aliases;
	validate.compositeValidators = compositeValidators;

	// Exports
	global.validate = validate;

} (this));
