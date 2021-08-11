#!/bin/bash



sed '/function getBinaryPromise() {/a if (storage.ressource) {\n\tconsole.log("use stored wasm binary!");\n\treturn new Promise(function(resolve, reject) { resolve(storage.ressource); });\n}' -i polyvr.js
sed 'N;/function instantiateAsync() {\n    if (!wasmBinary &&/a !storage.ressource &&' -i polyvr.js
sed 's/window.addEventListener/Module["canvas"].addEventListener/g' -i polyvr.js
sed 's/if (buffer.buffer === HEAP8.buffer) {/if (HEAP8 \&\& buffer.buffer === HEAP8.buffer) {/g' -i polyvr.js
sed 's/GLUT.passiveMotionFunc/GLUT.motionFunc/g' -i polyvr.js
sed 's/runDependencies++;/runDependencies++;\naddedRunDependencies++;\nsetProgress(doneRunDependencies\/addedRunDependencies, "download asset");/g' -i polyvr.js
sed 's/runDependencies--;/runDependencies--;\ndoneRunDependencies++;\nsetProgress(doneRunDependencies\/addedRunDependencies, "download asset");/g' -i polyvr.js
sed 's/var runDependencies = 0;/var runDependencies = 0;\nvar addedRunDependencies = 0;\nvar doneRunDependencies = 0;/g' -i polyvr.js


