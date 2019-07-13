//The color to fill the selected area
var FILL_COLOR = { a: 255, r: 178, g: 255, b: 89 };
//The new width and height of image on canvas
var new_img_width,
  new_img_height = 0;
//The position of the image on canvas
var img_x,
  img_y = 0;
//Keep track of the total pixels
var total_pix = 0;
//To store the orinal copy of img
var init_img_json;
//store area conversion factor
var pix_area_conv_fac = 0;
//Arr to store clicked points
var scale_point_arr = [];
//Check if the choose_scale function is first runed
//to not run the event lisener mutiple times when go back button is clicked
var first_scale_event = true;
//Check if the select_area function is first runed
//to not run the event lisener mutiple times when go back button is clicked
var first_area_event = true;

//PROGRAM START
get_media();

var navH = document.querySelector('nav').offsetHeight,
  footH = document.querySelector('footer').offsetHeight;

function init_video() {
  document.querySelector('video').style.height =
    window.innerHeight - navH - footH + 'px';
  document.querySelector('video').style.top = navH + 'px';
}

//Initialize canvas with the input pic (Resiz ing img from line 28 to 55)
function canvas_init(img) {
  var canvas_arr = document.querySelectorAll('canvas'); //Select all canvas (2)

  //Display the img on all canvas
  for (canvas of canvas_arr) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - navH - footH;

    canvas.style.height = canvas.height + 'px';
    canvas.style.top = navH + 'px';

    //Try proportionally fiting the image size to the width of canvas
    var ratio = img.width / img.height;
    new_img_width = canvas.width;
    new_img_height = new_img_width / ratio;

    //If the new height is still larger the the canvas height, proprtionally fit the image to the height of canvas
    if (new_img_height > canvas.height) {
      new_img_height = canvas.height;
      new_img_width = new_img_height * ratio;
    }

    //Find the cordinate to put the img at middle
    img_x = Math.round(canvas.width / 2 - new_img_width / 2);
    img_y = Math.round(canvas.height / 2 - new_img_height / 2);

    //Display the image at the center of the canvas in right size and proportion
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, img_x, img_y, new_img_width, new_img_height);
  }

  var slider_container = document.getElementById('slidecontainer');
  //Resize the slider width as same as canvas, when the screen is large
  if (window.innerWidth > 600) {
    slider_container.style.width = new_img_width + 'px';
  }

  //Save an original copy of the img in the format of json
  var img = document
    .getElementById('SelectionCanvas')
    .getContext('2d')
    .getImageData(img_x, img_y, new_img_width, new_img_height);
  init_img_json = JSON.stringify(img);
}

function update_img(img1, img2) {
  for (var i = 0; i < img2.data.length; i++) img2.data[i] = img1.data[i];
}

function select_area() {
  //Initialize the slider
  var slider = document.getElementById('toleranceRange');
  var output = document.getElementById('toleranceVal');
  output.innerHTML = slider.value; // display the default slider value
  var point_clicked_on_screen = null; //keep track of the point clicked on screen
  var point_clicked_on_canvas = null; //keep track of the point clicked on canvas

  if (first_area_event) {
    // Update the current slider value and the area with new tolerance
    slider.oninput = function() {
      output.innerHTML = this.value;
      if (point_clicked_on_canvas != null) {
        // check x/y coordinate against the image position and dimension
        if (
          point_clicked_on_canvas.x >= img_x &&
          point_clicked_on_canvas.x <= img_x + new_img_width &&
          point_clicked_on_canvas.y >= img_y &&
          point_clicked_on_canvas.y <= img_y + new_img_height
        ) {
          total_pix = 0;
          //Get the canvas and context for area selecction
          var canvas = document.getElementById('SelectionCanvas');
          var ctx = canvas.getContext('2d');
          var img = ctx.getImageData(
            img_x,
            img_y,
            new_img_width,
            new_img_height
          );
          update_img(JSON.parse(init_img_json), img); //Access the unclicked image data and convert its type to img

          floodfill(
            point_clicked_on_screen.x,
            point_clicked_on_screen.y,
            FILL_COLOR,
            img,
            img.width,
            img.height,
            this.value
          );

          document.getElementById('areaVal').innerHTML = (
            total_pix / pix_area_conv_fac
          ).toFixed(2); // Display the seleted area
        }
      }
    };

    //Initialize the click handler
    canvas.addEventListener(
      'mouseup',
      function(event) {
        //Get the point clicked
        point_clicked_on_canvas = getPosition(
          'SelectionCanvas',
          event,
          'canvas'
        );

        //check if it's clicked on img
        if (
          point_clicked_on_canvas.x >= img_x &&
          point_clicked_on_canvas.x <= img_x + new_img_width &&
          point_clicked_on_canvas.y >= img_y &&
          point_clicked_on_canvas.y <= img_y + new_img_height
        ) {
          total_pix = 0;
          //Get the acual point clicked on image
          point_clicked_on_screen = getPosition(
            'SelectionCanvas',
            event,
            'screen'
          );
          //Get the canvas and context for area selecction
          var canvas = document.getElementById('SelectionCanvas');
          var ctx = canvas.getContext('2d');
          var img = ctx.getImageData(
            img_x,
            img_y,
            new_img_width,
            new_img_height
          );
          update_img(JSON.parse(init_img_json), img); //Access the unclicked image data and convert its type to img

          floodfill(
            point_clicked_on_screen.x,
            point_clicked_on_screen.y,
            FILL_COLOR,
            img,
            img.width,
            img.height,
            slider.value
          );

          draw_point(
            ctx,
            getPosition('SelectionCanvas', event, 'canvas').x,
            getPosition('SelectionCanvas', event, 'canvas').y
          );

          document.getElementById('areaVal').innerHTML = (
            total_pix / pix_area_conv_fac
          ).toFixed(2); // Display the seleted area
        }
      },
      false
    );
  }

  if (document.getElementById('areaVal').innerHTML != 0) {
    document.getElementById('areaVal').innerHTML = (
      total_pix / pix_area_conv_fac
    ).toFixed(4); // Display the seleted area
  }
  first_area_event = false;
}

