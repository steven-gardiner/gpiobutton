# gpiobutton

## get higher level button events from a gpio button

This package provides specialized handling of signals from buttons
attached to GPIO ports of a Raspberry Pi.  Rather than programming
around low-level events like signal change, you can use higher-level
events like a button press or multiple presses.  

### Installation

```js
npm install gpiobutton
```

### Initialization

```js
var gpiobutton = require('gpiobutton');
var buttonSpec = {gpiono:4};
var button4 = new gpiobutton.button(buttonSpec);
```

### API Methods


```js
button4.deactivate();
```

Temporarily ignore signals from the button.  Buttons start out
activated but may be deactivated (which translates to being unexported
from the gpio package) to decrease the amount of polling.

```js
button4.activate();
```

Use the pin information from the instantiation to resume listening for
changes on the pin.

### Events

```js
button4.on("buttondown", function(event) {
  // button was pressed down
});
```

Most buttons seem to rest in the "up" or open position, sending a
signal of 1.  When the button is pushed down, the signal goes to 0 and
this event is emitted.

You can change the semantics of "up" and "down" for a particular
button by explicitly passing a "DOWN" property in the button's
instantiation spec.

```js
button4.on("buttonup", function(event) {
  // button was released
});
```

The opposite of the buttondown.

```js
button4.on("buttonpress", function(event) {
  // The button was pressed and then subsequently released
});
```

Analogue of the "mouseclick" event in web programming.  Will not fire
unless and until the button is released.

```js
button4.on("longpress", function(event) {
  // The button was pressed and held.
});
```

Fired after the button has been down for awhile (defaults to 1000
milliseconds; can be altered by setting the "longTimeout" property of
the instantiation spec of the button).  Note that this event fires
regardless of when or whether the button is released.

```js
button4.on("multipress", function(event) {
});
```

Fired after the button has been pressed (and released) multiple times,
as for example a double click on a mouse.  The event includes a
"count" property indicating how many times the button was pressed.
Finer-grained information about how long each press (and times between
presses) can be found from the "wave" property of the event; each
interval is described in terms of the number of "beats" the button
state lasted.  This package relies on the polling provided by the gpio
package, so state changes occurring between polls are ignored.

