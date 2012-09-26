$(document).ready(function(){
	$('.ui-content').css('height', getContentHeight());
	
	try{
		$('#map_canvas').css('height', getContentHeight());
	}catch(e){
		//map not on this page, ignore
	}
	
});

function stripPX(inp){
	return inp.split('px', [0])
}


function getContentHeight(){
	return $(window).height()
	 - $('.ui-header').outerHeight(true)
	 - $('.ui-footer').outerHeight(true)
	 - ($('.ui-content').innerHeight() - $('.ui-content').height()); 
}

