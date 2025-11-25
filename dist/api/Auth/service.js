import path from "path";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import BadRequest from "../../helper/exception/badRequest";
import transporter from "../../config/nodemailer-config";
import { RoleId } from '@prisma/client';
import prisma from "../../config/prisma";
const TEMP_TOKEN_SECRET = process.env.JWT_SECRET;
const TEMP_TOKEN_AUDIENCE = "loginOtp";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
async function signup(data) {
    try {
        const exists = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (exists) {
            throw new BadRequest("User already exists", "EMAIL_EXISTS");
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                roleId: RoleId.User,
            },
        });
        const payload = {
            email: data.email,
            expiry: Date.now() + TWENTY_FOUR_HOURS,
            expiryTime: "24 Hours.",
            url: process.env.FRONTEND_URL,
        };
        const html = await ejs.renderFile(path.resolve("modules/template/welcomeEmail.ejs"), { payload, baseurl: process.env.SERVER_URL });
        await transporter.sendMail({
            from: process.env.MAILER_FROM,
            to: payload.email,
            subject: "Welcome Email",
            html,
        });
        return { email: payload.email };
    }
    catch (error) {
        throw error;
    }
}
const verifyOtp = async ({ otp, accessToken, }) => {
    try {
        const decoded = jwt.verify(accessToken, TEMP_TOKEN_SECRET);
        const { email } = decoded;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new BadRequest("User not found", "USER_NOT_FOUND");
        if (user.loginOtp !== otp) {
            throw new BadRequest("Invalid OTP", "INVALID_OTP");
        }
        const authToken = jwt.sign({ id: user.id, roleId: user.roleId }, process.env.JWT_SECRET, {
            expiresIn: "7d",
            audience: "access",
        });
        await prisma.user.update({
            where: { email },
            data: { loginOtp: null, loginOtpExpiry: null },
        });
        return { email: user.email, authToken, message: "Login successful" };
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new BadRequest("OTP expired", "OTP_EXPIRED");
        }
        throw error;
    }
};
async function generateLoginOtp(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new BadRequest("Invalid email", "EMAIL ERROR");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        throw new BadRequest("Incorrect password", "PASSWORD ERROR");
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
        where: { email },
        data: {
            loginOtp: otp,
            loginOtpExpiry: expiry,
        },
    });
    const payload = {
        email,
        userName: user.firstName,
        otp,
        expiryMinutes: 10,
        expiryTime: expiry.toLocaleString(),
    };
    const html = await ejs.renderFile(path.resolve("modules/template/loginOtpEmail.ejs"), { payload });
    await transporter.sendMail({
        from: process.env.MAILER_FROM,
        to: user.email,
        subject: "Your Login OTP Code",
        html,
    });
    const tempToken = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, {
        expiresIn: "10m",
        audience: TEMP_TOKEN_AUDIENCE,
    });
    return {
        tempToken,
        message: "Login OTP has been sent to your registered email.",
    };
}
export default {
    verifyOtp,
    generateLoginOtp,
    signup,
};
//# sourceMappingURL=service.js.map