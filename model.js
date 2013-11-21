
/* global d3, ko*/
'use strict';

function init() {
    function LorenzValues(x0, s0, x1, s1, x2, s2) {
        var self = this;
        var n = 3;
        x0 = x0 || 0.0;
        s0 = s0 || 5.0;
        x1 = x1 || x0;
        s1 = s1 || s0;
        x2 = x2 || x0;
        s2 = s2 || s0;
        var r0 = d3.random.normal(x0, s0);
        var r1 = d3.random.normal(x1, s1);
        var r2 = d3.random.normal(x2, s2);
        self.x = ko.observable(r0());
        self.y = ko.observable(r1());
        self.z = ko.observable(r2());
        self.q11 = ko.observable(s0*s0);
        self.q12 = ko.observable(0);
        self.q13 = ko.observable(0);
        self.q21 = ko.observable(0);
        self.q22 = ko.observable(s1*s1);
        self.q23 = ko.observable(0);
        self.q31 = ko.observable(0);
        self.q32 = ko.observable(0);
        self.q33 = ko.observable(s2*s2);
        self.time = ko.observable(0);
        self.valString = ko.computed(function () {
            return 'L(' + self.time().toFixed(n) + ') = [' + [self.x().toFixed(n),
            self.y().toFixed(n), self.z().toFixed(n)].join(', ') + ']';
        });
        self.reset = function () {
            self.x(r0());
            self.y(r1());
            self.z(r2());
        };
    }
    
    function LorenzModel(val, sigma, rho, beta) {
        sigma = sigma || 10.0;
        rho = rho || 28.0;
        beta = beta || 8.0/3.0;
        
        var intervalVal = null;
        var that = this;
        var unpause;
        
        this.speed = ko.observable(5);
        this.setUnPause = function (foo) {
            unpause = foo;
        };
        this.pause = ko.observable(false);
        this.setPause = function () {
            if (this.pause()) {
                this.pause(false);
                unpause();
            } else {
                this.pause(true);
            }
        };
        this.nSteps = ko.observable(1);
        this.params = {
            sigma: ko.observable(sigma),
            rho:   ko.observable(rho),
            beta:  ko.observable(beta),
        };
        this.values = val || new LorenzValues();

        function frk(x, y, z, sigma, rho, beta) {

            return [ sigma * (y - x),
                     x * (rho - z) - y,
                     x * y - beta * z ];
        }
        this.deltaT = ko.observable(0.025);
        this.updateStep = function () {
            var dt = this.deltaT();
            var x = this.values.x(),
                y = this.values.y(),
                z = this.values.z(),
                t = this.values.time(),
                sigma = this.params.sigma(),
                rho = this.params.rho(),
                beta = this.params.beta();
            var a, b, c, d;
            
            a = frk(x, y, z, sigma, rho, beta);
            b = frk(x + dt * a[0]/2, y + dt * a[1]/2, z + dt * a[2]/2, sigma, rho, beta);
            c = frk(x + dt * b[0]/2, y + dt * b[1]/2, z + dt * b[2]/2, sigma, rho, beta);
            d = frk(x + dt * c[0], y + dt * c[1], z + dt * c[2], sigma, rho, beta);

            this.values.x(x + dt * (a[0] + 2*b[0] + 2*c[0] + d[0])/6.0 );
            this.values.y(y + dt * (a[1] + 2*b[1] + 2*c[1] + d[1])/6.0 );
            this.values.z(z + dt * (a[2] + 2*b[2] + 2*c[2] + d[2])/6.0 );
            this.values.time(t + dt);
        };
        this.update = function () {
            var i;
            for (i = 0; i < this.nSteps(); i++) { that.updateStep(); }
        };
        this.run = function () {
            if (!intervalVal) {
                intervalVal = window.setInterval(that.updateStep.bind(that), that.deltaT());
            }
        };
        this.stop = function () {
            if (intervalVal) {
                window.clearInterval(intervalVal);
                intervalVal = null;
            }
        };
    }
    
    var mod = new LorenzModel(new LorenzValues(5, 10, -7, 10, 25, 5));
    
    //ko.applyBindings(mod.values);
    //ko.applyBindings(mod.params);
    ko.applyBindings(mod);
    
    makeModelPlot(mod);
}
