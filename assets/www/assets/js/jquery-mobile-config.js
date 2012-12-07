$(document).on("mobileinit", function() {
	// Make your jQuery Mobile framework configuration changes here!
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true;
	$.mobile.buttonMarkup.hoverDelay = 100;
	//$.mobile.ajaxEnabled = false;
	//$.mobile.pushStateEnabled = false;
	$.mobile.selectmenu.prototype.options.nativeMenu = false;
});