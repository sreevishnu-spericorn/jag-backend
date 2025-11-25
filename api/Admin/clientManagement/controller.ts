import { Request, Response } from "express";
import service from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";
import { MulterRequest } from "../../../types/express.js";

const createClient = async (req: MulterRequest, res: Response) => {
   try {
      const result = await service.createClient(req.body, req.file?.filename);
      return res
         .status(201)
         .json(goodResponse(result, "Client created successfully"));
   } catch (error: any) {
      return res
         .status(400)
         .json(failedResponse(error.message, error.statusCode));
   }
};

const getClients = async (req: Request, res: Response) => {
   try {
      const result = await service.getClients(req.query);
      return res.json(goodResponse(result, "Client list fetched"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const getClientById = async (req: Request, res: Response) => {
   try {
      const result = await service.getClientById(req.params.id);
      return res.json(goodResponse(result, "Client fetched"));
   } catch (error: any) {
      return res.status(404).json(failedResponse(error.message, 404));
   }
};

const updateClient = async (req: Request, res: Response) => {
   try {
      const result = await service.updateClient(
         req.params.id,
         req.body,
         req.file?.filename
      );
      return res.json(goodResponse(result, "Client updated"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const deleteClient = async (req: Request, res: Response) => {
   try {
      await service.deleteClient(req.params.id);
      return res.json(goodResponse(null, "Client deleted successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

export default {
   createClient,
   getClients,
   getClientById,
   updateClient,
   deleteClient,
};
