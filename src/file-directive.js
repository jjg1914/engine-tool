module.exports = function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function($scope, $element, $attributes, ngModel) {
      $element.on("change", function(event) {
        $scope.$apply(function() {
          ngModel.$setViewValue(event.target.files[0], "change");
        });
      });
    }
  }
}
