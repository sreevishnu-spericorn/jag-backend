import "dotenv/config";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: process.env.MAILER_SERVICE || "gmail",
    auth: {
        user: process.env.MAILER_AUTH_USER,
        pass: process.env.MAILER_AUTH_PASS,
    },
});
export default transporter;
//# sourceMappingURL=nodemailer-config.js.map