//Return the point clicked
function getPosition(canvas_id, event, mode) {
  var canvas = document.getElementById(canvas_id);
  var x, y;

  if (mode == 'screen') {
    //Substract the moved distance
    x = event.offsetX - img_x;
    y = event.offsetY - img_y;
  }

  if (mode == 'canvas') {
    var rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }

  return { x: x, y: y };
}

function draw_point(ctx, x, y) {
  ctx.fillStyle = '#ff2626'; // Red color
  ctx.beginPath(); //Start path
  ctx.arc(x, y, 3, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
  ctx.fill(); // Close the path and fill.
}

function draw_line_with_text(ctx, x1, y1, x2, y2, text) {
  ctx.fillStyle = '#ff2626'; // Red color
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.font = '25px Arial';
  ctx.fillText(text, x2 + 10, y2 + 10);
}

function choose_scale() {
  var canvas = document.getElementById('ScaleCanvas');
  var ctx = canvas.getContext('2d');
  var img = ctx.getImageData(img_x, img_y, new_img_width, new_img_height);

  var undo_but = document.getElementById('ScaleUndo');
  undo_but.onclick = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Clear the canvas first
    update_img(JSON.parse(init_img_json), img); //Access the unclicked image data and convert its type to img
    ctx.putImageData(img, img_x, img_y);
    scale_point_arr = [];
  };
  if (first_scale_event) {
    canvas.addEventListener(
      'mouseup',
      function(event) {
        //Get the point clicked
        point_clicked = getPosition('ScaleCanvas', event, 'canvas');
        //check if it's clicked on img
        if (
          point_clicked.x >= img_x &&
          point_clicked.x <= img_x + new_img_width &&
          point_clicked.y >= img_y &&
          point_clicked.y <= img_y + new_img_height
        ) {
          //When less than 2 points in arr, draw it
          if (scale_point_arr.length < 2) {
            draw_point(ctx, point_clicked.x, point_clicked.y);
          }

          //Push the selected point into the arr
          scale_point_arr.push(point_clicked);

          //When two points in arr, do the area conversion
          if (scale_point_arr.length == 2) {
            var diff_x = scale_point_arr[0].x - scale_point_arr[1].x;
            var diff_y = scale_point_arr[0].y - scale_point_arr[1].y;
            var distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
            pix_area_conv_fac = distance * distance;
            draw_line_with_text(
              ctx,
              scale_point_arr[0].x,
              scale_point_arr[0].y,
              scale_point_arr[1].x,
              scale_point_arr[1].y,
              '1CM'
            );
          }
        }
      },
      false
    );
  }
  first_scale_event = false;
}

