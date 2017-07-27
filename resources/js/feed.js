// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create (Feed) Element Objects from a (JSON) Config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Feed = function (feedJSONConfig) {

	// Constants
	const _const = {
		feed: 'feed',
		params: 'params',
		sourceFeedId: 'sourceFeedId',
		sourceFeedIds: 'sourceFeedIds',
		trackingCode: 'trackingCode'
	};
	
	// Variables to be set by _init 'constructor'
	var _feedConfig, 
		_shimConfig;

	// Constructor for this Feed instance
	var _init = function (feedConfig) {
		_feedConfig = feedConfig;
		_shimConfig = {
			elementType: _const.feed
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

	// Get Feed Class Name
	this.getFeedClassName = function () {
		return _feedConfig.feedClassName;
	};

	// Get Element Id of Feed
	this.getId = function () {
		return _feedConfig.feedId;
	};

	// Get Feed Name
	this.getName = function () {
		return _feedConfig.name;
	};

	// Get Named Sources
	this.getNamedSources = function () {
		return this.hasNamedSources() ? _feedConfig.sourceFeedIds : {};
	};

	// Get Feed Params
	this.getParams = function () {
		// Get any legit Params first
		var params = (_const.params in _feedConfig) ? _feedConfig.params : {};

		// Add Named Sources as Params
		var namedSources = this.getNamedSources();

		// Merge all 'params'
		var allParams = Object.assign({}, namedSources, params);

		// Return null if we got nothing, otherwise send what we got
		return (Object.keys(allParams).length === 0 && allParams.constructor === Object)
			? null
			: allParams;
	};

	// Get Source Feed Ids
	this.getSourceFeedIds = function () {
		// Single, Multiple, or none?
		if (_const.sourceFeedId in _feedConfig) {
			// To accommodate those that did not update the source param correctly
			return (Array.isArray(_feedConfig.sourceFeedId))
				? _feedConfig.sourceFeedId
				: [ _feedConfig.sourceFeedId ];
		} else if (_const.sourceFeedIds in _feedConfig) {
			// Check if is named Sources
			var sourceFeedIds = _feedConfig.sourceFeedIds;

			if (Array.isArray(sourceFeedIds)) {
				return sourceFeedIds;
			} else {
				var namedSources = Object.keys(sourceFeedIds);
				var sources = [];

				namedSources.forEach(function (namedSource) {
					sources.push(sourceFeedIds[namedSource]);
				}, this);

				return sources;
			}
		} else {
			return null;
		}
	};

	// Get Feed Tracking Code
	this.getTrackingCode = function () {
		var trackingCode = _const.trackingCode in _feedConfig
			? _feedConfig.trackingCode
			: _implicitWrap(this.getName());
		return trackingCode;
	};

	// Feed has Named Sources
	this.hasNamedSources = function () {
		return (_const.sourceFeedIds in _feedConfig)
			&& !Array.isArray(_feedConfig.sourceFeedIds);
	};

	// Init Feed
	_init(feedJSONConfig);
};