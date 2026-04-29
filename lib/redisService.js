const { getFromRedis, setInRedis } = require('./redis');
const { redisKeys } = require('../constant/redisKeys');

/**
 * get county by county-id
 */
 const findOneCounty = async (countyId) => {
    if ( !countyId ) return {};
    // get counties from redis
    const counties = await getFromRedis(redisKeys.counties);

    let county = counties[countyId];

    return county && county.is_active ? county : {};
};

const fetchAllCounties = async () => {
    // fetch county list
    let counties = await getFromRedis(redisKeys.counties);

    counties = Object.values(counties);

    return counties;
};



module.exports = {
    findOneCounty,
    fetchAllCounties,
};