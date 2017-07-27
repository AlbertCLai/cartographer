// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create Element Nodes from Element Objects
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var ElementNode = function (elementObj) {

	// Constants
	const _const = {
		// Node Element Types
		feed: 'feed',
		placement: 'placement',
		section: 'section',
		source: 'source',
		umt: 'umt',
		// Node Class Types
		codeClass: 'class',
		label: 'label',
		path: 'path'
	};

	// Variables to be set by _init 'constructor'
	var _element, 
		_nodeData;

	// Constructor for this ElementNode instance
	var _init = function (element) {
		_element = element;
		_nodeData = {};
		_setNodeType();
	};

	// Determine Node Type based on element object
	var _setNodeType = function () {
		var elementType = _element.getElementType();

		if (elementType == _const.section) {
			_nodeData.type = _const.section;
		} else if (elementType == _const.placement) {
			_nodeData.type = _const.placement;
		} else if (elementType == _const.umt) {
			_nodeData.type = _const.umt;
		} else if (elementType == _const.feed) {
			_nodeData.type = _element.getSourceFeedIds() == null
				? _const.source
				: _const.feed;
		} else {
			_nodeData.type = null;
		}
	};

	// Get Element Object
	this.getElement = function () {
		return _element
	};

	// Get Element Type
	this.getElementType = function () {
		return _element.getElementType();
	};

	// Get Node Type
	this.getNodeType = function () {
		return _nodeData.type;
	};

	// Get Node Class
	this.getNodeClass = function (form) {
		var feedClassNamePath = this.getElement().getFeedClassName();
		switch (form) {
			case _const.codeClass:
				return feedClassNamePath.split('\\').pop().split(' ').join();
			case _const.label:
				// Gets last string from full path and splits classname where it sees CAPS
				var splitName = feedClassNamePath.split('\\').pop().match(/[A-Z][a-z]+/g);

				// Determine text for classname label
				return Array.isArray(splitName)
					? splitName.join(' ')
					: feedClassNamePath.split('\\').pop();
			case _const.path:
				return feedClassNamePath;
			default:
				return;
		}
	};

	// Get Node Height
	this.getHeight = function () {
		return _nodeData.height;
	};

	// Get Node Width
	this.getWidth = function () {
		return _nodeData.width;
	};

	// Get Node X-coordinate
	this.getX = function () {
		return _nodeData.x;
	};

	// Get Node Y-coordinate
	this.getY = function () {
		return _nodeData.y;
	};

	// Set Node Height
	this.setHeight = function (height) {
		_nodeData.height = height;
	};

	// Set Node Width
	this.setWidth = function (width) {
		_nodeData.width = width;
	};

	// Set Node X-coordinate
	this.setX = function (x) {
		_nodeData.x = x;
	};

	// Set Node Y-coordinate
	this.setY = function (y) {
		_nodeData.y = y;
	};

	// Position: Horizontal - Left
	this.xLeft = function () {
		return this.getX();
	};

	// Position: Horizontal - Center
	this.xCenter = function () {
		return this.getX() + (this.getWidth() / 2);
	};

	// Position: Horizontal - Right
	this.xRight = function () {
		return this.getX() + this.getWidth();
	};

	// Position: Vertical - Top
	this.yTop = function () {
		return this.getY();
	};

	// Position: Vertical - Middle
	this.yMiddle = function () {
		return this.getY() + (this.getHeight() / 2);
	};

	// Position: Vertical - Bottom
	this.yBottom = function () {
		return this.getY() + this.getHeight();
	};

	// Init Element Node
	_init(elementObj);
};