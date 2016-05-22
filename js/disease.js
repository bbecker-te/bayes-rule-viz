
var disease = (function(module) {

    module.init = function() {

        // load the data
        var graph = {
            "nodes": [
                {"node": 3, "name": "Classified Healthy"},
                {"node": 4, "name": "Classified Healthy, but Diseased"},
                {"node": 0, "name": "Actually Diseased"},
                {"node": 1, "name": "Actually Healthy"},
                {"node": 2, "name": "Classified Diseased"}
            ],
            "links": [
                {"source": 1, "target": 3, "value": 6},
                {"source": 1, "target": 2, "value": 2},
                {"source": 0, "target": 4, "value": 0.4},
                {"source": 0, "target": 2, "value": 2}
            ]
        };

        var margin = {top: 10, right: 10, bottom: 10, left: 10};
        var width = 700 - margin.left - margin.right;
        var height = 400 - margin.top - margin.bottom;

        var color = d3.scale.category20();

        // append the svg canvas to the page
        var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        var defs = svg.append("defs");

        // Set the sankey diagram properties
        var sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(50)
            .size([width, height]);

        var path = sankey.link();

        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        // add in the links
        var link = svg.append("g").selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", path)
            // has bug for now
            .style("stroke", function(d) { return "url(#" + getLinkID(d) + ")"; })
            .style("stroke-width", function (d) {
                return Math.max(1, d.dy);
            })
            .sort(function (a, b) {
                return b.dy - a.dy;
            });

        // add link gradients
        var grads = defs.selectAll("linearGradient")
            .data(graph.links, getLinkID);

        grads.enter().append("linearGradient")
            .attr("id", getLinkID)
            .attr("gradientUnits", "userSpaceOnUse");


        grads.html("") // erase any existing <stop> elements on update
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", function (d) {
                return nodeColor((+d.source.x <= +d.target.x) ? d.source : d.target);
            });

        grads.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", function (d) {
                return nodeColor((+d.source.x > +d.target.x) ? d.source : d.target)
            });

        function getLinkID(d) {
            return "link-" + makeValid(d.source.name) + "-" + makeValid(d.target.name);
        }

        function nodeColor(d) {
            return d.color = color(makeValid(d.name));
        }

        function makeValid(s) {
            return s.replace(/ /g, "").replace(/,/g, "");
        }


        // add the link titles
        link.append("title")
            .text(function (d) {
                return d.source.name + " → " + d.target.name;
            });

        // add in the nodes
        var node = svg.append("g").selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .call(d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", function () {
                    this.parentNode.appendChild(this);
                })
                .on("drag", dragmove));

        // add the rectangles for the nodes
        node.append("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth())
            .style("fill", nodeColor)
            .style("stroke", function (d) {
                return d3.rgb(d.color).darker(1);
            })
            .append("title")
            .text(function (d) {
                return d.name + "\n" + d.value;
            });

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) {
                return d.name;
            })
            .filter(function (d) {
                return d.x < width / 2;
            })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        // the function for moving the nodes
        function dragmove(d) {
            d3.select(this).attr("transform",
                "translate(" + d.x + "," + (
                    d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
                ) + ")");
            sankey.relayout();
            link.attr("d", path);
        }
    };

    return module;
} (disease || {}));