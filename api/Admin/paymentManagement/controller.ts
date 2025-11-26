import { Request, Response } from "express";
import * as service from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";

export const getAllPaymentsController = async (req: Request, res: Response) => {
    try {
       const page = Math.max(Number(req.query.page) || 1, 1);
       const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
       const proposalId = req.query.proposalId as string | undefined;
       const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : null;
       const toDate = req.query.toDate ? new Date(req.query.toDate as string) : null;
 
       const payments = await service.getAllPaymentsService({ page, limit, proposalId, fromDate, toDate });
 
       return res.status(200).json(goodResponse(payments, "Payments fetched successfully"));
    } catch (error: any) {
       return res.status(500).json(failedResponse(error.message, 500));
    }
 };
 

export const getPaymentByIdController = async (req: Request, res: Response) => {
   try {
      const payment = await service.getPaymentByIdService(req.params.id);
      if (!payment) {
         return res.status(404).json(failedResponse("Payment not found", 404));
      }
      return res
         .status(200)
         .json(goodResponse(payment, "Payment fetched successfully"));
   } catch (error: any) {
      return res.status(500).json(failedResponse(error.message, 500));
   }
};

export default { getAllPaymentsController, getPaymentByIdController };
