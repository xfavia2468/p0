/**
 * Image filter algorithms
 * Centralized filter functions to reduce code duplication
 */

/**
 * Apply brightness adjustment to image
 * @param {ImageData} imageData - Canvas image data
 * @param {number} value - Brightness value (-100 to 100)
 */
export const applyBrightness = (imageData, value) => {
	const data = imageData.data;
	const brightnessFactor = value / 100;

	for (let i = 0; i < data.length; i += 4) {
		data[i] += brightnessFactor * 255; // R
		data[i + 1] += brightnessFactor * 255; // G
		data[i + 2] += brightnessFactor * 255; // B
		// i + 3 is Alpha, unchanged
	}
};

/**
 * Apply contrast adjustment to image
 * @param {ImageData} imageData - Canvas image data
 * @param {number} value - Contrast value (-100 to 100)
 */
export const applyContrast = (imageData, value) => {
	const data = imageData.data;
	const contrastFactor = (value + 100) / 100;

	for (let i = 0; i < data.length; i += 4) {
		data[i] = (data[i] - 128) * contrastFactor + 128; // R
		data[i + 1] = (data[i + 1] - 128) * contrastFactor + 128; // G
		data[i + 2] = (data[i + 2] - 128) * contrastFactor + 128; // B
		// i + 3 is Alpha, unchanged
	}
};

/**
 * Apply saturation adjustment to image
 * @param {ImageData} imageData - Canvas image data
 * @param {number} value - Saturation value (-100 to 100)
 */
export const applySaturation = (imageData, value) => {
	const data = imageData.data;
	const saturationFactor = (value + 100) / 100;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Convert to grayscale (luminance)
		const gray = r * 0.299 + g * 0.587 + b * 0.114;

		// Blend between grayscale and original based on saturation
		data[i] = gray + (r - gray) * saturationFactor;
		data[i + 1] = gray + (g - gray) * saturationFactor;
		data[i + 2] = gray + (b - gray) * saturationFactor;
	}
};

/**
 * Apply multiple filters in sequence
 * @param {ImageData} imageData - Canvas image data
 * @param {Object} filters - Filter values { brightness, contrast, saturation }
 * @returns {ImageData} Modified image data
 */
export const applyAllFilters = (imageData, filters) => {
	const { brightness = 0, contrast = 0, saturation = 0 } = filters;

	// Apply in specific order for best results: contrast -> brightness -> saturation
	if (contrast !== 0) {
		applyContrast(imageData, contrast);
	}
	if (brightness !== 0) {
		applyBrightness(imageData, brightness);
	}
	if (saturation !== 0) {
		applySaturation(imageData, saturation);
	}

	return imageData;
};
