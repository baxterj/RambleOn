var activeMap;
var mapZoom = 10;
var maps = {
	routeMap: null,
	editMap: null,
	searchMap: null,
	noteMap: null,
	trackedMap: null,
	createMap: null
}


var enableNotesPhotos = true

var geoLocOptions = { 
	maximumAge: 3000,
	timeout: 5000,
	enableHighAccuracy: true
}

var newItemMarker
var activeMarker
var activeRouteMarker

var currPosMarkerSettings = {
		position: new google.maps.LatLng(0, 0),
		title: 'You are Here',
		icon: 'assets/images/youarehere-map-icon.png',
		zIndex: 99999,
		optimized: false
	}
var currentPositionMarker = new google.maps.Marker(currPosMarkerSettings);

var infowindow = new google.maps.InfoWindow({
	content: ''
});

var geocoder

var notesContent = []
var imagesContent = []
var routesContent = []

var noteMarkers = new google.maps.MVCArray();
var imageMarkers = new google.maps.MVCArray();
var routeMarkers = new google.maps.MVCArray();
//var createMarkers = new google.maps.MVCArray();
var createLine
var geoLocID

var trackingPaused = true

var noteImageRefreshEnabled = true
var refreshTimer
var routeRefreshEnabled = true
var routeRefreshTimer

var recordPositionTimer
var recordPosition = true

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

$('#page-createByHand').live('pageshow', function(event){
	sortMapHeight()
	createMapByHand()
	activeMap = maps.createMap
	
	
})

$('#page-createTracked').live('pageshow', function(event){
	sortMapHeight()
	createMapTracked()
	activeMap = maps.trackedMap
	
})

$('#page-notesphotos').live('pageshow', function(event){
	sortMapHeight('.map_page_nonmap')
	createMapNotesPhotos()
	activeMap = maps.noteMap
	fillImgPopup()
	
	
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
		maps.routeMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
		maps.routeMap.route = makePolyLine('#DD0000', false)
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
			clearMarkerArray(noteMarkers)
			clearMarkerArray(imageMarkers)
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
	clearMarkerArray(routeMarkers)

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
	maps.searchMap.route = makePolyLine('#DD0000', false)
	maps.searchMap.route.setMap(maps.searchMap); //assign route poly to route map
	buildPathFromCoords(data, maps.searchMap.route)
	$.mobile.activePage.find('#search-routeInfo p').html(routeInfoHTML(data))
	createFavDoneButtons(data.id, data.fav, data.done)
	$.mobile.activePage.find('.search_routelink a').attr('href', 'route.html?id='+data.id)

	$.mobile.activePage.find('#search-routeInfo').popup("open", { positionTo: '#search-popupbtn' })//TODO
}

function drawNotes(data, messageTarget){

	clearMarkerArray(noteMarkers)

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
			clickable: true,
			zIndex: 1
		});
		noteMarkers.push(marker)
		google.maps.event.addListener(marker,"click",function(){
			showNoteContent(this)
		});
	}
}

function showNoteContent(marker){
	var cont = notesContent[marker.num]
	var html = '<div class="noteImageContent">\n'
	html+= '<div class="ni_title">' + cont.title + '</div>\n'
	html+= '<p>' + cont.content + '</p>\n'
	html+= '<div class="ni_info"><b>Owner: </b>' + cont.owner.username + '<br />\n'
	html+= '<b>Private: </b>' + yesTrue(cont.private) + '<br />\n'
	html+= '<b>Created: </b>' + cont.creationDate + '<br />\n'
	html+= '<b>Updated: </b>' + cont.updateDate + '<br />\n'
	html+= '</div>\n'
	html+= '</div>'


	infowindow.setContent(html)
	if(activeMarker != null){
		activeMarker.setMap(null)
	}
	activeMarker = cloneMarker(marker)
	infowindow.open(activeMap, activeMarker)
}



function drawImages(data, messageTarget){

	clearMarkerArray(imageMarkers)

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
			clickable: true,
			zIndex: 1
		});
		imageMarkers.push(marker)
		google.maps.event.addListener(marker,"click",function(){
			showImageContent(this)
		});
	}
}

