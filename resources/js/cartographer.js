// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create Cartographer that manages the flowchart and its visualization
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var Cartographer = function () {

    // Constants
    const _const = {
        // Endpoint Element Id Selection
        showMeEverything: 'albertShowMeEverything',
        // Mini Map
        minimapPadding: 20,
        minimapScale: 0.05
    };

    // Variables to be set by _init 'constructor'
    var _assetData = {
            flowchart: null,
            minimap: null
        },
        _markHighlighter,
        _zoom;

    // Constructor for this Cartographer instance
    var _init = function () {
        // Ready the html page calling the Cartographer
        _readyPage();

        // Placeholder for 'Mark' Highlighter
        _markHighlighter = null;
        // Placeholder for Zoom
        _zoom = null;
    };

    // Generates a bracket based selector for 'id' attribute
    var _generateAttrIdSelector = function (id) {
        // This allows periods and to start with numbers
        return '[id="' + id + '"]';
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Readying Page Resizers & Event Listeners
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var _readyPage = function () {
        // Load all Resizers Event Listeners
        document.body.addEventListener('load', _loadResizers());

        // Load Drag and Drop Event Listeners
        document.getElementById("configDropZone").addEventListener('drop', function (event) {
            _onDropHandler(event);
        });

        document.getElementById("configDropZone").addEventListener('dragover', function (event) {
            _onDragOverHandler(event);
        });

        // Load Config Event Listeners
        document.getElementById("btnLoadConfig").addEventListener('click', _onLoadConfigBtnClick);
        document.getElementById("trueYamlInput").addEventListener('change', function (event) {
            _loadYamlConfigAndUpdate(event);
        });

        // Load Plot Event Listeners
        document.getElementById("btnPlot").addEventListener('click', _plot);
        document.getElementById("btnCenterPlot").addEventListener('click', _centerPlot);
        document.getElementById("btnClearPlot").addEventListener('click', _clearPlot);
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Console Panel Resizing & Associated Sizers
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Attach drag resize handler to Console
    var _consoleResizer = function () {
        var container = d3.select('#console');
        var resizer = container.select('#consoleResizer');

        var dragResize = d3.behavior.drag()
            .on('drag', function() {
                // Determine resizer position relative to resizable (container)
                var x = d3.mouse(this.parentNode)[0];

                // Avoid negative or really small widths
                var safe_x = Math.max(400, x);

                // Adjust Console container
                container.style('width', safe_x + 'px');

                // Adjust SVG container
                _svgResize();

                // Render Minimap (Adjustments)
                if (_assetData.minimap !== null) {
                    _getMinimap().render();
                }
            });

        resizer.call(dragResize);
    };

    // Get current width of Console
    var _getConsoleWidth = function () {
        return d3.select('#console').node().clientWidth;
    };

    // Attach drag resize handler to Experiment Panel
    var _experimentPanelResizer = function () {
        var container = d3.select('#experimentPanel');
        var resizer = container.select('#experimentPanelResizer');

        var dragResize = d3.behavior.drag()
            .on('drag', function() {
                // Determine resizer position relative to resizable (container)
                var y = d3.mouse(this.parentNode)[1];

                // Determine Yaml Config Panel size
                var windowSize = window.innerHeight;
                var plotPanelSize = document.getElementById("plotPanel").offsetHeight;
                var yamlConfigPanelSize = windowSize - plotPanelSize - y;

                // Get 'Safe' sizes - Avoid negative or really small heights
                var safeYamlPanelSize = Math.max(150, yamlConfigPanelSize);
                var safe_y = safeYamlPanelSize == yamlConfigPanelSize
                    ? Math.max(100, y)
                    : windowSize - plotPanelSize - safeYamlPanelSize;

                // Adjust containers
                container.style('height', safe_y + 'px');
                d3.select('#yamlConfigPanel').style('height', safeYamlPanelSize + 'px');
            });

        resizer.call(dragResize);
    };

    // Initialize Resizables
    var _initResizables = function () {
        // Determine Yaml Config Panel size
        var yamlConfigPanelSize = window.innerHeight
            - document.getElementById("plotPanel").offsetHeight
            - document.getElementById("experimentPanel").offsetHeight;

        // Init container
        d3.select('#yamlConfigPanel').style('height', yamlConfigPanelSize + 'px');
    };

    // Resize SVG Container
    var _svgResize = function () {
        var consoleWidth = _getConsoleWidth();
        var svgWidth = window.innerWidth - consoleWidth;

        d3.select('#primaryCanvas').style('width', svgWidth + 'px').style('margin-left', consoleWidth + 'px');
    };

    // On window resize, re-Render Minimap if present
    var _onWindowResize = function () {
        window.addEventListener("resize", function () {
            // Adjust SVG container
            _svgResize();

            // Re-render Minimap
            if (_assetData.minimap !== null) {
                _getMinimap().render();
            }
        });
    };

    // Loads all resizers
    var _loadResizers = function () {
        _consoleResizer();
        _experimentPanelResizer();
        _onWindowResize();
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Load: Yaml Config File
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Update Cartographer based on recently loaded Config
    var _updateCartographer = function (event) {
        // Grab the (text) contents of file
        var fileContent = event.target.result;

        // Get the raw json data, in this case, from the locally loaded yaml file
        // and convert (yaml) content to json
        var json = jsyaml.load(fileContent);

        // Create our Flowchart object from the json data
        _assetData.flowchart = new Flowchart(json);

        // Clear out and previously loaded content
        _clearCartographer();

        // Load all Endpoint ElementId options
        _loadEndpointElementIdSelectOptions();

        // Load all Experiment ElementNodes variant options
        _loadExperimentNodesVariantOptions();

        // Load config file content (as-is) to highlightable scroll zone
        _loadHighlightableConfig(fileContent);

        // Resize with newly loaded content
        _initResizables();
    };

    // Trigger hidden config file load button
    var _onLoadConfigBtnClick = function () {
        document.getElementById('trueYamlInput').click();
    };

    // Prevent default select and drag behavior
    var _onDragOverHandler = function (event) {
        event.preventDefault();
    };

    // Load and Update Cartographer: On Yaml Config file drop
    var _onDropHandler = function (event) {
        // Let's not replace the page with what was dropped
        event.preventDefault();

        // If dropped items aren't files, reject them
        var dataTransfer = event.dataTransfer;
        if (!dataTransfer.items) {
            return;
        }

        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < dataTransfer.items.length; i++) {
            if (dataTransfer.items[i].kind == "file") {
                var file = dataTransfer.items[i].getAsFile();
                if (!file) {
                    return;
                }

                // Read the file
                var reader = new FileReader();
                reader.onload = _updateCartographer;
                reader.readAsText(file);

                // Update filename that is displayed
                d3.select('#filename').text(file.name);
            } else {
                return;
            }
        }
    };

    // Load and Update Cartographer: On Yaml Config file button input
    var _loadYamlConfigAndUpdate = function (event) {
        var file = event.target.files[0];
        if (!file) {
            return;
        }

        // Read the file
        var reader = new FileReader();
        reader.onload = _updateCartographer;
        reader.readAsText(file);

        // Update filename that is displayed
        d3.select('#filename').text(file.name);
    };

    // Clear all rendered DOM elements from the Cartographer
    var _clearCartographer = function () {
        _clearEndpointElementIdSelectOptions();
        _clearExperimentNodesVariantOptions();
        _clearHighlightableConfig();
        _clearMarkHighlighter();
        _clearPlot();
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Endpoint Selection
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Load Endpoint ElementId Candidate Options
    var _loadEndpointElementIdSelectOptions = function () {
        // Get all Endpoint Element Ids Grouped by elementType (Feeds, Umts, Sections, Placements)
        var elementIdCandidateGroups = _assetData.flowchart.getAllEndpointElementIdCandidatesGrouped();

        // Target Endpoint ElementId Container
        d3.select('#elementIdSelectZone').append('div').attr('id', 'elementIdSelect');
        var endpointSelectContainer = d3.select('#elementIdSelect');

        // Append (select) and initialize
        var select = endpointSelectContainer.append('select').attr('id', 'selectEndpoint');

        // Append default (option) to plot all possible endpoints
        select.append('option')
            .text('Show Me Everything (Default)')
            .attr('value', _const.showMeEverything);

        // Cycle through all grouped candidates and append available (options)
        Object.keys(elementIdCandidateGroups).forEach(function (group) {
            // If group is empty ... skip (optgroup)!
            if (elementIdCandidateGroups[group].length == 0) {
                return;
            }

            // Append (optgroup) and init
            var optGroup = select.append('optgroup').attr('label', group);

            // Append (options) within its (optgroup)

            var options = optGroup.selectAll('option')
                .data(elementIdCandidateGroups[group])
                .enter()
                .append('option')
                .text(function (d) {
                    switch (group) {
                        case 'Sections':
                            return d.startsWith('section--')
                                ? d.slice('section--'.length)
                                : d;
                        case 'Placements':
                            return d.startsWith('placement--')
                                ? d.slice('placement--'.length)
                                : d;
                        default:
                            return d;
                    }
                })
                .attr('value', function (d) { return d; });
        }, this);
    };

    // Remove Endpoint ElementId Candidate Options
    var _clearEndpointElementIdSelectOptions = function () {
        d3.select('#elementIdSelect').remove();
    };

    // Get the Endpoint ElementId selected or all
    var _getEndpointElementIdSelected = function () {
        // Target Endpoint ElementId Selector
        var selectEndpoint = document.getElementById('selectEndpoint');

        // Get Selected Endpoint
        var endpoint = selectEndpoint.options[selectEndpoint.selectedIndex].value;

        return endpoint == _const.showMeEverything ? '' : endpoint;
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Experiment Selection
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Load Experiment ElementNode variant selection options
    var _loadExperimentNodesVariantOptions = function () {
        // Get ExperimentsDictionary for this flowchart
        var experiments = _assetData.flowchart.getAllExperiments();

        // Get possible Experiment Scope Levels
        var scopeLevels = experiments.getScopeLevels();

        // Target Experiment Variant Selection Container
        d3.select('#experimentParametersAndVariants').append('div').attr('id', 'expOptions');
        var experimentVariantContainer = d3.select('#expOptions');

        // Cycle through all scope levels and display variants
        scopeLevels.forEach(function (scope) {
            // Get Experiments at target scope level
            var scopeLevelExperiments = experiments.getAllExperimentScopeLevel(scope);

            // Display scope level if there are experiments
            if (Object.keys(scopeLevelExperiments).length > 0) {
                // Append Scope Label
                experimentVariantContainer.append('div').attr('class', 'scopeLabel')
                    .text('Scope: ' + scope);

                // Cycle through all Parameters within scope level
                Object.keys(scopeLevelExperiments).forEach(function (parameter) {
                    // Append Parameter Label
                    experimentVariantContainer.append('div').attr('class', 'paramLabel')
                        .text('Parameter: ' + parameter);

                    // Get experiment data (elementIds and variant values) for this parameter
                    var experimentData = scopeLevelExperiments[parameter];

                    // Cycle through all ElementIds involved within parameter
                    experimentData.elementIds.forEach(function (elementId) {
                        // Append involved ElementId
                        experimentVariantContainer.append('div').attr('class', 'feedIdLabel')
                            .text('Feed Id: ' + elementId);
                    }, this);

                    // Cycle through all variant values within parameter
                    experimentData.values.forEach(function (namedSource) {
                        // Create (input) value for variant selection
                        var value = {
                            scope : scope,
                            parameter : parameter,
                            variant : namedSource
                        };

                        // Append (input:checkbox)
                        var inputGrp = experimentVariantContainer.append('div');
                        inputGrp.append('input')
                            .attr({
                                'type':'checkbox',
                                'value': JSON.stringify(value),
                                'id': 'opt-'+namedSource,
                                'class' : 'expOptionSelect'
                            });

                        // Append corresponding Variant Label
                        inputGrp.append('label').attr('class', 'inputLabel')
                            .text(namedSource);
                    }, this); // variants
                }, this); // parameters
            } // If-block
        }, this); // scopeLevels
    };

    // Remove Experiment ElementNode variant selection options
    var _clearExperimentNodesVariantOptions = function () {
        d3.select('#expOptions').remove();
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Mark Highlight Config
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Load Highlightable (Yaml) Config
    var _loadHighlightableConfig = function (configContent) {
        // Add config file content (as-is) to highlightable scroll zone
        d3.select('#yamlConfigPanel').append('div')
            .attr('id', 'scrollZone')
            .text(configContent);
    };

    // Removes Highlightable (Yaml) Config
    var _clearHighlightableConfig = function () {
        d3.select('#scrollZone').remove();
    };

    // Get 'Mark' Highlighter
    var _getMarkHighlighter = function () {
        // Check if we've already have an instance of 'Mark' Highlighter
        if (_markHighlighter == null) {
            var highlightableContext = document.getElementById("scrollZone");
            _markHighlighter = new Mark(highlightableContext);
        }

        return _markHighlighter;
    };

    // Clear 'Mark' Highlighter
    var _clearMarkHighlighter = function () {
        _markHighlighter = null;
    };

    // Get Regex pattern to use to target Highlight
    var _getRegexPatternForElementType = function (elementType, elementId) {
        // Construct Regex to target in config based on elementType
        switch (elementType) {
            case 'section':
                return '-[\\s]*sectionId:[\\s]*' + elementId.slice('section--'.length) + '[\\s]*$';
            case 'placement':
                return '^(?!-)[\\s]*feedId:[\\s]*' + elementId.slice('placement--'.length) + '[\\s]*$';
            case 'feed':
            case 'umt':
            default:
                return '-[\\s]*feedId:[\\s]*' + elementId + '[\\s]*$';
        }
    };

    // 'Mark' highlighted portion of config and scroll to highlight
    var _showMarkHighlighted = function (d, i) {
        // Get ElementId of our target
        var elementId = d.getElement().getId();
        var elementType = d.getElement().getElementType();

        // Construct Regex to target in config based on elementType
        var pattern = _getRegexPatternForElementType(elementType, elementId);
        var flags = 'gim';
        var regex = new RegExp(pattern, flags);

        // Get 'Mark' highlighter
        var markHighlight = _getMarkHighlighter();

        // Highlight and scroll to focus
        markHighlight.markRegExp(regex, {
            className: 'krsScrollHere',
            done: function () {
                // Compute target scroll location
                var highlightableConfigContainerTop = document.getElementById('scrollZone').offsetTop;
                var markHighlightLocation = document.getElementsByClassName('krsScrollHere')[0].offsetTop;
                var topMargin = 15;
                var targetScroll = markHighlightLocation - highlightableConfigContainerTop - topMargin;

                // Scroll to 'Mark' Highlight
                d3.select("#yamlConfigPanel")
                    .transition()
                    .duration(1000)
                    .tween("scrollToMarkHighlight", scrollTopTween(targetScroll));

                // Scroll tween curve
                function scrollTopTween(scrollTop) {
                    return function() {
                        var i = d3.interpolateNumber(this.scrollTop, scrollTop);
                        return function(t) { this.scrollTop = i(t); };
                    };
                }
            }
        });
    };

    // Clears the highlighting done by 'Mark' Highlight
    var _clearMarkHighlighted = function () {
        _getMarkHighlighter().unmark();
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Pathway Tracing
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Check Trace Option to trace on D3 Node click
    var _useOnClick = function () {
        return d3.select('input#useClick').property('checked');
    };

    // Check Trace Option to trace on D3 Node hover
    var _useOnHover = function () {
        return d3.select('input#useHover').property('checked');
    };

    // Shows pathway from target ElementId to its sources
    var _showPathway = function (d, i) {
        var selectedExperimentVariants = {};

        // Do we want to show all Pathways or just the selected variant Pathways
        if (d3.select('input#useExperiment').property('checked')) {
            // Grab experiment options
            var options = d3.selectAll('input.expOptionSelect');

            // For each selected variant, grab corresponding sources for each ElementId
            // involved for a given parameter to form a elementId to source hash
            options[0].forEach(function (option) {
                if (option.checked) {
                    // Get details of selected variant
                    var details = JSON.parse(option.value);

                    // Get sources for parameter variant for all involved ElementIds
                    var sources = _assetData.flowchart.getAllExperiments()
                        .getSourceFeedIdsForScopeParameterVariant(
                            details.scope,
                            details.parameter,
                            details.variant
                        );

                    // Merge all 'sources'
                    selectedExperimentVariants = Object.assign({}, selectedExperimentVariants, sources);
                }
            }, this);
        }

        // Which ElementNode are we targeting
        var elementId = d.getElement().getId();

        // Get Pathway ElementIds from ElementNode
        var pathway = _assetData.flowchart.getPathwayElementIds(elementId, selectedExperimentVariants);

        // Highlight Nodes
        pathway.nodes.forEach(function (nodeId) {
            d3.select(_generateAttrIdSelector(nodeId)).classed('outline', true);
        }, this);

        // Highlight Edges
        pathway.edges.forEach(function (edge) {
            var edgeId = edge.getId(_assetData.flowchart.getEdgeGlue());
            d3.select(_generateAttrIdSelector(edgeId)).classed('trace', true);
        }, this);
    };

    // Remove Pathway highlight
    var _clearPathHighlight = function () {
        d3.selectAll('.outline').classed('outline', false);
        d3.selectAll('.trace').classed('trace', false);
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Render: Minimap
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Get Minimap from memory, create if needed
    var _getMinimap = function() {
        if (_assetData.minimap == null) {

            function minimap(hostSVG, sourceGroup, zoom) {

                var scale = 1,
                    frameX = 0,
                    frameY = 0;

                var _getXYFromTranslate = function (translateString) {
                    var currentTransform = d3.transform(translateString);
                    var currentX = currentTransform.translate[0];
                    var currentY = currentTransform.translate[1];

                    return [currentX, currentY];
                };

                // Frame dimensions should be the same as real visible area (after scaling)
                var _getFrameHeight = function () {
                    return document.getElementById("primaryCanvas").clientHeight;
                };

                var _getFrameWidth = function () {
                    return document.getElementById("primaryCanvas").clientWidth;
                };

                // Create Minimap Group
                var minimapGroup = hostSVG.append("g")
                    .attr("class", "minimap")
                    .attr("id", "minimapGroup");

                minimap.node = minimapGroup.node();

                // Create View Group
                var frame = minimapGroup.append("g")
                    .attr('class', 'frame')
                    .attr('id', 'viewFrame');

                // Create viewfinder
                frame.append('rect')
                    .attr('class', 'background')
                    .attr('id', 'viewfinder')
                    .attr('width', _getFrameWidth())
                    .attr('height', _getFrameHeight())
                    .attr('filter', 'url(#minimapDropShadow)');

                // Create drag functionality for viewfinder
                var drag = d3.behavior.drag()
                    .on("dragstart.minimap", function () {
                        d3.select('#minichartGroup').style('opacity', '1.0');
                        var frameTranslate = _getXYFromTranslate(frame.attr("transform"));
                        frameX = frameTranslate[0];
                        frameY = frameTranslate[1];
                    })
                    .on("drag.minimap", function () {
                        d3.event.sourceEvent.stopImmediatePropagation();
                        frameX += d3.event.dx;
                        frameY += d3.event.dy;
                        frame.attr("transform", "translate(" + frameX + "," + frameY + ")");
                        var translate = [(-frameX * scale), (-frameY * scale)];
                        sourceGroup.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
                        zoom.translate(translate);
                    })
                    .on("dragend.minimap", function () {
                        d3.select('#minichartGroup').style('opacity', null);
                    });

                // Add drag functionality to viewfinder
                frame.call(drag);

                // Render Minimap
                minimap.render = function () {
                    scale = zoom.scale();

                    // Calculate Minimap Group positioning
                    var realFlowchartGroupWidth = d3.select("#flowchartGroup").node().getBBox().width * _const.minimapScale;
                    var realFlowchartGroupHeight = d3.select("#flowchartGroup").node().getBBox().height * _const.minimapScale;
                    var realMiniMapGroupX = _getFrameWidth() - realFlowchartGroupWidth - _const.minimapPadding;
                    var realMiniMapGroupY = _getFrameHeight() - realFlowchartGroupHeight - _const.minimapPadding;

                    // Transform Minimap Group position and scale
                    minimapGroup.attr("transform", "translate(" + realMiniMapGroupX + "," + realMiniMapGroupY + ")scale(" + _const.minimapScale + ")");

                    // Create Copy of flowchart group source and prepare minichart group
                    var node = sourceGroup.node().cloneNode(true);
                    node.setAttribute('class', 'canvas_mini');
                    node.setAttribute('id', 'minichartGroup');
                    node.childNodes.forEach(function (element) { element.removeAttribute('id'); });

                    // Remove any previous minichart group (before we try appending a new one)
                    hostSVG.selectAll("#minichartGroup").remove();

                    // Add minichart group to minimap group
                    minimap.node.appendChild(node);

                    var targetTransform = _getXYFromTranslate(sourceGroup.attr("transform"));

                    frame.attr("transform", "translate(" + (-targetTransform[0] / scale) + "," + (-targetTransform[1] / scale) + ")")
                        .select(".background")
                        .attr("width", _getFrameWidth() / scale)
                        .attr("height", _getFrameHeight() / scale);
                    frame.node().parentNode.appendChild(frame.node());

                    d3.select(node).attr("transform", "translate(1,1)");
                };

                // Defining Filter (Minimap Viewfinder)
                // ---------------------------------------------------
                var svgDefs = d3.select('defs#primaryCanvasDefs');
                var filter = svgDefs.append("svg:filter")
                    .attr("id", "minimapDropShadow")
                    .attr("x", "-20%")
                    .attr("y", "-20%")
                    .attr("width", "150%")
                    .attr("height", "150%");

                filter.append("svg:feOffset")
                    .attr("result", "offOut")
                    .attr("in", "SourceGraphic")
                    .attr("dx", "1")
                    .attr("dy", "1");

                filter.append("svg:feColorMatrix")
                    .attr("result", "matrixOut")
                    .attr("in", "offOut")
                    .attr("type", "matrix")
                    .attr("values", "0.1 0 0 0 0 0 0.1 0 0 0 0 0 0.1 0 0 0 0 0 0.5 0");

                filter.append("svg:feGaussianBlur")
                    .attr("result", "blurOut")
                    .attr("in", "matrixOut")
                    .attr("stdDeviation", "10");

                filter.append("svg:feBlend")
                    .attr("in", "SourceGraphic")
                    .attr("in2", "blurOut")
                    .attr("mode", "normal");
            }

            // Set Minimap
            _assetData.minimap = minimap;
        }

        return _assetData.minimap;
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Render: (Plot) Flowchart
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Get Zoom Method
    var _getZoom = function () {
        if (_zoom == null) {
            var zoomFlowchartGroupHandler = function () {
                d3.select('#flowchartGroup')
                    .attr('transform', "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");

                // (Re-)render Minimap to account for changes
                _getMinimap().render();
            };

            var zoomFlowchartGroup = d3.behavior.zoom()
                .scaleExtent([0.05, 5])
                .on('zoom.flowchartGroup', zoomFlowchartGroupHandler);

            _zoom = zoomFlowchartGroup;
        }

        return _zoom;
    };

    // Clear Zoom Method
    var _clearZoom = function () {
        _zoom = null;
    };

    // Removes (Plot) Flowchart and Associated Zoom
    var _clearPlot = function () {
        d3.select("svg#primaryCanvas").remove();
        _clearZoom();
    };

    // Plot Full Flowchart (and Minimap)
    var _plot = function () {
        // Clear out any existing plot first
        _clearPlot();

        // Get the Endpoint to start plotting from
        var endpointElementId = _getEndpointElementIdSelected();

        // Get all D3 related data from the flowchart
        var d3Data = _assetData.flowchart.getD3Data(endpointElementId);

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // D3 Rendering Portions
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // Create SVG Element, Defs, and flowchartGroup for flowchart to be rendered in
        // ---------------------------------------------------
        var svg = d3.select('#flowchartStudio')
            .append('svg')
            .classed("primary", true)
            .attr("id", "primaryCanvas")
            .attr("shape-rendering", "auto")
            // Call Handler that allows for zooming and panning
            .call(_getZoom());

        var defs = svg.append("defs")
            .attr("id", "primaryCanvasDefs");

        var flowchartGroup = svg.append("g")
            .attr("class", "canvas_main")
            .attr('id', 'flowchartGroup');

        // Render Elements
        // ---------------------------------------------------
        var d3Nodes = flowchartGroup.selectAll("elementNode")
            .data(d3Data.nodes)
            .enter()
            .append("rect");

        var d3NodesAttr = d3Nodes
            .attr("class", function (d) {
                var nodeStyle = 'nodeDefaultStyle';
                switch (d.getNodeType()) {
                    case 'placement':
                        nodeStyle = 'nodePlacementStyle';
                        break;
                    case 'section':
                        nodeStyle = 'nodeSectionStyle';
                        break;
                    case 'umt':
                        nodeStyle = 'nodeUmtStyle';
                        break;
                    case 'source':
                        nodeStyle = 'nodeSourceStyle';
                        break;
                    // Must be a Feed then ...
                    case 'feed':
                        var nodeClass = d.getNodeClass('class');
                        if (nodeClass == 'ExperimentSwitchFilter') {
                            nodeStyle = ' nodeUmtStyle';
                        } else {
                            // Add PHP class as CSS class
                            nodeStyle += ' ' + nodeClass;
                        }
                        break;
                }
                return 'elementNode ' + nodeStyle;
            })
            .attr("x", function(d) { return d.getX(); })
            .attr("y", function(d) { return d.getY(); })
            .attr("width", function(d) { return d.getWidth(); })
            .attr("height", function(d) { return d.getHeight(); })
            .attr("id", function(d) { return d.getElement().getId(); })
            .on('mouseover', function (d, i) {
                if (_useOnHover()) {
                    _showPathway(d, i);
                    _showMarkHighlighted(d, i);
                }
            })
            .on('mouseout', function () {
                if (_useOnHover()) {
                    _clearPathHighlight();
                    _clearMarkHighlighted();
                }
            })
            .on('click', function (d, i) {
                if (_useOnClick()) {
                    _clearPathHighlight();
                    _clearMarkHighlighted();

                    _showPathway(d, i);
                    _showMarkHighlighted(d, i);
                }
            });

        /*
         // Render Edge Lines
         // ---------------------------------------------------
         var lines = flowchartGroup.selectAll("line")
         .data(d3Data.edges)
         .enter()
         .append("line");

         var linesAttr = lines
         .classed("edgeLine", true)
         .attr("x1", function (d) { return d.x1; })
         .attr("y1", function (d) { return d.y1; })
         .attr("x2", function (d) { return d.x2; })
         .attr("y2", function (d) { return d.y2; })
         .attr("marker-end", "url(#arrowHead)");
         */

        // Render Edge Diagonals
        // ---------------------------------------------------
        var diagonals = flowchartGroup.selectAll("edgeDiagonal")
            .data(d3Data.diagonals)
            .enter()
            .append("path")
            .classed("edgeDiagonal", true)
            .attr("d", d3.svg.diagonal())
            .attr("marker-end", "url(#arrowHead)")
            .attr("id", function (d) { return d.edgeId; });

        // Render Element Class Name Labels
        // ---------------------------------------------------
        var classNameLabels = flowchartGroup.selectAll("classNameLabel")
            .data(d3Data.classNameLabels)
            .enter()
            .append("text");

        var classNameLabelsAttr = classNameLabels
            .classed("classNameLabel", true)
            .attr("x", function (d) { return (d.x); })
            .attr("y", function (d) { return (d.y); })
            .attr("dy", "3px")
            .text(function (d) { return d.className; });

        // Render Element Id Labels
        // ---------------------------------------------------
        var elementIdLabels = flowchartGroup.selectAll("elementIdLabel")
            .data(d3Data.elementIdLabels)
            .enter()
            .append("text");

        var elementIdLabelsAttr = elementIdLabels
            .classed("elementIdLabel", true)
            .attr("x", function (d) { return (d.x); })
            .attr("y", function (d) { return (d.y); })
            .attr("dx", "5px")
            .attr("dy", "10px")
            .attr("text-anchor", "left")
            .text(function (d) { return d.elementId; });

        // Defining Markers (Arrow Heads)
        // ---------------------------------------------------
        var marker = defs.append("marker")
            .attr({
                "id": "arrowHead",
                "viewBox": "0 -5 10 10",
                "refX": 10,
                "refY": 0,
                "markerWidth": 4,
                "markerHeight": 4,
                "orient": "auto"
            })
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");

        // Defining Gradients
        // ---------------------------------------------------
        function createFill(defs, gradientConfig) {
            var elementFill = defs.append('linearGradient')
                .attr('id', gradientConfig.gradientId)
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', 1);

            // Create the stops of the main gradient. Each stop will be assigned
            // a class to style the stop using CSS.

            // Top Stop color
            elementFill.append('stop')
                .attr('class', gradientConfig.topClass)
                .attr('offset', '0');

            /*
             // Middle Stop color
             elementFill.append('stop')
             .attr('class', 'stop-core')
             .attr('offset', '0.5');
             */

            // Bottom Stop color
            elementFill.append('stop')
                .attr('class', gradientConfig.bottomClass)
                .attr('offset', '1');

            return elementFill;
        }

        // Gradient - Default
        var gradientDefault = createFill(defs, {
            gradientId : 'gradientDefault',
            topClass : 'nodeDefault-StopTop',
            bottomClass : 'nodeDefault-StopBottom'
        });

        // Gradient - Source
        var gradientSource = createFill(defs, {
            gradientId : 'gradientSource',
            topClass : 'nodeSource-StopTop',
            bottomClass : 'nodeSource-StopBottom'
        });

        // Gradient - Umt
        var gradientUmt = createFill(defs, {
            gradientId : 'gradientUmt',
            topClass : 'nodeUmt-StopTop',
            bottomClass : 'nodeUmt-StopBottom'
        });

        // Gradient - Placement
        var gradientPlacement = createFill(defs, {
            gradientId : 'gradientPlacement',
            topClass : 'nodePlacement-StopTop',
            bottomClass : 'nodePlacement-StopBottom'
        });

        // Gradient - Section
        var gradientSection = createFill(defs, {
            gradientId : 'gradientSection',
            topClass : 'nodeSection-StopTop',
            bottomClass : 'nodeSection-StopBottom'
        });

        // Adjust SVG Container to account for Console
        // ---------------------------------------------------
        _svgResize();

        // Render Minimap - Initial full render
        // ---------------------------------------------------

        // Instantiate Minimap
        _getMinimap()(d3.select("#primaryCanvas"), d3.select("#flowchartGroup"), _getZoom());

        // Render Minimap
        _getMinimap().render();

        // Center the Plot in Viewable area
        _centerPlot();
    };

    // Centers (Resets) Zoom on Flowchart
    var _centerPlot = function () {
        // The original container that the zoom handler was associated with
        var svg = d3.select('svg#primaryCanvas');

        // The zoom method used
        var zoom = _getZoom();

        // Calculate constrained (Reset) Zoom of Viewfinder
        var scale = zoom.scale();
        if (scale < 0.25) {
            scale = 0.25;
        } else if (scale > 2) {
            scale = 2;
        }

        // Get virtual dimensions of (unchanging) Bounding Box of Group
        var virtualWidth = d3.select('#flowchartGroup').node().getBBox().width;
        var virtualHeight = d3.select('#flowchartGroup').node().getBBox().height;

        // Get real dimensions of (unchanging) viewable plot area
        var realWidth = document.getElementById("primaryCanvas").clientWidth;
        var realHeight = document.getElementById("primaryCanvas").clientHeight;

        // Get real dimension of (variable) left console width
        var consoleWidth = d3.select('#console').node().clientWidth;

        // Calculate (Reset) position the plot should move to (up and left)
        // (scale) converts 'virtual' to 'real'
        var xPos = -((virtualWidth * scale) - realWidth) / 2;
        var yPos = -((virtualHeight * scale) - realHeight) / 2;

        // Zoom to (reset) parameters
        svg.call(zoom.event);
        zoom.scale(scale);
        zoom.translate([xPos,yPos]);
        svg.transition().duration(1500).call(zoom.event);
    };

    // (Public Plot Methods) Flowchart
    this.plot = function () {
        _plot();
    };

    this.centerPlot = function () {
        _centerPlot();
    };

    this.clearPlot = function () {
        _clearPlot();
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Initialize Cartographer
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Init Cartographer
    _init();
};