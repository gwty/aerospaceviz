var colors = d3.scaleOrdinal(d3.schemeCategory10);
var dataset;
d3.csv("nodes.csv", function (nodes) {
    dataset = new Object();
    dataset.nodes = nodes;
    getEdges(dataset);
});

function findNodeWithId(id) {
    for (var index = 0; index < dataset.nodes.length; index++)
        if (dataset.nodes[index].id == id)
            return index;
}

function getEdges(dataset) {
    d3.csv("edges.csv", function (edges) {
        edges.forEach(function (element, index, edges) {
            edges[index].source = findNodeWithId(element.source);
            edges[index].target = findNodeWithId(element.target);
        });
        dataset.edges = edges;
        drawGraph(dataset);
    });
}

function gotoNode(id) {
    // move the current node to the center
    // push the nodes in the center to a random point
    for (index = 0; index < dataset.nodes.length; index++) {
        if (dataset.nodes[index].fx == width / 8 && dataset.nodes[index].fy == height / 8) {
            dataset.nodes[index].fx = 100 + Math.random() * width / 5;
            dataset.nodes[index].fy = 100 + Math.random() * height / 5;
        }

        if (dataset.nodes[index].id == id) {
            d = dataset.nodes[index];
            d.fx = width / 8;
            d.fy = height / 8;
        }
    }

    // populates the dashboard
    var dashboard = document.getElementById("dashboard");
    dashboard.innerHTML = "<h1>" + d.label + "</h1><hr>";
    dashboard.innerHTML += "<h2>Inputs:</h2><br>";

    for (index = 0; index < dataset.edges.length; index++) {
        if (dataset.edges[index].target.id == d.id) {
            var color = dataset.edges[index].Color;
            var node_index = findNodeWithId(dataset.edges[index].source.id);
            var id = dataset.nodes[node_index].id;
            var label = dataset.nodes[node_index].label;

            dashboard.innerHTML += "<button class='to' style='background-color : " + color + "'  onclick='gotoNode(" + id + ")'>" + label + "</button><br>";
        }
    }

    dashboard.innerHTML += "<h2>Outputs:</h2><br>";
    for (index = 0; index < dataset.edges.length; index++) {

        if (dataset.edges[index].source.id == d.id) {
            var color = dataset.edges[index].Color;
            var node_index = findNodeWithId(dataset.edges[index].target.id);
            var id = dataset.nodes[node_index].id;
            var label = dataset.nodes[node_index].label;

            dashboard.innerHTML += "<button class='to' style='background-color : " + color + "'  onclick='gotoNode(" + id + ")'>" + label + "</button><br>";
        }
    }
}


function drawGraph(dataset) {

    var svg = d3.select("#graph").append("svg");

    width = document.querySelector("#graph").clientWidth;
    height = document.querySelector("#graph").clientHeight;

    margin = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    }

    // sets the indegree and outdegree
    dataset.nodes.forEach(function (d) {
        d.inDegree = 0;
        d.outDegree = 0;
    });

    // calculates the indegree and outdegree
    dataset.edges.forEach(function (d) {
        dataset.nodes[d.source].outDegree += 1;
        dataset.nodes[d.target].inDegree += 1;
    });

    svg.attr("width", width).attr("height", height);

    // Defines the tooltip in the SVG
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 20)
        .attr('markerHeight', 20)
        .attr('xoverflow', 'hidden')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#333')
        .style('stroke', 'none');

    var tool_tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<span>" + d.label + "</span>";
        })

    // start sthe siimulation
    var simulation = d3.forceSimulation(dataset.nodes)
        .force("link", d3.forceLink(dataset.edges))
        .force("center", d3.forceCenter())
        .force("collide", d3.forceCollide(function (d) {
            return d.r + 8
        }).iterations(16))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 8, height / 8))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0));


    var link = svg.append("g")
        .attr("class", "edges")
        .selectAll("line")
        .data(dataset.edges)
        .enter()
        .append("line")
        .attr("stroke", function (d) {
            return d.Color;
        })
        .attr('marker-end', 'url(#arrowhead)');

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(dataset.nodes)
        .enter().append("circle")
        .attr("r", function (d) {
            return d.inDegree + 5;
        })
        .attr("fill", function (d) {
            return colors(d.id);
        })
        .attr("border", "2px 2px 2px #333;")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", clicked)
        .on('mouseover', tool_tip.show)
        .on('mouseout', tool_tip.hide);

    svg.call(tool_tip);


    // Initiates the directory
    var allnodes = document.getElementById("allnodes");
    allnodes.innerHTML = "<h1>" + "Directory" + "</h1><hr>";
    for (index = 0; index < dataset.nodes.length; index++) {
        allnodes.innerHTML += "<button class='to' " + "' onclick='gotoNode(" + dataset.nodes[index].id + ")'>" + dataset.nodes[index].label + "</button><br>";
    }

    // Initiates the guide
    var guide = document.getElementById("guide");
    var edgecolors = {};
    for (index = 0; index < dataset.edges.length; index++) {
        edgecolors[dataset.edges[index].Color] = dataset.edges[index].Label;
    }

    for (index in edgecolors) {
        guide.innerHTML += "<button class='guides' style='background-color:" + index + "'>" + edgecolors[index] + "</button>";
    }


    var ticked = function () {
        var mult_factor = 4;
        link
            .attr("x1", function (d) {;
                return d.source.x * mult_factor;
            })
            .attr("y1", function (d) {
                return d.source.y * mult_factor
            })
            .attr("x2", function (d) {
                return d.target.x * mult_factor;
            })
            .attr("y2", function (d) {
                return d.target.y * mult_factor;
            });

        node
            .attr("cx", function (d) {
                return d.x * mult_factor;
            })
            .attr("cy", function (d) {
                return d.y * mult_factor;
            });

    }

    simulation.nodes(dataset.nodes)
        .on("tick", ticked);
    // Adds zoom capabilities 

    var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    zoom_handler(svg);
    // Zoom functions 
    function zoom_actions() {
        node.attr("transform", d3.event.transform)
        link.attr("transform", d3.event.transform)
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function clicked(d) {
        gotoNode(d.id);
    }
}
