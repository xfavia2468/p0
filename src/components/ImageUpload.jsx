import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { useImage } from "../ImageContext";
import { validateImageFile, formatFileSize } from "../utils/imageProcessor";
import { useToast } from "../contexts/ToastContext";

export default function ImageUpload({
	onFileSelect,
	accept = "image/*",
	multiple = false,
	batch = false,
}) {
	const [previewUrl, setPreviewUrl] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const { setImage, addBatchImage } = useImage();
	const { addToast } = useToast();

	const processFile = (file) => {
		// Validate file
		const validation = validateImageFile(file);
		if (!validation.valid) {
			addToast(validation.error, "error");
			return;
		}

		// Read file as data URL for context
		const reader = new FileReader();
		reader.onloadend = () => {
			const dataUrl = reader.result;

			if (batch) {
				// Add to batch queue
				addBatchImage(file, dataUrl);
				addToast(`Added to batch: ${file.name}`, "info");
			} else {
				// Single image mode
				setPreviewUrl(dataUrl);
				setImage({ file, url: dataUrl });
				if (onFileSelect) {
					onFileSelect(file, dataUrl);
				}
				addToast(`Image loaded: ${formatFileSize(file.size)}`, "success");
			}
		};
		reader.onerror = () => {
			addToast("Failed to read file", "error");
		};
		reader.readAsDataURL(file);
	};

	const handleFileChange = (e) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		if (multiple || batch) {
			Array.from(files).forEach(processFile);
		} else {
			processFile(files[0]);
		}
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;

		if (multiple) {
			Array.from(files).forEach(processFile);
		} else {
			processFile(files[0]);
		}
	};

	// Cleanup object URL on unmount (not needed for data URLs, but keep for safety)
	useEffect(() => {
		return () => {
			if (previewUrl && previewUrl.startsWith("blob:")) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	return (
		<Form.Group className="mb-3">
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				style={{
					padding: "2rem",
					border: `2px dashed ${isDragging ? "#0d6efd" : "#dee2e6"}`,
					borderRadius: "0.375rem",
					backgroundColor: isDragging ? "#f0f8ff" : "transparent",
					cursor: "pointer",
					transition: "all 0.3s ease",
				}}
			>
				<Form.Control
					type="file"
					accept={accept}
					onChange={handleFileChange}
					multiple={multiple}
					style={{ display: "none" }}
					id="image-input"
				/>
				<label
					htmlFor="image-input"
					style={{
						cursor: "pointer",
						marginBottom: 0,
						display: "block",
						width: "100%",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							width: "100%",
						}}
					>
						<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
						<p
							className="mb-1"
							style={{ fontWeight: 500, margin: "0.25rem 0" }}
						>
							Drag and drop your image here
						</p>
						<p
							className="text-muted small mb-0"
							style={{ margin: "0.25rem 0" }}
						>
							or click to select a file
						</p>
					</div>
				</label>
			</div>
		</Form.Group>
	);
}
