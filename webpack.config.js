const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
    entry: [ "./src/index.js"],
    output: {
        libraryExport: "default",
        path: path.resolve(__dirname, './dist'),
        filename: "main.js"
    },
    module: {

        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                },
            },
        ],

    },

    plugins: [

        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),

        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false
        }),
        new CopyWebpackPlugin( {
            patterns: [
                { from: "src/image-compare-viewer.min.css", to: path.basename('image-compare-viewer.min.css') },
                { from: "src/image-compare-viewer.min.js", to: path.basename('image-compare-viewer.min.js') },
                { from: "src/download-icon.svg", to: path.basename('download-icon.svg') },
                { from: "src/cnn-2x-s.json", to: path.basename('cnn-2x-s.json') },

            ]
        })

    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },

    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
    },

    mode: 'development'

};
