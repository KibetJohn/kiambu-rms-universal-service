const elasticSearchlogger = require("./elasticSearchLogger");
const {set} = require('lodash');
module.exports = ( request, response, next ) => {
    const requestStart = Date.now();
    const { headers, httpVersion, method, socket, url, query, params } = request;
    const { remoteAddress, remoteFamily } = socket;

    const oldWrite = response.write;
    const oldEnd = response.end;

    const chunks = [];

    response.write = (...responsetArgs) => {
        chunks.push(Buffer.from(responsetArgs[0]));
        oldWrite.apply(response, responsetArgs);
    };

    // unique reference id
    const ref_id = new Date().valueOf();

    // set elk_ref_id in request object to store it mongo db logs
    set(request, 'elk_reference_id', ref_id);

    response.end = (...restArgs) => {
        if (restArgs[0]) {
            chunks.push(Buffer.from(restArgs[0]));
        }

        // response body
        const body = Buffer.concat(chunks).toString('utf8');

        // object to be logged
        let logObj = {
            time: new Date(),
            fromIP: request.headers['x-forwarded-for'] || request.connection.remoteAddress,
            originalUri: request.originalUrl,
            url,
            remoteAddress, 
            remoteFamily,
            execution_time: Date.now() - requestStart,
            requestData: {
                headers,
                httpVersion,
                method,
                body: JSON.stringify(request.body),
                query: JSON.stringify(query),
                params: JSON.stringify(params)
            },
            responseData: {
                body,
                statusCode: request.res.statusCode,
            },
            referer: request.headers.referer || '',
            elk_reference_id:  ref_id,
            service: 'USER_SERVICE'
        };

        // add user object if request is authenticated.
        if (request.user) {
            logObj.user = request.user;
        }

        // if response is success
        if (request.res.statusCode.toString().startsWith('2')) {
            // store all the log to a local file in format with level - info
            elasticSearchlogger.log('info', logObj);
        }
        // if response is failure
        else {
            // store all the log to a local file in format with level - error
            elasticSearchlogger.log('error', logObj);
        }

        oldEnd.apply(response, restArgs);
    };
    next();
};