
import * as assert from 'assert';
import CsvHelper from '../helpers/CsvHelper';

suite('CsvHelper.findInsertPosition typescript tests', () => {

  const csvData = [
    ['key', 'en-us', 'de-de', 'hw'],
    ['BBB', 'en BBB', 'de BBB', 'x'],
    ['DDD', 'en DDD', 'de DDD', 'x'],
    ['FFF', 'en FFF', 'de FFF', 'x']
  ];

  test('simple insert: AAA', () => {
    const actual = CsvHelper.updateData([...csvData], [{ key: 'AAA', value: 'AAA' }], 'en-us', 'hw');
    const expected = [
      ['key', 'en-us', 'de-de', 'hw'],
      ['AAA', 'AAA', '', 'x'],
      ['BBB', 'en BBB', 'de BBB', 'x'],
      ['DDD', 'en DDD', 'de DDD', 'x'],
      ['FFF', 'en FFF', 'de FFF', 'x']
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test('simple insert: CCC', () => {
    const actual = CsvHelper.updateData([...csvData], [{ key: 'CCC', value: 'CCC' }], 'en-us', 'hw');
    const expected = [
      ['key', 'en-us', 'de-de', 'hw'],
      ['BBB', 'en BBB', 'de BBB', 'x'],
      ['CCC', 'CCC', '', 'x'],
      ['DDD', 'en DDD', 'de DDD', 'x'],
      ['FFF', 'en FFF', 'de FFF', 'x']
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test('simple insert: EEE', () => {
    const actual = CsvHelper.updateData([...csvData], [{ key: 'EEE', value: 'EEE' }], 'en-us', 'hw');
    const expected = [
      ['key', 'en-us', 'de-de', 'hw'],
      ['BBB', 'en BBB', 'de BBB', 'x'],
      ['DDD', 'en DDD', 'de DDD', 'x'],
      ['EEE', 'EEE', '', 'x'],
      ['FFF', 'en FFF', 'de FFF', 'x']
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test('simple insert: ZZZ', () => {
    const actual = CsvHelper.updateData([...csvData], [{ key: 'ZZZ', value: 'ZZZ' }], 'en-us', 'hw');
    const expected = [
      ['key', 'en-us', 'de-de', 'hw'],
      ['BBB', 'en BBB', 'de BBB', 'x'],
      ['DDD', 'en DDD', 'de DDD', 'x'],
      ['FFF', 'en FFF', 'de FFF', 'x'],
      ['ZZZ', 'ZZZ', '', 'x']
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test('empty', () => {
    const actual = CsvHelper.updateData([], [{ key: 'ZZZ', value: 'ZZZ' }], 'en-us', 'hw');
    const expected: string[][] = [];
    assert.deepStrictEqual(actual, expected);
  });

  test('single line', () => {
    const actual = CsvHelper.updateData([['key', 'en-us', 'de-de', 'hw']], [{ key: 'ZZZ', value: 'ZZZ' }], 'en-us', 'hw');
    const expected = [
      ['key', 'en-us', 'de-de', 'hw'],
      ['ZZZ', 'ZZZ', '', 'x']
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test('unsorted', () => {
    const actual = CsvHelper.updateData([
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
