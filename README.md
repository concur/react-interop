# react-interop
Interop layer for consuming React components with other JavaScript libraries.

Do you want to render React components into a legacy application that uses a different framework?  Do you want your legacy code to be ignorant of the fact that React is being used?

Are you delivering a component for someone else to render in their application?  Do you need your component to work regardless of the framework their application is built in?

react-interop enables these scenarios by delivering your components in an API that can be used by virtually any other client-side framework.

## Exporting Components

Exporting your React components through react-interop makes them available for legacy or third-party integration.  To export them, create a webpack entry point to produce a JavaScript bundle to be referenced by the host application (legacy or third-party).  The bundle will have code like the following.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides your exported components via react-interop
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

Your components then integrate into legacy or third-party systems using vanilla JavaScript that can interop with virtually any client-side JavaScript library.

``` html
<script src="exported-components.js"></script>
<script>

    var displayName = window.ExportedComponents.DisplayName;

    var displayNameHtml = displayName.renderToStaticMarkup({
        name: 'Via Interop'
    });

</script>
```

## Consuming Exported Components for Live Rendering

Exported components also provide live rendering for "durable" containers that you can render into.

``` html
<div id="display-name"></div>

<script src="exported-components.js"></script>
<script>

    var displayName = window.ExportedComponents.DisplayName;

    displayName.render(
        {name: 'Via Interop'},
        document.getElementById('display-name')
    );

</script>
```

## Backing Components with redux

react-interop also supports backing your components with redux or other container components to enable state-driven components.  This works with both static markup and live rendering.

To accomplish this, your webpack entry point will create your redux store, and pass the `Provider` component and its props to `exportComponents`.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides your exported components via react-interop
// For this example, output would be 'exported-components.js'

import {createStore} from 'redux';
import {exportComponents} from 'react-interop';
import React from 'react';
import {Provider} from 'react-redux';

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

Consumers of your exported components do not need to do anything differently when the components are wrapped in a container.

## Exporting Redux Action Creators

Alongside your React components, you can also use a small bit of code to export your action creators to the consuming application.  This relies on redux's `bindActionCreators` function to expose pure JavaScript functions that will dispatch actions on your store.

_Nothing is needed beyond `bindActionCreators` and a simple convention, so there are not any helpers from react-interop involved in exporting action creators._

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides your exported components via react-interop
// For this example, output would be 'exported-components.js'

import {exportComponents} from 'react-interop';
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

const mapStateToProps = ({age}) => ({age});
const ConnectedNameAndAge = connect(mapStateToProps)(NameAndAge);

const store = createStore(reducer, {age:42});

// Generate the exported components
const exportedComponents = exportComponents(
    {
        DisplayName: ConnectedNameAndAge
    },
    Provider,
    {store}
);

const exportedActions = bindActionCreators({setAge}, store.dispatch);

// The exported components can be made available globally
// for consumers to reference
window.ExportedComponents = {
    ...exportedComponents,
    ...exportedActions
};
```

With this approach, consumers can now invoke vanilla JavaScript functions that will dispatch redux actions, update your store, and cause any exported components rendered through the `render` method to update.  Subsequent calls to `renderToStaticMarkup` will also respect store updates.

``` html
<script src="exported-components.js"></script>
<script>

    var displayName = window.ExportedComponents.DisplayName;

    // This results in dispatching the setAge action creator
    // and the store will be updated with {age: 34}
    window.ExportedComponents.setAge(34);

    var displayNameHtml = displayName.renderToStaticMarkup({
        name: 'Via Interop'
    });

</script>
```
