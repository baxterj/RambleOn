var map;
var mapZoom = 12;

$(document).ready(function(){
	$('.footer_button').button();
});


function initialize(){
	var mapOptions = {
      center: new google.maps.LatLng(50.848115, -0.11364),
      zoom: mapZoom,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      rotateControl: true
    };

    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);


}

function setMapZoom(zoomout){
	if(zoomout){
		map.setZoom(--mapZoom);
	}else{
		map.setZoom(++mapZoom);
	}
}