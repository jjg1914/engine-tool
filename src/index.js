document.addEventListener("DOMContentLoaded", function() {
  var data = [];
  var dataName = "";

  var dragging = false;

  var canvas = document.getElementById("stage");
  var t_input = document.getElementById("t_input");
  var x_input = document.getElementById("x_input");
  var y_input = document.getElementById("y_input");
  var dx_input = document.getElementById("dx_input");
  var dy_input = document.getElementById("dy_input");
  var export_input = document.getElementById("export_input");
  var import_input = document.getElementById("import_input");
  var export_action = document.getElementById("export_action");
  var remove_action = document.getElementById("remove_action");
  var new_action = document.getElementById("new_action");
  var ctx = canvas.getContext("2d");

  canvas.style.width = (canvas.width = 208) + "px";
  canvas.style.height = (canvas.height = 256) + "px";

  draw(ctx, data);

  canvas.addEventListener("mousedown", function(event) {
    var selected = select(data, event.offsetX, event.offsetY);
    if (selected) {
      dragging = true;
    }
    assignItem(selected);
    draw(ctx, data);
  });

  canvas.addEventListener("mousemove", function(event) {
    if (dragging) {
      assignItem(update(data, event.offsetX, event.offsetY));
    }
      draw(ctx, data);
  });

  canvas.addEventListener("mouseup", function(event) {
    dragging = false;
  });

  canvas.addEventListener("mouseleave", function(event) {
    dragging = false;
  });

  remove_action.addEventListener("click", function() {
    assignItem(remove(data));
    draw(ctx, data);
  });

  new_action.addEventListener("click", function() {
    data = [];
    dataName = "";
    assignItem();
    draw(ctx, data);
  });

  t_input.addEventListener("change",function(event) {
    updateItem(data, "t", Number(event.target.value));
    draw(ctx, data);
  });

  x_input.addEventListener("change", function(event) {
    updateItem(data, "x", Number(event.target.value));
    draw(ctx, data);
  });

  y_input.addEventListener("change", function(event) {
    updateItem(data, "y", Number(event.target.value));
    draw(ctx, data);
  });

  dx_input.addEventListener("change", function(event) {
    updateItem(data, "dx", Number(event.target.value));
    draw(ctx, data);
  });

  dy_input.addEventListener("change", function(event) {
    updateItem(data, "dy", Number(event.target.value));
    draw(ctx, data);
  });

  export_input.addEventListener("change", function(event) {
    dataName = event.target.value;
  });

  import_input.addEventListener("change", function(event) {
    var reader = new FileReader();
    reader.onerror = function(err) { console.error(error); }
    reader.onload = function(result) {
      var raw = result.target.result;
      var str = String.fromCharCode.apply(null, new Uint8Array(raw));
      data = JSON.parse(str);
      assignItem();
      draw(ctx, data);
      export_input.value = dataName = event.target.files[0].name;
    }
    reader.readAsArrayBuffer(event.target.files[0]);
    // draw(ctx, data);
  });

  export_action.addEventListener("click", function(event) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([ json ], { type: "application/json;charset=utf-8"});
    
    var a = document.createElement("a");
    a.setAttribute("href", window.URL.createObjectURL(blob));
    a.setAttribute("download", dataName);
    a.click();
  });
});

function updateItem(data, prop, value) {
  var d = data.find(function(e) {
    return e.selected;
  });

  if (d) {
    d[prop] = value;
  }
}

function select(data, x, y) {
  var prev = data.find(function(e) {
    return e.selected;
  });

  var d = data.find(function(e) {
    var dx = e.x - x;
    var dy = e.y - y;

    return Math.sqrt((dx * dx) + (dy * dy)) < 8;
  });

  var dtangent = data.find(function(e) {
    var dx = e.x + e.dx - x;
    var dy = e.y + e.dy - y;

    return Math.sqrt((dx * dx) + (dy * dy)) < 8;
  });

  var ditangent = data.find(function(e) {
    var dx = e.x - e.dx - x;
    var dy = e.y - e.dy - y;

    return Math.sqrt((dx * dx) + (dy * dy)) < 8;
  });

  if (prev != null) {
    prev.selected = false
  }

  if (d != null) {
    d.selected = true;
  } else if (dtangent != null) {
    dtangent.selected = "tangent";
  } else if (ditangent != null) {
    ditangent.selected = "itangent";
  } else {
    if (prev == null) {
      d = { t: (data.length === 0 ? 0 : 1000), x: x, y: y, dx: 32, dy: 32 };
      data.push(d);
    }
  }

  return d || dtangent || ditangent;
}

function update(data, x, y) {
  var d = data.find(function(e) {
    return e.selected;
  });

  if (d) {
    if (typeof d.selected == "boolean") {
      d.x = x;
      d.y = y;
    } else if (typeof d.selected == "string") {
      if (d.selected === "tangent") {
        d.dx = x - d.x;
        d.dy = y - d.y;
      } else if (d.selected === "itangent") {
        d.dx = -(x - d.x);
        d.dy = -(y - d.y);
      }
    }
  }

  return d;
}

function remove(data) {
  var i;
  for (i = 0; i < data.length; ++i) {
    if (data[i].selected) {
      break;
    }
  }

  if (i < data.length) {
    data.splice(i, 1);
  }
}

function assignItem(e) {
  if (e) {
    document.getElementById("t_input").value = e.t;
    document.getElementById("x_input").value = e.x;
    document.getElementById("y_input").value = e.y;
    document.getElementById("dx_input").value = e.dx;
    document.getElementById("dy_input").value = e.dy;
    document.getElementById("remove_action").disabled = false;
  } else {
    document.getElementById("t_input").value = "";
    document.getElementById("x_input").value = "";
    document.getElementById("y_input").value = "";
    document.getElementById("dx_input").value = "";
    document.getElementById("dy_input").value = "";
    document.getElementById("remove_action").disabled = true;
  }
}

function draw(ctx, data) {
  ctx.fillStyle = "#F8F8F8";
  ctx.strokeStyle = "#C8C8C8";
  ctx.fillRect(0, 0, 208, 256);

  for (let i = 8; i < 208; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  for (let i = 8; i < 256; i += 16) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(208, i);
    ctx.stroke();
  }

  let prev = null;

  data.forEach(function(e) {
    ctx.strokeStyle = "#282828";

    if (prev) {
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.dx, e.y + e.dy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x - e.dx, e.y - e.dy);
    ctx.stroke();

    prev = e;
  });

  data.forEach(function(e) {
    ctx.strokeStyle = "#282828";
    if (e.selected) {
      ctx.fillStyle = "#aeea1c";
    } else {
      ctx.fillStyle = "#00b6e4";
    }

    ctx.beginPath();
    ctx.moveTo(e.x + 3, e.y);
    ctx.arc(e.x, e.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f33c6d";

    ctx.beginPath();
    ctx.moveTo(e.x + e.dx + 3, e.y + e.dy);
    ctx.arc(e.x + e.dx, e.y + e.dy, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(e.x - e.dx + 3, e.y - e.dy);
    ctx.arc(e.x - e.dx, e.y - e.dy, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });
}
