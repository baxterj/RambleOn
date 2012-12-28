var activeMap;
var mapZoom = 12;
var maps = {
	routeMap: null,
	editMap: null,
	searchMap: null,
	noteMap: null,
	trackMap: null,
	createMap: null
}

var geoLocOptions = { 
	maximumAge: 3000,
	//timeout: 5000,
	enableHighAccuracy: true
}

var activeMarker
var activeRouteMarker

var infowindow = new google.maps.InfoWindow({
	content: ''
	//maxWidth:...
});

var geocoder

var notesContent = []
var imagesContent = []
var routesContent = []

var noteMarkers = new google.maps.MVCArray();
var imageMarkers = new google.maps.MVCArray();
var routeMarkers = new google.maps.MVCArray();

var noteImageRefreshEnabled = true
var refreshTimer
var routeRefreshEnabled = true
var routeRefreshTimer

$('#page-viewRoute').live('pageshow', function(event){
	sortMapHeight()
	createMapRoute()
	activeMap = maps.routeMap
	
	setTimeout("getRoute(getUrlVars()['id'], loadRoute)", 500); //url vars dont load before this event fires so we wait
})

$('#page-searchRoute').live('pageshow', function(event){
	sortMapHeight('.map_page_nonmap')
	createMapSearch()
	activeMap = maps.searchMap
	
})


function findMapLocation(distance, units, location, messageTarget){
	geocoder = new google.maps.Geocoder();
	geocoder.geocode( { 'address': location }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			activeMap.setCenter(results[0].geometry.location);
			activeMap.setZoom(calcSearchZoom(distance, units))
		}else{
			messageTarget.html('Could not find address')
		}

	});

}


function loadRoute(data, messageTarget){
	if(maps.routeMap == null){//map not loaded yet, try again in 1 second
		setTimeout("loadRoute(data, messageTarget)", 1000);
	}else{
		//activeMap = maps.routeMap

		maps.routeMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
		maps.routeMap.route = makePolyLine()
		maps.routeMap.route.setMap(maps.routeMap); //assign route poly to route map
		buildPathFromCoords(data, maps.routeMap.route)
		pageHeader(data.name)
		$.mobile.activePage.find('#routeInfo p').html(routeInfoHTML(data))
		createFavDoneButtons(data.id, data.fav, data.done)



	}
}

function updateNotesPhotos(map, limitByZoom){
	var doUpdate = true
	if(limitByZoom){
		if(activeMap.getZoom() < 9){
			clearNoteMarkers()
			clearImageMarkers()
			doUpdate = false
		}
	}
	
	if(doUpdate){
		clearTimeout(refreshTimer)
		refreshTimer = setTimeout("noteImageRefreshEnabled = true", 500);

		if(noteImageRefreshEnabled){
				noteImageRefreshEnabled = false
				getNotesPhotos(map)
		}
	}

}

function updateSearchRoutes(map){
	clearTimeout(routeRefreshTimer)
	routeRefreshTimer = setTimeout("routeRefreshEnabled = true", 500);

	if(routeRefreshEnabled){
		routeRefreshEnabled = false
		getSearchRoutes(map)
	}
}

function drawRoutes(data, messageTarget){
	clearRouteMarkers()

	routesContent = data.objects

	var marker
	for(var i = 0; i < data.objects.length; i++){
		//make marker for each
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.objects[i].pathpoints[0].lat, data.objects[i].pathpoints[0].lng),
			map: activeMap,
			icon: 'assets/images/route-map-icon.png',
			title: data.objects[i].name,
			num: i,
			optimized: false,
			clickable: true,
			zIndex: 99999
		});
		routeMarkers.push(marker)
		google.maps.event.addListener(marker,"click",function(){
			showRouteContent(this)
		});

	}
}

function showRouteContent(marker){
	if(maps.searchMap.route != null){
		maps.searchMap.route.setMap(null)
	}
	

	var data = routesContent[marker.num]
	maps.searchMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
	maps.searchMap.route = makePolyLine()
	maps.searchMap.route.setMap(maps.searchMap); //assign route poly to route map
	buildPathFromCoords(data, maps.searchMap.route)
	$.mobile.activePage.find('#search-routeInfo p').html(routeInfoHTML(data))
	createFavDoneButtons(data.id, data.fav, data.done)
	$.mobile.activePage.find('.search_routelink a').attr('href', 'route.html?id='+data.id)

	$.mobile.activePage.find('#search-routeInfo').popup("open", { positionTo: '#search-popupbtn' })//TODO
}

function drawNotes(data, messageTarget){

	clearNoteMarkers()

	notesContent = data.objects
	
	var marker
	for(var i = 0; i < data.objects.length; i++){
		//make marker for each
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.objects[i].lat, data.objects[i].lng),
			map: activeMap,
			icon: 'assets/images/note-map-icon.png',
			title: data.objects[i].title,
			num: i,
			optimized: false,
			clickable: true
		});
		noteMarkers.push(marker)
		google.maps.event.addListener(marker,"click",function(){
			showNoteContent(this)
		});
	}
}

