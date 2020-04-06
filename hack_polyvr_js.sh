#!/bin/bash



sed '/function getBinaryPromise() {/a if (storage.ressource) {\n\tconsole.log("use stored wasm binary!");\n\treturn new Promise(function(resolve, reject) { resolve(storage.ressource); });\n}' -i polyvr.js
sed 'N;/function instantiateAsync() {\n    if (!wasmBinary &&/a !storage.ressource &&' -i polyvr.js
sed 's/window.addEventListener/Module["canvas"].addEventListener/g' -i polyvr.js
