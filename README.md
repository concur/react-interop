# react-interop
Interop layer for consuming React components with other JavaScript libraries.

Do you want to render React components into a legacy application that uses a different framework?  Do you want your legacy code to be ignorant of the fact that React is being used?

Are you delivering a component for someone else to render in their application?  Do you need your component to work regardless of the framework their application is built in?

react-interop enables these scenarios by delivering your components in an API that can be used by virtually any other JavaScript framework.

## Exporting Components

Exporting React components through react-interop makes them available for legacy or third-party integration.  To export them, create a webpack entry point to produce a JavaScript bundle to be referenced by the consumer (legacy or third-party).  The entry point will have code like the following.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'exported-components.js'

import {exportComponents} from 'react-interop';
import React from 'react';

// DisplayName is a sample React component that we want to export
const DisplayName = ({name}) => (
    <div>
        Name: {name}
    </div>
);

// exportComponents provides an API over all specified components
// that allows them to be rendered either as static markup or
// with live React rendering
const exported = exportComponents({
    DisplayName
});

// The exported components can be made available globally
// for consumers to reference
window.ExportedComponents = exported;
```

## Consuming Exported Components as Static Markup

Exported components integrate into legacy or third-party applications using vanilla JavaScript.

``` html
<script src="exported-components.js"></script>
<script>

    var DisplayName = window.ExportedComponents.DisplayName;

    var displayNameHtml = DisplayName.renderToStaticMarkup({
        name: 'Via Interop'
    });

</script>
```

## Consuming Exported Components for Live Rendering

Exported components also provide live rendering for "durable" containers where the component becomes the owner of the container element.

``` html
<!-- The DIV that the display name component will be rendered into -->
<div id="display-name"></div>

<script src="exported-components.js"></script>
<script>

    var DisplayName = window.ExportedComponents.DisplayName;

    DisplayName.render(
        {name: 'Via Interop'},
        // Supply either an element or and element id string
        // (for document.getElementById to be used by default)
        document.getElementById('display-name')
    );

</script>
```

## Backing Components with redux

react-interop also supports backing components with redux or other container components to enable state-driven components.  This works with both static markup and live rendering.

To accomplish this, the webpack entry point will create the redux store, and pass the `Provider` component and its props to `exportComponents`.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'exported-components.js'

import {createStore} from 'redux';
import {exportComponents} from 'react-interop';
import React from 'react';
import {connect, Provider} from 'react-redux';

function reducer(state = {}, action) {
    switch (action.type) {
        case 'SET_AGE':
            const age = action.age;

            return {
                ...state,
                age
            };

        default:
            return state;
    }
}

// NameAndAge is a sample React component that we want to export
const NameAndAge = ({age, name}) => (
    <div>
        <div>Name: {name}</div>
        <div>Age: {age}</div>
    </div>
);

const mapStateToProps = ({age}) => ({age});
const ConnectedNameAndAge = connect(mapStateToProps)(NameAndAge);

const store = createStore(reducer, {age:42});

// The second parameter is the container type that every
// component instance should be rendered within.
// The third parameter is an object that represents the
// props to provide to the container elements themselves
// In this example, we supply react-redux Provider and
// the store instance to be used for every Provider
const exported = exportComponents(
    {
        DisplayName: ConnectedNameAndAge
    },
    Provider,
    {store}
);

// The exported components can be made available globally
// for consumers to reference
window.ExportedComponents = exported;
```

Consumers of exported components do not need to do anything differently when the components are wrapped in a container.

_Note that react-interop does not depend on redux or react-redux.  You can use any container element to wrap around exported components._

## Exporting Redux Action Creators

Alongside React components, you can also use a small bit of code to export action creators to the consuming application.  This relies on redux's `bindActionCreators` function to expose pure JavaScript functions that will dispatch actions on the store.

_Nothing is needed beyond `bindActionCreators` and a simple convention, so there are not any helpers from react-interop involved in exporting action creators._

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'exported-components.js'

import {exportComponents} from 'react-interop';
import PropTypes from 'prop-types';
import React from 'react';
import {Provider} from 'react-redux';
import {bindActionCreators, createStore} from 'redux';

function reducer(state = {}, action) {
    switch (action.type) {
        case 'SET_AGE':
            const age = action.age;

            return {
                ...state,
                age
            };

        default:
            return state;
    }
}

function setAge(age) {
    return {
        type: 'SET_AGE',
        age
    };
}

// NameAndAge is a sample React component that we want to export
const NameAndAge = ({age, name}) => (
    <div>
        <div>Name: {name}</div>
        <div>Age: {age}</div>
    </div>
);

NameAndAge.propTypes = {
    age: PropTypes.number,
    name: PropTypes.string
};

const mapStateToProps = ({age}) => ({age});
const ConnectedNameAndAge = connect(mapStateToProps)(NameAndAge);

const store = createStore(reducer, {age: 42});

// Generate the exported components
const exportedComponents = exportComponents(
    {
        DisplayName: ConnectedNameAndAge
    },
    Provider,
    {store}
);

// Use bindActionCreators to be ready to export the action creators
const exportedActions = bindActionCreators({setAge}, store.dispatch);

