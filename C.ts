


export type DecoratorType = { scope: string; resource: string };
export const decorateMe = (str: string, body: DecoratorType) => decoratorBase(str, body);

export const decoratorBase = (str: string, data: any) => {
  return <T extends { new (...args: any[]): {} }>(C: T) => {
    (<any>C).hasDecorator = true;
    (<any>C).decoratorData = data;
    return C;
  };
};

/**
 * Documentation for C
 */
 @decorateMe('string', {scope: 'internal', resource: 'mylaptop'})
 class Class1 implements Processor<TypeAny, boolean, string, unknown> {
     body: number;
     bodya: number;
     constructor(a: string, b: Class1) { }
     processeEvent(int: InputEvent<TypeAny>): OutputEvent<boolean> {
         throw "a";
     }
 }

 type TypeAny = {s: string}

interface Processor<Ax, Bx, Cx, Dx> {
    body: Ax | Bx | Cx | Dx;
}

interface InputEvent<T> {
    bodya: T;
}

interface OutputEvent<T> {
    bodya: T;
}
