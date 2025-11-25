import { goodResponse, failedResponse } from "../../helper/response";
import service from "./service";
const signup = async (req, res) => {
    try {
        const user = await service.signup(req.body);
        return res.json(goodResponse({ user }, "New user Created."));
    }
    catch (error) {
        return res
            .status(error.statusCode || 400)
            .json(failedResponse(error.message || "Something went wrong", error.statusCode || 400));
    }
};
const verifyOtp = async (req, res) => {
    try {
        const result = await service.verifyOtp(req.body);
        return res.json(goodResponse(result, result.message));
    }
    catch (error) {
        return res
            .status(error.statusCode || 400)
            .json(failedResponse(error.message || "Something went wrong", error.statusCode || 400));
    }
};
const loginWithOtp = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await service.generateLoginOtp(email, password);
        return res.json(goodResponse({
            tempToken: result.tempToken,
        }, result.message));
    }
    catch (error) {
        console.error("[loginWithOtp] Error:", error);
        return res
            .status(400)
            .json(failedResponse(error.message || "Failed to login with OTP", 400));
    }
};
export default {
    signup,
    verifyOtp,
    loginWithOtp,
};
//# sourceMappingURL=controller.js.map