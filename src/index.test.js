import { parse } from 'date-fns';
import { ValidationError } from 'yup';

import {
  YupTypesNames,
  isYupType,
  getNormalizedConfig,
  getYupType,
  getYupSchema,
} from './index';

describe('qe-json-to-yup', () => {
  test('isYupType', () => {
    expect(isYupType('array'))
      .toEqual(true);
    expect(isYupType('boolean'))
      .toEqual(true);
    expect(isYupType('date'))
      .toEqual(true);
    expect(isYupType('mixed'))
      .toEqual(true);
    expect(isYupType('number'))
      .toEqual(true);
    expect(isYupType('object'))
      .toEqual(true);
    expect(isYupType('string'))
      .toEqual(true);
    expect(isYupType('password'))
      .toEqual(false);
  });

  describe('getNormalizedConfig', () => {
    test('type', () => {
      expect(getNormalizedConfig('string'))
        .toEqual({ type: YupTypesNames.STRING });
      expect(getNormalizedConfig({ type: 'string' }))
        .toEqual({ type: YupTypesNames.STRING, methods: [] });

      expect(() => {
        getNormalizedConfig('password');
      }).toThrow('Type password is not valid type.');
      expect(() => {
        getNormalizedConfig({ required: true });
      }).toThrow('Type undefined is not valid type.');
      expect(() => {
        getNormalizedConfig([]);
      }).toThrow('Invalid configuration ()');
      expect(() => {
        getNormalizedConfig(true);
      }).toThrow('Invalid configuration (true)');
    });

    test('methods', () => {
      expect(getNormalizedConfig({
        type: 'string',
        required: true,
      }))
        .toEqual({
          type: YupTypesNames.STRING,
          methods: [
            {
              name: 'required',
              args: true,
            },
          ],
        });
      expect(getNormalizedConfig({
        type: 'string',
        required: true,
        min: 3,
        max: 5,
      }))
        .toEqual({
          type: YupTypesNames.STRING,
          methods: [
            {
              name: 'required',
              args: true,
            },
            {
              name: 'min',
              args: 3,
            },
            {
              name: 'max',
              args: 5,
            },
          ],
        });
    });
  });

  describe('getYupType', () => {
    test('array', () => {
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType([]))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType([1, 2, 3]))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.ARRAY }).isType(true))
        .toEqual(false);
    });
    test('boolean', () => {
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType(true))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType(false))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.BOOLEAN }).isType('true'))
        .toEqual(false);
    });
    test('date', () => {
      expect(getYupType({ type: YupTypesNames.DATE }).isType(new Date()))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.DATE }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.DATE }).isType(true))
        .toEqual(false);
    });
    test('number', () => {
      expect(getYupType({ type: YupTypesNames.NUMBER }).isType(1))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.NUMBER }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.NUMBER }).isType(true))
        .toEqual(false);
    });
    test('string', () => {
      expect(getYupType({ type: YupTypesNames.STRING }).isType('Lorem Ipsum'))
        .toEqual(true);
      expect(getYupType({ type: YupTypesNames.STRING }).isType())
        .toEqual(false);
      expect(getYupType({ type: YupTypesNames.STRING }).isType(true))
        .toEqual(false);
    });
  });

  describe('getYupSchema', () => {
    test('types', () => {
      const yupSchema = getYupSchema({
        id: 'number',
        username: 'string',
        password: 'string',
        active: 'boolean',
        created: 'date',
        tags: 'array',
      });

      expect(yupSchema.isValidSync({
        id: 1,
        username: 'petar',
        password: 'test123',
        active: true,
        created: new Date(),
        tags: ['javascript', 'html', 'css'],
      }))
        .toEqual(true);
      expect(yupSchema.isValidSync({
        id: '1',
        username: 'petar',
        password: 'test123',
        active: 'true',
        created: '2020-04-17',
      }))
        .toEqual(true);
      expect(yupSchema.isValidSync({
        id: 'a',
        username: 'petar',
        password: 'test123',
        active: true,
        created: new Date(),
      }))
        .toEqual(false);
    });

    test('methods', () => {
      const yupSchema = getYupSchema({
        id: {
          type: 'number',
          min: 5,
          max: 10,
        },
        username: {
          type: 'string',
          required: true,
          min: 8,
          max: 12,
        },
        password: {
          type: 'string',
          required: true,
          matches: /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/,
        },
        active: {
          type: 'boolean',
        },
        created: {
          type: 'date',
          min: parse('2020-04-15', 'yyyy-MM-dd', new Date()),
          max: parse('2020-04-20', 'yyyy-MM-dd', new Date()),
        },
        tags: {
          type: 'array',
          min: 3,
        },
      });

      expect(
        yupSchema.validateSync(
          {
            id: 6,
            username: 'petar1983',
            password: 'Test1234!',
            active: true,
            created: parse('2020-04-17', 'yyyy-MM-dd', new Date()),
            tags: ['javascript', 'html', 'css'],
          },
          { abortEarly: false },
        ),
      )
        .toEqual({
          id: 6,
          username: 'petar1983',
          password: 'Test1234!',
          active: true,
          created: parse('2020-04-17', 'yyyy-MM-dd', new Date()),
          tags: ['javascript', 'html', 'css'],
        });

      expect(() => {
        yupSchema.validateSync(
          {
            id: 1,
            username: 'petar',
            password: 'teeessst',
            active: true,
            created: parse('2020-04-21', 'yyyy-MM-dd', new Date()),
            tags: ['javascript', 'html'],
          },
          { abortEarly: false },
        );
      })
        .toThrowError(ValidationError);
    });

    test('exceptions', () => {
      expect(() => {
        getYupSchema({
          username: 'string',
          passowrd: 'password',
        });
      }).toThrow('Type password is not valid type.');

      expect(() => {
        getYupSchema({
          passowrd: {
            type: 'string',
            required: true,
            min: 3,
            max: 5,
            password: true,
          },
        });
      }).toThrow('Invalid method password on string type');
    });
  });
});
