// covert all property of object to lowercase
const convertObjectValuesToLowerCase = (body) => {
    for(let property in body){
        body[property] = body[property].toLowerCase();
    }
};

// covert all property of object to trim
const convertObjectValuesTrim = (body) => {
    for(let property in body){
        body[property] = body[property].trim();
    }
};

// covert all property of object to trim and lowercase
const convertObjectValuesTrimAndLowerCase = (body) => {
    for(let property in body){
        // value is string then only transfrom the string
        if(typeof body[property] === 'string'){
            body[property] = body[property].trim();
            body[property] = body[property].toLowerCase();
        }
    }
};

module.exports = {
    convertObjectValuesToLowerCase,
    convertObjectValuesTrim,
    convertObjectValuesTrimAndLowerCase
};