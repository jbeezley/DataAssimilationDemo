/* global d3 */
'use strict';

function Gaussian(selection) {
    var n = 250;
    var margin = { top: 20, right: 20, bottom: 20, left: 40 },
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, n-1])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, 1])
        .range([height, 0]);

    var line = d3.svg.line()
        .x(function (d, i) { return x(i); })
        .y(function (d, i) { return y(d); });

    var svg = d3.select(selection).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    var path = svg.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum([])
        .attr('class', 'gaussian')
        .attr('d', line);

    function draw(mean, sigma) {
        var t = d3.scale.linear().domain([0,n-1]).range([-2,2]);
        function gausDensity(x) {
            var m = (t(x)-mean)/sigma;
            return Math.exp( -m*m );
        }
        var data = d3.range(n).map(gausDensity);
        d3.select('.gaussian').datum(data).attr('d', line);
        debugger
    }

    return draw;
}
