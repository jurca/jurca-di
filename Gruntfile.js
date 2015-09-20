
module.exports = function (grunt) {

  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    "babel": {
      options: {
        sourceMap: "inline",
        modules: "amd",
        optional: ["runtime"]
      },
      dist: {
        files: [{
          "expand": true,
          "cwd": "es6/",
          "src": ["**/*.js"],
          "dest": "amd"
        }]
      }
    },

    clean: {
      build: ["amd"]
    },

    watch: {
      dev: {
        files: ["es6/**/*.js"],
        tasks: ["babel"],
        options: {
          spawn: false,
          atBegin: true
        }
      }
    }
  });

  grunt.registerTask("default", ["babel"]);

};
