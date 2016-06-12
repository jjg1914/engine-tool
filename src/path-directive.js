let find = require("./find");
let interpolate = require("./interpolate");
let draw = require("./draw");

module.exports = function() {
  return {
    restrict: "A",
    scope: {
      value: "=",
      time: "=",
    },
    link: function ($scope, $element) {
      let ctx = $element[0].getContext("2d");
      let dragging = false;

      $element[0].style.width = ($element[0].width = 208) + "px";
      $element[0].style.height = ($element[0].height = 256) + "px";

      $scope.$watch("[ value, time ]", function(v) {
        let [ value, time ] = v;

        draw.background(ctx, value);

        if (value) {
          if (typeof time === "number") {
            draw.preview(ctx, value, time);
          } else {
            draw.path(ctx, value);
            draw.tangents(ctx, value);
            draw.anchors(ctx, value);
            draw.tangentAnchors(ctx, value);
          }
        }
      }, true);

      $element.on("mousedown", function($event) {
        $scope.$apply(function() {
          let x = $event.offsetX;
          let y = $event.offsetY;

          let prev = find.selected($scope.value);

          if (prev != null) {
            prev.selected = false
          }

          let d;

          if ((d = find.near($scope.value, x, y, 8)) != null) {
            d.selected = true;
            dragging = true;
          } else if ((d = find.tangentNear($scope.value, x, y, 8)) != null) {
            d.selected = "tangent";
            dragging = true;
          } else if ((d = find.iTangentNear($scope.value, x, y, 8)) != null) {
            d.selected = "itangent";
            dragging = true;
          } else if (prev == null) {
            let last = interpolate.coordinates($scope.value).reverse()[0];

            $scope.value.push({
              t: ($scope.value.length === 0 ? 0 : 1000),
              x: ($scope.value.length === 0 ? x : x - last.x ),
              y: ($scope.value.length === 0 ? y : y - last.y ),
              dx: 32,
              dy: 32,
              selected: true,
              absolute: false,
            });
          }
        });
      });

      $element.on("mousemove", function($event) {
        $scope.$apply(function() {
          let x = $event.offsetX;
          let y = $event.offsetY;
          let d = find.selected(interpolate.coordinates($scope.value));

          if (dragging && d) {
            if (typeof d.target.selected == "boolean") {
              [ d.target.x, d.target.y ] =
                find.newCoordinates($scope.value, d.target, x, y);
            } else if (typeof d.target.selected == "string") {
              if (d.target.selected === "tangent") {
                d.target.dx = x - d.x;
                d.target.dy = y - d.y;
              } else if (d.target.selected === "itangent") {
                d.target.dx = -(x - d.x);
                d.target.dy = -(y - d.y);
              }
            }
          }
        });
      });

      $element.on("mouseup", function($event) {
        dragging = false;
      });

      $element.on("mouseleave", function($event) {
        dragging = false;
      });
    },
  };
}
