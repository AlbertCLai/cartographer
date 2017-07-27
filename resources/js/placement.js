// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create (Placement) Element Objects from a (JSON) Config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Placement = function (placementJSONConfig) {

	// Constants
	const _const = {
		className: 'KRS Placement',
		idPrefix: 'placement--',
		placement: 'placement',
		sectionIdPrefix: 'section--'
	};
	
	// Variables to be set by _init 'constructor'
	var _placementConfig, 
		_shimConfig;

	// Constructor for this Placement instance
	var _init = function (placementConfig) {
		_placementConfig = placementConfig;
		_shimConfig = {
			className: _const.className,
			idPrefix: _const.idPrefix,
			elementType: _const.placement,
			params: null
		};
	};

	// Get Element Type
	this.getElementType = function () {
		return _shimConfig.elementType;
	};

	// Get 'Feed' Class Name
	this.getFeedClassName = function () {
		return _shimConfig.className;
	};

	// Get Element 'Id' of Placement
	this.getId = function () {
		return _shimConfig.idPrefix + _placementConfig.feedId;
	};

	// Get Placement Login Mask
	this.getLoginMask = function () {
		return _placementConfig.loginMask;
	};

	// Get Placement Mobile Mask
	this.getMobileMask = function () {
		return _placementConfig.mobileMask;
	};

	// Get Placement 'Params'
	this.getParams = function () {
		return _shimConfig.params;
	};

	// Get Placement Section Id
	this.getSectionId = function () {
		return _const.sectionIdPrefix + _placementConfig.sectionId;
	};

	// Get Pipeline Endpoint Feed Id
	this.getSourceFeedIds = function () {
		return [_placementConfig.feedId];
	};

	// Get Placement URI Pattern
	this.getUriPattern = function () {
		return _placementConfig.uriPattern;
	};

	// Init Placement
	_init(placementJSONConfig);
};