//Floodfill functions
function floodfill(x, y, fillcolor, img, width, height, tolerance) {
  var data = img.data;
  var length = data.length;
  var Q = [];
  var i = (x + y * width) * 4;
  var e = i,
    w = i,
    me,
    mw,
    w2 = width * 4;
  var targetcolor = [data[i], data[i + 1], data[i + 2], data[i + 3]];
  var targettotal = data[i] + data[i + 1] + data[i + 2] + data[i + 3];

  if (
    !pixelCompare(
      i,
      targetcolor,
      targettotal,
      fillcolor,
      data,
      length,
      tolerance
    )
  ) {
    return false;
  }
  Q.push(i);
  while (Q.length) {
    i = Q.pop();
    if (
      pixelCompareAndSet(
        i,
        targetcolor,
        targettotal,
        fillcolor,
        data,
        length,
        tolerance
      )
    ) {
      e = i;
      w = i;
      mw = parseInt(i / w2) * w2; //left bound
      me = mw + w2; //right bound
      while (
        mw < (w -= 4) &&
        pixelCompareAndSet(
          w,
          targetcolor,
          targettotal,
          fillcolor,
          data,
          length,
          tolerance
        )
      ) {
        total_pix++;
      } //go left until edge hit and add to total pix
      while (
        me > (e += 4) &&
        pixelCompareAndSet(
          e,
          targetcolor,
          targettotal,
          fillcolor,
          data,
          length,
          tolerance
        )
      ) {
        total_pix++;
      } //go right until edge hit and add to total pix

      for (var j = w; j < e; j += 4) {
        if (
          j - w2 >= 0 &&
          pixelCompare(
            j - w2,
            targetcolor,
            targettotal,
            fillcolor,
            data,
            length,
            tolerance
          )
        )
          Q.push(j - w2); //queue y-1
        if (
          j + w2 < length &&
          pixelCompare(
            j + w2,
            targetcolor,
            targettotal,
            fillcolor,
            data,
            length,
            tolerance
          )
        )
          Q.push(j + w2); //queue y+1
      }
    }
  }
  document
    .getElementById('SelectionCanvas')
    .getContext('2d')
    .putImageData(img, img_x, img_y); //display in the right context
}

function pixelCompare(
  i,
  targetcolor,
  targettotal,
  fillcolor,
  data,
  length,
  tolerance
) {
  if (i < 0 || i >= length) return false; //out of bounds
  if (data[i + 3] === 0) return true; //surface is invisible
  if (
    targetcolor[3] === fillcolor.a &&
    targetcolor[0] === fillcolor.r &&
    targetcolor[1] === fillcolor.g &&
    targetcolor[2] === fillcolor.b
  )
    return false; //target is same as fill
  if (
    targetcolor[3] === data[i + 3] &&
    targetcolor[0] === data[i] &&
    targetcolor[1] === data[i + 1] &&
    targetcolor[2] === data[i + 2]
  )
    return true; //target matches surface

  if (
    Math.abs(targetcolor[3] - data[i + 3]) <= 255 - tolerance &&
    Math.abs(targetcolor[0] - data[i]) <= tolerance &&
    Math.abs(targetcolor[1] - data[i + 1]) <= tolerance &&
    Math.abs(targetcolor[2] - data[i + 2]) <= tolerance
  )
    return true; //target to surface within tolerance

  return false; //no match
}

//To change the pix
function pixelCompareAndSet(
  i,
  targetcolor,
  targettotal,
  fillcolor,
  data,
  length,
  tolerance
) {
  if (
    pixelCompare(
      i,
      targetcolor,
      targettotal,
      fillcolor,
      data,
      length,
      tolerance
    )
  ) {
    //fill the color
    data[i] = fillcolor.r;
    data[i + 1] = fillcolor.g;
    data[i + 2] = fillcolor.b;
    data[i + 3] = fillcolor.a;
    return true;
  }
  return false;
}

//To swich b/w frames
function change_state(state) {
  // change to the choose input frame
  if (state == 'input') {
    document.querySelector('main').className = 'ChooseInputFrame';
    location.reload();
    //document.getElementById('input_button_container').style.display = 'flex';
    //document.querySelector('video').style.display = 'none';
    //document.getElementById('ScaleCanvas').style.display = 'none';
    //document.getElementById('SelectionCanvas').style.display = 'none';
  }
  //change to takePic frame
  if (state == 'video') {
    init_video();
    document.querySelector('main').className = 'TakePicFrame';
    document.getElementById('input_button_container').style.display = 'none';
    document.querySelector('video').style.display = 'block';
    document.getElementById('ScaleCanvas').style.display = 'none';
  }
  //change to choose scale frame
  if (state == 'scale') {
    choose_scale(); // send the pic to scale
    document.querySelector('main').className = 'ChooseScaleFrame';
    document.getElementById('input_button_container').style.display = 'none';
    document.querySelector('video').style.display = 'none';
    document.getElementById('ScaleCanvas').style.display = 'block';
    document.getElementById('SelectionCanvas').style.display = 'none';
  }
  //change to choose tolerance frame
  if (state == 'processing') {
    select_area();
    document.querySelector('main').className = 'AreaProcessingFrame';
    document.getElementById('input_button_container').style.display = 'none';
    document.getElementById('ScaleCanvas').style.display = 'none';
    document.getElementById('SelectionCanvas').style.display = 'block';
  }
}
