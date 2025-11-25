import { Request, Response } from "express";
import service from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";
import { MulterRequest } from "../../../types/express.js";
import { UpdatePublisherDTO } from "../../../types/publisherTypes/publisherTypes.ts";

const createPublisher = async (req: MulterRequest, res: Response) => {
   try {
      const logoFile = (req.files as any)?.logo?.[0];
      const w9Files = (req.files as any)?.w9Files || [];
      const result = await service.createPublisher(
         req.body,
         logoFile?.filename,
         w9Files.map((f: any) => f.filename)
      );
      return res
         .status(201)
         .json(goodResponse(result, "Publisher created successfully"));
   } catch (error: any) {
      return res
         .status(400)
         .json(failedResponse(error.message, error.statusCode || 400));
   }
};

const getPublishers = async (req: Request, res: Response) => {
   try {
      const result = await service.getPublishers(req.query);
      return res.json(goodResponse(result, "Publisher list fetched"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const getPublisherById = async (req: Request, res: Response) => {
   try {
      const result = await service.getPublisherById(req.params.id);
      return res.json(goodResponse(result, "Publisher fetched"));
   } catch (error: any) {
      return res.status(404).json(failedResponse(error.message, 404));
   }
};

const updatePublisher = async (req: MulterRequest, res: Response) => {
   try {
      const logoFile = (req.files as any)?.logo?.[0];
      const w9Files = (req.files as any)?.w9Files || [];

      const result = await service.updatePublisher(
         req.params.id,
         req.body,
         logoFile?.filename, // single logo
         w9Files.map((f: any) => f.filename) // multiple W9 files
      );

      return res.json(goodResponse(result, "Publisher updated"));
   } catch (error: any) {
      return res
         .status(400)
         .json(failedResponse(error.message, error.statusCode || 400));
   }
};

const deletePublisher = async (req: Request, res: Response) => {
   try {
      await service.deletePublisher(req.params.id);
      return res.json(goodResponse(null, "Publisher deleted successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

export default {
   createPublisher,
   getPublishers,
   getPublisherById,
   updatePublisher,
   deletePublisher,
};
