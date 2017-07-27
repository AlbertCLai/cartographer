// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create Flowchart Object from a (JSON) Space Config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Flowchart = function (spaceJSONConfig) {

	// Constants
	const _const = {
		// Space Config sections
		Feeds: 'Feeds',		
		Pages: 'Pages',
		Placements: 'Placements',
		Sections: 'Sections',
		Umts: 'Umts',
		Version: 'Version',
		// Node Class Types
		codeClass: 'class',
		label: 'label',
		// Other
		experimentSwitch: 'ExperimentSwitchFilter',
		umt: 'umt',
		edgeGlue: '-to-',
		elementTypes: ['Feeds', 'Pages', 'Placements', 'Sections', 'Umts'],
		// D3
		d3Edge: 'edge',
		d3Diagonal: 'diagonal',
		feedDimensions: { height: 50, width: 100 },
	};
		
	// Variables to be set by _init 'constructor'
	var _Space = { Feeds: {}, Pages: {}, Placements: {}, Sections: {}, Umts: {}, Version: {} };
	var _allNodes,
		_experimentNodes,
		_experimentsDictionary,
		_spaceConfig, 
		_Version;

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Initialization of the Flowchart, prepping and setting the data. 
	// Prepped data shouldn't change once set ...
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	// Constructor for this Flowchart instance
	var _init = function (spaceConfig) {
		// Save a copy of the original (JSON) Space Config
		_spaceConfig = spaceConfig;
        	
		// Breaks apart the raw spaceConfig into its element types and sets them
		_const.elementTypes.forEach(function (type) {
			_setElementsOfType(type);    	
		}, this);
        	
		// Sets version if one is provided
		_Space.Version = _const.Version in _spaceConfig
			? _spaceConfig.Version
			: null;
        		
		// Linking Sections and Placements together
		_linkSectionPlacement();
			
		// Placeholder for 'ElementNode' form of plottable elements types
		_allNodes = null;
			
		// Placeholder for 'Experiment' 'ElementNodes' (UMT, ExperimentSwitchFilter, etc ... )
		_experimentNodes = null;
		
		// Placeholder for Experiment Dictionary
		_experimentsDictionary = null;
    };

	// Sets Element Type (Feeds, Pages, Placements, Sections, Umts) Configs
	var _setElementsOfType = function (elementType) {
		if (elementType in _spaceConfig && _spaceConfig[elementType] !== null) {
			var elementConfigMap = {};

			_spaceConfig[elementType].forEach(function (elementConfig) {
				var element = _createNewElementOfType(elementType, elementConfig)
				if (element !== null) {
					elementConfigMap[element.getId()] = element;
				}
			}, this);

			_Space[elementType] = elementConfigMap;
			
			return;
		}

		_Space[elementType] = null;
	};

	// Creates a new Element Type Config
	var _createNewElementOfType = function (elementType, elementConfig) {
		switch (elementType) {
			case _const.Pages:
				return new Page(elementConfig);
			case _const.Placements:
				return new Placement(elementConfig);
			case _const.Umts:
				return new Umt(elementConfig);
			case _const.Sections:
				return new Section(elementConfig);
			case _const.Feeds:
				return new Feed(elementConfig);
			default:
				console.log('Element type [' + elementType + '] unknown! Cannot create new!');
				return null;
		}
	};

	// Link Sections and Placements together by setting Placements as 'sources' of Sections
	var _linkSectionPlacement = function () {
		var placementIds = Object.keys(_Space.Placements);
		placementIds.forEach(function (placementId) {
			var sectionId = _Space.Placements[placementId].getSectionId();

			_Space.Sections[sectionId].setSourceFeedIds(placementId);
		}, this);
	};

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Plot-specific: Gathering what is to be plotted
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	// Creates an object of ElementNodes of Type (Feeds, Placements, Sections, Umts)
	// from Set Element Types (_Feeds, _Placements, _Sections, _Umts)
	var _getAllElementNodesOfType = function (elementType) {
		if (_const.elementTypes.includes(elementType)) {
			var elementIds = _Space[elementType] == null
				? []
				: Object.keys(_Space[elementType]);

			var ElementNodes = {};
			elementIds.forEach(function (elementId) {
				// Create new ElementNode
				var elementNode = new ElementNode(_Space[elementType][elementId]);

				// Set ElementNode Size
				elementNode.setHeight(_const.feedDimensions.height);
				elementNode.setWidth(_const.feedDimensions.width);

				// Add to batch
				ElementNodes[elementId] = elementNode;
			}, this);

			return ElementNodes;
		}

		console.log('Element type [' + elementType + '] unknown! Cannot retrieve nodes!');
		return {};
	};

	// Creates an object of all potential graphable ElementNodes
	var _getAllNodes = function () {
		// Check if we've already assembled the nodes
		if (_allNodes == null) {
			var feedNodes = _getAllElementNodesOfType(_const.Feeds);
			var umtNodes = _getAllElementNodesOfType(_const.Umts);
			var placementsNodes = _getAllElementNodesOfType(_const.Placements);
			var sectionsNodes = _getAllElementNodesOfType(_const.Sections);

			// Create (flat) object with all nodes gathered
			_allNodes = Object.assign({}, feedNodes, umtNodes, placementsNodes, sectionsNodes);
		}

		return _allNodes;
	};

	// Creates Type-Groups (Feeds, Umts, Sections, Placements) of objects of ElementNodes
	// (i.e., similar to _getAllNodes(), but grouped by element types)
	var _getAllNodesGrouped = function () {
		return {
			Feeds: _getAllElementNodesOfType(_const.Feeds),
			Umts: _getAllElementNodesOfType(_const.Umts),
			Placements: _getAllElementNodesOfType(_const.Placements),
			Sections: _getAllElementNodesOfType(_const.Sections)
		};
	};

	// Create an object of all ElementNodes from a specific ElementId
	var _getAllElementNodesFromElementId = function (endpointElementId) {
		// Grab all potential ElementNodes
		var allNodes = _getAllNodes();

		// If no endpoint ElementId provided then use everything available
		if (!endpointElementId) {
			return allNodes;
		}

		// Figure out the Pathway ElementIds we need
		var initialList = { nodes: [], edges: [] };
		var pathwayElementIds = _walkPath(allNodes, endpointElementId, initialList, {});

		// Gather the ElementNode set to be used
		var elementNodes = {};
		pathwayElementIds.nodes.forEach(function (elementId) {
			elementNodes[elementId] = allNodes[elementId];
		}, this);

		return elementNodes;
	};

	// Creates an object of 'Experiment'-only ElementNodes (ExperimentSwitchFilter and Umts)
	var _getExperimentNodes = function () {
		// Check if we've already assembled the 'Experiment' nodes
		if (_experimentNodes == null) {
			var allNodes = _getAllNodes();
			var experimentNodes = {};

			// Gather the Experiment Nodes
			Object.keys(allNodes).forEach(function (elementId) {
				var elementNode = allNodes[elementId];
				if (elementNode.getNodeType() == _const.umt ||
					elementNode.getNodeClass(_const.codeClass) == _const.experimentSwitch) {
					experimentNodes[elementNode.getElement().getId()] = elementNode;
				}
			}, this);

			// Set Flowchart Experiment ElementNodes
			_experimentNodes = experimentNodes;
		}

		return _experimentNodes;
	};

	// Creates an Experiments Dictionary from 'Experiment' nodes
	var _getExperimentsDictionary = function () {
		// Check if we've already have an experiments dictionary created
		if (_experimentsDictionary == null) {
			var experimentNodes = _getExperimentNodes();

			// Set Flowchart Experiments Dictionary
			_experimentsDictionary = new ExperimentsDictionary(experimentNodes);
		}

		return _experimentsDictionary;
	};

	// Recursively walks all unique paths from a specific ElementId (to all Sources)
	// This method is essentially the 'core' of gathering what needs to be plotted 
	// or highlighted (nodes and edges). This method can also selectively walk a
	// specific experiment path based on the experiment variants selected.
	//
	// ( nodeMap ) - object { key (elementId) : value (elementNode) } :: a map of all nodes
	// 		in the Space to be considered.
	//
	// ( elementId ) - string (elementId) :: the id of the elementNode we are starting at.
	//
	// ( visited ) - object { nodes : [elementIds], edges : [ElementEdge] } :: object of
	//		visited nodes and edges. This is used to determine if we've been down this
	//		path before and what (nodes and edges) are included in our walk.
	//
	// ( selectedExperimentVariants ) - object { key (elementId) : value (source feed Ids) }
	// 		:: the normal array of sourceIds should be replaced with the keyed values.
	//
	var _walkPath = function (nodeMap, elementId, visited, selectedExperimentVariants) {
		// If elementId is on ( visited ) then we've been down this path before
		if (visited.nodes.includes(elementId)) {
			return { nodes: [], edges: [] };
		}

		// Get the elementNode's normal or experiment variant sources
		var sourceIds = Object.keys(selectedExperimentVariants).includes(elementId)
			// Get the sources based on the selected Experiment variant
			? selectedExperimentVariants[elementId]
			// Get the normal sources of our current ElementNode
			: nodeMap[elementId].getElement().getSourceFeedIds();

		// If no sources then we've reach the end of this path
		if (sourceIds == null) {
			return { nodes: [elementId], edges: [] };
		}

		// Setup nodeCrumbs and edgeCrumbs and walk to all sources
		var nodeCrumbs = [];
		var edgeCrumbs = [];

		sourceIds.forEach(function (sourceId) {
			var pathwayCrumbs = _walkPath(nodeMap, sourceId, { nodes: nodeCrumbs, edges: [] }, selectedExperimentVariants);

			// Compile Nodes
			nodeCrumbs = nodeCrumbs.concat(pathwayCrumbs.nodes);

			// Compile Edges (keep unique)
			pathwayCrumbs.edges.forEach(function (edgeCrumb) {
				if (!_hasEdge(edgeCrumb, edgeCrumbs)) {
					edgeCrumbs.push(edgeCrumb);
				}
			}, this);

			// Add current Edge
			var currentEdge = new ElementEdge(nodeMap[sourceId], nodeMap[elementId]);
			if (!_hasEdge(currentEdge, edgeCrumbs)) {
				edgeCrumbs.push(currentEdge);
			}
		}, this);

		// Return all ( visited ) nodeCrumbs (including current) and edgeCrumbs
		return { nodes: nodeCrumbs.concat([elementId]), edges: edgeCrumbs };
	};

	// Checks array of ElementEdges if an existing ElementEdge exists
	var _hasEdge = function (needle, edges) {
		var edgeFound = false;
		edges.forEach(function (edge) {
			if (!edgeFound && needle.isSame(edge)) {
				edgeFound = true;
			}
		}, this);

		return edgeFound;
	};

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Plot-specific: Compute layout based on what was gathered to be 
	// plotted (requires dagre for layout computation)
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	// Compute (via Dagre) Node Layout and set coordinates on ElementNodes
	var _computeLayoutAndSetCoordinates = function (elementNodes) {
		// Create new dagre graph
		var graph = new dagre.graphlib.Graph();

		// Set an object for the graph label
		graph.setGraph({});

		// Default to assigning a new object as a label for each new edge.
		graph.setDefaultEdgeLabel(function() { return {}; });

		// Set Nodes
		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];

				graph.setNode(elementId, {
					label: elementId,
					height: elementNode.getHeight(),
					width: elementNode.getWidth()
				});
			}
		}

		// Set Edges
		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];
				var sources = elementNode.getElement().getSourceFeedIds();

				// Setting edge(s) for source(s) to current
				if (sources !== null) {
					sources.forEach(function (source) {
						graph.setEdge(source, elementId);
					}, this);
				}
			}
		}

		// Compute Layout (on graph)
		dagre.layout(graph);

		// Set computed coordinates on ElementNodes
		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];

				// Transposing computed (x, y)
				elementNode.setX(graph.node(elementId).x);
				elementNode.setY(graph.node(elementId).y);
			}
		}

		return elementNodes;
	};

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Public Flowchart Methods: Preparing Data for D3 consumption
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	// Get all computed ElementNodes for the whole Space or from a Specific Endpoint
	this.getComputedElementNodesForD3 = function (endpointElementId) {
		// Gather Element Nodes to be included in target graph (all or specific)
		var elementNodes = _getAllElementNodesFromElementId(endpointElementId)

		// Compute Node Layout coordinates
		return _computeLayoutAndSetCoordinates(elementNodes);
	}

	// Create D3 Nodes array from computed ElementNodes
	this.getD3Nodes = function (elementNodes) {
		// Tranform ElementNodes Object into D3 Nodes Array
		var d3NodeArr = [];
		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];
				d3NodeArr.push(elementNode);
			}
		}

		return d3NodeArr;
	};

	// Create D3 Edges array from computed ElementNodes (default edges are straight)
	this.getD3Edges = function (elementNodes, type = _const.d3Edge) {
		// Create edges
		var d3EdgeArr = [];

		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];
				var sourceFeedIds = elementNode.getElement().getSourceFeedIds();

				// If ElementNode has no source then there is no Edge
				if (sourceFeedIds == null) {
					continue;
				}

				// Assemble Edge from each Source to this ElementNode
				sourceFeedIds.forEach(function (sourceFeedId) {
					// Source needs to exist to create Edge
					if (!sourceFeedId in elementNodes) {
						return;
					}

					// Create Source Node and ElementEdge
					var sourceNode = elementNodes[sourceFeedId];
					var elementEdge = new ElementEdge(sourceNode, elementNode);

					// Straight Edge or Diagonal Edge
					if (type == _const.d3Diagonal) {
						// Add 'Diagonal' (Edge)
						d3EdgeArr.push({
							source: {
								x: sourceNode.xCenter(),
								y: sourceNode.yBottom()
							},
							target: {
								x: elementNode.xCenter(),
								y: elementNode.yTop()
							},
							edgeId: elementEdge.getId(_const.edgeGlue)
						});
					} else {
						// Add Straight 'Diagonal' (Edge)
						d3EdgeArr.push({
							x1: sourceNode.xCenter(),
							y1: sourceNode.yBottom(),
							x2: elementNode.xCenter(),
							y2: elementNode.yTop(),
							edgeId: elementEdge.getId(_const.edgeGlue)
						});
					}
				}, this);
			}
		}

		return d3EdgeArr;
	};

	// Create D3 'Diagonal' (Edges) array from computed ElementNodes
	this.getD3Diagonals = function (elementNodes) {
		return this.getD3Edges(elementNodes, _const.d3Diagonal);
	};

	// Create D3 ElementId Labels array from computed ElementNodes
	this.getD3ElementIdLabels = function (elementNodes) {
		// Create Labels
		var elementIdLabelArr = [];

		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];

				// Add ElementId Label
				elementIdLabelArr.push({
					elementId : elementNode.getElement().getId(),
					x : elementNode.xCenter(),
					y : elementNode.yBottom()
				});
			}
		}

		return elementIdLabelArr;
	};

	// Create D3 Element Class Name Labels array from computed ElementNodes
	this.getD3ElementClassNameLabels = function (elementNodes) {
		// Create Labels
		var classNameLabels = [];

		for (var elementId in elementNodes) {
			if (elementNodes.hasOwnProperty(elementId)) {
				var elementNode = elementNodes[elementId];

				// Add Element Classname Label
				classNameLabels.push({
					className : elementNode.getNodeClass(_const.label),
					x : elementNode.xCenter(),
					y : elementNode.yMiddle()
				});
			}
		}

		return classNameLabels;
	};

	// Get all D3 related needed data for flowchart rendering
	this.getD3Data = function (endpointFeedId) {
		// Get computed ElementNodes to be transformed to Plottable D3 assets
		var elementNodes = this.getComputedElementNodesForD3(endpointFeedId);

		return {
			nodes : this.getD3Nodes(elementNodes),
			edges : this.getD3Edges(elementNodes),
			diagonals: this.getD3Diagonals(elementNodes),
			elementIdLabels : this.getD3ElementIdLabels(elementNodes),
			classNameLabels : this.getD3ElementClassNameLabels(elementNodes)
		};
	};
	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Public Flowchart Methods: Exposing data to the Cartographer
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	// Get all ElementIds (grouped by elementType) that can be targeted as Endpoints
	this.getAllEndpointElementIdCandidatesGrouped = function () {
		var allNodesGrouped = _getAllNodesGrouped();
		var elementIdCandidatesGrouped = {};

		Object.keys(allNodesGrouped).forEach(function (group) {
			elementIdCandidatesGrouped[group] = Object.keys(allNodesGrouped[group]);
		}, this);

		return elementIdCandidatesGrouped;
	};

	// Get all Experiments (Dictionary)
	this.getAllExperiments = function () {
		return _getExperimentsDictionary();
	};

	// Get 'glue' used for ElementEdge Ids
	this.getEdgeGlue = function () {
		return _const.edgeGlue;
	};

	// Get all Pathway (Node & Edge) ElementIds that end on a Target ElementId
	this.getPathwayElementIds = function (elementId, selectedExperimentVariants) {
		var pathwayElementIds = _walkPath(_getAllNodes(), elementId, { nodes: [], edges: [] }, selectedExperimentVariants);

		return pathwayElementIds;
	};

	// Init Flowchart
    _init(spaceJSONConfig);
};