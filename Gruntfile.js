
module.exports = function (grunt) {
	grunt.initConfig({
		jasmine: {
			src: 'validator.js',
			options: {
				specs: 'test_validator.js'
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-jasmine");

	grunt.registerTask("test", "jasmine");
	grunt.registerTask("default", "test");
};
