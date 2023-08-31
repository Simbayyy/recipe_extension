"use strict";
/**
 * @jest-environment jsdom
 */
Object.defineProperty(exports, "__esModule", { value: true });
const recipe_parser_export_1 = require("../recipe-parser-export");
test('Unit harmonizing', () => {
    expect((0, recipe_parser_export_1.harmonize_units)("cuillers à soupe")).toEqual("cs");
    expect((0, recipe_parser_export_1.harmonize_units)("cuillère à café")).toEqual("cc");
    expect((0, recipe_parser_export_1.harmonize_units)("minutes")).toEqual("min");
    expect((0, recipe_parser_export_1.harmonize_units)("seconde")).toEqual("sec");
});
test('Time selection', () => {
    let times = [
        {
            time: 10,
            unit: "min",
            prefix: "total"
        }
    ];
    expect((0, recipe_parser_export_1.select_time)(times)).toEqual({ time: 10, unit: "min" });
});
