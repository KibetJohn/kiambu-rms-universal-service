exports.redisKeys = {
    counties: `counties_${process.env.NODE_ENV}` || 'counties',
    subCounties: `subCounties_${process.env.NODE_ENV}` || 'subCounties',
    wards: `wards_${process.env.NODE_ENV}` || 'wards',
    zones: `zones_${process.env.NODE_ENV}` || 'zones',
    busParks: `busParks_${process.env.NODE_ENV}` || 'busParks',
    impoundLocations: `impoundLocations_${process.env.NODE_ENV}` || 'impoundLocations',
    entryPoints: `entryPoints_${process.env.NODE_ENV}` || 'entryPoints',
    licenseAndPermits: `licenseAndPermits_${process.env.NODE_ENV}` || 'licenseAndPermits'
};