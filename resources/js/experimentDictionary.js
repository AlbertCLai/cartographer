// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create Experiments Dictionary from (Experiment) Element Nodes
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var ExperimentsDictionary = function (experimentElementNodes) {

	// Constants
	const _const = {
		codeClass: 'class',
		darwinParameter: 'Darwin Parameter',
		experimentScope: 'Experiment Scope',
		experimentSwitch: 'ExperimentSwitchFilter',
		scopeLevelFeed: 'feed',
		scopeLevels: ['krs', 'space', 'feed'],
		umt: 'umt'
	};

	// Variables to be set by _init 'constructor'
	var _experimentNodes,
		_experimentsDictionary;

	// Constructor for this Experiments Dictionary
	var _init = function (experimentElementNodes) {
		_experimentNodes = experimentElementNodes;
		_experimentsDictionary = {};

		// Set up Experiments Dictionary
		_setExperimentsDictionary();
	};

	// Get the 'Darwin' Parameter Name of Experiment Node
	var _getParameterName = function (elementNode) {
		if (_isUmt(elementNode)) {
			return elementNode.getElement().getId();
		} else if (_isExperimentSwitch(elementNode)) {
			var params = elementNode.getElement().getParams();
			
			if (Object.keys(params).includes(_const.darwinParameter)) {
				return params[_const.darwinParameter];
			}

			// Must be scope-level 'feed' so Feed Id is the parameter
			return elementNode.getElement().getId();
		}

		// Should never happen, unless we have a new kind of Experiment Node
		return null;
	};

	// Get the 'Darwin' Parameter values (variants / named sources) of Experiment Node
	var _getParameterValues = function (elementNode) {
		var namedSources = elementNode.getElement().getNamedSources();

		return Object.keys(namedSources);
	};

	// Get the scope of Experiment Node
	var _getScope = function (elementNode) {
		if (_isUmt(elementNode)) {
			return _const.scopeLevelFeed;
		} else if (_isExperimentSwitch(elementNode)) {
			var params = elementNode.getElement().getParams();
			
			if (Object.keys(params).includes(_const.experimentScope)) {
				return params[_const.experimentScope];
			}

			// Must be scope-level 'feed'
			return _const.scopeLevelFeed;
		}

		// Should never happen, unless we have a new kind of Experiment Node
		return null;
	};

	// Check to see if Experiment is in Experiments Dictionary
	var _inExperimentsDictionary = function (elementNode) {
		var scope = _getScope(elementNode);
		var parameterName = _getParameterName(elementNode);

		// Do we already have a record of the scope and parameter name?
		return Object.keys(_experimentsDictionary).includes(scope)
			&& Object.keys(_experimentsDictionary[scope]).includes(parameterName);
	};

	// Check whether Element Node is a (Feed) ExperimentSwitchFilter
	var _isExperimentSwitch = function (elementNode) {
		return elementNode.getNodeClass(_const.codeClass) == _const.experimentSwitch;
	};

	// Check whether Element Node is an Umt
	var _isUmt = function (elementNode) {
		return elementNode.getElementType() == _const.umt;
	};

	// Set up Experiments Dictionary
	var _setExperimentsDictionary = function () {
		Object.keys(_experimentNodes).forEach(function (elementId) {
			var elementNode = _experimentNodes[elementId];
			var scope = _getScope(elementNode);
			var parameterName = _getParameterName(elementNode);

			// Check if we already have a record of this experiment							
			if (!_inExperimentsDictionary(elementNode)) {
				// Check if we already have this scope. If not, add entry.
				if (!Object.keys(_experimentsDictionary).includes(scope)) {
					_experimentsDictionary[scope] = {};
				}

				// Check if we already have this parameter name. If not, add entry
				if (!Object.keys(_experimentsDictionary[scope]).includes(parameterName)) {
					// Add experiment values (variants / named sources) and Feed Id of experiment node
					_experimentsDictionary[scope][parameterName] = {
						values : _getParameterValues(elementNode),
						elementIds: [elementNode.getElement().getId()]
					};
				}
			} else {
				// Record of experiment exists. Add experiment node if not previously added
				var elementId = elementNode.getElement().getId();
				
				if (!_experimentsDictionary[scope][parameterName].elementIds.includes(elementId)) {
					_experimentsDictionary[scope][parameterName].elementIds.push(elementId);
				}
			}
		}, this);
	};

	// Get scope-level Experiments (pick a scope, any scope)
	this.getAllExperimentScopeLevel = function (scope) {
		return Object.keys(_experimentsDictionary).includes(scope)
			? _experimentsDictionary[scope]
			: {};
	};

	// Get All scope levels (constants)
	this.getScopeLevels = function () {
		return _const.scopeLevels;
	};

	// Gets the Source Feed Ids for all experiment nodes of a given (scope, parameter, variant) combination
	this.getSourceFeedIdsForScopeParameterVariant = function (scope, parameter, variant) {
		// Get all Element Ids of given (scope, parameter) combination
		var elementIds = _experimentsDictionary[scope][parameter].elementIds;
		var sourceFeedIdMap = {};

		elementIds.forEach(function (elementId) {
			var namedSources = _experimentNodes[elementId].getElement().getNamedSources();
			var sourceFeedId = namedSources[variant];
			
			sourceFeedIdMap[elementId] = [sourceFeedId];
		}, this);

		return sourceFeedIdMap;
	};

	// Init Experiments Dictionary
	_init(experimentElementNodes);
};