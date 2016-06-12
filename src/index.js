let angular = require("angular");
let app = angular.module("engine-tools", []);

app.controller("PathController", require("./path-controller"));
app.directive("appFile", require("./file-directive"));
app.directive("appPath", require("./path-directive"));
