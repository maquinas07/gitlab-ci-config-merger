import { read } from './io'

export function parse(files: string[]): any[] {
    const yamls: any[] = []

    try {
        for (let i = 0; i < files.length; ++i) {
            const filePath: string = files[i];
            const parsedYaml = read(filePath)
            parsedYaml && yamls.push(parsedYaml);
        }
        return yamls;
    } catch (e: any) {
        process.stderr.write(`error: ${e.message}\n`);
        throw Error("there was a problem parsing the files\n");
    }
}
