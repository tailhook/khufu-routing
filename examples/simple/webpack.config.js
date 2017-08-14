module.exports = {
    context: __dirname,
    entry: "./index",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [{
            test: /\.khufu$/,
            loaders: ['babel-loader', 'khufu'],
            exclude: /node_modules/,
        }, {
            test: /\.js$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/,
        }],
    },
    resolve: {
        modules: ["/usr/lib/node_modules", "node_modules",
            "../../lib" // so we can test without installation, don't copy it
            ],
        mainFields: ["jsnext:main", "main"],
    },
    resolveLoader: {
        modules: ["/usr/lib/node_modules"],
        mainFields: ["webpackLoader", "jsnext:main", "main"],
    },
}
