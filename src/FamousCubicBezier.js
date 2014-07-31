define(function(require, exports, module) {

    /**
     * @class Creates a parametric curve for smooth variable velocity.
     *
     * @constructor
     */
    function FamousCubicBezier(v) {
        //v =  [y1, y2, dy1, dy2];

        var M = [
            [ 1,  0,  0,  0],
            [ 0,  0,  1,  0],
            [-3,  3, -2, -1],
            [ 2, -2,  1,  1]
        ];

        v = v || [0,1,0,0];

        this.coef = [0,0,0,0];
        for (var i = 0; i < 4; i++)
            for (var j = 0; j < 4; j++)
                this.coef[i] += M[i][j]*v[j];

    };

    FamousCubicBezier.prototype.create = function() {
        var self = this;
        return function(t) {
            t = t || 0;
            var v = self.coef;
            return v[0] + v[1]*t + v[2]*t*t + v[3]*t*t*t;
        };
    };

    module.exports = FamousCubicBezier;
});