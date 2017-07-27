// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create Element Edge between Source and Target Element Nodes
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var ElementEdge = function (sourceElementNode, targetElementNode) {

	// Variables to be set by _init 'constructor'
	var _sourceElementNode, 
		_targetElementNode;

	// Constructor for this ElementEdge instance
	var _init = function (sourceNode, targetNode) {
		_sourceElementNode = sourceNode;
		_targetElementNode = targetNode;
	};

	// Get Edge Id
	this.getId = function (glue) {
		return this.getSourceId() + glue + this.getTargetId();
	};

	// Get Edge Source Id
	this.getSourceId = function () {
		return _sourceElementNode.getElement().getId();
	};

	// Get Edge Target Id
	this.getTargetId = function () {
		return _targetElementNode.getElement().getId();
	};

	// Checks if target Element Edge is the same the current Element Edge
	this.isSame = function (targetEdge) {
		return (targetEdge.getSourceId() == this.getSourceId()
			&& targetEdge.getTargetId() == this.getTargetId());
	};

	// Init Element Edge
	_init(sourceElementNode, targetElementNode);
};