var map;
var mapZoom = 12;



$('#page-viewRoute').live('pageshow', function(event){
	$.mobile.activePage.find('.map_content').css('height', $(window).height()
	 - $.mobile.activePage.find('.map_header').outerHeight()
	 - $.mobile.activePage.find('.ui-footer').outerHeight() )
	initialize()
})





function initialize(){
	var mapOptions = {
      center: new google.maps.LatLng(50.848115, -0.11364),
      zoom: mapZoom,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      rotateControl: true
    };

    map = new google.maps.Map(document.getElementById("map_canvas_route"),
        mapOptions);


}

function setMapZoom(zoomout){
	if(zoomout){
		map.setZoom(--mapZoom);
	}else{
		map.setZoom(++mapZoom);
	}
}

function generateThumbCoords(){
	//possibly do on server
}