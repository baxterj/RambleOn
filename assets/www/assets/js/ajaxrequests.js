var apiUrl = 'http://www.rambleonline.com/api/v1/'


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

function successLoginRegister(data){
	window.localStorage.setItem("apikey", data.key)
	window.localStorage.setItem("user", data.user)
	window.location = 'home.html'
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
			successFunc(data)
		},
		error: function(jqXHR, textStatus, errorThrown) {
			messageTarget.html(jQuery.parseJSON(jqXHR.responseText).error_message)
		}
	})


}