import { parse } from "./parser";
import { merge } from "./merger";
import yargs from "yargs";
import chalk from "chalk";
import * as fs from "fs";
import * as yaml from "js-yaml";

(() => {
    yargs(process.argv.slice(2))
        .version("0.0.1")
        .scriptName("glcm")
        .wrap(yargs.terminalWidth())
        .command({
            handler: async (argv: any) => {
                try {
                    if (typeof argv._ === "undefined" || !argv._.length) {
                        if (argv.v) {
                            process.stdout.write(`No files defined, using default`);
                        }
                        argv._ = ["./.gitlab-ci.yml"]
                    }
                    if (argv.v) {
                        process.stdout.write(`${argv._.length} selected file(s):\n`);
                        for (let i = 0; i < argv._.length; ++i) {
                            process.stdout.write(`- ${yaml.dump(argv._[i])}`);
                        }
                    }
                    var glData = parse(argv._);
                    if (argv.v) {
                        process.stdout.write("Parsed data: \n");
                        for (let i = 0; i < glData.length; ++i) {
                            process.stdout.write(`${i}:\n${yaml.dump(glData[i])}`);
                        }
                        for (let i = 0; i < yargs.terminalWidth(); ++i) {
                            process.stdout.write("-");
                        }
                        process.stdout.write("\n");
                    }
                    var mergedGlData = merge(glData);
                    if (argv.o === "-") {
                        process.stdout.write(`---\n${yaml.dump(mergedGlData)}`);
                    } else {
                        fs.writeFileSync(argv.o, `---\n${yaml.dump(mergedGlData)}`);
                    }
                } catch (e: any) {
                    process.stderr.write(chalk`{red ${e.message ?? "unexpected failure.\n"}}\n`);
                    process.exit(1);
                }
            },
            command: "$0 [.gitlab-ci.yml]",
            describe: "Parses and generates a merged version of the indicated yaml files",
        })
        .option("o", {
            alias: "output-file",
            default: "./.gitlab-ci-merged.yml",
            describe: "File to output merged yml",
            type: "string"
        })
        .option("v", {
            alias: "verbose",
            default: false,
            describe: "Verbose output",
            type: "boolean"
        })
        .parse()
})();