function showImageContent(marker){
	var cont = imagesContent[marker.num]
	var html = '<div class="noteImageContent">\n'
	html+= '<div class="ni_title">'+ cont.title + '</div><br />\n'
	html+= '<a href="viewImage.html?id='+cont.id + '">'
	html+= '<img src="'+ cont.thumbnail +'" /></a> <br />\n'
	html+= '<p>' + cont.text + '</p>\n'
	html+= '<div class="ni_info"><b>Owner: </b>' + cont.owner.username + '<br />\n'
	html+= '<b>Private: </b>' + yesTrue(cont.private) + '<br />\n'
	html+= '<b>Created: </b>' + cont.creationDate + '<br />\n'
	html+= '<b>Updated: </b>' + cont.updateDate + '<br />\n'
	html+= '</div>\n'
	html+= '</div>'
	infowindow.setContent(html)
	if(activeMarker != null){
		activeMarker.setMap(null)
	}
	activeMarker = cloneMarker(marker)
	infowindow.open(activeMap, activeMarker)
}

function clearMarkerArray(arr){
	for(var i = 0; i < arr.getLength(); i++){ 
		arr.getAt(i).setMap(null)
	}
	arr.clear()
}

function setNewMap(arr, map){
	for(var i = 0; i < arr.getLength(); i++){ 
		arr.getAt(i).setMap(map)
	}
}

function newRoutePoint(map, event){
	createLine.getPath().push(event.latLng);

	//this code used when editable: false on polyline
	// var path = createLine.getPath();
	// num = path.getLength();
	// path.push(event.latLng);

	// var marker = new google.maps.Marker({
	// 	position: event.latLng,
	// 	title: ''+num,
	// 	map: map,
	// 	num: num,
	// 	icon: 'assets/images/routepoint-map-icon.png',
	// 	zIndex: 99999,
	// 	draggable: true
	// });
	// createMarkers.push(marker);

	// google.maps.event.addListener(marker, 'dragend', function(){
	// 	path.setAt(this.num, this.getPosition());
	// });

	// google.maps.event.addListener(marker, 'click', function(){
	// 	if (confirm('Remove Point?')) {
	// 		path.removeAt(this.num)
	// 		this.setMap(null)
	// 		createMarkers.removeAt(this.num)
	// 		for(var i = 0; i < createMarkers.getLength(); i++){
	// 			createMarkers.getAt(i).num = i;
	// 		}
	// 	} else {
	// 		//nothing
	// 	}
	// });
}


function createMapRoute(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: 14,
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

function createMapByHand(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: 5,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	var oldCenter
	var oldZoom
	if(maps.createMap != null){
		oldCenter = maps.createMap.getCenter()
		oldZoom = maps.createMap.getZoom()
	}

	maps.createMap = new google.maps.Map(document.getElementById("map_canvas_byhand"),
		mapOptions);

	if(oldCenter != null){
		maps.createMap.setCenter(oldCenter)
		maps.createMap.setZoom(oldZoom)
	}

	// google.maps.event.addListener(maps.createMap, 'idle', function() {
	// 	updateNotesPhotos(maps.createMap, true)
	// })


	if (createLine == null){
		goToCurrentPosition()
		createLine = makePolyLine('#DD0000', true)
		//clearMarkerArray(createMarkers)
	}
	createLine.setMap(maps.createMap)
	//setNewMap(createMarkers, maps.createMap)

	google.maps.event.addListener(maps.createMap, 'click', function(event) {
		newRoutePoint(this, event)
	})

}

function createMapTracked(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: 5,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};


	var oldCenter
	var oldZoom
	if(maps.trackedMap != null){
		oldCenter = maps.trackedMap.getCenter()
		oldZoom = maps.trackedMap.getZoom()
	}

	maps.trackedMap = new google.maps.Map(document.getElementById("map_canvas_tracked"),
		mapOptions);

	if(oldCenter != null){
		maps.trackedMap.setCenter(oldCenter)
		maps.trackedMap.setZoom(oldZoom)
	}

	google.maps.event.addListener(maps.trackedMap, 'idle', function() {
		updateNotesPhotos(maps.trackedMap, true)
	})

	// if (createLine == null){
	// 	createLine = makePolyLine('#DD0000', false)
	// 	//clearMarkerArray(createMarkers)
	// }
	// createLine.setMap(maps.trackedMap)
	//setNewMap(createMarkers, maps.trackedMap)

	if(createLine != null){
		createLine.setMap(maps.trackedMap)
	}

	trackCurrentPosition(maps.trackedMap)


}

function createMapSearch(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: 7,
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
		if(enableNotesPhotos){
			updateNotesPhotos(maps.searchMap, true)
		}
		updateSearchRoutes(maps.searchMap)
	})



}

