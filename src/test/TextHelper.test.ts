import * as assert from 'assert';
import TextHelper from '../helpers/TextHelper';

// typescript (strings.d.ts) update tests
suite('TextHelper.findInsertPosition typescript tests', () => {

  const lines = [
    'declare interface Foo {',
    '  BBB: string;',
    '  DDD: string;',
    '  FFF: string;',
    '}',
  ];

  test('simple insert: AAA', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'AAA', TextHelper.findPositionTs), 0);
  });
  test('simple insert: CCC', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'CCC', TextHelper.findPositionTs), 1);
  });
  test('simple insert: EEE', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'EEE', TextHelper.findPositionTs), 2);
  });
  test('simple insert: ZZZ', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'ZZZ', TextHelper.findPositionTs), 3);
  });

  test('default', () => {

    const lines = [
      'declare interface Foo {',
      '}',
    ];

    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB', TextHelper.findPositionTs), 0);
  });

  test('invalid', () => {

    const lines = [
      'class XYZ {',
      'AA: string;',
      '}',
    ];

    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB', TextHelper.findPositionTs), -1);
  });

  test('empty', () => {
    const lines: string[] = [];
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB', TextHelper.findPositionTs), -1);
  });

  test('unsorted', () => {
    const lines = [
      'declare interface Foo {',
      '  BBB2: string;',
      '  BBB1: string;',
      '}',
    ];
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB3', TextHelper.findPositionTs), 2);
  });

});


// javascript udpate tests (en-us.js, etc)
suite('TextHelper.findInsertPosition javascript tests', () => {

  const lines = [
    'define([], function() {',
    'return {',
    '  BBB: "B",',
    '  DDD: "D",',
    '  FFF: "F",',
    '  };',
    '});'
  ];

  test('simple insert: AAA', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'AAA', TextHelper.findPositionJs), 1);
  });
  test('simple insert: CCC', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'CCC', TextHelper.findPositionJs), 2);
  });
  test('simple insert: EEE', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'EEE', TextHelper.findPositionJs), 3);
  });
  test('simple insert: ZZZ', () => {
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'ZZZ', TextHelper.findPositionJs), 4);
  });

  test('default', () => {

    const lines = [
      'define([], function() {',
      'return {',
      '  };',
      '});'
    ];

    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB', TextHelper.findPositionJs), 1);
  });

  test('invalid', () => {

    const lines = [
      'var xy = asdf',
      '}',
    ];

    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB', TextHelper.findPositionJs), -1);
  });

  test('empty', () => {
    const lines: string[] = [];
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB', TextHelper.findPositionJs), -1);
  });

  test('unsorted', () => {
    const lines = [
      'define([], function() {',
      'return {',
      '  BBB2: "bbb2",',
      '  BBB1: "bbb1",',
      '  };',
      '});'
    ];
    assert.strictEqual(TextHelper.findInsertPosition(lines, 'BBB3', TextHelper.findPositionJs), 3);
  });

});
