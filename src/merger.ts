import deepExtend from "deep-extend";
import { assert } from "console";
import chalk from "chalk";
import * as fs from "fs";
import { read } from "./io";

function expandReferences(gitlabData: any, recurseData: any): void {
    for (const [key, value] of Object.entries<any>(recurseData || {})) {
        if (value && value.referenceData) {
            recurseData[key] = getSubDataByReference(gitlabData, value.referenceData);
        } else if (typeof value === "object") {
            expandReferences(gitlabData, value);
        }
    }
}

function getSubDataByReference(gitlabData: any, referenceData: string[]): void {
    let gitlabSubData = gitlabData;
    referenceData.forEach((referencePointer) => {
        assert(gitlabSubData[referencePointer] != null, `!reference [${referenceData.join(", ")}] is undefined`);
        gitlabSubData = gitlabSubData[referencePointer];
    });
    return gitlabSubData;
};

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

export function merge(data: any[]): any {
    for (let i = 0; i < data.length; ++i) {
        const expandedYaml: any = expandIncludes(data[i], 0);
        var includes: any = [];
        for (let i = 0; i < expandedYaml.length; ++i) {
            includes = includes.concat(expandedYaml[i].include ?? []);
        } // preserve includes that we don't expand
        expandedYaml[expandedYaml.length - 1].include = includes;
        data[i] = deepExtend({}, ...expandedYaml);
    }
    var mergedYaml = deepExtend({}, ...data);
    expandReferences(mergedYaml, mergedYaml);
    return mergedYaml;
}
