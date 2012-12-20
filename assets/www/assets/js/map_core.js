var map;
var mapZoom = 12;
var maps = {
	routeMap: null,
	editMap: null,
	searchMap: null,
	noteMap: null,
	trackMap: null,
	createMap: null
}



$('#page-viewRoute').live('pageshow', function(event){
	sortMapHeight()
	createMap()
	setTimeout("getRoute(getUrlVars()['id'], loadRoute)", 1000);
})



function loadRoute(data, messageTarget){
	if(maps.routeMap == null){//map not loaded yet, try again in 2 seconds
		setTimeout("loadRoute(data, messageTarget)", 2000);
	}else{
		maps.routeMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
		maps.routeMap.route = makePolyLine()
		maps.routeMap.route.setMap(maps.routeMap); //assign route poly to route map
		buildPathFromCoords(data, maps.routeMap.route)
		pageHeader(data.name)
		$.mobile.activePage.find('#routeInfo p').html(routeInfoHTML(data))
		createFavDoneButtons(data.id, data.fav, data.done)
	}
}


function createMap(){
	var mapOptions = {
		//center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: mapZoom,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		rotateControl: true
	};

	maps.routeMap = new google.maps.Map(document.getElementById("map_canvas_route"),
		mapOptions);

}

function createFavDoneButtons(routeID, fav, done){
	$.mobile.activePage.find('.route_favbuttons .favBtn img').attr('src', 'assets/images/fav_'+fav+'_mini.png')
	$.mobile.activePage.find('.route_favbuttons .doneBtn img').attr('src', 'assets/images/done_'+done+'_mini.png')
	$.mobile.activePage.find('.route_favbuttons .favBtn').attr('onClick', 'flipFavBtn('+routeID+', '+!fav+')')
	$.mobile.activePage.find('.route_favbuttons .doneBtn').attr('onClick', 'flipDoneBtn('+routeID+', '+!done+')')
}

function flipFavBtn(routeID, bool){
	changeFav(routeID, bool)
	$.mobile.activePage.find('.route_favbuttons .favBtn').attr('onClick', 'flipFavBtn('+routeID+', '+!bool+')')
	$.mobile.activePage.find('.route_favbuttons .favBtn img').attr('src', 'assets/images/fav_'+bool+'_mini.png')
}

function flipDoneBtn(routeID, bool){
	changeDone(routeID, bool)
	$.mobile.activePage.find('.route_favbuttons .doneBtn').attr('onClick', 'flipDoneBtn('+routeID+', '+!bool+')')
	$.mobile.activePage.find('.route_favbuttons .doneBtn img').attr('src', 'assets/images/done_'+bool+'_mini.png')
}

function buildPathFromCoords(data, polyLine){
	var path = polyLine.getPath()
	for(var i = 0; i < data.pathpoints.length; i++){
		path.push(new google.maps.LatLng(data.pathpoints[i].lat, data.pathpoints[i].lng))
	}
}

function makePolyLine(){
	var polyOptions = {
		strokeColor: '#DD0000',
		strokeOpacity: 0.8,
		strokeWeight: 3
	}
	return new google.maps.Polyline(polyOptions);
}

function setMapZoom(zoomout){
	if(zoomout){
		map.setZoom(--mapZoom);
	}else{
		map.setZoom(++mapZoom);
	}
}

function sortMapHeight(){
	$.mobile.activePage.find('.map_content').css('height', $(window).height()
	 - $.mobile.activePage.find('.map_header').outerHeight()
	 - $.mobile.activePage.find('.ui-footer').outerHeight() )
}

function generateThumbCoords(){
	//possibly do on server
}