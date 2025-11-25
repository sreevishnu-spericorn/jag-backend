import { Request, Response } from "express";
import service from "./service.ts";
import { goodResponse, failedResponse } from "../../../helper/response.ts";

const createProduct = async (req: Request, res: Response) => {
   try {
      const result = await service.createProduct(req.body);
      return res
         .status(201)
         .json(goodResponse(result, "Product created successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const getProducts = async (req: Request, res: Response) => {
   try {
      const result = await service.getProducts(req.query);
      return res.json(goodResponse(result, "Product list fetched"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const getProductById = async (req: Request, res: Response) => {
   try {
      const result = await service.getProductById(req.params.id);
      return res.json(goodResponse(result, "Product fetched"));
   } catch (error: any) {
      return res.status(404).json(failedResponse(error.message, 404));
   }
};

const updateProduct = async (req: Request, res: Response) => {
   try {
      const result = await service.updateProduct(req.params.id, req.body);
      return res.json(goodResponse(result, "Product updated"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

const deleteProduct = async (req: Request, res: Response) => {
   try {
      await service.deleteProduct(req.params.id);
      return res.json(goodResponse(null, "Product deleted successfully"));
   } catch (error: any) {
      return res.status(400).json(failedResponse(error.message, 400));
   }
};

export default {
   createProduct,
   getProducts,
   getProductById,
   updateProduct,
   deleteProduct,
};
