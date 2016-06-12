let find = require("./find");
let interpolate = require("./interpolate");

module.exports = function() {
  this.value = [];
  this.file = null;
  this.fileName = "";
  this.time = null;
}

module.exports.prototype.getSelected = function() {
  return find.selected(this.value);
}

module.exports.prototype.doRemove = function() {
  let i;
  for (i = 0; i < this.value.length; ++i) {
    if (this.value[i].selected) {
      break;
    }
  }

  if (i < this.value.length) {
    this.value.splice(i, 1);
  }
};

module.exports.prototype.doClear = function() {
  this.value = [];
};

module.exports.prototype.doPreview = function() {
  let self = this;
  let last = performance.now();
  let coordinates = interpolate.coordinates(this.value).reverse();

  if (coordinates.length > 1) {
    let endTime = coordinates[0].t;
    self.time = 0;

    let interval = setInterval(function() {
      angular.element(document.body).scope().$apply(function() {
        let now = performance.now();
        self.time += now - last;
        last = now;

        if (self.time > endTime) {
          self.time = null;
          clearInterval(interval);
        }
      });
    }, 1000 / 60);
  }
};

module.exports.prototype.doToggleAbsolute = function() {
  let d = find.selected(this.value);

  if (d) {
    [ d.x, d.y ] = find.newCoordinates(this.value, d);
  }
};

module.exports.prototype.doImport = function() {
  let self = this;
  let reader = new FileReader();

  reader.onerror = function(err) { console.error(err); };
  reader.onload = function(result) {
    let raw = result.target.result;
    let str = String.fromCharCode.apply(null, new Uint8Array(raw));

    self.value = JSON.parse(str);
    self.fileName = this.file.name;
  };
  reader.readAsArrayBuffer(this.file);
};

module.exports.prototype.doExport = function() {
  let json = JSON.stringify(this.value, null, 2);
  let blob = new Blob([ json ], { type: "application/json;charset=utf-8"});
  
  let a = document.createElement("a");
  a.setAttribute("href", window.URL.createObjectURL(blob));
  a.setAttribute("download", this.fileName);
  a.click();
};
