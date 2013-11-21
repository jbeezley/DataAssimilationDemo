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
        height = 150 - margin.top - margin.bottom;

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

    var svgX = d3.select('#modelX').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    var svgY = d3.select('#modelY').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    var svgZ = d3.select('#modelZ').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svgX.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    svgX.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .call(d3.svg.axis().scale(x).orient('bottom').ticks([]));

    svgX.append('g')
        .attr('class', 'y axis')
        .call(d3.svg.axis().scale(y).orient('left').ticks([7]));
    
    svgY.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    svgY.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .call(d3.svg.axis().scale(x).orient('bottom').ticks([]));

    svgY.append('g')
        .attr('class', 'y axis')
        .call(d3.svg.axis().scale(y).orient('left').ticks([7]));
    
    svgZ.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    svgZ.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .call(d3.svg.axis().scale(x).orient('bottom').ticks([]));

    svgZ.append('g')
        .attr('class', 'y axis')
        .call(d3.svg.axis().scale(yz).orient('left').ticks([7]));

    var pathX = svgX.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum(dataX)
        .attr('class', 'lineX')
        .attr('d', line);
    
    var pathY = svgY.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum(dataY)
        .attr('class', 'lineY')
        .attr('d', line);
    
    var pathZ = svgZ.append('g')
        .attr('clip-path', 'url(#clip)')
      .append('path')
        .datum(dataZ)
        .attr('class', 'lineZ')
        .attr('d', lineZ);
    
    svgX.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", height/2)
        .attr('dx', '-1.75em')
        .text('x');
    
    svgY.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", height/2)
        .attr('dx', '-1.75em')
        .text('y');
    
    svgZ.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", height/2)
        .attr('dx', '-1.75em')
        .text('z');


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

