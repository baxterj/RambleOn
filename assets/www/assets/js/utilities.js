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
        $("[data-role=footer]").hide();
    }
    else{
        $("[data-role=footer]").show();
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