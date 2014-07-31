define(function(require, exports, module) {
    var Engine = require('famous/core/Engine');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var ViewSequence = require('famous/core/ViewSequence');
    var Utility = require('famous/utilities/Utility');
    var Lightbox = require('FancyLightbox');

    var mainContext = Engine.createContext();
    mainContext.setPerspective(600);

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
    var prevButton = new Surface({
        content: "Prev",
        properties: {
            color: 'white',
            backgroundColor: '#fa5c4f',
            textAlign: 'center',
            cursor: 'pointer',
            lineHeight: '50px'
        }
    });
    var nextButtonModifier = new StateModifier({
        size: [100,50],
        origin: [0.5, 0.5],
        align: [0.2, 0.5]
    });
    var nextButton = new Surface({
        content: "Next",
        properties: {
            color: 'white',
            backgroundColor: '#fa5c4f',
            textAlign: 'center',
            cursor: 'pointer',
            lineHeight: '50px'
        }
    });
    var prevButtonModifier = new StateModifier({
        size: [100,50],
        origin: [0.5, 0.5],
        align: [0.8, 0.5]
    });
    mainContext.add(nextButtonModifier).add(prevButton);
    mainContext.add(prevButtonModifier).add(nextButton);
    prevButton.on('click', prev);
    nextButton.on('click', next);

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
    }

    window.lightbox = lightbox;
    window.viewSequence = viewSequence;

    lightbox.show(viewSequence);

    function next() {
        var transitionId = 2*document.getElementById('transitionsSelect').value;
        lightbox.setPageTransition(transitionId);
        if (viewSequence.getNext()) {
            viewSequence = viewSequence.getNext();
            lightbox.show(viewSequence);
        }
    }

    function prev() {
        var transitionId = 2*document.getElementById('transitionsSelect').value-1;
        lightbox.setPageTransition(transitionId);
        if (viewSequence.getPrevious()) {
            viewSequence = viewSequence.getPrevious();
            lightbox.show(viewSequence);
        }
    }


});
