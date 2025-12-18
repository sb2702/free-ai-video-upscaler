const path = require('path');
const webpack = require('webpack');



const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
    entry: [ "./src/index.js", './src/worker.js'],
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
                use: ["style-loader", "css-loader", "postcss-loader"],
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
                { from: "src/*.js", to: path.basename('[name].js') },
                { from: "src/img/*.svg", to: path.basename('[name].svg') },
                { from: "src/img/*.png", to: path.basename('[name].png') },

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
        allowedHosts: "all",
    },

    mode: 'development'

};
