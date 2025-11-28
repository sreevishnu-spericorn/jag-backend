import { Request, Response } from "express";
import service from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";

const createProposal = async (req: Request, res: Response) => {
   try {
      const result = await service.createProposal(req.body);
      return res
         .status(201)
         .json(goodResponse(result, "Proposal created successfully"));
   } catch (error: any) {
      return res
         .status(400)
         .json(failedResponse(error.message, error.statusCode || 400));
   }
};

const getProposals = async (req: Request, res: Response) => {
   try {
      console.log("REQQQQQQQQQQQQQ", req.query);
      const result = await service.getProposals(req.query);
      return res.json(goodResponse(result, "Proposal list fetched"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const getProposalById = async (req: Request, res: Response) => {
   try {
      const result = await service.getProposalById(req.params.id);
      return res.json(goodResponse(result, "Proposal fetched"));
   } catch (error: any) {
      return res.status(404).json(failedResponse(error.message, 404));
   }
};

const updateProposal = async (req: Request, res: Response) => {
   try {
      const result = await service.updateProposal(req.params.id, req.body);
      return res.json(goodResponse(result, "Proposal updated"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const deleteProposal = async (req: Request, res: Response) => {
   try {
      await service.deleteProposal(req.params.id);
      return res.json(goodResponse(null, "Proposal deleted successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

export default {
   createProposal,
   getProposals,
   getProposalById,
   updateProposal,
   deleteProposal,
};
