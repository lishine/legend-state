import fs from 'node:fs';
import path from 'node:path';
import pkg from './package.json' assert { type: 'json' };

const Exclude = new Set(['.DS_Store']);
const extensions = ['js', 'js.map', 'mjs', 'mjs.map'];

Object.keys(pkg.exports).forEach((exp) => {
    // Adjust the rollup build to move the /* exports into a folder
    if (exp.endsWith('*')) {
        const expPath = exp.replace('/*', '');
        const files = fs.readdirSync(path.join('src', expPath));
        const distPath = path.join('dist', expPath);
        const distTempPath = path.join(distPath, 'temp');

        const exportObj = pkg.exports[exp];
        files.forEach((file) => {
            if (!Exclude.has(file)) {
                const base = path.parse(file).name;

                // Add an export for each of the files in the folder
                const exportPath = expPath + '/' + base;
                const newExportObj = (pkg.exports[exportPath] = Object.assign({}, exportObj));
                Object.keys(newExportObj).forEach((key) => {
                    newExportObj[key] = newExportObj[key].replace('*', base);
                });

                // Copy files in the wildcard to the output directory
                extensions.map((ext) => {
                    const filename = base + '.' + ext;

                    fs.cpSync(path.join(distTempPath, filename), path.join(distPath, filename));
                });

                // Copy type file in the wildcard to the output directory
                const dts = base + '.d.ts';
                fs.cpSync(path.join(distTempPath, 'src', expPath, dts), path.join(distPath, dts));
            }
        });

        // Delete the wildcard export
        delete pkg.exports[exp];

        // Delete the temp path
        fs.rmSync(distTempPath, { recursive: true, force: true });
    }
});

// Remove fields we don't want in the built version
pkg.private = false;
delete pkg.devDependencies;
delete pkg.overrides;
delete pkg.scripts;
delete pkg.engines;

fs.writeFileSync(path.join('dist/package.json'), JSON.stringify(pkg, undefined, 4));

// Recursive function to traverse directories
function replaceStringInFiles(dirPath, searchString, replaceString) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            replaceStringInFiles(filePath, searchString, replaceString);
        } else if (stats.isFile()) {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${filePath}:`, err);
                    return;
                }

                const updatedData = data.replace(searchString, replaceString);

                if (updatedData !== data) {
                    fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                        if (err) {
                            console.error(`Error writing file ${filePath}:`, err);
                        } else {
                            console.log(`Updated file: ${filePath}`);
                        }
                    });
                }
            });
        }
    }
}

const directoryPath = 'dist';
const searchString = '@legendapp/state';
const replaceString = '@byondxr/legend-state';

replaceStringInFiles(directoryPath, searchString, replaceString);
