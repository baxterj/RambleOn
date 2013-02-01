//var apiUrl = 'http://127.0.0.1:8000/api/v1/'
var apiUrl = 'http://rocky-scrubland-5487.herokuapp.com/api/v1/'
//var apiUrl = 'http://mighty-lake-4789.herokuapp.com/api/v1/'
var routesListType = 'my' //my, fav, done, saved
var routesListData
var routesListMsgTarget



$('#page-routesList').live('pageshow', function(event, data){
	if(data.prevPage.attr('id') == 'page-home'){
		getMyRoutesItems($('#routesListMessage'), getUrlVars()["list"])
	}else{
		getMyRoutesItems($('#routesListMessage'), routesListType)
	}

})

$('#page-viewImage').live('pageshow', function(event){
	setTimeout("getImage(getUrlVars()['id'])", 500); //url vars dont load before this event fires so we wait
})



function sendForgot(username, messageTarget){
	var data = JSON.stringify({
		"user": username
	})
	sendAjax(data, messageTarget, successForgotPassword, 'forgotpassword', 'POST', false)
}

function successForgotPassword(data, messageTarget){
	$('#forgotSuccess').html(data.message)
}

function sendLogin(data, messageTarget){
	var data = JSON.stringify({
		"user": data[0],
		"passw": data[1]
	});
	sendAjax(data, messageTarget, successLoginRegister, 'login', 'POST', false)

}

function sendRegister(data, messageTarget){
	var data = JSON.stringify({
		"user": data[0],
		"passw": data[1],
		"email": data[2]
	});
	sendAjax(data, messageTarget, successLoginRegister, 'register', 'POST', false)
}

function successLoginRegister(data, messageTarget){
	window.localStorage.setItem("apikey", data.key)
	window.localStorage.setItem("user", data.user)
	$.mobile.changePage("home.html")
}


function logout(){
	window.localStorage.removeItem("apikey");
	window.localStorage.removeItem("user");
	$.mobile.changePage("login.html");
}

function checkLoggedIn(){
	return(window.localStorage.getItem("apikey") != null)
}

function redirectLoggedOut(){
	if(!checkLoggedIn()){
		$.mobile.changePage("login.html")
	}
}

function redirectLoggedIn(){
	if(checkLoggedIn()){
		$.mobile.changePage("home.html")
	}
}


function getMyRoutesItems(messageTarget, listType){
	if (listType != null){
		routesListType = listType
	}
	sendAjax(null, messageTarget, successRoutesList, 'myroutes', 'GET', true)
}

function successRoutesList(data, messageTarget){
	var html = ''
	if(data != null){
		routesListData = data
	}else{
		data = routesListData
	}

	if(messageTarget != null){
		routesListMsgTarget = messageTarget
	}else{
		messageTarget = routesListMsgTarget
	}
	
	
	if(data.meta.total_count < 1){
		messageTarget.html('No routes found for user: ' + window.localStorage.getItem("user"))
	}else{
		$.mobile.activePage.find('.routeList_' + routesListType + ' a').addClass('ui-btn-active').addClass('ui-state-persist')
		if(routesListType == 'my'){
			pageHeader('My Routes')
			for(var i = 0; i < data.objects.length; i++){
				if(data.objects[i].owner.username.toLowerCase() == window.localStorage.getItem("user").toLowerCase()){
					html += createRouteListItem(data.objects[i])
				}
			}
		}else if(routesListType == 'fav'){
			pageHeader('Favourite Routes')
			for(var i = 0; i < data.objects.length; i++){
				if(data.objects[i].fav){
					html += createRouteListItem(data.objects[i])
				}
			}
		}else if(routesListType == 'done'){
			pageHeader('Done Routes')
			for(var i = 0; i < data.objects.length; i++){
				if(data.objects[i].done){
					html += createRouteListItem(data.objects[i])
				}
			}
		}else if(routesListType == 'saved'){
			pageHeader('Saved Routes')
			for(var i = 0; i < data.objects.length; i++){
				html += createRouteListItem(data.objects[i])
			}
		}else{
			messageTarget.html('Please select a list')
		}
	}

	$('#myRoutesList').html(html)
	$('#myRoutesList').listview('refresh')
}

function createRouteListItem(route){
	var html = '<li>\n' //data-filtertext="'+stringifyArray(route.keywords)+'">\n'
	html += '<a href="route.html?id='+route.id+'">\n'
	html += '<div class="routelist_title">' + route.name + '</div>\n'
	html += '<div class="routelist_owner'+isUserClass(route.owner.username)+'">Owner: ' + route.owner.username + '</div>\n'
	html += '<div class="routelist_icons">\n'
	html += '<div class="routelist_fav fav_'+route.fav+'"></div>\n'
	html += '<div class="routelist_done done_'+route.done+'"></div>\n'
	html += '</div>\n'
	html += '<div class="routelist_keywords">Keywords: ' + stringifyArray(route.keywords)+'</div>\n'
	html += '<div class="mapThumb" id="mapThumb'+route.id+'"></div>\n'
	//html += '<a href="#" onClick="showMapThumbnail('+route.id+')" data-icon="grid" data-iconpos="right" title="Map"></a>\n'
	html += '</a></li>\n'
	return html
}



