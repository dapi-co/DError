const { MoleculerError } = require("moleculer").Errors

//PERF: Can optimize stack by knowing call depth
module.exports = class DError extends MoleculerError {
  constructor(prevError, msg, code = 500, type = '', data = {}, external = false) {

    super(msg, code, type, data)
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
    this.stack += prevError.stack

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

      if (prevError instanceof Error)
        this.data.errStack[1] = {
          msg: prevError.message,
          type: prevError.type || prevError.code,
          data: prevError.data
        }

      return
    }

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