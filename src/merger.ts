import deepExtend from "deep-extend";

export function merge(data: any[]): any {
    return deepExtend({}, ...data);
}
