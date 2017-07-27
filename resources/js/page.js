// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create (Page) Element Objects from a (JSON) Config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Page = function (pageJSONConfig) {

	// Constants
	const _const = {
		className: 'KRS Page',
		idPrefix: 'page--',
		page: 'page',
		pageId: 'pageId',
		trackingCode: 'trackingCode'
	};
	
	// Variables to be set by _init 'constructor'
	var _pageConfig, 
		_shimConfig;

	// Constructor for this Page instance
	var _init = function (pageConfig) {
		_pageConfig = pageConfig;
		_shimConfig = {
			className: _const.className,
			idPrefix: _const.idPrefix,
			elementType: _const.page,
			params: null
		};
	};

	// Implicitly Wrap value with '()'
	var _implicitWrap = function (toWrap) {
		return '(' + toWrap + ')';
	};

	// Get Element Type
	this.getElementType = function () {
		return _shimConfig.elementType;
	};

	// Get 'Feed' Class Name
	this.getFeedClassName = function () {
		return _shimConfig.className;
	};

	// Get Element 'Id' of Page
	this.getId = function () {
		var pageId = _const.pageId in _pageConfig
			? _pageConfig.pageId
			: this.getName();
		return _shimConfig.idPrefix + pageId;
	};

	// Get Page Name
	this.getName = function () {
		return _pageConfig.name;
	};

	// Get Page 'Params'
	this.getParams = function () {
		return _shimConfig.params;
	};

	// Get Page Tracking Code
	this.getTrackingCode = function () {
		var trackingCode = _const.trackingCode in _pageConfig
			? _pageConfig.trackingCode
			: _implicitWrap(this.getName());
		return trackingCode;
	};

	// Get Page URI
	this.getUri = function () {
		return _pageConfig.uri;
	};

	// Init Page
	_init(pageJSONConfig);
};