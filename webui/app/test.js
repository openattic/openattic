import "angular";
import "angular-mocks/angular-mocks";
require("./app");

// requires all tests
const tests = require.context(".", true, /\.spec\.js$/);

tests.keys().forEach(tests);
