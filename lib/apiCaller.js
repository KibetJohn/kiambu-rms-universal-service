const axios = require('axios');
const { COMMON_HEADERS }  = require('../constant/appConstants');

/**
 * wrapper function to handle axios call
 * @param {*} request 
 * @returns object 
 */
const apiCaller =  async (request) => {
    try {
        // extracted method, url, body and params for axios call 
        const options = {
            headers: COMMON_HEADERS.headers,
            method: request.method,
            data: request.body,
            url: request.url,
            params: request.query
        };

        // adding authorization token
        options.headers.authorization = (request.headers && request.headers['authorization']) || null;
        
        let response = await axios(options);

        return response.data;

    }
    catch (error) {
        throw error.response.data;
    }
};

module.exports = {
    apiCaller
};