import * as path from "path";
import * as cli from "build-utils/cli";
import {copyFile, copyGlob, deleteDirectory, readJSONFile} from "build-utils/fs";
import {mergeConfig, updateConfig} from "build-utils/config";
import {exec} from "build-utils/process";

cli.command("patch", patch);
cli.command("pack", pack);
cli.command("test", test);
cli.run();

export async function test() {
    await compileTS();
    await jasmine();
}

async function compileTS() {
    console.log("Compiling typescript");

    await exec(path.resolve("node_modules/.bin/tsc"));
}

async function jasmine() {
    await exec(path.resolve("node_modules/.bin/jasmine"));
}

export async function pack() {
    console.log("Creating npm package");

    await mergeConfig("./tsconfig.json", "./build/tsconfig.pack.json", "./tsconfig.pack.json");

    await deleteDirectory("./build_tmp");
    await deleteDirectory("./package");

    await exec(path.resolve("node_modules/.bin/tsc") + " -p ./tsconfig.pack.json");

    await exec("node_modules/.bin/rollup -c build/rollup.config.js");
    await exec("node_modules/.bin/rollup -c build/rollup.config.js -f es -o package/t-rex.es2015.js");

    //await copyGlob("./build_tmp/fx/*.js", "./package");
    await copyGlob("./build_tmp/fx/*.d.ts", "./package");
    await copyFile("./package.json", "package/package.json");
    await updateConfig("package/package.json", {devDependencies: {}}, false);
}

export async function patch() {
    await pack();

    await exec("npm version patch", {
        cwd: "./package",
    });

    await copyFile("../readme.md", "package/readme.md");

    await exec("npm publish", {
        cwd: "./package",
    });

    await copyFile("package/package.json", "./package.json");

    const {version} = await readJSONFile("./package.json");

    await exec(`git commit -a -m v${version}`);

    await exec(`git push`);
}