function showMapThumbnail(id){
	var thumb = $.mobile.activePage.find('#mapThumb'+id)
	if(thumb.css('display') == 'none'){
		thumb.css('display', 'block')
	}else{
		thumb.css('display', 'none')
	}
	
}

function getRoute(id, mapUpdateFunction){
	sendAjax(null, null, mapUpdateFunction, 'route/'+id, 'GET', true)
}

function changeFav(id, bool){
	var data = JSON.stringify({
		'route': id,
		'set': bool
	})
	sendAjax(data, null, null, 'fav', 'POST', true)
}

function changeDone(id, bool){
	var data = JSON.stringify({
		'route': id,
		'set': bool
	})
	sendAjax(data, null, null, 'done', 'POST', true)
}

function getNotesPhotos(map){
	try{
		var data = 'bounds='+ map.getBounds().toUrlValue()
		sendAjax(data, null, drawNotes, 'note', 'GET', true)
		sendAjax(data, null, drawImages, 'image', 'GET', true)
	}catch(e){
		//nothing
	}
	
}

function getSearchRoutes(map){
	var data = 'bounds='+ map.getBounds().toUrlValue()
	if($('#searchKeywords').val() != ''){
		if(validateField($('#searchKeywords'), 'Keywords', $('#searchFieldError'), 'alphanum', false, 0, 200)){
			data += '&filterwords='+stringifyArray($('#searchKeywords').val().split(' '), ',')
		}
	}
	
	sendAjax(data, null, drawRoutes, 'route', 'GET', true)
}

function sendNewRoute(line, name, priv, keywords){
	
	var pathpoints = []
	var path = line.getPath()
	for(var i = 0; i < path.getLength(); i++){
		pathpoints.push({
			'lat': path.getAt(i).lat(),
			'lng': path.getAt(i).lng()
		})

	}
	var data = JSON.stringify({
		'name': name,
		'private': priv,
		'keywords': keywords.split(' '),
		'mapThumbnail': 'aa',
		'pathpoints': pathpoints
	})
	sendAjax(data, null, successNewRoute, 'route', 'POST', true)

}

function successNewRoute(data, messageTarget){
	resetCreation(true)
	$.mobile.changePage('route.html?id='+data.id)
}

function sendNewNote(title, priv, content, lat, lng){
	var data = JSON.stringify({
		'title': title,
		'private': priv,
		'content':content,
		'lat': lat,
		'lng': lng
	})
	sendAjax(data, null, successNewNote, 'note', 'POST', true)
}

function successNewNote(data, messageTarget){
	$('#notesPhotos-newNote').popup('close')
	setEnableNotesPhotos(true)
	alert('Note Created!')
}

function sendNewImage(title, priv, text, lat, lng, file){
	var data = {
		'title': title,
		'private': priv,
		'text':text,
		'lat': lat,
		'lng': lng
	}
	sendImgur(data, file, $('#imageStatus'))
}

function successNewImage(data, messageTarget){
	$('#notesPhotos-newImage').popup('close')
	clearPhotoUploadPopup()
	setEnableNotesPhotos(true)
	alert('Image Created!')
}

function successImgur(rambledata, imgurdata, messageTarget){
	rambledata['image'] = imgurdata.data.id + '|' + imgurdata.data.deletehash
	rambledata['thumbnail'] = 'http://i.imgur.com/' + imgurdata.data.id +'t.jpg'
	var data = JSON.stringify(rambledata)
	sendAjax(data, null, successNewImage, 'image', 'POST', true)
}
 

function getImage(id){
	sendAjax(null, null, displayImage, 'image/'+id, 'GET', true)
}

function displayImage(data, messageTarget){
	$('#viewImage').attr('src', 'http://i.imgur.com/'+data.image.split('|')[0]+'l.jpg')

	$('#viewImageTitle').html('<b>'+data.title+'</b>')
	$('#viewImageText').html(data.text)
	$('#imageFullLink').attr('href', 'http://i.imgur.com/'+data.image.split('|')[0]+'')

	var html = '<b>Owner: </b><span class="' + isUserClass(data.owner.username) + '">' + data.owner.username + '</span><br />\n'
	html+= '<b>Private: </b>' + yesTrue(data.private) + '<br />\n'
	html+= '<b>Created: </b>' + data.creationDate + '<br />\n'
	html+= '<b>Updated: </b>' + data.updateDate + '<br />\n'
	$('#viewImageInfo').html(html)

	if(userOwns(data.owner.username)){
		createDeleteButton('image', data.id, $('#imageMessage'), data.image)	
	}else{
		$.mobile.activePage.find('.deleteButton').attr('onClick', 'alert(\'You do not own this image\')')
	}
	
}

