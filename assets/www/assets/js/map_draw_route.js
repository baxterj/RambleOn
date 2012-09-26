var DRAWTYPES = {
  MARKER : {value: 0, name: "Add Points", icon: "star"}, 
  REMOVER: {value: 1, name: "Delete Points", icon: "delete"},
  MOVER: {value: 1, name: "Move Points", icon: "grid"}
};
var num = 0;
var markers = new google.maps.MVCArray();
var poly;
var drawType = DRAWTYPES.MARKER;

var polyOptions = {
      strokeColor: '#000000',
      strokeOpacity: 1.0,
      strokeWeight: 3
    }
    poly = new google.maps.Polyline(polyOptions);
    

function initDrawMode(){
	poly.setMap(map);
	google.maps.event.addListener(map, 'click', processClick);
}


function processClick(event){
	if(drawType == DRAWTYPES.MARKER){
	 addMarker(event);
	}
}


function addMarker(event) {

	var path = poly.getPath();
	num = path.getLength();
	path.push(event.latLng);

	var marker = new google.maps.Marker({
		position: event.latLng,
		title: '#' + path.getLength(),
		map: map,
		num: num
	});

	markers.push(marker);

	//remove point + corresponding vertex on click
	google.maps.event.addListener(marker, 'click', function(){
		if (drawType == DRAWTYPES.REMOVER){
			marker.setMap(null);
			markers.removeAt(marker.num);
			path.removeAt(marker.num);
			//reset markers numerically for new path
			for(var i = 0; i < markers.length; i++){
				markers.getAt(i).num = i;
			}
		}
	 
	});

	google.maps.event.addListener(marker, 'dragend', function(){
		path.setAt(marker.num, marker.getPosition());
	});

}

function toggleModeSelect(){
	$('.modeSelect').toggle();
}

function hideModeSelect(){
	$('.modeSelect').hide();
}

function swapDrawMode(newMode){
	hideModeSelect();
	var prevMode = drawType;

	var prevClass = 'ui-icon-' + drawType.icon;
	drawType = newMode;
	$('.modebutton .ui-icon').removeClass(prevClass);
	$('.modebutton .ui-icon').addClass('ui-icon-' + drawType.icon);
	$('.modebutton .ui-btn-text').html(drawType.name);

	if(newMode == DRAWTYPES.MOVER){
		for(var i = 0; i < markers.length; i++){
			markers.getAt(i).setDraggable(true);
		}
	}else if(prevMode == DRAWTYPES.MOVER){
		for(var i = 0; i < markers.length; i++){
			markers.getAt(i).setDraggable(false);
		}
	}
}
