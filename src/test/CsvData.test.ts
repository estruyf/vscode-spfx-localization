import * as assert from 'assert';
import * as fs from 'fs';
import { CsvDataArray } from '../helpers/CsvDataArray';
import { CsvDataExcel } from '../helpers/CsvDataExcel';

suite('CsvData file tests', () => {

  const expected = [
    ['key', 'en-us', 'de-de', 'hw'],
    ['BBB', 'en BBB', 'de BBB', 'x'],
    ['DDD', 'en DDD', 'de DDD', 'x'],
    ['FFF', 'en FFF', 'de FFF', 'x']
  ];

  [
    { name: "testdata98793.csv", csvData: new CsvDataArray(expected) }, 
    { name: "testdata98793.xlsx", csvData: new CsvDataExcel(expected) }
  ].forEach(({ name, csvData }) => {

    test(`read-write ${name}`, async () => {
      fs.unlinkSync(name);
      await csvData.write(name, { delimiter: ';', bom: true });
      await csvData.read(name, { delimiter: ';', bom: true });
      fs.unlinkSync(name);
      const actual = csvData.getData();
      assert.deepStrictEqual(actual, expected);
    });
  })
});