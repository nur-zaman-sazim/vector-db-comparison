import { flattenObjectForMapping } from "../pdf-generation.helpers";

describe("flattenObjectForMapping", () => {
  it("should be defined", () => {
    expect(flattenObjectForMapping).toBeDefined();
  });

  it("should return an empty object when given an empty object", () => {
    const emptyObject = {};
    expect(flattenObjectForMapping(emptyObject)).toEqual(emptyObject);
  });

  it("should correctly flatten a simple nested object with multiple levels of nesting", () => {
    const nestedObject = {
      level1: {
        level2: {
          level3: {
            key: "value",
          },
        },
      },
    };
    const expectedOutput = {
      "level1.level2.level3.key": "value",
    };
    expect(flattenObjectForMapping(nestedObject)).toEqual(expectedOutput);
  });

  it("should handle objects with arrays of primitive values", () => {
    const obj = {
      key1: [1, 2, 3],
      key2: [4, 5, 6],
    };
    expect(flattenObjectForMapping(obj)).toEqual({
      "key1[0]": 1,
      "key1[1]": 2,
      "key1[2]": 3,
      "key2[0]": 4,
      "key2[1]": 5,
      "key2[2]": 6,
    });
  });

  it("should handle objects with array and object values", () => {
    const input = { key1: { key2: { key3: 0, key4: [1, 2, 3] } } };
    const expected = {
      "key1.key2.key3": 0,
      "key1.key2.key4[0]": 1,
      "key1.key2.key4[1]": 2,
      "key1.key2.key4[2]": 3,
    };
    expect(flattenObjectForMapping(input)).toEqual(expected);
  });

  it("should handle objects with arrays of objects", () => {
    const obj = {
      key1: [{ nestedKey1: "value1" }, { nestedKey2: "value2" }],
      key2: [{ nestedKey3: "value3" }],
    };
    expect(flattenObjectForMapping(obj)).toEqual({
      "key1[0].nestedKey1": "value1",
      "key1[1].nestedKey2": "value2",
      "key2[0].nestedKey3": "value3",
    });
  });

  it("should correctly flatten an object with mixed types", () => {
    const date = new Date();
    const obj = {
      key1: "value1",
      key2: 123,
      key3: true,
      key4: {
        nestedKey1: "nestedValue1",
        nestedKey2: 456,
        nestedKey3: false,
        nestedDate: date,
      },
      key5: [1, "two", false],
    };
    const expectedOutput = {
      key1: "value1",
      key2: 123,
      key3: true,
      "key4.nestedKey1": "nestedValue1",
      "key4.nestedKey2": 456,
      "key4.nestedKey3": false,
      "key4.nestedDate": date,
      "key5[0]": 1,
      "key5[1]": "two",
      "key5[2]": false,
    };
    expect(flattenObjectForMapping(obj)).toEqual(expectedOutput);
  });

  it("should omit values with keys with empty arrays and objects", () => {
    const obj = {
      key1: [],
      key2: {
        nestedKey1: "value1",
        nestedKey2: [],
      },
      key3: {
        subKey3: {
          nestedKey1: "value2",
        },
      },
      key4: {},
    };
    const expectedOutput = {
      "key2.nestedKey1": "value1",
      "key3.subKey3.nestedKey1": "value2",
    };
    expect(flattenObjectForMapping(obj)).toEqual(expectedOutput);
  });

  it("should handle objects with undefined and null values", () => {
    const nestedObject = {
      key1: "value1",
      key2: undefined,
      key3: {
        nestedKey1: "subValue1",
        nestedKey2: null,
      },
    };
    const expectedOutput = {
      key1: "value1",
      key2: undefined,
      "key3.nestedKey1": "subValue1",
      "key3.nestedKey2": null,
    };
    expect(flattenObjectForMapping(nestedObject)).toEqual(expectedOutput);
  });

  it("should handle deeply nested arrays", () => {
    const input = { key1: [[[{ key2: 1 }]]] };
    const expected = { "key1[0][0][0].key2": 1 };
    expect(flattenObjectForMapping(input)).toEqual(expected);
  });

  it("should handle deeply nested arrays with date field", () => {
    const date = new Date();
    const input = { key1: [[[{ key2: date }]]] };
    const expected = { "key1[0][0][0].key2": date };
    expect(flattenObjectForMapping(input)).toEqual(expected);
  });

  it("should handle mixed nested objects and arrays", () => {
    const input = {
      key1: [{ key2: 2 }, [{ key3: 3 }]],
      key4: {
        key5: [4, 5],
      },
    };
    const expected = {
      "key1[0].key2": 2,
      "key1[1][0].key3": 3,
      "key4.key5[0]": 4,
      "key4.key5[1]": 5,
    };
    expect(flattenObjectForMapping(input)).toEqual(expected);
  });

  it("should handle mixed types in arrays", () => {
    const input = { key1: [1, { key2: 2 }, [3]] };
    const expected = { "key1[0]": 1, "key1[1].key2": 2, "key1[2][0]": 3 };
    expect(flattenObjectForMapping(input)).toEqual(expected);
  });
});
