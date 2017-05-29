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
        Name: <span>{name}</span>
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
import reducers from './reducers';

// DisplayName is a sample React component that we want to export
const DisplayName = ({name}) => (
    <div>
        Name: <span>{name}</span>
    </div>
);

const store = createStore(reducers);

// The second parameter is the container type that every
// component instance should be rendered within.
// The third parameter is an object that represents the
// props to provide to the container elements themselves
// In this example, we supply react-redux Provider and
// the store instance to be used for every Provider
const exported = exportComponents(
    {DisplayName},
    Provider,
    {store}
);

// The exported components can be made available globally
// for consumers to reference
window.ExportedComponents = exported;
```

Consumers of your exported components do not need to do anything differently when the components are wrapped in a container.  The result of `renderToStaticMarkup` or `render` for these exported components will result in:

``` jsx
<Provider store={store}>
    <DisplayName {...propsFromCaller} />
</Provider>
```
