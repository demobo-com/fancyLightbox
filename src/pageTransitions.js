define(function(require, exports, module) {
    var Engine = require('famous/core/Engine');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var ViewSequence = require('famous/core/ViewSequence');
    var Utility = require('famous/utilities/Utility');
    var Lightbox = require('FancyLightbox');

    var mainContext = Engine.createContext();
    mainContext.setPerspective(500);

    var surfaces = [];
    var viewSequence = new ViewSequence({
        array: surfaces,
        loop: true
    });

    var size = [window.innerWidth/4, window.innerHeight/4];

    var centerModifier = new StateModifier({
        size: size,
        origin: [0.5, 0.5],
        align: [0.5, 0.5]
    });

    var lightbox = new Lightbox({
        size: size
    });

    mainContext.add(centerModifier).add(lightbox);

    for (var i = 0; i < 5; i++) {
        var surface = new Surface({
            size: size,
            content: 'Surface ' + i,
            properties: {
                textAlign: 'center',
                lineHeight: '100px',
                color: 'white',
                backgroundColor: "hsl(" + (i * 360 / 40) + ", 100%, 50%)",
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)'
            }
        });
        surfaces.push(surface);
        surface.on('click', next);
    }

    window.lightbox = lightbox;
    window.viewSequence = viewSequence;

    lightbox.show(viewSequence);

    function next() {
        lightbox.setPageTransition(document.getElementById('transitionsSelect').value);
        if (viewSequence.getNext()) {
            viewSequence = viewSequence.getNext();
            lightbox.show(viewSequence);
        }
    }

    function prev() {
        lightbox.setPageTransition(document.getElementById('transitionsSelect').value);
        if (viewSequence.getPrevious()) {
            viewSequence = viewSequence.getPrevious();
            lightbox.show(viewSequence);
        }
    }


});
