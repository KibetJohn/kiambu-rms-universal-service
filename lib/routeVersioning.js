const config = require('./config')();
const errors = require('./errors')

module.exports = ( req, res, next ) => {
    const apiVersion = req.get('accept-version');

    if ( !apiVersion ) {
        throw errors.VERSION_HEADER_NOT_FOUND();
    }

    if (apiVersion != config.apiVersion) {
        throw errors.VERSION_MISMATCH();
    }
    next();
}