import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
export function localTypeScriptLoader(globals={}) {
  const cache=new Map();
  function load(file) {
    file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
    const record={exports:{}};cache.set(file,record);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    vm.runInNewContext(code,{module:record,exports:record.exports,Date,TextEncoder,URL,Blob,Event,...globals,require(name){
      let next=name.startsWith('@/')?path.resolve('src',name.slice(2)):name.startsWith('.')?path.resolve(path.dirname(file),name):null;
      if(!next)throw Error('Unexpected local fixture import '+name);
      if(!path.extname(next))next+='.ts';return load(next);
    }},{filename:file});return record.exports;
  }
  return load;
}
