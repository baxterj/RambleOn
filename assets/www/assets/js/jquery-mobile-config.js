$( document ).bind( "mobileinit", function() {
	// Make your jQuery Mobile framework configuration changes here!
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true;
	$.mobile.selectmenu.prototype.options.nativeMenu = false;
	$.mobile.buttonMarkup.hoverDelay = 1;
	});