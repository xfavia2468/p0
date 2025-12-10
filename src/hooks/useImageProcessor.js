import { useState, useRef, useCallback } from "react";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";

/**
 * Custom hook for common image processing operations
 * Reduces code duplication across operation pages
 */
export const useImageProcessor = () => {
	const { setImage: setContextImage } = useImage();
	const { addToast } = useToast();
	const canvasRef = useRef(null);

	/**
	 * Load image from file and return as Image element
	 * @param {File} file - Image file to load
	 * @returns {Promise<Image>} Loaded image element
	 */
	const loadImage = useCallback((file) => {
		return new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = URL.createObjectURL(file);
		});
	}, []);

	/**
	 * Save processed image blob to context and optionally download
	 * @param {Blob} blob - Processed image blob
	 * @param {string} format - Image MIME type
	 * @param {string} filename - Optional filename for download
	 * @param {boolean} download - Whether to trigger download
	 */
	const saveProcessedImage = useCallback(
		(blob, format, filename = "image", download = false) => {
			const url = URL.createObjectURL(blob);
			const reader = new FileReader();

			reader.onloadend = () => {
				const dataUrl = reader.result;
				setContextImage({ file: blob, url: dataUrl });

				if (download && filename) {
					const ext =
						format === "image/png"
							? "png"
							: format === "image/jpeg"
							? "jpg"
							: "webp";
					const link = document.createElement("a");
					link.href = url;
					link.download = `${filename}.${ext}`;
					link.click();
					addToast("Image downloaded successfully!", "success");
				}
			};

			reader.readAsDataURL(blob);
			return url;
		},
		[setContextImage, addToast]
	);

	/**
	 * Convert data URL to blob (useful for operations on carried-over images)
	 * @param {string} dataUrl - Data URL to convert
	 * @returns {Promise<Blob>} Converted blob
	 */
	const dataUrlToBlob = useCallback(async (dataUrl) => {
		const response = await fetch(dataUrl);
		return response.blob();
	}, []);

	return {
		canvasRef,
		loadImage,
		saveProcessedImage,
		dataUrlToBlob,
	};
};
