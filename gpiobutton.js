var gpiobutton = {};

gpiobutton.mods = {};
gpiobutton.mods.EventEmitter = require("events").EventEmitter;
gpiobutton.mods.gpio = require('gpio');

gpiobutton.api = {};

gpiobutton.defaults = {
  interval: 100,
  longTimeout: 1000,
  waveTimeout: 500,
  maxDownBeats: 8,
  maxUpBeats: 4,
  DOWN: 0,
};

gpiobutton.beatCounter = {
  increment: function() {
    if (! this.target.ended) {
      this.target.beats++;
    }
    //console.error("NOW: %j", this.target);
  }
};

gpiobutton.api.button = function(spec) {
  var self = {};

  self.config = Object.create(gpiobutton.defaults);

  self.config.gpiono = spec.gpiono;
  if (spec.DOWN) {
    self.config.DOWN = spec.DOWN;
  }
  if (spec.interval) {
    self.config.interval = spec.interval;
  }
  if (spec.longTimeout) {
    self.config.longTimeout = spec.longTimeout;
  }

  //console.error("CONFIG: %j -> %j", spec, self.config);

  self.state = {};
  self.state.buttondown = {dir:'down0',beats:0};
  self.state.buttonup = {dir:'up0',beats:0};
  self.state.wave = [];

  self.ee = new gpiobutton.mods.EventEmitter();

  self.emit = function(eventName,spec) { self.ee.emit(eventName,spec); };
  self.on   = function(eventName,spec) { self.ee.on(  eventName,spec); };

  self.activate = function(callback) {
    if (self.gpio) { return; }
    callback = callback ||  function() {
      //console.error("READY: " + JSON.stringify(spec));
    };

    self.gpio = gpiobutton.mods.gpio.export(self.config.gpiono, {
      direction: "in",
      interval: self.config.interval,
      ready: callback
    });
    self.gpio.on('change', function(val) {
      var dir = "um";
      if (val === self.config.DOWN) {
        dir = "down";
        self.state.buttondown = {dir:"down",beats:0};
        self.emit('buttondown', {down:self.state.buttondown,up:self.state.buttonup});
      } else {
        dir = "up";
        self.state.buttonup = {dir:"up",beats:0};
        self.emit('buttonup', {down:self.state.buttondown,up:self.state.buttonup});
      }
    
      //setTimeout(function() { console.error("DELTA %j", {val:val,dir:dir}); }, 0);
    });
    
    return self;
  };
  self.deactivate = function() {
    self.gpio.unexport();
    delete self.gpio;

    return self;
  };

  self.activate();

  self.on('buttondown', function(spec) {    
    spec.down.beats = 0;

    self.state.wave.push(spec.up);
    spec.up.ended = true;

    var beatCounter = Object.create(gpiobutton.beatCounter);
    beatCounter.target = spec.down;
    for (var i = 0; i < self.config.maxDownBeats; i++) {
      setTimeout(function() { beatCounter.increment() }, i*self.config.interval);
    }
    setTimeout(function() {
      //console.error("LONG? %j", spec);
      if (! spec.down.ended) {
        self.emit('longpress');
      }
    }, self.config.longTimeout);

    //console.error("DOWN: %j", spec);
  });
  self.on('buttonup', function(spec) {
    spec.up.beats = 0;

    self.state.wave.push(spec.down);
    spec.down.ended = true;
    
    var beatCounter = Object.create(gpiobutton.beatCounter);
    beatCounter.target = spec.up;
    for (var i = 0; i < self.config.maxUpBeats; i++) {
      setTimeout(function() { beatCounter.increment() }, i*self.config.interval);
    }
    setTimeout(function() {
      if (spec.up.ended) {
        return;
      }
      self.state.wave.push(spec.up);
      var waveSpec = {
        wave:self.state.wave,
        count: (-1 + self.state.wave.length) / 2,
      };
      waveSpec.eventName = (waveSpec.count <= 1) ? "buttonpress" : "multipress";
      self.emit(waveSpec.eventName, waveSpec);
      self.state.wave = [];
    }, self.config.waveTimeout);

    //console.error("UP: %j", spec);
  });


  return self;
};

module.exports = gpiobutton.api;
