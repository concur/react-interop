import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

/**
 * Wrap a component with the react-interop API methods
 * @param {function} Component React component type to wrap
 * @param {function} Container Optional React component type to use as a container
 * @param {object} containerProps Optional props for the container
 * @return {object} An object with render and renderToStaticMarkup methods
 */
function wrapComponent(Component, Container, containerProps) {
    return {
        createElement(componentProps) {
            const component = <Component {...componentProps} />;

            // If there is a Container type, then wrap the component in
            // a container element, providing the container its props
            if (Container) {
                return (
                    <Container {...containerProps} children={component} />
                );
            }

            return component;
        },

        render(props, container) {
            if (typeof container === 'string') {
                container = document.getElementById(container);
            }

            ReactDOM.render(this.createElement(props), container);
        },

        renderToStaticMarkup(props) {
            return ReactDOMServer.renderToStaticMarkup(this.createElement(props));
        }
    };
}

/**
 * Export React components for interop rendering
 * @param {object} componentTypes Each property is a React component type to be exported
 * @param {function} Container Optional React component type to use as a container
 * @param {object} containerProps Optional props for the container
 * @return {object} An object with properties for each React component type exported, each of those having render and renderToStaticMarkup methods
 */
export default function exportComponents(componentTypes, Container, containerProps) {
    const exported = {};

    function exportComponent(key, componentType) {
        if (typeof componentType === 'function') {
            exported[key] = wrapComponent(componentType, Container, containerProps);
        }
    }

    if (componentTypes) {
        Object.keys(componentTypes).forEach((key) => exportComponent(key, componentTypes[key]));
    }

    return exported;
}
