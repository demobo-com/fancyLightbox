define(function(require, exports, module) {
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');
    var RenderNode = require('famous/core/RenderNode');
    var Utility = require('famous/utilities/Utility');
    var OptionsManager = require('famous/core/OptionsManager');
    var Transitionable = require('famous/transitions/Transitionable');
    var TransitionableTransform = require('famous/transitions/TransitionableTransform');
    var Lightbox = require('famous/views/Lightbox');
    var Easing = require('famous/transitions/Easing');
    var FamousCubicBezier = require('FamousCubicBezier');
    var CubicBezier = new FamousCubicBezier( [0.25,0.1,0.25,1] );
    var cssEase = 'easeInOut';

    function FancyLightbox(options) {
        Lightbox.apply(this, arguments);
        this.initPageTransitions();
    }

    FancyLightbox.prototype = Object.create(Lightbox.prototype);
    FancyLightbox.prototype.constructor = FancyLightbox;

    FancyLightbox.DEFAULT_OPTIONS = {};

    FancyLightbox.prototype.show = function show(renderable, transition, callback) {
        if (!renderable) {
            return this.hide(callback);
        }

        if (transition instanceof Function) {
            callback = transition;
            transition = undefined;
        }

        if (this._showing) {
            if (this.options.overlap) this.hide();
            else {
                this.hide(this.show.bind(this, renderable, callback));
                return;
            }
        }
        this._showing = true;

        var inTransform = this.options.inTransform[0] instanceof Array ? this.options.inTransform[0] : this.options.inTransform;
        var inOrigin = this.options.inOrigin[0] instanceof Array ? this.options.inOrigin[0] : this.options.inOrigin;
        var inOpacity = this.options.inOpacity instanceof Array ? this.options.inOpacity[0] : this.options.inOpacity;
        var stateItem = {
            transform: new TransitionableTransform(inTransform),
            origin: new Transitionable(inOrigin),
            opacity: new Transitionable(inOpacity)
        };

        var transform = new Modifier({
            transform: stateItem.transform,
            opacity: stateItem.opacity,
            origin: stateItem.origin
        });
        var node = new RenderNode();
        node.add(transform).add(renderable);
        this.nodes.push(node);
        this.states.push(stateItem);
        this.transforms.push(transform);

        if (!transition) transition = this.options.inTransition;
        if (!(transition instanceof Array)) transition = [transition];
        var showTransform = (this.options.inTransform[0] instanceof Array ? this.options.inTransform : transition.map(function(){
            return this.options.inTransform;
        }.bind(this))).slice(1);
        showTransform.push(this.options.showTransform);
        var showOrigin = (this.options.inOrigin[0] instanceof Array ? this.options.inOrigin : transition.map(function(){
            return this.options.inOrigin;
        }.bind(this))).slice(1);
        showOrigin.push(this.options.showOrigin);
        var showOpacity = (this.options.inOpacity instanceof Array ? this.options.inOpacity : transition.map(function(){
            return this.options.inOpacity;
        }.bind(this))).slice(1);
        showOpacity.push(this.options.showOpacity);

        var cbCount = showTransform.length + showOrigin.length + showOpacity.length;
        var _cb = callback ? Utility.after(cbCount, callback) : undefined;

//        console.log(showTransform, transition)

        showTransform.map(function(transform,index){
            stateItem.transform.set(transform, transition[index], _cb);
        }.bind(this));
        showOrigin.map(function(origin,index){
            stateItem.origin.set(origin, transition[index], _cb);
        }.bind(this));
        showOpacity.map(function(opacity,index){
            stateItem.opacity.set(opacity, transition[index], _cb);
        }.bind(this));

    };

    FancyLightbox.prototype.hide = function hide(transition, callback) {
        if (!this._showing) return;
        this._showing = false;

        if (transition instanceof Function) {
            callback = transition;
            transition = undefined;
        }

        var node = this.nodes[this.nodes.length - 1];
        var transform = this.transforms[this.transforms.length - 1];
        var stateItem = this.states[this.states.length - 1];

        if (!transition) transition = this.options.outTransition;
        if (!(transition instanceof Array)) transition = [transition];
        var outTransform = this.options.outTransform[0] instanceof Array ? this.options.outTransform : transition.map(function(){
            return this.options.outTransform;
        }.bind(this));
        var outOrigin = this.options.outOrigin[0] instanceof Array ? this.options.outOrigin : transition.map(function(){
            return this.options.outOrigin;
        }.bind(this));
        var outOpacity = this.options.outOpacity instanceof Array ? this.options.outOpacity : transition.map(function(){
            return this.options.outOpacity;
        }.bind(this));

        var cbCount = outTransform.length + outOrigin.length + outOpacity.length;
        var _cb = Utility.after(cbCount, function() {
            this.nodes.splice(this.nodes.indexOf(node), 1);
            this.states.splice(this.states.indexOf(stateItem), 1);
            this.transforms.splice(this.transforms.indexOf(transform), 1);
            if (callback) callback.call(this);
        }.bind(this));

        console.log(outTransform,transition )
        outTransform.map(function(transform,index){
            stateItem.transform.set(transform, transition[index], _cb);
        }.bind(this));
        outOrigin.map(function(origin,index){
            stateItem.origin.set(origin, transition[index], _cb);
        }.bind(this));
        outOpacity.map(function(opacity,index){
            stateItem.opacity.set(opacity, transition[index], _cb);
        }.bind(this));
    };

    FancyLightbox.prototype.setPageTransition = function setPageTransition(pageTransition) {
        if (this.pageTransitions[pageTransition])
            this.setOptions(this.pageTransitions[pageTransition]);
        else
            this.setOptions({});
    };

    FancyLightbox.prototype.initPageTransitions  = function initPageTransitions() {
        this.pageTransitions = [];
        var deg = Math.PI/180;

        this.pageTransitions[1] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(this.options.size[0],0,1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(-this.options.size[0],0,0),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[2] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(-this.options.size[0],0,1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(this.options.size[0],0,0),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[3] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,this.options.size[1],1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(0,-this.options.size[1],0),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[4] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,-this.options.size[1],1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(0,this.options.size[1],0),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[5] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(this.options.size[0],0,1),
            inOpacity: 1,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.identity,
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[6] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(-this.options.size[0],0,1),
            inOpacity: 1,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.identity,
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[7] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,this.options.size[1],1),
            inOpacity: 1,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.identity,
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[8] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,-this.options.size[1],1),
            inOpacity: 1,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.identity,
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[9] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(this.options.size[0],0,1),
            inOpacity: 0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(-this.options.size[0],0,0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[10] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(-this.options.size[0],0,1),
            inOpacity: 0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(this.options.size[0],0,0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[11] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,this.options.size[1],1),
            inOpacity:0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(0,-this.options.size[1],0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[12] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,-this.options.size[1],1),
            inOpacity: 0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(0,this.options.size[1],0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[13] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(this.options.size[0],0,0),
            inOpacity: 0,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 1,
            outTransform: Transform.translate(-this.options.size[0],0,1),
            outTransition: {duration: 700, curve: 'easeInOut'},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[14] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(-this.options.size[0],0,0),
            inOpacity: 1,
            inTransition: {duration: 600},

            outOrigin: [0.5,0.5],
            outOpacity: 1,
            outTransform: Transform.translate(this.options.size[0],0,1),
            outTransition: {duration: 700, curve: 'easeInOut'},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[15] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,this.options.size[1],0),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 1,
            outTransform: Transform.translate(0,-this.options.size[1],1),
            outTransition: {duration: 700, curve: 'easeInOut'},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[16] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,-this.options.size[1],0),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 1,
            outTransform: Transform.translate(0,this.options.size[1],1),
            outTransition: {duration: 700, curve: 'easeInOut'},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[17] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(this.options.size[0],0,1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(.8, .8),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[18] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(-this.options.size[0],0,1),
            inOpacity: 1,
            inTransition: {duration: 600},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(.8, .8),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[19] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,this.options.size[1],1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(.8, .8),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[20] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,-this.options.size[1],1),
            inOpacity: 1,
            inTransition: {duration: 600, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(.8, .8),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[21] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.identity,
                Transform.scale(1.2, 1.2)
            ],
            inOpacity: 0,
            inTransition: [
                {duration: 300, curve: cssEase},
                {duration: 500, curve: cssEase}
            ],
            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(.8, .8),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[22] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.scale(0.8, 0.8),
                Transform.scale(0.8, 0.8)
            ],
            inOpacity: [0,0],
            inTransition: [
                {duration: 300, curve: cssEase},
                {duration: 700, curve: cssEase}
            ],
            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(1.2, 1.2),
            outTransition: {duration: 500, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[23] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.scale(0.8, 0.8)
            ],
            inOpacity: [0],
            inTransition: [
                {duration: 700, curve: cssEase}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(-this.options.size[0],0,1),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[24] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.scale(0.8, 0.8)
            ],
            inOpacity: [0],
            inTransition: [
                {duration: 700, curve: cssEase}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(this.options.size[0],0,1),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[25] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.scale(0.8, 0.8)
            ],
            inOpacity: [0],
            inTransition: [
                {duration: 700, curve: cssEase}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(0,-this.options.size[1],1),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[26] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.scale(0.8, 0.8)
            ],
            inOpacity: [0],
            inTransition: [
                {duration: 700, curve: cssEase}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(0,this.options.size[1],1),
            outTransition: {duration: 600, curve: cssEase},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[27] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.scale(0.7, 0.7),
                Transform.scale(0.7, 0.7)
            ],
            inOpacity: [0,0],
            inTransition: [
                {duration: 400, curve: "easeOut"},
                {duration: 400, curve: "easeOut"}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.scale(0.7, 0.7),
            outTransition: {duration: 400, curve: "easeIn"},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[28] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.translate(this.options.size[0],0,1),
                Transform.translate(this.options.size[0],0,1)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 200, curve: cssEase},
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [0,0.5],
            outOpacity: [0.8,0],
            outTransform: [
                Transform.moveThen([0,0,1], Transform.rotateY(15*deg)),
                Transform.moveThen([0,0,-200], Transform.scale(0.8,0.8))
            ],
            outTransition: [
                {duration: 320, curve: "easeOut"},
                {duration: 480, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[29] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.translate(-this.options.size[0],0,1),
                Transform.translate(-this.options.size[0],0,1)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 200, curve: cssEase},
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [1,0.5],
            outOpacity: [0.8,0],
            outTransform: [
                Transform.moveThen([0,0,1], Transform.rotateY(-15*deg)),
                Transform.moveThen([0,0,-200], Transform.scale(0.8,0.8))
            ],
            outTransition: [
                {duration: 320, curve: "easeOut"},
                {duration: 480, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[30] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.translate(0,-this.options.size[1],1),
                Transform.translate(0,-this.options.size[1],1)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 200, curve: cssEase},
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [0.5,1],
            outOpacity: [0.8,0],
            outTransform: [
                Transform.moveThen([0,0,1], Transform.rotateX(15*deg)),
                Transform.moveThen([0,0,-200], Transform.scale(0.8,0.8))
            ],
            outTransition: [
                {duration: 320, curve: "easeOut"},
                {duration: 480, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[31] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.translate(0,this.options.size[1],1),
                Transform.translate(0,this.options.size[1],1)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 200, curve: cssEase},
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [0.5,0],
            outOpacity: [0.8,0],
            outTransform: [
                Transform.moveThen([0,0,1], Transform.rotateX(-15*deg)),
                Transform.moveThen([0,0,-200], Transform.scale(0.8,0.8))
            ],
            outTransition: [
                {duration: 320, curve: "easeOut"},
                {duration: 480, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[32] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateY(-90*deg), [0,0,-1000]),
                Transform.thenMove(Transform.rotateY(-90*deg), [0,0,-1000]),
            ],
            inOpacity: [0.2,0.2],
            inTransition: [
                {duration: 500, curve: cssEase},
                {duration: 500, curve: "easeOut"}
            ],
            outOrigin: [0.5,0.5],
            outOpacity: [0.2],
            outTransform: [
                Transform.thenMove(Transform.rotateY(90*deg), [0,0,-1000])
            ],
            outTransition: [
                {duration: 500, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[33] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateY(90*deg), [0,0,-1000]),
                Transform.thenMove(Transform.rotateY(90*deg), [0,0,-1000]),
            ],
            inOpacity: [0.2,0.2],
            inTransition: [
                {duration: 500, curve: cssEase},
                {duration: 500, curve: "easeOut"}
            ],
            outOrigin: [0.5,0.5],
            outOpacity: [0.2],
            outTransform: [
                Transform.thenMove(Transform.rotateY(-90*deg), [0,0,-1000])
            ],
            outTransition: [
                {duration: 500, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[34] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateX(90*deg), [0,0,-1000]),
                Transform.thenMove(Transform.rotateX(90*deg), [0,0,-1000]),
            ],
            inOpacity: [0.2,0.2],
            inTransition: [
                {duration: 500, curve: cssEase},
                {duration: 500, curve: "easeOut"}
            ],
            outOrigin: [0.5,0.5],
            outOpacity: [0.2],
            outTransform: [
                Transform.thenMove(Transform.rotateX(-90*deg), [0,0,-1000])
            ],
            outTransition: [
                {duration: 500, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[35] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateX(-90*deg), [0,0,-1000]),
                Transform.thenMove(Transform.rotateX(-90*deg), [0,0,-1000]),
            ],
            inOpacity: [0.2,0.2],
            inTransition: [
                {duration: 500, curve: cssEase},
                {duration: 500, curve: "easeOut"}
            ],
            outOrigin: [0.5,0.5],
            outOpacity: [0.2],
            outTransform: [
                Transform.thenMove(Transform.rotateX(90*deg), [0,0,-1000])
            ],
            outTransition: [
                {duration: 500, curve: "easeIn"}
            ],
            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[36] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.scale(.8, .8),
            inOpacity: 0,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0,0],
            outOpacity: 1,
            outTransform: [
                Transform.rotateZ(0),
                Transform.moveThen([0,0,1], Transform.rotateZ(10*deg)),
                Transform.moveThen([0,0,1], Transform.rotateZ(17*deg)),
                Transform.moveThen([0,0,1], Transform.rotateZ(16*deg)),
                Transform.thenMove(Transform.rotateZ(17*deg), [0,1000,0])
            ],
            outTransition: [
                {duration: 200, curve: cssEase},
                {duration: 200, curve: 'easeOut'},
                {duration: 200, curve: cssEase},
                {duration: 200, curve: cssEase},
                {duration: 200, curve: cssEase}
            ],

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[37] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateZ(-180*deg), [0,0,-3000]),
                Transform.thenMove(Transform.rotateZ(-180*deg), [0,0,-3000]),
//                Transform.thenMove(Transform.rotateZ(-180*deg), [0,0,-2000]),
//                Transform.thenMove(Transform.rotateZ(-120*deg), [0,0,-1000])
            ],
            inOpacity: 1,
            inTransition: [
                {duration: 500, curve: "easeIn"},
                {duration: 250, curve: "easeOut"},
//                {duration: 1700, curve: "easeOut"},
//                {duration: 1700, curve: "easeOut"}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: 1,
            outTransform: [
                Transform.thenMove(Transform.rotateZ(-180*deg), [0,0,-1000]),
//                Transform.thenMove(Transform.rotateZ(-178*deg), [0,0,-2000]),
//                Transform.thenMove(Transform.rotateZ(-360*deg), [0,0,-3000])
            ],
            outTransition: [
                {duration: 250, curve: "easeIn"},
                {duration: 250, curve: "easeIn"},
//                {duration: 1700, curve: "easeIn"}
            ],

            showOrigin: [0.5,0.5],
            showTransform: Transform.thenMove(Transform.rotateZ(0*deg), [0,0,1]),
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[38] = {
            inOrigin: [0,0.5],
            inTransform: [
                Transform.translate(this.options.size[0],0,0)
            ],
            inOpacity: 1,
            inTransition: [
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [0,0.5],
            outOpacity: [0],
            outTransform: [
                Transform.rotateY(90*deg)
            ],
            outTransition: [
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[39] = {
            inOrigin: [1,0.5],
            inTransform: [
                Transform.translate(-this.options.size[0],0,0)
            ],
            inOpacity: 1,
            inTransition: [
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [1,0.5],
            outOpacity: [0],
            outTransform: [
                Transform.rotateY(-90*deg)
            ],
            outTransition: [
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[40] = {
            inOrigin: [0.5,0],
            inTransform: [
                Transform.translate(0,this.options.size[1],0)
            ],
            inOpacity: 1,
            inTransition: [
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [0.5,0],
            outOpacity: [0],
            outTransform: [
                Transform.rotateX(-90*deg)
            ],
            outTransition: [
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[41] = {
            inOrigin: [0.5,1],
            inTransform: [
                Transform.translate(0,-this.options.size[1],0)
            ],
            inOpacity: 1,
            inTransition: [
                {duration: 600, curve: cssEase}
            ],
            outOrigin: [0.5,1],
            outOpacity: [0],
            outTransform: [
                Transform.rotateX(90*deg)
            ],
            outTransition: [
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[42] = {
            inOrigin: [1,0.5],
            inTransform: [
                Transform.rotateY(-90*deg),
                Transform.rotateY(-90*deg)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 180, curve: cssEase},
                {duration: 500, curve: cssEase}
            ],
            outOrigin: [0,0.5],
            outOpacity: [1,0],
            outTransform: [
                Transform.rotateY(0*deg),
                Transform.rotateY(90*deg)
            ],
            outTransition: [
                {duration: 0, curve: cssEase},
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[43] = {
            inOrigin: [0,0.5],
            inTransform: [
                Transform.rotateY(90*deg),
                Transform.rotateY(90*deg)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 180, curve: cssEase},
                {duration: 500, curve: cssEase}
            ],
            outOrigin: [1,0.5],
            outOpacity: [1,0],
            outTransform: [
                Transform.rotateY(0*deg),
                Transform.rotateY(-90*deg)
            ],
            outTransition: [
                {duration: 0, curve: cssEase},
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[44] = {
            inOrigin: [0.5,1],
            inTransform: [
                Transform.rotateX(90*deg),
                Transform.rotateX(90*deg)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 180, curve: cssEase},
                {duration: 500, curve: cssEase}
            ],
            outOrigin: [0.5,0],
            outOpacity: [1,0],
            outTransform: [
                Transform.rotateX(0*deg),
                Transform.rotateX(-90*deg)
            ],
            outTransition: [
                {duration: 0, curve: cssEase},
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[45] = {
            inOrigin: [0.5,0],
            inTransform: [
                Transform.rotateX(-90*deg),
                Transform.rotateX(-90*deg)
            ],
            inOpacity: [0,1],
            inTransition: [
                {duration: 180, curve: cssEase},
                {duration: 500, curve: cssEase}
            ],
            outOrigin: [0.5,1],
            outOpacity: [1,0],
            outTransform: [
                Transform.rotateX(0*deg),
                Transform.rotateX(90*deg)
            ],
            outTransition: [
                {duration: 0, curve: cssEase},
                {duration: 800, curve: cssEase}
            ],
            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[46] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(this.options.size[0],0,1),
            inOpacity: 0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [
//                [1,0.5],
                [1,0.5]
            ],
            outOpacity: [
//                1,
                0
            ],
            outTransform: [
//                Transform.identity,
                Transform.thenMove(Transform.rotateY(-90*deg), [-this.options.size[0],0,0])
            ],
            outTransition: [
//                {duration: 0},
                {duration: 700, curve: cssEase},
            ],
            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[47] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(-this.options.size[0],0,1),
            inOpacity: 0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [
//                [0,0.5],
                [0,0.5]
            ],
            outOpacity: [
//                1,
                0
            ],
            outTransform: [
//                Transform.identity,
                Transform.thenMove(Transform.rotateY(90*deg), [this.options.size[0],0,0])
            ],
            outTransition: [
//                {duration: 0},
                {duration: 700, curve: cssEase}
            ],

            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[48] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,this.options.size[1],1),
            inOpacity:0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [
//                [0.5,1],
                [0.5,1]
            ],
            outOpacity: [
//                1,
                0
            ],
            outTransform: [
//                Transform.identity,
                Transform.thenMove(Transform.rotateX(90*deg), [0,-this.options.size[1],0])
            ],
            outTransition: [
//                {duration: 0},
                {duration: 700, curve: cssEase}
            ],

            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[49] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.translate(0,-this.options.size[1],1),
            inOpacity: 0.3,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [
//                [0.5,0],
                [0.5,0]
            ],
            outOpacity: [
//                1,
                0
            ],
            outTransform: [
//                Transform.identity,
                Transform.thenMove(Transform.rotateX(-90*deg), [0,this.options.size[1],0])
            ],
            outTransition: [
//                {duration: 0},
                {duration: 700, curve: cssEase}
            ],

            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[50] = {
            inOrigin: [1,0.5],
            inTransform: Transform.thenMove(Transform.rotateY(-90*deg), [-this.options.size[0],0,0]),
            inOpacity: 0,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(this.options.size[0],0,0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[51] = {
            inOrigin: [0,0.5],
            inTransform: Transform.thenMove(Transform.rotateY(90*deg), [this.options.size[0],0,0]),
            inOpacity: 0,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(-this.options.size[0],0,0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[52] = {
            inOrigin: [0.5,1],
            inTransform: Transform.thenMove(Transform.rotateX(90*deg), [0,-this.options.size[1],0]),
            inOpacity: 0,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(0,this.options.size[1],0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[53] = {
            inOrigin: [0.5,0],
            inTransform: Transform.thenMove(Transform.rotateX(-90*deg), [0,this.options.size[1],0]),
            inOpacity:0,
            inTransition: {duration: 700, curve: cssEase},

            outOrigin: [0.5,0.5],
            outOpacity: 0.3,
            outTransform: Transform.translate(0,-this.options.size[1],0),
            outTransition: {duration: 700, curve: cssEase},

            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[54] = {
            inOrigin: [0,0.5],
            inTransform: Transform.thenMove(Transform.rotateY(-90*deg), [this.options.size[0],0,0]),
            inOpacity: 0.3,
            inTransition: {duration: 800, curve: cssEase},

            outOrigin: [1,0.5],
            outOpacity: [1,0.3],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateY(90*deg), [-this.options.size[0],0,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[55] = {
            inOrigin: [1,0.5],
            inTransform: Transform.thenMove(Transform.rotateY(90*deg), [-this.options.size[0],0,0]),
            inOpacity: 0.3,
            inTransition: {duration: 800, curve: cssEase},

            outOrigin: [0,0.5],
            outOpacity: [1,0.3],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateY(-90*deg), [this.options.size[0],0,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[56] = {
            inOrigin: [0.5,0],
            inTransform: Transform.thenMove(Transform.rotateX(90*deg), [0,this.options.size[1],0]),
            inOpacity: 0.3,
            inTransition: {duration: 800, curve: cssEase},

            outOrigin: [0.5,1],
            outOpacity: [1,0.3],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateX(-90*deg), [0,-this.options.size[1],0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[57] = {
            inOrigin: [0.5,1],
            inTransform: Transform.thenMove(Transform.rotateX(-90*deg), [0,-this.options.size[1],0]),
            inOpacity: 0.3,
            inTransition: {duration: 800, curve: cssEase},

            outOrigin: [0.5,0],
            outOpacity: [1,0.3],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateX(90*deg), [0,this.options.size[1],0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[58] = {
            inOrigin: [0,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateY(90*deg), [this.options.size[0],0,0]),
                Transform.thenMove(Transform.rotateY(90*deg), [this.options.size[0],0,0]),
                Transform.thenMove(Transform.rotateY(45*deg), [this.options.size[0]/2,0,-200])
            ],
            inOpacity: [
                0,
                0.3,
                1
            ],
            inTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            outOrigin: [1,0.5],
            outOpacity: [
                1,
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateY(-45*deg), [-this.options.size[0]/2,0,-200]),
                Transform.thenMove(Transform.rotateY(-90*deg), [-this.options.size[0],0,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[59] = {
            inOrigin: [1,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateY(-90*deg), [-this.options.size[0],0,0]),
                Transform.thenMove(Transform.rotateY(-90*deg), [-this.options.size[0],0,0]),
                Transform.thenMove(Transform.rotateY(-45*deg), [-this.options.size[0]/2,0,-200])
            ],
            inOpacity: [
                0,
                0.3,
                1
            ],
            inTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            outOrigin: [0,0.5],
            outOpacity: [
                1,
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateY(45*deg), [this.options.size[0]/2,0,-200]),
                Transform.thenMove(Transform.rotateY(90*deg), [this.options.size[0],0,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[60] = {
            inOrigin: [0.5,0],
            inTransform: [
                Transform.thenMove(Transform.rotateX(-90*deg), [0,this.options.size[1],0]),
                Transform.thenMove(Transform.rotateX(-90*deg), [0,this.options.size[1],0]),
                Transform.thenMove(Transform.rotateX(-45*deg), [0,this.options.size[1]/2,-200])
            ],
            inOpacity: [
                0,
                0.3,
                1
            ],
            inTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            outOrigin: [0.5,1],
            outOpacity: [
                1,
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateX(45*deg), [0,-this.options.size[1]/2,-200]),
                Transform.thenMove(Transform.rotateX(90*deg), [0,-this.options.size[1],0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[61] = {
            inOrigin: [0.5,1],
            inTransform: [
                Transform.thenMove(Transform.rotateX(90*deg), [0,-this.options.size[1],0]),
                Transform.thenMove(Transform.rotateX(90*deg), [0,-this.options.size[1],0]),
                Transform.thenMove(Transform.rotateX(45*deg), [0,-this.options.size[1]/2,-200])
            ],
            inOpacity: [
                0,
                0.3,
                1
            ],
            inTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            outOrigin: [0.5,0],
            outOpacity: [
                1,
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateX(-45*deg), [0,this.options.size[1]/2,-200]),
                Transform.thenMove(Transform.rotateX(-90*deg), [0,this.options.size[1],0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 300, curve: "easeOut"},
                {duration: 300, curve: "easeIn"}
            ],

            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[62] = {
            inOrigin: [0,0.5],
            inTransform: [
                Transform.thenMove(Transform.thenScale(Transform.rotateY(65*deg), [.4,.4,.4]), [this.options.size[0]*2,0,0]),
                Transform.thenMove(Transform.thenScale(Transform.rotateY(65*deg), [.4,.4,.4]), [this.options.size[0]*2,0,0])
            ],
            inOpacity: [
                0,
                0.3
            ],
            inTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            outOrigin: [1,0.5],
            outOpacity: [
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.thenScale(Transform.rotateY(-65*deg), [.4,.4,.4]), [-this.options.size[0]*1.5,0,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [0,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[63] = {
            inOrigin: [1,0.5],
            inTransform: [
                Transform.thenMove(Transform.thenScale(Transform.rotateY(-65*deg), [.4,.4,.4]), [-this.options.size[0]*2,0,0]),
                Transform.thenMove(Transform.thenScale(Transform.rotateY(-65*deg), [.4,.4,.4]), [-this.options.size[0]*2,0,0])
            ],
            inOpacity: [
                0,
                0.3
            ],
            inTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            outOrigin: [0,0.5],
            outOpacity: [
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.thenScale(Transform.rotateY(65*deg), [.4,.4,.4]), [this.options.size[0]*1.5,0,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [1,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[64] = {
            inOrigin: [0.5,0],
            inTransform: [
                Transform.thenMove(Transform.thenScale(Transform.rotateX(-65*deg), [.4,.4,.4]), [0,this.options.size[1]*2,0]),
                Transform.thenMove(Transform.thenScale(Transform.rotateX(-65*deg), [.4,.4,.4]), [0,this.options.size[1]*2,0])
            ],
            inOpacity: [
                0,
                0.3
            ],
            inTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            outOrigin: [0.5,1],
            outOpacity: [
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.thenScale(Transform.rotateX(65*deg), [.4,.4,.4]), [0,-this.options.size[1]*1.5,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [0.5,0],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[65] = {
            inOrigin: [0.5,1],
            inTransform: [
                Transform.thenMove(Transform.thenScale(Transform.rotateX(65*deg), [.4,.4,.4]), [0,-this.options.size[1]*2,0]),
                Transform.thenMove(Transform.thenScale(Transform.rotateX(65*deg), [.4,.4,.4]), [0,-this.options.size[1]*2,0])
            ],
            inOpacity: [
                0,
                0.3
            ],
            inTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            outOrigin: [0.5,0],
            outOpacity: [
                1,
                0.3
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.thenScale(Transform.rotateX(-65*deg), [.4,.4,.4]), [0,this.options.size[1]*1.5,0])
            ],
            outTransition: [
                {duration: 0},
                {duration: 800, curve: cssEase}
            ],

            showOrigin: [0.5,1],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[66] = {
            inOrigin: [1.5,.5],
            inTransform: [
                Transform.thenMove(Transform.rotateY(-90*deg), [0,0,-500]),
                Transform.thenMove(Transform.rotateY(-90*deg), [0,0,-500])
            ],
            inOpacity: [
                0,
                0
            ],
            inTransition: [
                {duration: 200},
                {duration: 500, curve: "easeOut"}
            ],

            outOrigin: [-0.5,0.5],
            outOpacity: [
                1,
                0
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateY(90*deg), [0,0,-500])
            ],
            outTransition: [
                {duration: 0},
                {duration: 500, curve: "easeIn"}
            ],

            showOrigin: [1.5,.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[67] = {
            inOrigin: [-0.5,0.5],
            inTransform: [
                Transform.thenMove(Transform.rotateY(90*deg), [0,0,-500]),
                Transform.thenMove(Transform.rotateY(90*deg), [0,0,-500])
            ],
            inOpacity: [
                0,
                0
            ],
            inTransition: [
                {duration: 200},
                {duration: 500, curve: "easeOut"}
            ],

            outOrigin: [1.5,.5],
            outOpacity: [
                1,
                0
            ],
            outTransform: [
                Transform.identity,
                Transform.thenMove(Transform.rotateY(-90*deg), [0,0,-500])
            ],
            outTransition: [
                {duration: 0},
                {duration: 500, curve: "easeIn"}
            ],

            showOrigin: [-0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[68] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.translate(this.options.size[0]*2,0,-500),
                Transform.translate(this.options.size[0]*2,0,-500),
                Transform.translate(0,0,-500),
                Transform.translate(0,0,-500)
            ],
            inOpacity: [
                0.5,
                0.5,
                0.5,
                1
            ],
            inTransition: [
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: [
                1,
                0.5,
                0.5,
                0.5
            ],
            outTransform: [
                Transform.translate(0,0,-500),
                Transform.translate(-this.options.size[0]*2,0,-500),
                Transform.translate(-this.options.size[0]*2,0,-500),
                Transform.translate(-this.options.size[0]*2,0,-500)
            ],
            outTransition: [
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase}
            ],

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };
        this.pageTransitions[69] = {
            inOrigin: [0.5,0.5],
            inTransform: [
                Transform.translate(-this.options.size[0]*2,0,-500),
                Transform.translate(-this.options.size[0]*2,0,-500),
                Transform.translate(0,0,-500),
                Transform.translate(0,0,-500)
            ],
            inOpacity: [
                0.5,
                0.5,
                0.5,
                1
            ],
            inTransition: [
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase}
            ],

            outOrigin: [0.5,0.5],
            outOpacity: [
                1,
                0.5,
                0.5,
                0.5
            ],
            outTransform: [
                Transform.translate(0,0,-500),
                Transform.translate(this.options.size[0]*2,0,-500),
                Transform.translate(this.options.size[0]*2,0,-500),
                Transform.translate(this.options.size[0]*2,0,-500)
            ],
            outTransition: [
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase},
                {duration: 250, curve: cssEase}
            ],

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

    };
    module.exports = FancyLightbox;
});
