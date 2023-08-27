/**
 * @jest-environment jsdom
 */

import { harmonize_units } from '../recipe-parser.js'

test('Unit harmonizing', () => {
    expect(harmonize_units("cuillers à soupe")).toEqual("cs");
    expect(harmonize_units("cuillère à café")).toEqual("cc");
    expect(harmonize_units("minutes")).toEqual("min");
    expect(harmonize_units("seconde")).toEqual("sec");
})