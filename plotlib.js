/* global d3 */

//var d3 = require('d3');

function LinePlot(opts) {
    'use strict';

    var miny = opts.miny || -10,
        maxy = opts.maxy || 10,
        rng = maxy - miny;
    var n = opts.n || 500;
    var data = [];
    var margin = opts.margin || { top: 20, right: 20, bottom: 20, left: 20 };
    var width = opts.width || 800,
        height = opts.height || 150;
    var domselect = opts.domSelect || '.plot';
    width -= margin.left + margin.right;
    height -= margin.bottom + margin.top;
    var xs = d3.scale.linear()
        .domain([0,n-1])
        .range([0,width]);
    var ys = d3.scale.linear()
        .domain([miny, maxy])
        .range([height, 0]);

    var line = d3.svg.line()
        .x(function (d, i) { return xs(i); })
        .y(function (d)    { return ys(d[0]); });
    
    var svg = d3.select(domselect)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    var rect = svg.append('rect')
        .attr('x', -1)
        .attr('y', -1)
        .attr('width', width + 2)
        .attr('height', height + 2)
        .attr('class', 'border');

    var area = d3.svg.area()
        .x(function (d,i) { return xs(i); })
        .y0(function (d) { return ys(d[0] - d[1]); })
        .y1(function (d) { return ys(d[0] + d[1]); });

    if (opts.ylabel) {
        svg.append('text')
            .attr('class', 'y label')
            .attr('text-anchor', 'end')
            .attr('x', 0)
            .attr('y', height/2)
            .attr('dx', '-1.75em')
            .text(opts.ylabel);
    }
    
    this.addPath = function (x, y, cls, s) {
        s = s || function () { return 0; };
        var A = [];
        cls = cls || 'line';
        var pathg = svg.append('g');
        var path = pathg
            .append('path')
              .datum(A)
              .attr('class', cls)
              .attr('d', line);

        var symbol = svg.append('g')
            .attr('class', cls)
            .style('display', 'none');
        var x0;
        symbol.append('circle')
            .attr('r', 4);
        var std = pathg
            .append('path')
              .datum(A)
              .attr('class', cls+"Area")
              .attr('opacity', 0.2)
              .attr('d', area);
        data.push( {x: x, y: y, s: s, data: A, path: path, std: std, symbol: symbol,
            tranSym: function (x) {
                var y0;
                x0 = x || x0;
                if (x0 === undefined) { return; }
                y0 = A[Math.round(xs.invert(x0))];
                symbol.style('display', null)
                      .attr('transform', 'translate(' + x0 + ',' + ys(y0) + ')');
            } } );
    };
    
    var s0 = xs(-1).toString();
    this.update = function () {
        var s = '0', i, d;
        
        if (data.length === 0) { return; }
        
        for (i = 0; i < data.length; i++) {
            d = data[i];
            d.data.push([d.y(), Math.min(Math.sqrt(d.s()), rng)]);
            if (d.data.length > n) {
                s = s0;
                d.data.shift();
            }
            d.path.attr('d', line)
                .attr('transform', null)
              .transition()
                .ease('linear')
                .attr('transform', 'translate(' + s + ',0)');
            d.std.attr('d', area)
                .attr('transform', null)
              .transition()
                .ease('linear')
                .attr('transform', 'translate(' + s + ',0)');
            d.tranSym();
        }
    };
    /*
    var vline = svg.append('g')
        .append('path');
    var moCallbacks = [];
    this.addMOCallback = function (foo) {
        moCallbacks.push(foo);
    };
    this.triggerMO = function (x, y) {
        var i;
        vline.datum([x,x])
          .attr('class', 'linev')
          .attr('d', d3.svg.line()
                  .x(function (d) { return d; })
                  .y(function (d, i) { return i ? ys(miny) : ys(maxy); })
          );
        for (i = 0; i < data.length; i++) {
            data[i].tranSym(x);
        }
    };
    this.addMOCallback(this.triggerMO);
    rect.on('mousemove', function () {
        var c = d3.mouse(this);
        var i;
        for (i = 0; i < moCallbacks.length; i++) {
            moCallbacks[i](c[0], c[1]);
        }
    });
    */
}
