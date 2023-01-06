/* eslint-disable security/detect-object-injection */
import { config } from '$/config';

const exclu = <T, Key extends keyof T>(obj: T, keys: Key[]): Omit<T, Key> => {
  keys.forEach((key) => {
    // eslint-disable-next-line no-param-reassign
    delete obj[key];
  });
  return obj;
};
const only = <T, Key extends keyof T>(object: T, keys: Key[]): Pick<T, Key> =>
  keys.reduce((obj: any, key) => {
    // eslint-disable-next-line no-param-reassign
    obj[key] = object[key];
    return obj;
  }, {});

const isProduction = () => config.env === 'production';
const isDev = () => config.env === 'development';

export { exclu, isDev, isProduction, only };
