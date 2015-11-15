
var allProjectFiles = [];
var allTestFiles = [];
var PROJECT_REGEXP = /es2015\/.*\.js$/i;
var TEST_REGEXP = /(spec|test)\.js$/i;

var pathToModule = function(path) {
  return path.replace(/^\/base\//, "").replace(/\.js$/, "");
};

Object.keys(window.__karma__.files).forEach(function (file) {
  // load project and tests files and normalize paths to RequireJS module names
  if (TEST_REGEXP.test(file)) {
    allTestFiles.push(pathToModule(file));
  } else if (PROJECT_REGEXP.test(file)) {
    allProjectFiles.push(pathToModule(file));
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: "/base",

  paths: {
  },

  // dynamically load all test files
  deps: allProjectFiles.concat(allTestFiles),

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
