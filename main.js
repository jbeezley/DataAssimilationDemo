/* global d3, ko*/
'use strict';

function makeModelPlot(model) {

    var newValueX = function () { model.update(); return model.values.x(); };
    var newValueY = function () { return model.values.y(); };
    var newValueZ = function () { return model.values.z(); };
    var n = 500;
    var dataX = d3.range(1).map(newValueX);
    var dataY = d3.range(1).map(newValueY);
    var dataZ = d3.range(1).map(newValueZ);
    var margin = { top: 20, right: 20, bottom: 20, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, n-1])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([-30, 30])
        .range([height, 0]);
    
    var yz = d3.scale.linear()
        .domain([0, 50])
        .range([height, 0]);

    var line = d3.svg.line()
        .x(function (d, i) { return x(i); })
        .y(function (d, i) { return y(d); });
    
    var lineZ = d3.svg.line()
        .x(function (d, i) { return x(i); })
        .y(function (d, i) { return yz(d); });

    var svg = d3.select('#model').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .call(d3.svg.axis().scale(x).orient('bottom').ticks([]));

    svg.append('g')
        .attr('class', 'y axis')
        .call(d3.svg.axis().scale(y).orient('left'));

    var pathX = svg.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum(dataX)
        .attr('class', 'lineX')
        .attr('d', line);
    
    var pathY = svg.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum(dataY)
        .attr('class', 'lineY')
        .attr('d', line);
    
    var pathZ = svg.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum(dataZ)
        .attr('class', 'lineZ')
        .attr('d', lineZ);

    tick();
    
    function tick() {
        var s = x(-1).toString();
        if (model.pause()) {
            model.setUnPause(tick);
            return;
        }
        dataX.push(newValueX());
        dataY.push(newValueY());
        dataZ.push(newValueZ());

        if (dataX.length < n) { s = '0'; }

        pathX.attr('d', line)
            .attr('transform', null)
          .transition()
            .ease('linear')
            .attr('transform', 'translate(' + s + ',0)');
        
        pathY.attr('d', line)
            .attr('transform', null)
          .transition()
            .ease('linear')
            .attr('transform', 'translate(' + s + ',0)');
        
        pathZ.attr('d', lineZ)
            .attr('transform', null)
          .transition()
            .duration(10 * Math.pow(2, 3-Number(model.speed())))
            .ease('linear')
            .attr('transform', 'translate(' + s + ',0)')
            .each('end', tick);
        
        if (dataX.length > n) {dataX.shift();}
        if (dataY.length > n) {dataY.shift();}
        if (dataZ.length > n) {dataZ.shift();}
    }

}

