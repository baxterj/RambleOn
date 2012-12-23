var apiUrl = 'http://www.rambleonline.com/api/v1/'
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
	html += '<a href="#" onClick="showMapThumbnail('+route.id+')" data-icon="grid" data-iconpos="right" title="Map"></a>\n'
	html += '</a></li>\n'
	return html
}

function isUserClass(user){
	if (window.localStorage.getItem('user') == user){
		return ' selfUser'
	}else{
		return ''
	}
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
	var data = 'bounds='+ map.getBounds().toUrlValue()
	sendAjax(data, null, drawNotes, 'note', 'GET', true)
	sendAjax(data, null, drawImages, 'image', 'GET', true)
}

//Generic function for sending ajax requests, pass error message display target
//and function for what to do on success
function sendAjax(data, messageTarget, successFunc, apiLocation, reqType, useAuth){
	showAjaxLoad(true)
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
			messageTarget.html(jQuery.parseJSON(jqXHR.responseText).error_message)
		}
	})


}