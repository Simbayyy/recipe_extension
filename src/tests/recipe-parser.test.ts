/**
 * @jest-environment jsdom
 */

import { harmonize_units, select_time } from '../recipe-parser-export'

test('Unit harmonizing', () => {
    expect(harmonize_units("cuillers à soupe")).toEqual("cs");
    expect(harmonize_units("cuillère à café")).toEqual("cc");
    expect(harmonize_units("minutes")).toEqual("min");
    expect(harmonize_units("seconde")).toEqual("sec");
})

test('Time selection', () => {
    let times = [
        {
            time: 10,
            unit: "min",
            prefix: "total"
        }
    ]
    expect(select_time(times)).toEqual({time:10,unit:"min"})
})