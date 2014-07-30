define(function(require, exports, module) {
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');
    var RenderNode = require('famous/core/RenderNode');
    var Utility = require('famous/utilities/Utility');
    var OptionsManager = require('famous/core/OptionsManager');
    var Transitionable = require('famous/transitions/Transitionable');
    var TransitionableTransform = require('famous/transitions/TransitionableTransform');
    var Lightbox = require('famous/views/Lightbox');

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
        }.bind(this))).splice(1);
        showTransform.push(this.options.showTransform);
        var showOrigin = (this.options.inOrigin[0] instanceof Array ? this.options.inOrigin : transition.map(function(){
            return this.options.inOrigin;
        }.bind(this))).splice(1);
        showOrigin.push(this.options.showOrigin);
        var showOpacity = (this.options.inOpacity instanceof Array ? this.options.inOpacity : transition.map(function(){
            return this.options.inOpacity;
        }.bind(this))).splice(1);
        showOpacity.push(this.options.showOpacity);

        var cbCount = showTransform.length + showOrigin.length + showOpacity.length;
        var _cb = callback ? Utility.after(cbCount, callback) : undefined;

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
            inTransform: Transform.translate(this.options.size[0],0,0),
            inOpacity: 0,
            inTransition: {duration: 600, curve: 'easeIn'},

            outOrigin: [0.5,0.5],
            outOpacity: 0,
            outTransform: Transform.translate(-this.options.size[0],0,0),
            outTransition: {duration: 600, curve: 'easeIn'},

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[36] = {
            inOrigin: [0.5,0.5],
            inTransform: Transform.scale(.8, .8, 1),
            inOpacity: 0,
            inTransition: {duration: 700, curve: 'easeIn'},

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
                {duration: 200, curve: 'easeIn'},
                {duration: 200, curve: 'easeOut'},
                {duration: 200, curve: 'easeIn'},
                {duration: 200, curve: 'easeIn'},
                {duration: 200, curve: 'easeIn'}
            ],

            showOrigin: [0.5,0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            overlap: true
        };

        this.pageTransitions[70] = {
            inOrigin: [0,0.5],
            inOpacity: 0.3,
            inTransform: [
                Transform.moveThen([this.options.size[0],0,0],Transform.rotateY(90*deg)),
                Transform.moveThen([this.options.size[0]/2,0,-200], Transform.rotateY(45*deg))
            ],
            inTransition: [
                {duration: 300, curve: 'easeOut'},
                {duration: 300, curve: 'easeIn'},
            ],

            outOrigin: [1,0.5],
            outOpacity: 1,
            outTransform: [
                Transform.moveThen([this.options.size[0]/2,0,-200], Transform.rotateY(-45*deg)),
                Transform.moveThen([-this.options.size[0],0,0], Transform.rotateY(-90*deg)),
            ],
            outTransition: [
                {duration: 300, curve: 'easeOut'},
                {duration: 300, curve: 'easeIn'}
            ],

            showOrigin: [1,0.5],
            showOpacity: 1,
            showTransform: Transform.identity,
            overlap: true
        };
    };
    module.exports = FancyLightbox;
});
