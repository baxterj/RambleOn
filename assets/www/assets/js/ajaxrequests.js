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
			//html += '<li><a href="index.html">route' + i + '</a></li>'
			html += createRouteListItem(data.objects[i])
		}
	}
	$('#myRoutesList').html(html)
	$('#myRoutesList').listview('refresh')
}

function createRouteListItem(route){
	var html = '<li><a href="route.html?id=' + route.id + '">' + route.name + '</a></li>'
	return html
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