function showNoteContent(marker){
	var cont = notesContent[marker.num]
	var html = '<div class="note_title">' + cont.title + '</div>\n'
	html += '<div class="note_content">' + cont.content + '</div>\n'
	infowindow.setContent(html)
	if(activeMarker != null){
		activeMarker.setMap(null)
	}
	activeMarker = cloneMarker(marker)
	infowindow.open(activeMap, activeMarker)
}



function drawImages(data, messageTarget){

	clearImageMarkers()

	imagesContent = data.objects

	var marker
	for(var i = 0; i < data.objects.length; i++){
		//make marker for each
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.objects[i].lat, data.objects[i].lng),
			map: activeMap,
			icon: 'assets/images/image-map-icon.png',
			title: data.objects[i].title,
			num: i,
			optimized: false,
			clickable: true
		});
		imageMarkers.push(marker)
		google.maps.event.addListener(marker,"click",function(){
			showImageContent(this)
		});
	}
}

function showImageContent(marker){
	var html = imagesContent[marker.num].id + ': '+ imagesContent[marker.num].title + '<br />\n'
	html+= '<img src="'+ imagesContent[marker.num].thumbnail +'" />\n'
	infowindow.setContent(html)
	if(activeMarker != null){
		activeMarker.setMap(null)
	}
	activeMarker = cloneMarker(marker)
	infowindow.open(activeMap, activeMarker)
}

function clearNoteMarkers(){
	for(var i = 0; i < noteMarkers.getLength(); i++){ 
		noteMarkers.getAt(i).setMap(null)
	}
	noteMarkers.clear()
}

function clearImageMarkers(){
	for(var i = 0; i < imageMarkers.getLength(); i++){ 
		imageMarkers.getAt(i).setMap(null)
	}
	imageMarkers.clear()
}

function clearRouteMarkers(){
	for(var i = 0; i < routeMarkers.getLength(); i++){ 
		routeMarkers.getAt(i).setMap(null)
	}
	routeMarkers.clear()
}


function createMapRoute(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: mapZoom,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	maps.routeMap = new google.maps.Map(document.getElementById("map_canvas_route"),
		mapOptions);

	updateNotesPhotos(maps.routeMap)
	google.maps.event.addListener(maps.routeMap, 'idle', function() {
		updateNotesPhotos(maps.routeMap)
	})

}

function createMapSearch(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: 5,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	var oldCenter
	var oldZoom
	if(maps.searchMap != null){
		oldCenter = maps.searchMap.getCenter()
		oldZoom = maps.searchMap.getZoom()
	}

	maps.searchMap = new google.maps.Map(document.getElementById("map_canvas_search"),
		mapOptions);

	if(oldCenter != null){
		maps.searchMap.setCenter(oldCenter)
		maps.searchMap.setZoom(oldZoom)
	}

	google.maps.event.addListener(maps.searchMap, 'idle', function() {
		updateNotesPhotos(maps.searchMap, true)
		updateSearchRoutes(maps.searchMap)
		console.log(maps.searchMap.getZoom())
	})

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

function sortMapHeight(nonMapContentClass){
	$.mobile.activePage.find('.map_content').css('height', $(window).height()
	 - $.mobile.activePage.find('.map_header').outerHeight()
	 - $.mobile.activePage.find('.ui-footer').outerHeight() )

	if(nonMapContentClass != null){
		$.mobile.activePage.find('.map_canvas').css('height', 
			$.mobile.activePage.find('.map_content').outerHeight() 
			- $.mobile.activePage.find(nonMapContentClass).outerHeight() )
	}
}


function cloneMarker(marker){
	newMarker = new google.maps.Marker({
			position: marker.position,
			map: marker.map,
			icon: marker.icon,
			title: marker.title,
			num: marker.num,
			optimized: marker.optimized,
			clickable: marker.clickable
		});
	return newMarker
}

function calcSearchZoom(distance, units){
	var meters = 10000
	if(units=='feet'){
		meters = distance / 3
	}else if(units=='meters'){
		meters = distance
	}else if(units=='kilometers'){
		meters = distance * 1000
	}else if(units=='miles'){
		meters = distance * 1600
	}

	if(distance == null || distance==''){
		meters = 10000
	}

	if(meters < 500){
		return 15
	}else if(meters < 2000){
		return 14
	}else if(meters < 4000){
		return 12
	}else if(meters < 8000){
		return 11
	}else if(meters < 40000){
		return 10
	}else if(meters < 100000){
		return 9
	}else if(meters < 200000){
		return 7
	}else{
		return 6
	}
}





function currentPosition(){
	showAjaxLoad(true)
	navigator.geolocation.getCurrentPosition(getPositionSuccess, getPositionError, geoLocOptions);
}

function getPositionSuccess(position){
	showAjaxLoad(false)
	if($.mobile.activePage.attr('id') == 'page-searchRoute'){
		$.mobile.activePage.find('#searchLocation').val( 
			Math.round( position.coords.latitude * 1000000 ) / 1000000 + ', ' //rounds to 6 DP
			 + Math.round( position.coords.longitude * 1000000 ) / 1000000
		)
	}
	
}

function getPositionError(error) {
	showAjaxLoad(false)
	alert('fail')
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}
