import * as yaml from "js-yaml";
import * as fs from "fs";

export function read(filePath: string): any {
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
