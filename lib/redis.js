const Redis = require("ioredis");
const config = require("../lib/config")();

let redisClient = null;
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.REDIS_HOST,
      port: config.redis.REDIS_PORT,
    });
  }
  return redisClient;
};

/**
 * set data in redis
 * @param {*} key
 * @param {*} value
 */
const setInRedis = async (key, value) => {
  let redis = getRedisClient();
  await redis.set(key, JSON.stringify(value));
};

/**
 * get data from redis
 * @param {*} key
 * @returns
 */
const getFromRedis = async (key) => {
  let redis = getRedisClient();
  const data = await redis.get(key);
  return JSON.parse(data);
};

/**
 * delete from redis
 * @param {*} key key to be deleted
 */
const deleteFromRedis = async (key) => {
  const redis = getRedisClient();
  await redis.del(key);
};

const fetchDetailsFromRedis = async (key, nestedKey) => {
  let redis = getRedisClient();
  const data = await redis.get(key);

  if (!data) return null;

  const parsedData = JSON.parse(data);

  if (nestedKey) {
    return parsedData[nestedKey] || null;
  }

  return parsedData;
};

module.exports = {
  getRedisClient,
  setInRedis,
  getFromRedis,
  deleteFromRedis,
  fetchDetailsFromRedis,
};
