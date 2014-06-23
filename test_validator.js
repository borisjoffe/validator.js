(function (global) {
	var validate = global.validate;

	function applyArgs(arrayOfArgs) {

		// default options
		var matcher = applyArgs.matcher !== undefined ? applyArgs.matcher : "toBe",

			// wrap validate invocation in an anonymous function to catch exceptions
			wrap = applyArgs.wrap !== undefined ? applyArgs.wrap : false,

			// put not before the matcher
			not = applyArgs.not !== undefined ? applyArgs.not : false;

		arrayOfArgs.forEach(function (args) {
			var expectedResult = args.slice(-1)[0],
				validatorArgs = args.slice(0, -1);

			invocation = wrap ?
						function () { validate.apply(null, validatorArgs); } :
						validate.apply(null, validatorArgs);

			var result;

			if (not) {
				result = !wrap ?
						result = expect(invocation).not[matcher](expectedResult) :
						result = expect(invocation).not[matcher]();
			} else {
				result = !wrap ?
						result = expect(invocation)[matcher](expectedResult) :
						result = expect(invocation)[matcher]();
			}

		});

		// reset defaults
		delete applyArgs.matcher;
		delete applyArgs.wrap;
		delete applyArgs.not;
	}

	describe("base validators", function () {

		// Base validators

		it("validates typeIsNumber", function () {
			applyArgs([
				[5.2, "typeIsNumber", true],

				["2", "typeIsNumber", false],
			]);
		});

		it("validates typeIsString", function () {
			applyArgs([
				["hello", "typeIsString", true],
				["2", "typeIsString", true],

				[2, "typeIsString", false],
			]);
		});

		it("validates typeIsObject", function () {
			applyArgs([
				[null, "typeIsObject", true],
				[{}, "typeIsObject", true],
				[new Array(2), "typeIsObject", true],
				[[1,2], "typeIsObject", true],

				["hello", "typeIsObject", false],
			]);
		});

		it("validates notNull", function () {
			applyArgs([
				["hello", "notNull", true],
				["", "notNull", true],
				[[], "notNull", true],
				[{}, "notNull", true],

				[null, "notNull", false],
			]);
		});

		it("validates isArray", function () {
			applyArgs([
				[[], "isArray", true],
				[[{}], "isArray", true],
				[new Array(3), "isArray", true],

				["hello", "isArray", false],
				[2, "isArray", false],
			]);
		});

		it("validates isNaN", function () {
			applyArgs([
				[NaN, "isNaN", true],

				[[], "isNaN", false],
				[5, "isNaN", false],
				["5", "isNaN", false],
			]);
		});

	}); // end base validators

	describe("property validators", function () {
		it("validates (strict) min/max", function () {
			applyArgs([
				["5", "!null", {max: 12}, true],
				[16, "number", {min: 12}, true],
				[12, "number", {min: 12}, true],
				[13, "number", {strictMin: 12}, true],
				[-1, "number", {strictMax: 0}, true],

				[12, "number", {strictMin: 12}, false],
				[0, "number", {strictMax: 0}, false],
				[20, "!null, !boolean", {max: 12}, false],
			]);
		});

		it("validates (strict) minLength/maxLength", function () {
			applyArgs([
				["hello", "string", {maxLength: 20}, true],
				["hello", "string", {strictMaxLength: 6}, true],
				["a", "string", {minLength: 2}, false],
				["ab", "string", {strictMinLength: 2}, false],

				["hello", "string", {strictMaxLength: 5}, false],
				["hello", "string", {strictMaxLength: 4}, false],
				["a", "string", {minLength: 2}, false],
				["ab", "string", {strictMinLength: 2}, false],
			]);
		});

	}); // end property validators

	describe("composite validators", function () {

		// Composite validators

		it("validates objects", function () {
			applyArgs([
				[{a: "a"}, "isNonEmptyObject", true],

				[{}, "isNonEmptyObject", false],
				[null, "isNonEmptyObject", false],
				[["a", 2], "isNonEmptyObject", false],
			]);
		});

		it("validates arrays", function () {
			applyArgs([
				[[5, "abc"], "isNonEmptyArray", true],

				[[], "isNonEmptyArray", false],
			]);
		});

		it("validates strings", function () {
			applyArgs([
				["test", "isNonEmptyString", true],

				["", "isNonEmptyString", false],
				[" ", "isNonEmptyString", false],
			]);
		});

	}); // end composite validators

	describe("JSON validators", function () {

		it("validates eachElement object", function () {
			applyArgs([
				[{a: 9, b: 3}, "eachElement", {rules: "validNumber"}, true],

				[{a: NaN, b: 3}, "eachElement", {rules: "validNumber"}, false],
			]);
		});

		it("validates eachElement on array", function () {
			applyArgs([
				[["a", 9, "b", 3], "eachElement", {rules: "!null"}, true],
				[["0xFF", 9, 2.5, 3], "eachElement", {rules: "validNumeric"}, true],

				[["a", 9, "b", 3], "eachElement", {rules: "validNumber"}, false],
				[["0xFF", 9, 2.5, 3], "eachElement", {rules: "validIntegerish"}, false],
			]);
		});

		it("validates eachElementProperty on object", function () {
			applyArgs([
				[{row1: {id: 9}, row2: {id: 22}},  "eachElementProperty", {propertyName: "id", rules: "validInteger"}, true],

				[{row1: {id: 9}, row2: {id: 2.2}},  "eachElementProperty", {propertyName: "id", rules: "validInteger"}, false],
			]);
		});

		it("validates eachElementProperty on array", function () {
			applyArgs([
				[[{b: 9}, {b: 2.2}],  "eachElementProperty", {propertyName: "b", rules: "validNumber"}, true],

				[[{b: 9}, {b: 2.2}],  "eachElementProperty", {propertyName: "b", rules: "validInteger"}, false],
			]);
		});

	}); // end JSON validators

	describe("validate() options", function () {
		// Optional parameters

		it("throws error", function () {
			applyArgs.wrap = true;
			applyArgs.matcher = "toThrow";
			applyArgs([
				[[5], "number", "number of requests", undefined],
				["5", "!string", "data", undefined],
			]);
		});

		it("does not throw error", function () {
			applyArgs.wrap = true;
			applyArgs.matcher = "toThrow";
			applyArgs.not = true;

			applyArgs([
				[5, "number", "number of requests", undefined],
				[[5], "!string", "data", undefined],
			]);
		});

	}); // end validate options
} (this));
