interface IErrMapParams {
    msg: string;
    code: number;
    external: boolean;
}
interface IErrMap {
    [propName: string]: IErrMapParams;
}
export declare function SetErrorMap(newErrMap: IErrMap): void;
export declare class DError {
    private prevError;
    private msg;
    private code;
    private type;
    private data;
    private external;
    private stack;
    private message;
    private name;
    private errStack;
    constructor(prevError: any, msg: string, code?: any | number, type?: string, data?: any, external?: boolean);
}
export {};
