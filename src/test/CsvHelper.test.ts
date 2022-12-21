
import * as assert from 'assert';
import CsvHelper from '../helpers/CsvHelper';
import { LocaleKeyValue } from '../models/LocaleKeyValue';
import { CsvDataArray } from '../helpers/CsvDataArray';
import { CsvDataExcel } from '../helpers/CsvDataExcel';

suite('CsvHelper.findInsertPosition typescript tests', () => {

  const csvData = [
    ['key', 'en-us', 'de-de', 'hw'],
    ['BBB', 'en BBB', 'de BBB', 'x'],
    ['DDD', 'en DDD', 'de DDD', 'x'],
    ['FFF', 'en FFF', 'de FFF', 'x']
  ];

  const testCsv = (data: string[][], keyValuePairs: LocaleKeyValue[], localeName: string, resourceName: string): string[][] => {
    const arr = new CsvDataArray(data);
    CsvHelper.updateData(arr, keyValuePairs, localeName, resourceName);
    return arr.getData();
  };

  const testExcel = (data: string[][], keyValuePairs: LocaleKeyValue[], localeName: string, resourceName: string): string[][] => {
    const arr = new CsvDataExcel(data);
    CsvHelper.updateData(arr, keyValuePairs, localeName, resourceName);
    return arr.getData();
  };

  [
    { name: "CSV", testOne: testCsv},
    { name: "Excel", testOne: testExcel}
  ].forEach( ({ name, testOne }) => {

    test(`${name} simple insert: AAA`, () => {
      const actual = testOne([...csvData], [{ key: 'AAA', value: 'AAA' }], 'en-us', 'hw');
      const expected = [
        ['key', 'en-us', 'de-de', 'hw'],
        ['AAA', 'AAA', '', 'x'],
        ['BBB', 'en BBB', 'de BBB', 'x'],
        ['DDD', 'en DDD', 'de DDD', 'x'],
        ['FFF', 'en FFF', 'de FFF', 'x']
      ];
      assert.deepStrictEqual(actual, expected);
    });

    test(`${name} simple insert: CCC`, () => {
      const actual = testOne([...csvData], [{ key: 'CCC', value: 'CCC' }], 'en-us', 'hw');
      const expected = [
        ['key', 'en-us', 'de-de', 'hw'],
        ['BBB', 'en BBB', 'de BBB', 'x'],
        ['CCC', 'CCC', '', 'x'],
        ['DDD', 'en DDD', 'de DDD', 'x'],
        ['FFF', 'en FFF', 'de FFF', 'x']
      ];
      assert.deepStrictEqual(actual, expected);
    });

    test(`${name} simple insert: EEE`, () => {
      const actual = testOne([...csvData], [{ key: 'EEE', value: 'EEE' }], 'en-us', 'hw');
      const expected = [
        ['key', 'en-us', 'de-de', 'hw'],
        ['BBB', 'en BBB', 'de BBB', 'x'],
        ['DDD', 'en DDD', 'de DDD', 'x'],
        ['EEE', 'EEE', '', 'x'],
        ['FFF', 'en FFF', 'de FFF', 'x']
      ];
      assert.deepStrictEqual(actual, expected);
    });

    test(`${name} simple insert: ZZZ`, () => {
      const actual = testOne([...csvData], [{ key: 'ZZZ', value: 'ZZZ' }], 'en-us', 'hw');
      const expected = [
        ['key', 'en-us', 'de-de', 'hw'],
        ['BBB', 'en BBB', 'de BBB', 'x'],
        ['DDD', 'en DDD', 'de DDD', 'x'],
        ['FFF', 'en FFF', 'de FFF', 'x'],
        ['ZZZ', 'ZZZ', '', 'x']
      ];
      assert.deepStrictEqual(actual, expected);
    });

    test(`${name} empty`, () => {
      const actual = testOne([], [{ key: 'ZZZ', value: 'ZZZ' }], 'en-us', 'hw');
      const expected: string[][] = [];
      assert.deepStrictEqual(actual, expected);
    });

    test(`${name} single line`, () => {
      const actual = testOne([['key', 'en-us', 'de-de', 'hw']], [{ key: 'ZZZ', value: 'ZZZ' }], 'en-us', 'hw');
      const expected = [
        ['key', 'en-us', 'de-de', 'hw'],
        ['ZZZ', 'ZZZ', '', 'x']
      ];
      assert.deepStrictEqual(actual, expected);
    });

    test(`${name} unsorted`, () => {
      const actual = testOne([
        ['key', 'en-us', 'de-de', 'hw'],
        ['BBB2', 'BBB2', 'BBB2', 'x'],
        ['BBB1', 'BBB1', 'BBB1', 'x'],
      ], [{ key: 'BBB3', value: 'BBB3' }], 'en-us', 'hw');
      const expected = [
        ['key', 'en-us', 'de-de', 'hw'],
        ['BBB2', 'BBB2', 'BBB2', 'x'],
        ['BBB1', 'BBB1', 'BBB1', 'x'],
        ['BBB3', 'BBB3', '', 'x'],
      ];
      assert.deepStrictEqual(actual, expected);
    });
  });
});
