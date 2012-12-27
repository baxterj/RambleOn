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

var activeMarker
var activeRouteMarker

var infowindow = new google.maps.InfoWindow({
	content: ''
	//maxWidth:...
});

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
	if(limitByZoom && activeMap.getZoom() > 9){
		clearTimeout(refreshTimer)
		refreshTimer = setTimeout("noteImageRefreshEnabled = true", 500);

		if(noteImageRefreshEnabled){
				noteImageRefreshEnabled = false
				getNotesPhotos(map)
		}
	}else{
		clearNoteMarkers()
		clearImageMarkers()
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

	$.mobile.activePage.find('#search-routeInfo').popup("open", { positionTo: '#search-routeInfo' })//TODO
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

function generateThumbCoords(){
	//possibly do on server
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