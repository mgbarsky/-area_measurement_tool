//Keep track of the total pixels
var total_pix = 0;
//To store the orinal copy of img
var init_img_json;
//To save all frames of img when changes are made by users
var img_json_arr = [];
//store area conversion factor
var pix_area_conv_fac = 0;
//Arr to store clicked points
var scale_point_arr = [];

var first_area_event = true;
//Initialize canvas
function init_canvas(img) {	
	var canvas_arr = document.querySelectorAll('canvas');
	var slider_container = document.querySelector('div.slidecontainer');
	//Resize the canvas and picture to fit in the window
	var img_w = img.width
	var img_h = img.height

	//Fit the img size to the screen
	while (img_w > window.innerWidth || img_h > (window.innerHeight-150)){
		img_w *= 0.9;
		img_h *= 0.9;
	}

	//Resize the slider width as same as img
	slider_container.style.width=img_w-1+'px';

	//Display img on all canvas
	for (canvas of canvas_arr){
		canvas.width = img_w;
		canvas.height = img_h;
		//Display the image
		var ctx = canvas.getContext('2d');
		console.log("orin dim: ", canvas.width, canvas.height)
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	};

	//Save an orinal copy of the img
	var img = document.getElementById('SelectionCanvas').getContext('2d').getImageData(0,0,canvas.width,canvas.height);
	init_img_json = JSON.stringify(img);
};


function update_img(img1, img2){
	  for(var i = 0; i < img2.data.length; i++) img2.data[i] = img1.data[i];
}


function select_area(){
	//Initialize the slider
	var slider = document.getElementById("toleranceRange");
	var output = document.getElementById("toleranceVal");
	output.innerHTML = slider.value; // display the default slider value
	var point_clicked = null; //keep track of the point clicked
	if (first_area_event){
		// Update the current slider value and the area with new tolerance
		slider.oninput = function() {
		  output.innerHTML = this.value;
		  if (point_clicked != null){
		  	  total_pix = 0;
		  	  //Get the canvas and context for area selecction
			  var canvas = document.getElementById('SelectionCanvas'); 
			  var ctx = canvas.getContext('2d');
			  var img = ctx.getImageData(0,0,canvas.width,canvas.height);

		  	  update_img(JSON.parse(init_img_json), img);//Access the unclicked image data and convert its type to img
			  floodfill(point_clicked.x, point_clicked.y, {a:255, r:0, g:255, b:0}, img, canvas.width, canvas.height, this.value);
			  document.getElementById("areaVal").innerHTML = (total_pix/pix_area_conv_fac).toFixed(4) // Display the seleted area
		  };
		};

		//Initialize the click handler
		canvas.addEventListener("mouseup", function(event){
			total_pix = 0;
			//Get the canvas and context for area selecction
		    var canvas = document.getElementById('SelectionCanvas'); 
		    var ctx = canvas.getContext('2d');
		    var img = ctx.getImageData(0,0,canvas.width,canvas.height);

			update_img(JSON.parse(init_img_json), img);//Access the unclicked image data and convert its type to img

			//Get the point clicked
			point_clicked = getPosition('SelectionCanvas', event, 'screen');

			floodfill(point_clicked.x, point_clicked.y, {a:255, r:0, g:255, b:0}, img, canvas.width, canvas.height, slider.value);
			draw_point(ctx, getPosition('SelectionCanvas', event, 'canvas').x, getPosition('SelectionCanvas', event, 'canvas').y)
			document.getElementById("areaVal").innerHTML = (total_pix/pix_area_conv_fac).toFixed(4) // Display the seleted area
		}, false);
	}

	if(document.getElementById("areaVal").innerHTML!=0) {
		document.getElementById("areaVal").innerHTML = (total_pix/pix_area_conv_fac).toFixed(4) // Display the seleted area
	}
	first_area_event = false;
}


//Return the point clicked
function getPosition(canvas_id, event, mode){
	var canvas = document.getElementById(canvas_id);
 	var x, y;

 	if (mode == 'screen'){
		x = event.offsetX;
		y = event.offsetY;
	}

	if (mode == 'canvas'){
		var rect = canvas.getBoundingClientRect();
		x = event.clientX - rect.left;
		y = event.clientY - rect.top;
	}

	return {"x":x, "y":y}
}


