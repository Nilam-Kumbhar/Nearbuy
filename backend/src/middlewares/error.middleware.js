import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors || [],
        data: null,
        success: false
    };

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
export default errorHandler;
