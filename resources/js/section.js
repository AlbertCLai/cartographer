// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create (Section) Element Objects from a (JSON) Config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Section = function (sectionJSONConfig) {

	// Constants
	const _const = {
		className: 'KRS Section',
		idPrefix: 'section--',
		section: 'section',
		silent: 'silent',
		trackingCode: 'trackingCode'
	};
	
	// Variables to be set by _init 'constructor'
	var _sectionConfig, 
		_shimConfig;

	// Constructor for this Section instance
	var _init = function (sectionConfig) {
		_sectionConfig = sectionConfig;
		_shimConfig = {
			className: _const.className,
			elementType: _const.section,
			idPrefix: _const.idPrefix,
			placementSources: [],
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

	// Get Element Id of Section
	this.getId = function () {
		return _shimConfig.idPrefix + _sectionConfig.sectionId;
	};

	// Get Section Name
	this.getName = function () {
		return _sectionConfig.name;
	};

	// Get Section 'Params'
	this.getParams = function () {
		return _shimConfig.params;
	};

	// Get Section Silent
	this.getSilent = function () {
		var silent = _const.silent in _sectionConfig
			? _sectionConfig.silent
			: false;
		return silent;
	};

	// Get 'Source' Feed Ids
	this.getSourceFeedIds = function () {
		return _shimConfig.placementSources;
	};

	// Get Section Tracking Code
	this.getTrackingCode = function () {
		var trackingCode = _const.trackingCode in _sectionConfig
			? _sectionConfig.trackingCode
			: _implicitWrap(this.getName());
		return trackingCode;
	};

	// Set 'Source' Feed Ids
	this.setSourceFeedIds = function (placementIds) {
		var addIds = Array.isArray(placementIds) ? placementIds : [placementIds];

		addIds.forEach(function (placementId) {
			_shimConfig.placementSources.push(placementId);
		}, this);
	};

	// Init Section
	_init(sectionJSONConfig);
};