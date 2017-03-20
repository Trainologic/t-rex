import * as path from "path";
import * as cli from "build-utils/cli";
import {copyGlob, copyFile, deleteDirectory, createDirectory} from "build-utils/fs";
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

    await deleteDirectory("./build_tmp");
    await deleteDirectory("./package");
    await exec(path.resolve("node_modules/.bin/tsc") + " -p ./build/tsconfig.pack.json");
    await createDirectory("./package");
    await copyGlob("./build_tmp/*.js", "./package");
    await copyGlob("./build_tmp/*.d.ts", "./package");
    await copyGlob("./build_tmp/*.metadata.json", "./package");
    await copyFile("./package.json", "package/package.json");
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
}
