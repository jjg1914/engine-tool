let previewInterval = null;
let find = require("./find");
let interpolate = require("./interpolate");
let draw = require("./draw");

document.addEventListener("DOMContentLoaded", function() {
  let dataName = "";
  let data = [];

  let dragging = false;

  let canvas = document.getElementById("stage");
  let t_input = document.getElementById("t_input");
  let x_input = document.getElementById("x_input");
  let y_input = document.getElementById("y_input");
  let dx_input = document.getElementById("dx_input");
  let dy_input = document.getElementById("dy_input");
  let linear_input = document.getElementById("linear_input");
  let absolute_input = document.getElementById("absolute_input");
  let export_input = document.getElementById("export_input");
  let import_input = document.getElementById("import_input");
  let export_action = document.getElementById("export_action");
  let remove_action = document.getElementById("remove_action");
  let preview_action = document.getElementById("preview_action");
  let new_action = document.getElementById("new_action");
  let ctx = canvas.getContext("2d");

  canvas.style.width = (canvas.width = 208) + "px";
  canvas.style.height = (canvas.height = 256) + "px";

  doDraw(ctx, data);

  function bind(f) {
    return function() {
      Promise.resolve(f.apply(undefined, arguments)).then(function() {
        assignItem(data);
        doDraw(ctx, data);
      });
    }
  }

  canvas.addEventListener("mousedown", bind(function(event) {
    select(data, event.offsetX, event.offsetY);
    if (find.selected(data)) {
      dragging = true;
    }
  }));

  canvas.addEventListener("mousemove", bind(function(event) {
    if (dragging) {
      update(data, event.offsetX, event.offsetY)
    }
  }));

  canvas.addEventListener("mouseup", function(event) {
    dragging = false;
  });

  canvas.addEventListener("mouseleave", function(event) {
    dragging = false;
  });

  remove_action.addEventListener("click", bind(function() {
    remove(data);
  }));

  new_action.addEventListener("click", bind(function() {
    data = [];
    dataName = "";
  }));

  preview_action.addEventListener("click", function() {
    let t = 0;
    let tEnd = data.reduce(function(m, v) { return m + v.t; }, 0);
    let last = performance.now();

    previewInterval = setInterval(function() {
      let now = performance.now();
      t += now - last;

      if (t <= tEnd) {
        doDraw(ctx, data, t);
        last = now;
      } else {
        clearInterval(previewInterval);
        previewInterval = null;
        doDraw(ctx, data);
      }
    }, 1000 / 60);
  });

  t_input.addEventListener("change", bind(function(event) {
    updateItem(data, "t", Number(event.target.value));
  }));

  x_input.addEventListener("change", bind(function(event) {
    updateItem(data, "x", Number(event.target.value));
  }));

  y_input.addEventListener("change", bind(function(event) {
    updateItem(data, "y", Number(event.target.value));
  }));

  dx_input.addEventListener("change", bind(function(event) {
    updateItem(data, "dx", Number(event.target.value));
  }));

  dy_input.addEventListener("change", bind(function(event) {
    updateItem(data, "dy", Number(event.target.value));
  });

  linear_input.addEventListener("change", bind(function(event) {
    updateItem(data, "linear", event.target.checked);
  }));

  absolute_input.addEventListener("change", bind(function(event) {
    updateItem(data, "absolute", event.target.checked);
    toggleAbsolute(data);
  }));

  export_input.addEventListener("change", bind(function(event) {
    dataName = event.target.value;
  }));

  import_input.addEventListener("change", bind(function(event) {
    return new Promise(function (resolve, reject) {
      let reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function(result) {
        let raw = result.target.result;
        let str = String.fromCharCode.apply(null, new Uint8Array(raw));
        data = JSON.parse(str);
        export_input.value = dataName = event.target.files[0].name;
        resolve();
      }
      reader.readAsArrayBuffer(event.target.files[0]);
    })
  }));

  export_action.addEventListener("click", function(event) {
    let json = JSON.stringify(data, null, 2);
    let blob = new Blob([ json ], { type: "application/json;charset=utf-8"});
    
    let a = document.createElement("a");
    a.setAttribute("href", window.URL.createObjectURL(blob));
    a.setAttribute("download", dataName);
    a.click();
  });
});

function updateItem(data, prop, value) {
  let d = find.selected(data);

  if (d) {
    d[prop] = value;
  }
}

function select(data, x, y) {
  let prev;
  let d;

  if ((prev = find.selected(data)) != null) {
    prev.selected = false
  }

  if ((d = find.near(data, x, y, 8)) != null) {
    d.selected = true;
  } else if ((d = find.tangentNear(data, x, y, 8)) != null) {
    d.selected = "tangent";
  } else if ((d = find.iTangentNear(data, x, y, 8)) != null) {
    d.selected = "itangent";
  } else if (prev == null) {
    let last = interpolate.coordinates(data).reverse()[0];

    data.push({
      t: (data.length === 0 ? 0 : 1000),
      x: (data.length === 0 ? x : x - last.x ),
      y: (data.length === 0 ? y : y - last.y ),
      dx: 32,
      dy: 32,
      selected: true,
      absolute: false,
    });
  }
}

function update(data, x, y) {
  let d = find.selected(interpolate.coordinates(data));

  if (d) {
    if (typeof d.target.selected == "boolean") {
      [ d.target.x, d.target.y ] = find.newCoordinates(data, d.target, x, y);
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
}

function toggleAbsolute(data) {
  let d = find.selected(data);

  if (d) {
    [ d.x, d.y ] = find.newCoordinates(data, d);
  }
}

function remove(data) {
  let i;
  for (i = 0; i < data.length; ++i) {
    if (data[i].selected) {
      break;
    }
  }

  if (i < data.length) {
    data.splice(i, 1);
  }
}

function assignItem(data) {
  let e;

  if ((e = find.selected(data))) {
    document.getElementById("t_input").value = e.t;
    document.getElementById("x_input").value = e.x;
    document.getElementById("y_input").value = e.y;
    document.getElementById("dx_input").value = e.dx;
    document.getElementById("dy_input").value = e.dy;
    document.getElementById("linear_input").checked = e.linear;
    document.getElementById("absolute_input").checked = e.absolute;
    document.getElementById("remove_action").disabled = false;
  } else {
    document.getElementById("t_input").value = "";
    document.getElementById("x_input").value = "";
    document.getElementById("y_input").value = "";
    document.getElementById("dx_input").value = "";
    document.getElementById("dy_input").value = "";
    document.getElementById("linear_input").checked = false;
    document.getElementById("absolute_input").checked = false;
    document.getElementById("remove_action").disabled = true;
  }
}

function doDraw(ctx, data, t) {
  if (previewInterval != null) {
    if (typeof t === "number") {
      draw.background(ctx, data);
      draw.preview(ctx, data, t);
    }
  } else {
    draw.background(ctx, data);
    draw.path(ctx, data);
    draw.tangents(ctx, data);
    draw.anchors(ctx, data);
    draw.tangentAnchors(ctx, data);
  }
}
