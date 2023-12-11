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

            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            }

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
                { from: "src/lib/image-compare-viewer.min.css", to: path.basename('image-compare-viewer.min.css') },
                { from: "src/lib/image-compare-viewer.min.js", to: path.basename('image-compare-viewer.min.js') },
                { from: "src/img/*.svg", to: path.basename('[name].svg') },

            ]
        })

    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js",  ".css"]
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
