// backend - router/upload.routes.js
import express from 'express';
import upload from '../middleware/upload.js';
import { uploadImageToImgBB } from '../controller/upload.controller.js';


const uploadRouter = express.Router();

uploadRouter.post('/', upload.single('image'), uploadImageToImgBB);

export default uploadRouter;
