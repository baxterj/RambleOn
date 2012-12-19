function stripPX(inp){
	return inp.split('px', [0])
}


function validateField(field, fieldName, messageTarget, rule, required, min, max){
	var text = field.val()
	if(required){
		if (text==null || text==''){
			messageTarget.html(fieldName + ' is required')
			return false
		}
	}
	if(min){
		if(text.length < min){
			messageTarget.html(fieldName + ' must be min ' + min + ' characters')
			return false
		}
	}
	if(max){
		if(text.length > max){
			messageTarget.html(fieldName + ' must be max ' + max + ' characters')
			return false
		}
	}

	if(rule){
		if(!testInputRule(rule, text)){
			messageTarget.html(fieldName + ' contains invalid characters')
			return false
		}
	}

	return true
}

function testInputRule(rule, text){
	if(rule == 'alphanum'){
		var reg = /^([a-zA-Z0-9 _-]+)$/
		return reg.test(text)
	}else if(rule == 'email'){
		var reg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		return reg.test(text)
	}else if(rule == 'password'){
		var reg = /^[\w!@#%&/(){}[\]=?+*^~\-.:,;]{1,32}$/
		return reg.test(text)
	}
	return false
}

function fieldsEqual(first, second, setName, messageTarget){
	if(first.val() != second.val()){
		messageTarget.html(setName + ' must be the same')
		return false
	}
	return true
}

function stringifyArray(argArray){
	var out = ''
	for (var i = 0; i < argArray.length; i++){
		out += argArray[i] + ' '
	}
	return out
}

var initialScreenSize = window.innerHeight;
window.addEventListener("resize", function() {
	if(window.innerHeight < initialScreenSize){
		$.mobile.activePage.find("[data-role=footer]").hide();
	}else{
		$.mobile.activePage.find("[data-role=footer]").show();
	}
});


function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function yesTrue(bool){
	if(bool){
		return 'Yes'
	}else{
		return 'No'
	}
}

function pageHeader(newText){
	$.mobile.activePage.find('[data-role="header"] h1').html(newText)
}

function routeInfoHTML(data){ //takes a route object from api/v1/route/#/
	var out = ''
	out += '<b>Name: </b>' + data.name + '<br />\n'
	out += '<b>Owner: </b>' + data.owner.username + '<br />\n'
	out += '<b>Private: </b>' + yesTrue(data.private) + '<br />\n'
	out += '<b>Created: </b>' + data.creation_date + '<br />\n'
	out += '<b>Last Update: </b>' + data.update_date + '<br />\n'
	out += '<b>Keywords: </b>' + data.keywords + '<br />\n'
	return out
}