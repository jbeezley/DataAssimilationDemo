
/* global d3, ko*/
'use strict';

function initKFModel() {
    function frk(x, y, z, sigma, rho, beta) {

        return [ sigma * (y - x),
                 x * (rho - z) - y,
                 x * y - beta * z ];
    }
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
            var x = that.mean.x(),
                y = that.mean.y(),
                z = that.mean.z();
            var rho = that.params.rho(),
                sigma = that.params.sigma(),
                beta = that.params.beta();
            var q11 = that.cov.x.x(),
                q12 = that.cov.x.y(),
                q13 = that.cov.x.z(),
                q22 = that.cov.y.y(),
                q23 = that.cov.y.z(),
                q33 = that.cov.z.z();
            var r11, r12, r13, r22, r23, r33;

            // generated from isympy M * Q * M.T
            r11 =  dt*sigma*(dt*q22*sigma - q12*(dt*sigma - 1)) - (dt*sigma - 1)*(dt*q12*sigma - q11*(dt*sigma - 1)) ;
            r12 =  -dt*x*(dt*q23*sigma - q13*(dt*sigma - 1)) + dt*(rho - z)*(dt*q12*sigma - q11*(dt*sigma - 1)) - (dt - 1)*(dt*q22*sigma - q12*(dt*sigma - 1)) ;
            r13 =  dt*x*(dt*q22*sigma - q12*(dt*sigma - 1)) + dt*y*(dt*q12*sigma - q11*(dt*sigma - 1)) - (beta*dt - 1)*(dt*q23*sigma - q13*(dt*sigma - 1)) ;
            r22 =  dt*x*(-dt*q13*(rho - z) + dt*q33*x + q23*(dt - 1)) - dt*(rho - z)*(-dt*q11*(rho - z) + dt*q13*x + q12*(dt - 1)) + (dt - 1)*(-dt*q12*(rho - z) + dt*q23*x + q22*(dt - 1)) ;
            r23 =  -dt*x*(-dt*q12*(rho - z) + dt*q23*x + q22*(dt - 1)) - dt*y*(-dt*q11*(rho - z) + dt*q13*x + q12*(dt - 1)) + (beta*dt - 1)*(-dt*q13*(rho - z) + dt*q33*x + q23*(dt - 1)) ;
            r33 =  dt*x*(dt*q12*y + dt*q22*x - q23*(beta*dt - 1)) + dt*y*(dt*q11*y + dt*q12*x - q13*(beta*dt - 1)) - (beta*dt - 1)*(dt*q13*y + dt*q23*x - q33*(beta*dt - 1)) ;
            
            that.cov.x.x(r11);
            that.cov.x.y(r12);
            that.cov.x.z(r13);
            that.cov.y.y(r22);
            that.cov.y.z(r23);
            that.cov.z.z(r33);
        }

        var cov = [[std[0]*std[0], 0, 0],
                   [0, std[1]*std[1], 0],
                   [0, 0, std[2]*std[2]]];
        var val = new LorenzValues(mean[0], std[0], mean[1], std[1], mean[2], std[2]);
        var mod = new LorenzModel(val, sigma, rho, beta);
        this.errStep = ko.observable(0.01); //mod.dtStep;
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
     
    var kfmod = new KFModel([-5,5,10],[0.1,0.1,0.1]);
    
    ko.applyBindings(kfmod);
    return kfmod;
}
