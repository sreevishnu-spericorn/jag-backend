import path from "path";
import crypto from "node:crypto";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ejs from "ejs";

import { VerifyOtpDTO } from "../../types/authTypes/VerifyOtpDTO.ts";
import { ForgetPassTypes } from "../../types/authTypes/ForgetPassTypes.ts";
import { LoginOtpResult } from "../../types/authTypes/LoginOtpResult.ts";
import { VerifyOtpResult } from "../../types/authTypes/VerifyOtpResult.ts";
import { ResetPasswordResult } from "../../types/authTypes/ResetPasswordResult.ts";

import BadRequest from "../../helper/exception/badRequest.ts";
import transporter from "../../config/nodemailer-config.ts";
import prisma from "../../config/prisma.ts";

const TEMP_TOKEN_SECRET = process.env.JWT_SECRET as string;
const TEMP_TOKEN_AUDIENCE = "loginOtp";
const RESET_PASSWORD_AUDIENCE = "resetPassword";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as string;

interface RequestWithCookies extends Request {
   cookies: {
      refreshToken?: string;
   };
}

const verifyOtp = async ({
   otp,
   accessToken,
}: VerifyOtpDTO): Promise<VerifyOtpResult> => {
   try {
      const decoded = jwt.verify(accessToken, TEMP_TOKEN_SECRET) as {
         email: string;
      };

      const { email } = decoded;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) throw new BadRequest("User not found", "USER_NOT_FOUND");

      if (user.loginOtp !== otp) {
         throw new BadRequest("Invalid OTP", "INVALID_OTP");
      }

      const authToken = jwt.sign(
         { id: user.id, roleId: user.roleId },
         process.env.JWT_SECRET as string,
         {
            expiresIn: "45m",
            audience: "access",
         }
      );

      const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, {
         expiresIn: "7d",
      });

      return {
         email: user.email,
         authToken,
         message: "Login successful",
         refreshToken,
      };
   } catch (error: any) {
      if (error.name === "TokenExpiredError") {
         throw new BadRequest("OTP expired", "OTP_EXPIRED");
      }
      throw error;
   }
};

async function generateLoginOtp(
   email: string,
   password: string
): Promise<LoginOtpResult> {
   const user = await prisma.user.findUnique({ where: { email } });

   if (!user) throw new BadRequest("Invalid email", "EMAIL ERROR");

   const isMatch = await bcrypt.compare(password, user.password);
   if (!isMatch) throw new BadRequest("Incorrect password", "PASSWORD ERROR");

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

   const html = await ejs.renderFile(
      path.resolve("modules/template/loginOtpEmail.ejs"),
      { payload }
   );

   await transporter.sendMail({
      from: process.env.MAILER_FROM,
      to: user.email,
      subject: "Your Login OTP Code",
      html,
   });

   const tempToken = jwt.sign({ id: user.id, email }, TEMP_TOKEN_SECRET, {
      expiresIn: "10m",
      audience: TEMP_TOKEN_AUDIENCE,
   });

   return {
      tempToken,
      message: "Login OTP has been sent to your registered email.",
   };
}

async function sendPasswordResetEmail(
   email: string
): Promise<ResetPasswordResult> {
   const user = await prisma.user.findUnique({ where: { email } });
   if (!user) throw new BadRequest("User not found", "EMAIL ERROR");

   const token = jwt.sign(
      { id: user.id, email: user.email },
      TEMP_TOKEN_SECRET,
      { expiresIn: "15m", audience: RESET_PASSWORD_AUDIENCE }
   );

   const payload = {
      userName: user.firstName || user.email,
      resetLink: `${process.env.CLIENT_URL}/forgot-password?token=${token}`,
      expiryMinutes: 15,
   };

   const html = await ejs.renderFile(
      path.resolve("modules/template/forgotPasswordEmail.ejs"),
      { payload }
   );

   const mailOptions = {
      from: process.env.MAILER_FROM,
      to: user.email,
      subject: "Password Reset Request",
      html,
   };

   await transporter.sendMail(mailOptions);

   return {
      email: user.email,
      message: "Password reset link sent successfully",
   };
}

async function resetPassword({ token, newPassword }: ForgetPassTypes) {
   if (!token || !newPassword) {
      throw new BadRequest(
         "Token and new password are required",
         "No Required Parameters"
      );
   }

   try {
      const decoded = jwt.verify(token, TEMP_TOKEN_SECRET, {
         audience: RESET_PASSWORD_AUDIENCE,
      }) as { id: string };

      const user = await prisma.user.findUnique({
         where: {
            id: decoded.id,
         },
      });
      if (!user) throw new BadRequest("User not found", "INVALID EMAIL");

      const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
      if (isSameAsCurrent) {
         throw new BadRequest(
            "New password cannot be the same as the current password",
            "SAME_AS_CURRENT_PASSWORD"
         );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
         where: { id: decoded.id },
         data: {
            password: hashedPassword,
         },
      });

      return { email: user.email, message: "Password reset successful" };
   } catch (error: any) {
      if (error.name === "TokenExpiredError") {
         throw new BadRequest("Reset token expired", "TOKEN_EXPIRED");
      }
      throw new BadRequest("Invalid or expired reset token", "INVALID TOKKEN");
   }
}

async function refresh(req: RequestWithCookies) {
   const refreshToken = req.cookies.refreshToken;
   if (!refreshToken)
      throw new BadRequest("Refresh token missing", "TOKEN_MISSING");

   console.log(refreshToken);
   let payload;
   try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
         id: string;
      };
   } catch (err) {
      throw new BadRequest("Refresh token expired or invalid", "TOKEN_INVALID");
   }

   console.log("Payload is", payload);

   const user = await prisma.user.findUnique({ where: { id: payload.id } });

   const accessToken = jwt.sign(
      { id: user?.id, roleId: user?.roleId },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "45m", audience: "access" }
   );

   return { accessToken };
}

export default {
   verifyOtp,
   generateLoginOtp,
   // signup,
   sendPasswordResetEmail,
   resetPassword,
   refresh,
};
