import * as yaml from "js-yaml";
import * as fs from "fs";
import { assert } from "console";
import chalk from "chalk";
import deepExtend from "deep-extend";

function parseIncludeList(includeList: any): any[] {
    if (!includeList) {
        return []
    }
    if (includeList.length == null || typeof includeList === "string") {
        includeList = [includeList];
    }
    for (const [index, entry] of Object.entries(includeList)) {
        if (typeof entry === "string") {
            if (entry.startsWith("https:") || entry.startsWith("http:")) {
                includeList[index] = { "remote": entry };
            } else {
                includeList[index] = { "local": entry };
            }
        } else {
            includeList[index] = entry;
        }
    }
    return includeList;
}

function expandIncludes(fromYaml: any, depth: number): any[] {
    depth++;
    assert(depth < 100 /*consistent with gitlab's limit as far as I know*/, chalk`includes nested too deep`);

    let expandedIncludes: any[] = [];

    fromYaml.include = parseIncludeList(fromYaml.include);

    for (let i = fromYaml.include.length - 1; i >= 0; --i) {
        var value: any = fromYaml.include[i];
        if (value.local) {
            const fileExists = fs.existsSync(`./${value.local}`);
            if (!fileExists) {
                throw Error(`local include file cannot be found ./${value.local}\n`);
            }
            fromYaml.include.splice(i, 1);
            const localYml = read(`./${value.local}`);
            expandedIncludes = expandedIncludes.concat(expandIncludes(localYml, depth));
        } // other include types are not added yet
    }

    expandedIncludes.push(fromYaml);
    return expandedIncludes;
}

function read(filePath: string): any {
    const referenceType = new yaml.Type("!reference", {
        kind: "sequence",
        construct: function (data) {
            return { referenceData: data };
        },
    });
    const schema = yaml.DEFAULT_SCHEMA.extend([referenceType]);

    if (!fs.existsSync(filePath)) {
        throw Error(`${filePath} doesn't exist\n`);
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    return yaml.load(fileContent, { schema });
}

export function parse(files: string[]): any[] {
    const yamls: any[] = []

    try {
        for (let i = 0; i < files.length; ++i) {
            const filePath: string = files[i];
            const parsedYaml = read(filePath)
            parsedYaml && yamls.push(parsedYaml);
        }
        for (let i = 0; i < yamls.length; ++i) {
            const expandedYaml: any = expandIncludes(yamls[i], 0);
            var includes: any = [];
            for (let i = 0; i < expandedYaml.length; ++i) {
                includes = includes.concat(expandedYaml[i].include ?? []);
            } // preserve includes that we don't expand
            expandedYaml[expandedYaml.length - 1].include = includes
            yamls[i] = deepExtend({}, ...expandedYaml)
        }
        return yamls;
    } catch (e: any) {
        process.stderr.write(`error: ${e.message}\n`);
        throw Error("there was a problem parsing the files\n");
    }
}
