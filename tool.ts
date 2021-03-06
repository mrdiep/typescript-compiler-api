import * as ts from "typescript";
import * as fs from "fs";

interface DocEntry {
  name: string;
  input: string;
  output: string;
  scope: string;
  resource: string;
}

function generate(fileNames: string[], options: ts.CompilerOptions): void {
  let program = ts.createProgram(fileNames, options);

  let checker = program.getTypeChecker();
  let output: DocEntry[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node) => visit(checker, node, output));
    }
  }

  // print out the doc
  fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 2));
}

function visit(checker, node: ts.Node, output) {
  if (!isNodeExported(node)) return;

  if (ts.isModuleDeclaration(node)) {
    ts.forEachChild(node, x => visit(checker, x, output));
    return;
  }

  if (!(ts.isClassDeclaration(node) && node.name)) return;

  let symbol = checker.getSymbolAtLocation(node.name);
  if (!symbol) return;

  //main code: parse class here
  const sourceFile = node.getSourceFile();

  var cls: ts.ClassDeclaration = <ts.ClassDeclaration>node;
  cls.forEachChild((m: ts.Node) => {
    // limit proecssing to methods
    if (m.kind == ts.SyntaxKind.MethodDeclaration) {
      var method = <ts.MethodDeclaration>m;
      console.log(
        'name = ', method.name.getText(sourceFile),
        '\r\nreturn type = ', method.type.getText(sourceFile),
        '\r\nmethod.parameters = ', method.parameters.length,
        '\r\nmethod.parameters[0]=', checker.typeToString(checker.getTypeAtLocation(method.parameters[0]))
      );
    }

  });

  for (const decorator of cls.decorators || []) {
    console.log('decorator=', decorator.expression.getText(sourceFile))
    console.log('decorator data=', decorator.expression.getChildren(sourceFile)[2].getFullText(sourceFile))
  }

  console.log('implements strings = ' + cls.heritageClauses[0].getText(sourceFile).replace('\r\n', ''));
  // then use regular expression parse
  console.log('implements string 2 = ', cls.heritageClauses[0].types[0].expression.getFullText(sourceFile));
  console.log('implements string 3 = ', cls.heritageClauses[0].getChildAt(0, sourceFile).getFullText(sourceFile));

  const expression1 = cls.heritageClauses[0].types[0].expression;
  const extendsSymbol = checker.getSymbolAtLocation(expression1);
  const extendsType = checker.getTypeAtLocation(expression1) as ts.Type;

  const extendsType2 = checker.getTypeAtLocation(expression1) as ts.TypeReference;

  const func2Type = checker.getTypeOfSymbolAtLocation(extendsSymbol, cls) as ts.TypeReference;
  const func2Signature = checker.getSignaturesOfType(func2Type, ts.SignatureKind.Construct)[0];

  //console.log(checker.typeToString(extendsType));
  console.log('84::', func2Signature);
  //output.push({name: 'test'} as);

}

function isNodeExported(node: ts.Node): boolean {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}

generate(['./C.ts'], {
  "lib": ["es2020"],
  "moduleResolution": ts.ModuleResolutionKind.NodeJs,
  "sourceMap": true,
  "target": ts.ScriptTarget.ES2020,
  "outDir": ".build",
  "allowSyntheticDefaultImports": true,
  "esModuleInterop": true,
  "preserveConstEnums": true,
  "experimentalDecorators": true
});