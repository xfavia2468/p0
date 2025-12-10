// Shared image processing utilities

export const loadImage = (file) =>
	new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});

export const fileToDataURL = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

export const blobToDataURL = (blob) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

export const formatFileSize = (bytes) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const validateImageFile = (file, maxSizeMB = 50) => {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;

	if (!file.type.startsWith("image/")) {
		return { valid: false, error: "Please select a valid image file." };
	}

	if (file.size > maxSizeBytes) {
		return {
			valid: false,
			error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${formatFileSize(
				file.size
			)}`,
		};
	}

	return { valid: true };
};