function draw_point(ctx, x, y){
	ctx.fillStyle = "#ff2626"; // Red color
    ctx.beginPath(); //Start path
    ctx.arc(x, y, 3, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
    ctx.fill(); // Close the path and fill.
}


function draw_line_with_text(ctx, x1, y1, x2, y2, text){
	ctx.fillStyle = "#ff2626"; // Red color
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	ctx.font = "25px Arial";
	ctx.fillText(text, x2+10, y2+10);
}


var first_scale_event = true;//Check if the func is called first time
function choose_scale(){
	var canvas = document.getElementById('ScaleCanvas'); 
	var ctx = canvas.getContext('2d');
	var img = ctx.getImageData(0,0,canvas.width,canvas.height)

	var undo_but = document.getElementById("ScaleUndo");
	undo_but.onclick = function(){
		update_img(JSON.parse(init_img_json), img);//Access the unclicked image data and convert its type to img
		ctx.putImageData(img, 0, 0);
		scale_point_arr=[];
	};
	if (first_scale_event){
		canvas.addEventListener("mouseup", function(event){
			//Get the point clicked
			point_clicked = getPosition('ScaleCanvas', event, 'canvas');

			//When less than 2 points in arr, draw it
			if ((scale_point_arr.length) < 2 ) {
				draw_point(ctx, point_clicked.x, point_clicked.y)
			}

			//Push the selected point into the arr
			scale_point_arr.push(point_clicked);

			//When two points in arr, do the area conversion
			if (scale_point_arr.length==2){
				var diff_x = scale_point_arr[0].x - scale_point_arr[1].x;
				var diff_y = scale_point_arr[0].y - scale_point_arr[1].y;
				var distance = Math.sqrt( diff_x*diff_x + diff_y*diff_y )
				pix_area_conv_fac = distance * distance;
				draw_line_with_text(ctx, scale_point_arr[0].x, scale_point_arr[0].y, scale_point_arr[1].x, scale_point_arr[1].y, '1CM');
			}
		}, false);
	}
	first_scale_event = false;
};


//Floodfill functions
function floodfill(x,y,fillcolor,img,width,height,tolerance) {
	var data = img.data;
	var length = data.length;
	var Q = [];
	var i = (x+y*width)*4;
	var e = i, w = i, me, mw, w2 = width*4;
	var targetcolor = [data[i],data[i+1],data[i+2],data[i+3]];
	var targettotal = data[i]+data[i+1]+data[i+2]+data[i+3];

	if(!pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) { return false; }
	Q.push(i);
	while(Q.length) {
		i = Q.pop();
		if(pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
			e = i;
			w = i;
			mw = parseInt(i/w2)*w2; //left bound
			me = mw+w2;	//right bound			
			while(mw<(w-=4) && pixelCompareAndSet(w,targetcolor,targettotal,fillcolor,data,length,tolerance)){total_pix++}; //go left until edge hit and add to total pix
			while(me>(e+=4) && pixelCompareAndSet(e,targetcolor,targettotal,fillcolor,data,length,tolerance)){total_pix++}; //go right until edge hit and add to total pix
			
			for(var j=w;j<e;j+=4) {
				if(j-w2>=0 		&& pixelCompare(j-w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j-w2); //queue y-1
				if(j+w2<length	&& pixelCompare(j+w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j+w2); //queue y+1
			} 			
		}
	}
	document.getElementById('SelectionCanvas').getContext('2d').putImageData(img,0,0); //display in the right context
}

function pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {	
	if (i<0||i>=length) return false; //out of bounds
	if (data[i+3]===0)  return true;  //surface is invisible
	if (
		(targetcolor[3] === fillcolor.a) && 
		(targetcolor[0] === fillcolor.r) && 
		(targetcolor[1] === fillcolor.g) && 
		(targetcolor[2] === fillcolor.b)
	) return false; //target is same as fill
	if (
		(targetcolor[3] === data[i+3]) &&
		(targetcolor[0] === data[i]  ) && 
		(targetcolor[1] === data[i+1]) &&
		(targetcolor[2] === data[i+2])
	) return true; //target matches surface 
	
	if (
		Math.abs(targetcolor[3] - data[i+3])<=(255-tolerance) &&
		Math.abs(targetcolor[0] - data[i]  )<=tolerance && 
		Math.abs(targetcolor[1] - data[i+1])<=tolerance &&
		Math.abs(targetcolor[2] - data[i+2])<=tolerance
	) return true; //target to surface within tolerance 
	
	return false; //no match
}

//To change the pix
function pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {
	if(pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
		//fill the color
		data[i] = fillcolor.r;
		data[i+1] = fillcolor.g;
		data[i+2] = fillcolor.b;
		data[i+3] = fillcolor.a;
		return true;
	}
	return false;
}


//To swich b/w frames
function change_state(state){
	if (state == "input") document.querySelector('body').className = 'ChooseInputFrame';
	if (state == "video") document.querySelector('body').className = 'TakePicFrame'; //change to takePic frame

	if (state == "scale"){
		choose_scale(); // send the pic to scale
		document.querySelector('body').className = 'ChooseScaleFrame'; //change to choose scale frame
	}
	if (state == "processing"){
		select_area();
		document.querySelector('body').className = 'AreaProcessingFrame'; //change to choose tolerance frame
	}

}

//For debug
window.addEventListener('keyup', function() {
	if (event.code === 'Digit1') document.querySelector('body').className = 'ChooseInputFrame';
	if (event.code === 'Digit2') document.querySelector('body').className = 'TakePicFrame';
	if (event.code === 'Digit3') document.querySelector('body').className = 'ChooseScaleFrame';
	if (event.code === 'Digit4') document.querySelector('body').className = 'AreaProcessingFrame';
	console.log('kb_'+event.code);
});
