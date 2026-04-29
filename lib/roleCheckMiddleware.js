const { errorConstants } = require("../constant/errorConstants");
const errors = require("./errors");
const appConstants = require('../constant/appConstants');
const { getFromRedis } = require('./redis');
const { rolesConstants } = require("../constant/rolesConstants");

const getOneRoleIdForUser = async(userId) => {
    return getFromRedis(userId);
};

// roles from redis and fall back
const getOneRoleFromRedis = async(roleId) => {
    return getFromRedis(roleId);
};

/**
 * Validate role against given role type.
 * Throws API error if data is invalid.
 *
 * @param {array} globalRole roles to be allowd
 * @param {object} staffMemberModule permissions and modules
 * 
 * staff member should have only one moduleName and and one permission its permission
 */
const roleCheck = (globalRole = [], staffMemberModule = {}) => {
    return async function(req, res, next) {
        // getting the role type from JWT token
        const roleType = req.user.type;
       
        //get user id
        const userId = req.user.id;

        // if the injected array has same roles as role type then let api bypass
        if(globalRole.includes(roleType)){
            
            // if the userType is staff member then check modules and permission
            if(roleType === appConstants.USER_TYPE.STAFF_MEMBER){

                // get role id
                const roleId = await getOneRoleIdForUser(userId);
     
                // get role details from role id
                const roleDetails = await getOneRoleFromRedis(roleId);
                
                // module name
                const roleModuleName = staffMemberModule.moduleName;

                // module permission
                const permission = staffMemberModule.permission;

                // if role has module name and permissions has correct permissions
                // thn bypass it 
                if(roleDetails && roleDetails.hasOwnProperty(roleModuleName) && roleDetails[roleModuleName].includes(permission)){
                    return next();
                }
            }
            else{
                return next();
            }
        }

        // send validation error with message
        // throw errors.INVALID_INPUT(errorConstants.CANNOT_ACCESS_REQUIRED_MODULE);
        next(errors.UNAUTHORIZED(errorConstants.CANNOT_ACCESS_REQUIRED_MODULE));
    };
};


module.exports = {
    roleCheck
};