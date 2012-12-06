var apiUrl = 'http://www.rambleonline.com/api/v1/'


function sendLogin(data, messageTarget){
	var data = JSON.stringify({
		"user": data[0],
		"passw": data[1]
	});
	sendPost(data, messageTarget, successLoginRegister, 'login', false)

}

function sendRegister(data, messageTarget){
	var data = JSON.stringify({
		"user": data[0],
		"passw": data[1],
		"email": data[2]
	});
	sendPost(data, messageTarget, successLoginRegister, 'register', false)
}

function successLoginRegister(data){
	window.localStorage.setItem("apikey", data.key)
	window.localStorage.setItem("user", data.user)
	window.location = 'home.html'
}






/*
Generic function for sending post requests
*/
function sendPost(data, messageTarget, successFunc, apiLocation, useAuth){
	var auth=''
	if(useAuth){
		user = window.localStorage.getItem("user")
		apikey = window.localStorage.getItem("apikey")
		auth = '&user=' + user + '&apikey=' + apikey		
	}

	$.ajax({
		url: apiUrl + apiLocation + '/?format=json' + auth,
		type: 'POST',
		contentType: 'application/json',
		data: data,
		dataType: 'json',
		crossDomain: true,
		processData: false,
		success: function(data, status, jqXHR) {
			successFunc(data)
		},
		error: function(jqXHR, textStatus, errorThrown) {
			messageTarget.html(jQuery.parseJSON(jqXHR.responseText).error_message)
		}
	})


}