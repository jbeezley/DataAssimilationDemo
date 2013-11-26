
/* global d3, ko*/
'use strict';

function initKFModel() {
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

    function LorenzCov(cov) {
        var self = this;
        var n = 3;
        cov = cov || [[1,0,0],[0,1,0],[0,0,1]];
        this.x = {
            x: ko.observable(cov[0][0]),
            y: ko.observable(cov[0][1]),
            z: ko.observable(cov[0][2])
        };
        this.y = {
            x: this.x.y,
            y: ko.observable(cov[1][1]),
            z: ko.observable(cov[1][2])
        };
        this.z = {
            x: this.x.z,
            y: this.y.z,
            z: ko.observable(cov[2][2])
        };
        this.valString = ko.computed(function () {
            return '[' + [Math.sqrt(self.x.x()).toFixed(n),
                          Math.sqrt(self.y.y()).toFixed(n),
                          Math.sqrt(self.z.z()).toFixed(n)].join(', ') + ']';
        });
    }

    function LorenzModel(val, sigma, rho, beta) {
        sigma = sigma || 10.0;
        rho = rho || 28.0;
        beta = beta || 8.0/3.0;

        this.dtStep = ko.observable(0.01);
        
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
        this.updateStep = function (dt) {
            if (dt === 0.0) { return; }
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
        this.update = function (dt) {
            var dS = this.dtStep();
            dt = (dt === undefined) ? dS : dt;
            var n = Math.floor(dt/dS);
            var i;
            if (dt < 0) { throw new Error("Negative time step"); }
            for (i = 0; i < n ; i++) {
                this.updateStep(dS);
            }
            this.updateStep(dt - dS * n);
        };
    }

    function KFModel(mean, std, sigma, rho, beta, opts) {
        
        var that = this;
        function updateCovStep(dt) {
            if (dt === 0.0) { return; }
            var t2 = dt*dt;
            var x = that.mean.x(),
                y = that.mean.y(),
                z = that.mean.z();
            var rho = that.params.rho(),
                sigma = that.params.sigma(),
                beta = that.params.beta();
            var q11 = that.cov.x.x(),
                q12 = that.cov.x.y(),
                q13 = that.cov.x.z(),
                q21 = that.cov.y.x(),
                q22 = that.cov.y.y(),
                q23 = that.cov.y.z(),
                q31 = that.cov.z.x(),
                q32 = that.cov.z.y(),
                q33 = that.cov.z.z();
            var r11, r12, r13, r22, r23, r33;

            // generated from isympy M * Q * M.T
            r11=sigma*sigma*(q11 - q12 - q21 + q22);
            r12=sigma*(q12 - q22 + x*(q13 - q23) - (q11 - q21)*(rho - z));
            r13=sigma*(beta*(q13 - q23) - x*(q12 - q22) - y*(q11 - q21));
            r22=-q12*(rho - z) + q22 + q32*x + x*(-q13*(rho - z) + q23 + q33*x) - (rho - z)*(-q11*(rho - z) + q21 + q31*x);
            r23=beta*(-q13*(rho - z) + q23 + q33*x) - x*(-q12*(rho - z) + q22 + q32*x) - y*(-q11*(rho - z) + q21 + q31*x);
            r33=-beta*(-beta*q33 + q13*y + q23*x) + x*(-beta*q32 + q12*y + q22*x) + y*(-beta*q31 + q11*y + q21*x);
            
            that.cov.x.x(q11 + r11*t2);
            that.cov.x.y(q12 + r12*t2);
            that.cov.x.z(q13 + r13*t2);
            that.cov.y.y(q22 + r22*t2);
            that.cov.y.z(q23 + r23*t2);
            that.cov.z.z(q33 + r33*t2);
        }

        var cov = [[std[0]*std[0], 0, 0],
                   [0, std[1]*std[1], 0],
                   [0, 0, std[2]*std[2]]];
        var val = new LorenzValues(mean[0], std[0], mean[1], std[1], mean[2], std[2]);
        var mod = new LorenzModel(val, sigma, rho, beta);
        this.errStep = ko.observable(.001); //mod.dtStep;
        this.mean = val;
        this.cov = new LorenzCov(cov);
        this.params = mod.params;
        this.time = val.time;
        this.update = function (dt) {
            var dS = this.errStep();
            dt = (dt === undefined) ? dS : dt;
            var n = Math.floor(dS/dt);
            var i;
            for (i = 0; i < n; i++) {
                updateCovStep(dS);
                mod.update(dS);
            }
            updateCovStep(dt - dS*n);
            mod.update(dt - dS*n);
        };
    }
    
    var kfmod = new KFModel([-5,5,10],[1,1,1]);
    
    ko.applyBindings(kfmod);
    return kfmod;
}
