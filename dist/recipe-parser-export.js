"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format_parsed_recipe = exports.post_recipe = exports.process_name = exports.select_time = exports.harmonize_units = exports.prepare_time = exports.prepare_ingredient = exports.parse_recipe = exports.remove_comments_and_parse = exports.WORDS_TO_REMOVE = exports.TIME = exports.parse_expression = exports.AMOUNT = exports.INGREDIENT = exports.UNITS = void 0;
exports.UNITS = /(?<unit>[mkc]?[gl]|cs|cc|c.à.s|c.à.c|cuill(?:e|è)re?s? à (?:café|soupe)|gousses?|poignées?|bouts?)/gi;
exports.INGREDIENT = /(?<ingredient>[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ’', -]+)/gi;
exports.AMOUNT = /(?<amount>(?:\d+[\.,]?\d*(?:\s\d\/\d)?)|une?|deux)\s?/gi;
exports.parse_expression = new RegExp(exports.AMOUNT.source + exports.UNITS.source + /(?:\n|\s)/.source + exports.INGREDIENT.source, 'gi');
exports.TIME = /(?<prefix>[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ]*)[^\d]{0,3}(?<duree>\d+)\s(?<unite>(?:min|sec|h)|(?:minutes?|secondes?|heures?))/g;
exports.WORDS_TO_REMOVE = / (bonnes?|grosses?|petites?|belles?|beaux?)/g;
let no_text_error = "Error: no text found";
let text = (document === null || document === void 0 ? void 0 : document.body.innerText) || (document === null || document === void 0 ? void 0 : document.body.textContent) || no_text_error;
function remove_comments_and_parse(text) {
    let COMMENTS_To_REMOVE = /Comment\w.*/gi;
    let split_text = text.split(COMMENTS_To_REMOVE);
    let split_results = split_text.map((fragment) => {
        return parse_recipe(fragment);
    });
    return split_results.find((elt) => { return elt[0].length != 0; }) || [[], []];
}
exports.remove_comments_and_parse = remove_comments_and_parse;
function parse_recipe(text) {
    let text_parsed = text.replace(exports.WORDS_TO_REMOVE, "");
    let match_ingredient = text_parsed.matchAll(exports.parse_expression);
    let match_array_ingredient = match_ingredient ? Array.from(match_ingredient) : [];
    let match_time = text_parsed.matchAll(exports.TIME);
    let match_array_time = match_ingredient ? Array.from(match_time) : [];
    return [match_array_ingredient, match_array_time];
}
exports.parse_recipe = parse_recipe;
function prepare_ingredient(ingredient_data) {
    function convert_amount(amount_string) {
        let amount_number;
        if (Number(amount_string) > 0) {
            amount_number = Number(amount_string);
        }
        else if (amount_string.match(/une?/i)) {
            amount_number = 1;
        }
        else if (amount_string.match(/deux/i)) {
            amount_number = 2;
        }
        else {
            amount_number = 0;
        }
        return amount_number;
    }
    let ingredient = {
        amount: convert_amount(ingredient_data[1]),
        unit: harmonize_units(ingredient_data[2]),
        name: process_name(ingredient_data[3])
    };
    return ingredient;
}
exports.prepare_ingredient = prepare_ingredient;
function prepare_time(time_data) {
    let time = {
        prefix: time_data[1],
        time: Number(time_data[2]),
        unit: harmonize_units(time_data[3])
    };
    return time;
}
exports.prepare_time = prepare_time;
function harmonize_units(unit) {
    if (unit.match(/(cs|cuill(?:e|è)re?s? (à|de) (?:soupe|table)|c.à.s)/)) {
        return "cs";
    }
    else if (unit.match(/(cc|cuill(?:e|è)re?s? à café|c.à.c)/)) {
        return "cc";
    }
    else if (unit.match(/^min/)) {
        return "min";
    }
    else if (unit.match(/^sec/)) {
        return "sec";
    }
    else if (unit.match(/^h/)) {
        return "h";
    }
    else {
        return unit.replace(/s$/, "");
    }
}
exports.harmonize_units = harmonize_units;
function select_time(times) {
    let maybe_total = times.find((time) => {
        time.prefix.match(/totale?s?/i);
    });
    if (maybe_total) {
        return { unit: maybe_total.unit, time: maybe_total.time };
    }
    else {
        let max_per_unit = ["h", "min", "sec"].map((unit) => {
            let filtered_times = times.filter((time) => {
                return time.unit == unit;
            });
            if (filtered_times.length > 0) {
                let reduced_times = filtered_times.reduce((max, time) => {
                    return max.time > time.time ? max : time;
                });
                return { unit: reduced_times.unit, time: reduced_times.time };
            }
            else {
                return { time: 0, unit: unit };
            }
        });
        let max_overall = max_per_unit.find((elt) => elt.time != 0);
        if (max_overall) {
            return max_overall;
        }
        else {
            console.log(times);
            throw new Error('Could not find the recipe time');
        }
    }
}
exports.select_time = select_time;
function process_name(ingredient_name) {
    let LINTER = /^ ?((du|des? )|d\W)/;
    let AFTER_OU_ET = / (ou|et) .*/;
    let TRIM_SPACE = / $/;
    return ingredient_name
        .replace(LINTER, "")
        .replace(AFTER_OU_ET, "")
        .replace(TRIM_SPACE, "");
}
exports.process_name = process_name;
function post_recipe(recipe, url) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
        var response = JSON.parse(xhr.response);
        if (response.status == 'success') {
            console.log(`Successful post of ${recipe} to ${url}`);
        }
    };
    xhr.send(JSON.stringify(recipe));
}
exports.post_recipe = post_recipe;
function format_parsed_recipe(recipe) {
    var _a;
    let ingredients = recipe[0].map(prepare_ingredient);
    let times = recipe[1].map(prepare_time);
    let time = select_time(times);
    let url = window.location.href;
    let title = ((_a = document.getElementById("title")) === null || _a === void 0 ? void 0 : _a.innerText) || "";
    return {
        name: title,
        url: url,
        ingredients: ingredients,
        time: time
    };
}
exports.format_parsed_recipe = format_parsed_recipe;
