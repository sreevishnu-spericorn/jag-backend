export default class BadRequest extends Error {
    code;
    statusCode;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.statusCode = 400;
        this.name = "BadRequest";
        Object.setPrototypeOf(this, BadRequest.prototype);
    }
}
//# sourceMappingURL=badRequest.js.map