Source for https://www.npmjs.com/package/@dapi-co/derror

# (Class) DError

For flexibility and due to specific requirements at Dapi, DError (Dapi Error), an extension to `MoleculerError` 
was created.

DError builds an error stack as the error propagates from the place it was thrown from to the top of the call stack
and it also handles putting the first external error to be thrown as the top error. 

DError also produces a clean error stack where only our own files are shown in the call stack, and even builds the
stack across network calls, where as `MoleculerError` fails to produce any call stack in case of a network 
call (basically always).

DError also deals with the case where the previous error in the stack is a `MoleculerError` or `Error`.

## Constructors

```javascript
DError(prevError, msg, code = 500, type = '', data = {}, external = false)
```

# Dependencies

- `MoleculerError`

# Usage

Should always be used by throwing. In case it is inside a `catch` statement, the previous error should be included. The external parameter decides whether this error should be returned to
client or not.

Very low level functions should generally not be external as they don't have information
about what operation the trying was trying to do. The first function in the call stack
able to give a general error message to the client describing what operation failed should
be set to external.

In case of multiple external DErrors, the **first** one to be set to external will be returned
to the user.

```javascript 
throw new DError(null, 'Invalid or expired token', 401, '', {}, true)
```

Example with try-catch

```javascript
try {
  await myModel.save()
} catch (error) {
  throw new DError(error, 'Saving database model failed', 500, 'ERR_DB', {}, true)
}
```
<br>
By default DError returns to the user the following object:

```javascript
{
  success: 'false',
  msg: 'My Error msg',
  type: 'ERR_DB' //Only if type is set, otherwise not sent
}
```

To return extra parameters to the client add an `external` object to the `data` field of
DError that contains all the field to return to the client. An example is shown below.

```javascript
throw new DError(null, 'Connection ID not found', 404, 'ERR_CONN_NOT_FOUND', {
  external: { errCode: 'CONNECTION_ID_NOT_FOUND' }
}, true)
```

In this case, `errCode: 'CONNECTION_ID_NOT_FOUND'` is returned to the client along with
the default parameters, resulting in the following return object.
```javascript
{
  success: 'false',
  msg: 'My Error msg',
  type: 'ERR_CONN_NOT_FOUND',
  errCode: 'CONNECTION_ID_NOT_FOUND'
}
```

# Notes

The entire stack of DErrors is logged for internal monitoring regardless of whether they are external or not.
