import webpack from 'webpack';

export default {
    entry: {
        'stockticker': './demo/stockticker.js'
    },
    output: {
        path: __dirname,
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
