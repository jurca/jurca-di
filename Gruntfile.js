
module.exports = function (grunt) {

  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    karma: {
      unit: {
        configFile: "test/karma.conf.js",
        autoWatch: true
      }
    }
  });

  grunt.registerTask("default", ["karma"]);

};
