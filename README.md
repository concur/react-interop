# react-interop
Interop layer for consuming React components with other JavaScript libraries

Do you want to render React components into a legacy application that uses a different framework?  Do you want your legacy code to be ignorant of the fact that React is being used?

Are you delivering a component for someone else to plug into their application?  Do you need your component to work regardless of the framework their application is built in?

react-interop enables all of these scenarios, delivering your components in an API that can be used by virtually any other client-side framework.

## Exporting Components

You export React components that you've created, with the exported components available for legacy or third-party integration.

``` jsx
// Run webpack over this module to produce a JS file
// that provides your exported components via react-interop
// Output would be 'exported-components.js'

import React from 'react';
import {exportComponents} from 'react-interop';

const DisplayName = ({name}) => (
    <div>
        Name: <span>{name}</span>
    </div>
);

const exported = exportComponents({
    DisplayName
});


window.ExportedComponents = exported;
```

## Consuming Exported Components as HTML

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

Your components can even provide live rendering for "durable" containers that you can render into.

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
