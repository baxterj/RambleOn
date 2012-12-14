var apiUrl = 'http://www.rambleonline.com/api/v1/'
var routesListType = 'my' //my, favourite, done


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
	routesListType = listType
	sendAjax(null, messageTarget, successRoutesList, 'myroutes', 'GET', true)
}

function successRoutesList(data, messageTarget){
	var html = ''
	if(data.meta.total_count < 1){
		messageTarget.html('No routes found for user: ' + window.localStorage.getItem("user"))
	}else{
		for(var i = 0; i < data.objects.length; i++){
			html += createRouteListItem(data.objects[i])
		}
	}
	$('#myRoutesList').html(html)
	$('#myRoutesList').listview('refresh')
}

function createRouteListItem(route){
	var html = '<li data-filtertext="'+stringifyArray(route.keywords)+'">\n'
	html += '<a href="route.html?id='+route.id+'">\n'
	html += '<div class="routelist_title">' + route.name + '</div>\n'
	html += '<div class="routelist_owner">Owner: ' + route.owner.username + '</div>\n'
	html += '<div class="routelist_fav fav_'+route.fav+'"></div>\n'
	html += '<div class="routelist_done done_'+route.done+'"></div>\n'
	html += '<div class="mapThumb" id="mapThumb'+route.id+'"></div>\n'
	html += '<a href="#" onClick="showMapThumbnail('+route.id+')" data-icon="grid" data-iconpos="right" title="Map"></a>\n'
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



//Generic function for sending ajax requests, pass error message display target
//and function for what to do on success
function sendAjax(data, messageTarget, successFunc, apiLocation, reqType, useAuth){
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
			successFunc(data, messageTarget)
		},
		error: function(jqXHR, textStatus, errorThrown) {
			messageTarget.html(jQuery.parseJSON(jqXHR.responseText).error_message)
		}
	})


}