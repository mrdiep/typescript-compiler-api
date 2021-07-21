import * as ts from "typescript";
import * as fs from "fs";

interface DocEntry {
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
}
let i = 0;
/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
): void {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();
  let output: DocEntry[] = [];

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      //console.log('start ', i++, sourceFile.statements[0])
      ts.forEachChild(sourceFile, visit);
    }
  }

  // print out the doc
  fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

  return;

  /** visit nodes finding exported classes */
  function visit(node: ts.Node) {

    console.log('visit ', i++)
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }
    console.log('next A ', i++)
    if (ts.isClassDeclaration(node) && node.name) {
      // This is a top level class, get its symbol
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const sourceFile = node.getSourceFile();

        var cls: ts.ClassDeclaration = <ts.ClassDeclaration>node;
        cls.forEachChild(function (m: ts.Node) {
            // limit proecssing to methods
            if (m.kind == ts.SyntaxKind.MethodDeclaration) {
                var method = <ts.MethodDeclaration>m;
                console.log(
                    'name = ' , method.name.getText(sourceFile),
                    '\r\nreturn type = ', method.type.getText(sourceFile),
                    // '\r\nmethod.parameters = ', method.parameters.length,
                    '\r\nmethod.parameters[0]=', checker.typeToString(checker.getTypeAtLocation(method.parameters[0]))
                );
            }

        });

        for(const decorator of cls.decorators || []) {
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
        console.log('84::', func2Signature)
        //output.push(serializeClass(symbol));
      }
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      console.log('child ', i++)
      ts.forEachChild(node, visit);
    }
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol: ts.Symbol): DocEntry {
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
      )
    };
  }

  /** Serialize a class symbol information */
  function serializeClass(symbol: ts.Symbol) {
    let details = serializeSymbol(symbol);

    // Get the construct signatures
    let constructorType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

    checker.getPropertySymbolOfDestructuringAssignment

console.log('constructorType');

    details.constructors = constructorType
      .getConstructSignatures()
      .map(serializeSignature);
    return details;
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature: ts.Signature) {
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(signature.getDocumentationComment(checker))
    };
  }

  /** True if this is visible outside this file, false otherwise */
  function isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
}

generateDocumentation(['./C.ts'], {
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