function createMapNotesPhotos(){
	
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: 5,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	var oldCenter
	var oldZoom
	if(maps.noteMap != null){
		oldCenter = maps.noteMap.getCenter()
		oldZoom = maps.noteMap.getZoom()
	}

	maps.noteMap = new google.maps.Map(document.getElementById("map_canvas_notesphotos"),
		mapOptions);

	if(oldCenter != null){
		maps.noteMap.setCenter(oldCenter)
		maps.noteMap.setZoom(oldZoom)
	}

	google.maps.event.addListener(maps.noteMap, 'idle', function() {
		if(enableNotesPhotos){
			updateNotesPhotos(maps.noteMap)
		}
		
	})

	if(newItemMarker != null){
		newItemMarker.setMap(maps.noteMap)
	}else{
		//first page visit for notes and photos
		enableNotesPhotos = false

		goToCurrentPosition()
		newItemMarker = new google.maps.Marker({
			position: maps.noteMap.getCenter(),
			title: 'Created here',
			map: maps.noteMap,
			//icon: 'assets/images/routepoint-map-icon.png',
			zIndex: 99999,
			draggable: true,
			optimized: false
		});
	}

	
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

function makePolyLine(color, editable){
	var polyOptions = {
		strokeColor: color,
		strokeOpacity: 0.8,
		strokeWeight: 3,
		editable: editable,
		optimized: false
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

function centerMarker(marker){
	marker.setPosition(activeMap.getCenter())
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

function setEnableNotesPhotos(bool){
	if(bool != null){
		if(bool){
			enableNotesPhotos = true
			updateNotesPhotos(activeMap)
		}else{
			enableNotesPhotos = false
			clearMarkerArray(noteMarkers)
			clearMarkerArray(imageMarkers)
		}
	}else{
		setEnableNotesPhotos(!enableNotesPhotos)
	}
	
}


function trackCurrentPosition(map){
	startPositionWatch(false)
	if(currentPositionMarker == null){
		currentPositionMarker = new google.maps.Marker(currPosMarkerSettings);
	}
	
	currentPositionMarker.setMap(map)
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

function trackingPositionSuccess(position){
	//if(position.coords.accuracy < 20){
		
		if(createLine != null && recordPosition){
			activeMap.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
			createLine.getPath().push(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
			recordPosition = false
			recordPositionTimer = setTimeout("recordPosition = true", 10000);
		}

		currentPositionMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
	//}

}

function goToCurrentPosition(){
	showAjaxLoad(true)
	navigator.geolocation.getCurrentPosition(goToPositionSuccess, getPositionError, geoLocOptions);
}

function goToPositionSuccess(position){
	showAjaxLoad(false)
	activeMap.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
	activeMap.setZoom(12)

	if($.mobile.activePage.attr('id') == 'page-notesphotos'){
		centerMarker(newItemMarker)
	}
}

function getPositionError(error) {
	showAjaxLoad(false)
	alert('finding location failed:\n'
		+'code: '    + error.code    + '\n' +
		'message: ' + error.message + '\n');
}

function startPositionWatch(createRoute){
	if(createRoute){
		activeMap.setZoom(15)
		createLine = makePolyLine('#DD0000', createRoute)
		createLine.setMap(activeMap)
	}
	if(geoLocID == null){
		geoLocID = navigator.geolocation.watchPosition(trackingPositionSuccess, getPositionError, geoLocOptions);
	}
}

function endPositionWatch(){
	navigator.geolocation.clearWatch(geoLocID);
	geoLocID = null
}

function pausePositionWatch(pause){
	if(pause){
		clearTimeout(recordPositionTimer)
		recordPosition = false
	}else{
		recordPosition = true
	}
}

$("#pauseTrack").live("slidestop", function(event, ui) {
 	if($(this).val() == 'track'){
 		if(trackingPaused){
 			if(createLine == null){
 				startPositionWatch(true)
 			}
 			trackingPaused = false
 			pausePositionWatch(false)
 		}
 	}else if($(this).val() == 'pause'){
 		if(!trackingPaused){
 			trackingPaused = true
 			pausePositionWatch(true)
 		}
 	}
});

function resetCreation(){
	if(createLine != null){
		createLine.getPath().clear()
	}
	
	if($.mobile.activePage.attr('id') == 'page-createTracked'){
		trackingPaused = true
		pausePositionWatch(true)
		$('#pauseTrack').val('pause').slider('refresh')	
	}
}