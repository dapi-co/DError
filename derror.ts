const { MoleculerError } = require('moleculer').Errors

interface IErrMapParams {
  msg: string,
  code: number,
  external: boolean
}

interface IErrMap {
  [propName: string]: IErrMapParams
}

let errMap: IErrMap = {}
export function SetErrorMap(newErrMap: IErrMap) {
  errMap = newErrMap
}

//PERF: Can optimize stack by knowing call depth
export class DError {

  private stack: string = ''
  private message: string = ''
  private name: string = 'DError'

  constructor(prevError: any, private msg: string, private code: any | number = 500, private type: string = '',
    private data: any = {}, private external: boolean = false) {

    //In case someone sends data as null
    if (!data)
      data = {}

    //If second parameter is type and third is data, use the error lookup table
    if (typeof (code) === "object") {
      type = msg
      data = code

      if (type in errMap) {
        msg = errMap[type].msg
        code = errMap[type].code
        external = errMap[type].external

        this.msg = msg;
        this.code = code;
        this.type = type;
        this.data = data;
        this.external = external;
      }
      else {
        code = 500
      }
    }

    this.stack = '\n' + this.stack
    this.msg = msg
    this.external = external

    if (!prevError) {
      this.data.errStack = [{
        msg: this.msg,
        code: this.code,
        type: this.type,
        external: this.external,
        data: { ...this.data }  //To avoid circular references
      }]
      return
    }

    //Cross network errors will be DError but will not pass instanceof, so check name
    if (!(prevError instanceof DError) && prevError.name as string !== 'DError') {
      this.data.errStack = [{
        msg: this.msg,
        code: this.code,
        type: this.type,
        external: this.external,
        data: { ...this.data }
      }, {}]

      if (prevError instanceof MoleculerError)
        this.data.errStack[1] = {
          msg: prevError.message,
          code: prevError.message,
          type: prevError.type,
          data: prevError.data
        }

      else if (prevError instanceof Error)
        this.data.errStack[1] = {
          msg: prevError.message,
          code: (prevError as any).code,
          type: (prevError as any).type,
          data: (prevError as any).data
        }

      else if (typeof prevError === 'string') {
        this.data.errStack[1] = {
          msg: prevError,
          code: 500,
          type: '',
          external: false,
          data: {}
        }
      }

      if (prevError.stack)
        this.stack += '\n' + prevError.stack.split('\n', 3)[1].trim()

      return
    }

    this.stack += prevError.stack
    prevError.data.errStack.unshift({
      msg: this.msg,
      code: this.code,
      type: this.type,
      external: this.external,
      data: { ...this.data }
    })
    this.data.errStack = prevError.data.errStack

    //Older external errors take precedence to be shown to the user
    if (prevError.external) {
      this.message = prevError.message
      this.msg = prevError.msg
      this.code = prevError.code
      this.type = prevError.type
      this.data = prevError.data
      this.external = true
    }
  }
}
