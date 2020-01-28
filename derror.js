const { MoleculerError } = require("moleculer").Errors

//PERF: Can optimize stack by knowing call depth
DError = class DError extends MoleculerError {
  constructor(prevError, msg, code = 500, type = '', data = {}, external = false) {

    //In case someone sends data as null
    if (!data)
      data = {}

    //If second parameter is type and third is data, use the error lookup table
    if (typeof (code) === "object") {
      type = msg
      data = code

      if (type in DError.errMap) {
        msg = DError.errMap[type].msg
        code = DError.errMap[type].code
        external = DError.errMap[type].external
        super(msg, code, type, data)
      }
      else {
        code = 500
        super(msg, code, type, data)
      }
    } else {
      super(msg, code, type, data)
    }

    this.stack = '\n' + this.stack.split('\n', 3)[1].trim() //Create slim call stack
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
    if (!(prevError instanceof DError) && prevError.name !== 'DError') {
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
          code: prevError.code,
          type: prevError.type,
          data: prevError.data
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
    if (prevError.data.errStack[0].external) {
      this.message = prevError.message
      this.msg = prevError.msg
      this.code = prevError.code
      this.type = prevError.type
      this.data = prevError.data
      this.external = true
    }
  }
}

DError.errMap = {}
DError.SetErrorMap = newErrMap => DError.errMap = newErrMap

module.exports = DError