// The exported components and actions can be made
// available globally for consumers to reference
window.ExportedComponents = {
    ...exportedComponents,
    ...exportedActions
};
```

With this approach, consumers can now invoke vanilla JavaScript functions that will dispatch redux actions, update the store, and cause any exported components rendered through the `render` method to update.  Subsequent calls to `renderToStaticMarkup` will also respect store updates.

``` html
<script src="exported-components.js"></script>
<script>

    var DisplayName = window.ExportedComponents.DisplayName;

    // This results in dispatching the setAge action creator
    // and the store will be updated with {age: 34}
    window.ExportedComponents.setAge(34);

    var displayNameHtml = DisplayName.renderToStaticMarkup({
        name: 'Via Interop'
    });

</script>
```

_Note that react-interop does not depend on redux.  This same approach can be used with other state management implementations._

## Making Callbacks to Consumers

If the consumer uses the `renderToStaticMarkup` rendering approach, there may be times when you need to invoke a callback to inform the consuming application that components need to be re-rendered or that other notable events have occurred.

To fulfill this requirement, react-interop supplies a pub/sub model based on redux's own `subscribe` implementation.  The webpack entry point will define callbacks that the consumer can subscribe to.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'exported-components.js'

import PropTypes from 'prop-types';
import React from 'react';
import {connect, Provider} from 'react-redux';
import {createCallback, exportComponents} from 'react-interop';
import {bindActionCreators, createStore} from 'redux';

function reducer(state = {}, action) {
    switch (action.type) {
        case 'SET_AGE':
            const age = action.age;

            return {
                ...state,
                age
            };

        case 'INCREMENT_AGE':
            const {age} = state;

            return {
                ...state,
                age: (age + 1)
            };

        default:
            return state;
    }
}

function setAge(age) {
    return {
        type: 'SET_AGE',
        age
    };
}

function incrementAge() {
    return {
        type: 'INCREMENT_AGE'
    };
}

// NameAndAge is a sample React component that we want to export
// name comes in through props, age will come from the store
const NameAndAge = ({age, name}) => (
    <div>
        <div>Name: {name}</div>
        <div>Age: {age}</div>
    </div>
);

NameAndAge.propTypes = {
    age: PropTypes.number,
    name: PropTypes.string
};

const mapStateToProps = ({age}) => ({age});
const ConnectedNameAndAge = connect(mapStateToProps)(NameAndAge);

// Create a callback pub/sub instance
const onAgeChanged = createCallback();

// Using redux middleware, watch for the age value to change
// and dispatch out to any subscribers that the age was updated
const ageNotificationMiddleware = store => next => action => {
    const {age: oldAge} = store.getState();

    next(action);

    const {age: newAge} = store.getState();

    if (oldAge !== newAge) {
        onAgeChanged.dispatch(newAge);
    }
};

const store = createStore(reducer, {age: 42}, [ageNotificationMiddleware]);

// Every 10 seconds, increment the age by a year
function dispatchIncrementAge() {
    store.dispatch(incrementAge());
}

window.setInterval(dispatchIncrementAge, 10000);

// Generate the exported components
const exportedComponents = exportComponents(
    {
        DisplayName: ConnectedNameAndAge
    },
    Provider,
    {store}
);

// Use bindActionCreators to be ready to export the action creators
const exportedActions = bindActionCreators({setAge}, store.dispatch);

// The exported components, actions, and callbacks can
// be made available globally for consumers to reference
window.ExportedComponents = {
    ...exportedComponents,
    ...exportedActions,
    onAgeChanged
};
```

With the `onAgeChanged` callback exported, consumers can now subscribe to the callback and receive the callback parameters.

``` html
<script src="exported-components.js"></script>
<script>

    var DisplayName = window.ExportedComponents.DisplayName;

    // This results in dispatching the setAge action creator
    // and the store will be updated with {age: 34}
    window.ExportedComponents.setAge(34);

    // The page is being rendered by building HTML as strings
    // and the renderToStaticMarkup function is used. This
    // needs to be called again each time the page is rendered.
    function renderPage() {
        var displayNameHtml = DisplayName.renderToStaticMarkup({
            name: 'Via Interop'
        });

        // ...
    }

    renderPage();

    // When the ExportedComponents notify that the age has changed,
    // display a status and render the page again.
    function notifyOnAgeChange(age) {
        window.status = 'The age has changed to ' + age;
        renderPage();
    }

    var onAgeChanged = window.ExportedComponents.onAgeChanged;

    // The subscribe function returns the unsubscribe function
    var unsubscribeAgeChanged = onAgeChanged.subscribe(notifyOnAgeChange);

</script>
```

_Note that react-interop does not depend on redux.  These callbacks can be used for any scenario where the consuming application needs to be notified._

## Wrap-Up

react-interop provides two small utilities (`exportComponents` and `createCallback`) to make it easy to provide an interop layer over your React components.  This interop layer allows your components to be rendered in legacy application or third-party applications where React might not be in direct use.  Consumers use vanilla JavaScript functions to render components, invoke actions, and subscribe to callbacks.

The two rendering scenarios are:

1. `render` components into "durable" containers (where the component then becomes the owner of the container)
2. `renderToStaticMarkup` gets the static HTML markup output from components for rendering inline with other components from the consumer

The exported API can also expose callbacks using `createCallback` where consumers subscribe to callbacks from your components.

react-interop also prescribes the use of redux's `bindActionCreators` (or analogous methods from other flux implementations) to expose functions for invoking actions without the consuming being aware of the flux implementation.

To provide your components to the consumer, create a webpack entry point that constructs your store and exports your components, actions, and callbacks.  Your consumers will reference your bundle as a vanilla JavaScript file.

