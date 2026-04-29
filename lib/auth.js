const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const config = require("./config")();
const errors = require("./errors");
const { errorConstants } = require("../constant/errorConstants");
const _ = require('lodash');
const { getFromRedis, setInRedis } = require("./redis");

//genearate jwt token
async function getJwtToken(user) {
    const { JWT_SECRET, JWT_EXPIRE } = config.jwt;
    return jwt.sign(
        {
            ...user,
        },
        JWT_SECRET,
        {   
            expiresIn: JWT_EXPIRE,
        }
    );
}

//encrypt password
async function createHash(password) {
    const secret = config.crypto.SECRET_KEY;
    return crypto.createHmac("SHA256", secret).update(password).digest("base64");
}

//authenticate jwt token
async function authenticate(req, res, next) {
    let token;
    if (
        req.headers["authorization"] &&
        req.headers["authorization"].startsWith("Bearer")
    ) {
        //set token from header
        token = req.headers["authorization"].split(" ")[1];
    }
    
    //Make sure token exists
    if (!token)
        return next(
            errors.UNAUTHORIZED(
                errorConstants.NOT_AUTHORIZED_TO_ACCESS_THIS_ROUTE
            )
        );
   
    try {
        const decoded = await jwt.verify(token, config.jwt.JWT_SECRET);
        // destruct
        const { id, device_id } = decoded || {};
        // if id & device_id present
        if(id && device_id) {
            // get token from redis
            let validToken = await getFromRedis(`PDSL_Users_${id}_${device_id}`);
            validToken = JSON.parse(validToken);
            // if token from redis is valid

            if(validToken && validToken == token) {
                // refresh token 5 minutes before expire
                if ((decoded.exp * 1000 - Date.now()) < 5 * 60000) {
                    delete decoded.exp;
                    delete decoded.iat;
                    //generates new token on every call
                    const newToken = await getJwtToken(decoded);

                    
                    // set new token in redis
                    await setInRedis(`PDSL_Users_${id}_${device_id}`, JSON.stringify((newToken)));

                    // set token in header
                    res.setHeader("Authorization", newToken);
                }
                // set user in req
                _.set(req, "user", decoded);
                return next();
            }
        }
        next(errors.UNAUTHORIZED(
            errorConstants.NOT_AUTHORIZED_TO_ACCESS_THIS_ROUTE
        ));
    } catch (e) {
        const detail =
            e.name == "TokenExpiredError"
                ? errorConstants.TOKEN_IS_EXPIRED
                : errorConstants.AUTH_TOKEN_IS_INVALID;
        return next(errors.UNAUTHORIZED(detail));
    }
};

module.exports = {
    getJwtToken,
    createHash,
    authenticate
};
