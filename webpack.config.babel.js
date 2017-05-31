import path from 'path';
import webpack from 'webpack';

export default {
    entry: {
        'exported-components': './demo/exported-components.js'
    },
    output: {
        path: path.join(__dirname, './demo'),
        filename: '[name]-packed.js',
        publicPath: '/'
    },
    plugins: [
        new webpack.DefinePlugin({
            __DEVTOOLS__: process.env.NODE_ENV === 'development',
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: [/\.jsx?$/],
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    }
};
