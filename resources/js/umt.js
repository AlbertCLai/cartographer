// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create (Umt) Element Objects from a (JSON) Config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Umt = function (umtJSONConfig) {

	// Constants
	const _const = {
		className: 'KRS UMT',
		umt: 'umt',
		trackingCode: 'trackingCode'
	};
	
	// Variables to be set by _init 'constructor'
	var _umtConfig, 
		_shimConfig;

	// Constructor for this Umt instance
	var _init = function (umtConfig) {
		_umtConfig = umtConfig;
		_shimConfig = {
			className: _const.className,
			elementType: _const.umt
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
		return _shimConfig.className;
	};

	// Get Element Id of Umt
	this.getId = function () {
		return _umtConfig.feedId;
	};

	// Get Umt Name
	this.getName = function () {
		return _umtConfig.name;
	};

	// Get Named Sources
	this.getNamedSources = function () {
		var variants = this.getVariants();
		var namedSources = {};

		variants.forEach(function (variant) {
			namedSources[variant.name] = variant.feedId
		}, this);

		return namedSources;
	};

	// Get Umt 'Params'
	this.getParams = function () {
		return this.getVariants();
	};

	// Get Umt Seed
	this.getSeed = function () {
		return _umtConfig.seed;
	};

	// Get Source Feed Ids
	this.getSourceFeedIds = function () {
		var sourceFeedIds = [];

		// Get Source Feed Id for each variant
		_umtConfig.variants.forEach(function (variant) {
			sourceFeedIds.push(variant.feedId);
		});

		return sourceFeedIds;
	};

	// Get Umt Tracking Code
	this.getTrackingCode = function () {
		var trackingCode = _const.trackingCode in _umtConfig
			? _umtConfig.trackingCode
			: _implicitWrap(this.getName());
		return trackingCode;
	};

	// Get Variants
	this.getVariants = function () {
		var variantObjects = [];

		// Assembling variant information
		_umtConfig.variants.forEach(function (variant) {
			var percent = 0;
			_umtConfig.buckets.forEach(function (bucket) {
				if (bucket.name == variant.name) {
					percent = bucket.percent;
				}
			});

			variantObjects.push({
				feedId : variant.feedId,
				name   : variant.name,
				percent : percent
			});
		}, this);

		return variantObjects;
	};

	// Init Umt
	_init(umtJSONConfig);
};