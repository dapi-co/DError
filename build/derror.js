const { MoleculerError } = require('moleculer').Errors;
//PERF: Can optimize stack by knowing call depth
export default class DError {
    constructor(prevError, msg, code = 500, type = '', data = {}, external = false) {
        this.prevError = prevError;
        this.msg = msg;
        this.code = code;
        this.type = type;
        this.data = data;
        this.external = external;
        this.name = 'DError';
        this.SetErrorMap = (newErrMap) => this.errMap = newErrMap;
        //In case someone sends data as null
        if (!data)
            data = {};
        //If second parameter is type and third is data, use the error lookup table
        if (typeof (code) === "object") {
            type = msg;
            data = code;
            if (type in this.errMap) {
                msg = this.errMap[type].msg;
                code = this.errMap[type].code;
                external = this.errMap[type].external;
            }
            else {
                code = 500;
            }
        }
        this.stack = '\n' + this.stack;
        this.msg = msg;
        this.external = external;
        if (!prevError) {
            this.data.errStack = [{
                    msg: this.msg,
                    code: this.code,
                    type: this.type,
                    external: this.external,
                    data: Object.assign({}, this.data) //To avoid circular references
                }];
            return;
        }
        //Cross network errors will be DError but will not pass instanceof, so check name
        if (!(prevError instanceof DError) && prevError.name !== 'DError') {
            this.data.errStack = [{
                    msg: this.msg,
                    code: this.code,
                    type: this.type,
                    external: this.external,
                    data: Object.assign({}, this.data)
                }, {}];
            if (prevError instanceof MoleculerError)
                this.data.errStack[1] = {
                    msg: prevError.message,
                    code: prevError.message,
                    type: prevError.type,
                    data: prevError.data
                };
            else if (prevError instanceof Error)
                this.data.errStack[1] = {
                    msg: prevError.message,
                    code: prevError.code,
                    type: prevError.type,
                    data: prevError.data
                };
            else if (typeof prevError === 'string') {
                this.data.errStack[1] = {
                    msg: prevError,
                    code: 500,
                    type: '',
                    external: false,
                    data: {}
                };
            }
            if (prevError.stack)
                this.stack += '\n' + prevError.stack.split('\n', 3)[1].trim();
            return;
        }
        this.stack += prevError.stack;
        prevError.data.errStack.unshift({
            msg: this.msg,
            code: this.code,
            type: this.type,
            external: this.external,
            data: Object.assign({}, this.data)
        });
        this.data.errStack = prevError.data.errStack;
        //Older external errors take precedence to be shown to the user
        if (prevError.data.errStack[0].external) {
            this.message = prevError.message;
            this.msg = prevError.msg;
            this.code = prevError.code;
            this.type = prevError.type;
            this.data = prevError.data;
            this.external = true;
        }
    }
}
