import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

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
                contaner = document.getElementById(container);
            }

            ReactDOM.render(this.createElement(props), container);
        },

        renderToStaticMarkup(props) {
            return ReactDOMServer.renderToStaticMarkup(this.createElement(props));
        }
    };
}

export default function exportComponents(componentTypes, Container, containerProps) {
    const exported = {};

    function exportComponent(key, componentType) {
        exported[key] = componentType && wrapComponent(componentType, Container, containerProps);
    }

    if (componentTypes) {
        Object.keys(componentTypes).forEach((key) => exportComponent(key, componentTypes[key]));
    }

    return exported;
}
