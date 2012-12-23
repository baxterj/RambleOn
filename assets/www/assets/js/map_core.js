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

var infowindow = new google.maps.InfoWindow({
	content: ''
	//maxWidth:...
});

var notesContent = []
var imagesContent = []

var noteMarkers = new google.maps.MVCArray();
var imageMarkers = new google.maps.MVCArray();

var noteImageRefreshEnabled = true
var refreshTimer

$('#page-viewRoute').live('pageshow', function(event){
	sortMapHeight()
	createMap()
	setTimeout("getRoute(getUrlVars()['id'], loadRoute)", 500); //url vars dont load before this event fires so we wait
})



function loadRoute(data, messageTarget){
	if(maps.routeMap == null){//map not loaded yet, try again in 1 second
		setTimeout("loadRoute(data, messageTarget)", 1000);
	}else{
		activeMap = maps.routeMap

		maps.routeMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
		maps.routeMap.route = makePolyLine()
		maps.routeMap.route.setMap(maps.routeMap); //assign route poly to route map
		buildPathFromCoords(data, maps.routeMap.route)
		pageHeader(data.name)
		$.mobile.activePage.find('#routeInfo p').html(routeInfoHTML(data))
		createFavDoneButtons(data.id, data.fav, data.done)

		updateNotesPhotos(maps.routeMap)
		google.maps.event.addListener(maps.routeMap, 'idle', function() {
			updateNotesPhotos(maps.routeMap)
		})

	}
}

function updateNotesPhotos(map){

	clearTimeout(refreshTimer)
	refreshTimer = setTimeout("noteImageRefreshEnabled = true", 500);

	if(noteImageRefreshEnabled){
		noteImageRefreshEnabled = false
		getNotesPhotos(map)
	}

	
	
}

function drawNotes(data, messageTarget){

	for(var i = 0; i < noteMarkers.getLength(); i++){ 
		noteMarkers.getAt(i).setMap(null)
	}
	noteMarkers.clear()

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
	infowindow.open(activeMap, marker)
}



function drawImages(data, messageTarget){

	for(var i = 0; i < imageMarkers.getLength(); i++){ 
		imageMarkers.getAt(i).setMap(null)
	}
	imageMarkers.clear()

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
	infowindow.open(activeMap, marker)
}



function createMap(){
	var mapOptions = {
		center: new google.maps.LatLng(50.848115, -0.11364),
		zoom: mapZoom,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
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