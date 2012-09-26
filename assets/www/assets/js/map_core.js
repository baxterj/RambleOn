var map;
var mapZoom = 12;

function initialize(){
	var mapOptions = {
      center: new google.maps.LatLng(50.848115, -0.11364),
      zoom: mapZoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      rotateControl: true
    };

    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);





}

function setMapZoom(out){
	if(out){
		map.setZoom(--mapZoom);
	}else{
		map.setZoom(++mapZoom);
	}
}