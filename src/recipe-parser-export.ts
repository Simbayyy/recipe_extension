export let UNITS: RegExp = /(?<unit>[mkc]?[gl]|cs|cc|c.à.s|c.à.c|cuill(?:e|è)re?s? à (?:café|soupe)|gousses?|poignées?|bouts?)/gi
export let INGREDIENT: RegExp = /(?<ingredient>[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ’', -]+)/gi
export let AMOUNT : RegExp = /(?<amount>(?:\d+[\.,]?\d*(?:\s\d\/\d)?)|une?|deux)\s?/gi
export let parse_expression: RegExp = new RegExp(AMOUNT.source + UNITS.source + /(?:\n|\s)/.source + INGREDIENT.source, 'gi');

export let TIME : RegExp = /(?<prefix>[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ]*)[^\d]{0,3}(?<duree>\d+)\s(?<unite>(?:min|sec|h)|(?:minutes?|secondes?|heures?))/g

export let WORDS_TO_REMOVE: RegExp = / (bonnes?|grosses?|petites?|belles?|beaux?)/g
let no_text_error = "Error: no text found"
let text = document?.body.innerText || document?.body.textContent || no_text_error

export function remove_comments_and_parse(text:string):RegExpMatchArray[][] {
    let COMMENTS_To_REMOVE: RegExp = /Comment\w.*/gi
    let split_text = text.split(COMMENTS_To_REMOVE)
    let split_results = split_text.map((fragment) => {
        return parse_recipe(fragment)
    })
    return split_results.find((elt) => {return elt[0].length != 0}) || [[],[]]
}

export function parse_recipe(text:string) {
    let text_parsed = text.replace(WORDS_TO_REMOVE, "")

    let match_ingredient = text_parsed.matchAll(parse_expression) 
    let match_array_ingredient = match_ingredient ? Array.from(match_ingredient) : []
    
    let match_time = text_parsed.matchAll(TIME)
    let match_array_time = match_ingredient ? Array.from(match_time) : []
    
    return [match_array_ingredient, match_array_time]
}

export function prepare_ingredient(ingredient_data:RegExpMatchArray){

    function convert_amount(amount_string:string): Number{
        let amount_number
        if (Number(amount_string) > 0){
            amount_number = Number(amount_string)
        } else if (amount_string.match(/une?/i)) {
            amount_number = 1
        } else if (amount_string.match(/deux/i)) {
            amount_number = 2
        } else {
            amount_number = 0
        } 
        return amount_number
    }
    
    let ingredient: Ingredient = {
        amount: convert_amount(ingredient_data[1]),
        unit: harmonize_units(ingredient_data[2]),
        name: process_name(ingredient_data[3])
    }

    return ingredient
}

export function prepare_time(time_data:RegExpMatchArray){
    let time = {
        prefix: time_data[1],
        time: Number(time_data[2]),
        unit: harmonize_units(time_data[3])
    }

    return time
}

export function harmonize_units(unit:string) {
    if (unit.match(/(cs|cuill(?:e|è)re?s? (à|de) (?:soupe|table)|c.à.s)/)){
        return "cs"
    } else if (unit.match(/(cc|cuill(?:e|è)re?s? à café|c.à.c)/)){
        return "cc"
    } else if (unit.match(/^min/)){
        return "min"
    } else if (unit.match(/^sec/)){
        return "sec"
    } else if (unit.match(/^h/)){
        return "h"
    } else {
        return unit.replace(/s$/, "")
    }
}

export function select_time(times: {time:Number, unit:string, prefix:string}[]) {
    let maybe_total = times.find((time) => {
        time.prefix.match(/totale?s?/i)
    })
    if (maybe_total) {
        return {unit: maybe_total.unit, time: maybe_total.time}
    } else {
        let max_per_unit = ["h","min","sec"].map((unit) => {
            let filtered_times = times.filter((time) => {
                return time.unit == unit
            })
            if (filtered_times.length > 0) {
                let reduced_times = filtered_times.reduce((max, time) => {
                    return max.time > time.time ? max : time
                })
                return {unit: reduced_times.unit, time:reduced_times.time}
            } else {
                return {time: 0, unit: unit}
            }
        })
        let max_overall = max_per_unit.find((elt) => elt.time != 0 )
        if (max_overall) {
            return max_overall
        } else {
            console.log(times)
            throw new Error('Could not find the recipe time')
        }
    } 
}

export function process_name(ingredient_name:string):string {
    let LINTER: RegExp = /^ ?((du|des? )|d\W)/
    let AFTER_OU_ET: RegExp = / (ou|et) .*/
    let TRIM_SPACE: RegExp = / $/
    return ingredient_name
        .replace(LINTER, "")
        .replace(AFTER_OU_ET, "")
        .replace(TRIM_SPACE, "")
}

export interface Time {
    time: Number,
    unit: string
}

export interface Ingredient {
    name: string,
    amount: Number,
    unit:string
}

export interface Recipe {
    name: string,
    url: string,
    time: Time,
    ingredients: Ingredient[]
}
export function post_recipe(recipe: Recipe, url: string) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
        var response = JSON.parse(xhr.response);
        if (response.status == 'success') {
            console.log(`Successful post of ${recipe} to ${url}`)
        }
    };
    xhr.send(JSON.stringify(recipe));
}

export function format_parsed_recipe(recipe: RegExpMatchArray[][]): Recipe {
    let ingredients = recipe[0].map(prepare_ingredient)
    let times = recipe[1].map(prepare_time)
    
    let time: Time = select_time(times)

    let url: string = window.location.href
    let title: string = document.getElementById("title")?.innerText || ""

    return {
        name: title,
        url: url,
        ingredients: ingredients,
        time: time
    }
}