function deleteItem(api, id, imageString){
	if(confirm('Delete ' + api + '?')){
		var successFunc
		var data=JSON.stringify({
			'id': id,
		})
		if(api == 'image'){
			successFunc = successDelImgur
			deleteImgur(data, imageString, successFunc, deleteMessageTarget)
		}else if(api == 'note'){
			successFunc = successDelNote
		}else if(api == 'route'){
			successFunc = successDelRoute
		}
		if(api != 'image'){//if image, sendAjax is called once imgur delete is successful
			sendAjax(data, deleteMessageTarget, successFunc, 'delete'+api, 'POST', true)	
		}
		
	}
	
}

function successDelRoute(data, messageTarget){
	alert('Route Deleted Succesfully')
	history.back()
}

function successDelNote(data, messageTarget){
	alert('Note Deleted Succesfully')
	infowindow.close()
	activeMarker.setMap(null)
	activeMap.setZoom(activeMap.getZoom())
}

function successDelImgur(rambledata, data, messageTarget){
	sendAjax(rambledata, messageTarget, successDelImage, 'deleteimage', 'POST', true)
}

function successDelImage(data, messageTarget){
	messageTarget.html('Image Deleted Succesfully')
	alert('Image Deleted Succesfully')
	$.mobile.changePage('notesPhotos.html')
}

function sendTrackData(speed, altitude){
	var data = JSON.stringify({
		'speed': speed,
		'altitude': altitude
	})
	sendAjax(data, null, null, 'trackdata', 'POST', true)
}

//Generic function for sending ajax requests, pass error message display target
//and function for what to do on success
function sendAjax(data, messageTarget, successFunc, apiLocation, reqType, useAuth){
	showAjaxLoad(true)
	if(messageTarget != null){
		messageTarget.html('&nbsp;')
	}
	var auth=''
	if(useAuth){
		user = window.localStorage.getItem("user")
		apikey = window.localStorage.getItem("apikey")
		auth = '&user=' + user + '&apikey=' + apikey		
	}

	$.ajax({
		url: apiUrl + apiLocation + '/?format=json' + auth,
		type: reqType,
		contentType: 'application/json',
		data: data,
		dataType: 'json',
		crossDomain: true,
		processData: false,
		success: function(data, status, jqXHR) {
			showAjaxLoad(false)
			if(successFunc != null){
				successFunc(data, messageTarget)
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			showAjaxLoad(false)
			if(messageTarget != null){
				messageTarget.html(jQuery.parseJSON(jqXHR.responseText).error_message)
			}
		}
	})


}


function sendImgur(rambledata, img, messageTarget){
	//if img is gonna be a URI and not base64, need to do something here to buffered send it, else
	//gonna run out of memory in lots of devices.

	showAjaxLoad(true)
	if(messageTarget != null){
		messageTarget.html('&nbsp;')
	}

	data = JSON.stringify({
		image: img,
		name: rambledata.title,
		title: rambledata.title
	})
	$.ajax({
		url: 'https://api.imgur.com/3/image' ,
		type: 'POST',
		contentType: 'application/json',
		data: data,
		dataType: 'json',
		crossDomain: true,
		processData: false,
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", "Client-ID 9cd62be48e7184a");
		},
		success: function(data, status, jqXHR) {
			showAjaxLoad(false)
			successImgur(rambledata, data, messageTarget)
		},
		error: function(jqXHR, textStatus, errorThrown) {
			showAjaxLoad(false)
			if(messageTarget != null){
				try{
					messageTarget.html(jQuery.parseJSON(jqXHR.responseText).data.error)
				}catch(e){
					messageTarget.html('Something went wrong')
				}
			}
		}
	})
}

function deleteImgur(rambledata, imageString, successFunc, messageTarget){
	showAjaxLoad(true)
	if(messageTarget != null){
		messageTarget.html('&nbsp;')
	}
	var imgData = imageString.split('|')
	var url = 'https://api.imgur.com/3/image/'+imgData[1]+'?_fake_status=200'

	$.ajax({
		url: url,
		type: 'DELETE',
		contentType: 'application/json',
		//data: data,
		dataType: 'json',
		crossDomain: true,
		processData: false,
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", "Client-ID 9cd62be48e7184a");
		},
		success: function(data, status, jqXHR) {
			showAjaxLoad(false)
			if(successFunc!= null){
				successFunc(rambledata, data, messageTarget)
			}
			
		},
		error: function(jqXHR, textStatus, errorThrown) {
			showAjaxLoad(false)
			if(messageTarget != null){
				try{
					messageTarget.html(jQuery.parseJSON(jqXHR.responseText).data.error)
				}catch(e){
					messageTarget.html('Something went wrong')
				}
			}
		}
	})
}

