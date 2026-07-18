// backend - controller/upload.controller.js
import asyncHandler from '../middleware/asyncHandler.js';

export const uploadImageToImgBB = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided',
    });
  }

  const base64Image = req.file.buffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('image', base64Image);

  const imgbbRes = await fetch(
    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await imgbbRes.json();

  if (!data.success) {
    return res.status(500).json({
      success: false,
      message: 'Image upload to ImgBB failed',
    });
  }

  res.status(200).json({
    success: true,
    url: data.data.url,
  });
});
