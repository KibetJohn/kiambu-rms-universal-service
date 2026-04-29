const moment = require('moment');
const logger = require('./logger');
const { findOneCounty } = require('../lib/redisService');
const { isEmpty} = require('lodash');

/**
 * to get start and end of financial year
 * @param {*} countyMonth // denotes month in integer from which financial year of the county started
 * @param {*} financialYear // current or next
 */
const getFinancialYear = (countyMonth, financialYear) => {
    try {
        let start;
        let end;
        let cmonth = moment().month(); // current month
        let cyear = moment().year(); // current year
        let fyear; // fianacial year in which we need to add data

        // if financial year is current
        if(financialYear == 'CURRENT') {
            // example financial year started in April and we are in July
            if(cmonth >= countyMonth) {
                fyear = cyear;
            } else { // financial year started in July and we are in April
                fyear = cyear-1;
            }
        } else { // for next financial year
            if(cmonth >= countyMonth) {
                fyear = cyear+1;
            } else {
                fyear = cyear;
            }
        }
        // start of the financial year
        start = new Date(fyear, countyMonth);
        
        // end month of the financial year is starting month (countyMonth) +12
        let endMonth = (countyMonth+12)%12;

        // end of the financial year
        end = new Date(fyear+1, endMonth);

        return { start, end};
    } catch(error) {
        // log error
        logger.log('error', error);
        throw error;
    }
};

/**
 * get financial year of perticuler county
 * @param {*} county_id 
 * @param {*} financial_year 
 * @returns 
 */
const getFinancialYearOfCounty = async(county_id, financial_year) => {
    try{
        // find one county
        let county = await findOneCounty(county_id);

        // if county does not exist
        if( isEmpty(county) || county.financial_year_start_month == null ) throw errors.INVALID_INPUT('Please set financial year in your county.');

        // get financial year start and end { start, end}
        return getFinancialYear( county.financial_year_start_month, financial_year);
    }
    catch(error){
        logger.log('error', error);
        throw error;
    }
    
};

module.exports = {
    getFinancialYear,
    getFinancialYearOfCounty
};