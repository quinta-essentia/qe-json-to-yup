import forEach from 'lodash/forEach';
import includes from 'lodash/includes';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import mapValues from 'lodash/mapValues';
import reduce from 'lodash/reduce';
import toString from 'lodash/toString';
import values from 'lodash/values';

import {
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  string,
} from 'yup';

const YupTypesNames = {
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  DATE: 'date',
  MIXED: 'mixed',
  NUMBER: 'number',
  OBJECT: 'object',
  STRING: 'string',
};

const isYupType = (value) => includes(values(YupTypesNames), value);

const getNormalizedConfig = (config) => {
  if (isString(config)) {
    if (isYupType(config)) {
      return {
        type: config,
      };
    }

    throw new Error(`Type ${config} is not valid type.`);
  }

  if (isPlainObject(config)) {
    if (isYupType(config.type)) {
      const methods = reduce(
        config,
        (result, value, key) => {
          if (key !== 'type') {
            result.push({
              name: key,
              args: value,
            });
          }

          return result;
        },
        [],
      );

      return {
        type: config.type,
        methods,
      };
    }

    throw new Error(`Type ${config.type} is not valid type.`);
  }

  throw new Error(`Invalid configuration (${toString(config)})`);
};

const getYupType = ({ type }) => {
  switch (type) {
    case YupTypesNames.ARRAY: return array();
    case YupTypesNames.BOOLEAN: return boolean();
    case YupTypesNames.DATE: return date();
    case YupTypesNames.MIXED: return mixed();
    case YupTypesNames.NUMBER: return number();
    case YupTypesNames.OBJECT: return object();
    case YupTypesNames.STRING: return string();
    default: throw new Error(`Type ${type} is not valid type.`);
  }
};

const applyMethodsOnType = (base, typeName, methods) => {
  let baseType = base;

  forEach(
    methods,
    ({ name, args }) => {
      if (isFunction(base[name])) {
        if (isBoolean(args)) {
          if (args) {
            baseType = baseType[name](args);
          }
        } else {
          baseType = baseType[name](args);
        }
      } else {
        throw new Error(`Invalid method ${name} on ${typeName} type`);
      }
    },
  );

  return baseType;
};

const getYupSchema = (config) => object().shape(
  mapValues(
    config,
    (c) => {
      const normalizedConfig = getNormalizedConfig(c);

      return applyMethodsOnType(
        getYupType(normalizedConfig),
        normalizedConfig.type,
        normalizedConfig.methods,
      );
    },
  ),
);

export {
  YupTypesNames,
  isYupType,
  getNormalizedConfig,
  getYupType,
  applyMethodsOnType,
  getYupSchema,
};
