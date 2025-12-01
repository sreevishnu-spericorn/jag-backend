import prisma from "../../../config/prisma.ts";
import BadRequest from "../../../helper/exception/badRequest.ts";
import bcrypt from "bcrypt";

const getProfile = async (userId: string) => {
   const user = await prisma.user.findUnique({ where: { id: userId } });
   if (!user) throw new BadRequest("User not found", "NOT_FOUND");

   const { password, loginOtp, loginOtpExpiry, ...safeUser } =
      user;

   return safeUser;
};

const updateProfile = async (userId: string, data: any) => {
   const user = await prisma.user.findUnique({ where: { id: userId } });
   if (!user) throw new BadRequest("User not found", "NOT_FOUND");

   const updated = await prisma.user.update({
      where: { id: userId },
      data,
   });

   const { password, loginOtp, loginOtpExpiry, ...safeUser } =
      updated;
   return safeUser;
};

const changePassword = async (
   userId: string,
   data: { currentPassword: string; newPassword: string }
) => {
   const user = await prisma.user.findUnique({ where: { id: userId } });
   if (!user) throw new BadRequest("User not found", "NOT_FOUND");

   console.log(user);

   console.log(data.currentPassword);

   const isMatch = await bcrypt.compare(data.currentPassword, user.password);
   if (!isMatch)
      throw new BadRequest("Current password is incorrect", "INVALID_PASSWORD");

   const hashedPassword = await bcrypt.hash(data.newPassword, 10);

   await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
   });

   return { success: true };
};

export default { getProfile, updateProfile, changePassword };
