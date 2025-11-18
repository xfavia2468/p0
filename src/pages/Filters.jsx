import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";

function Filters() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [brightness, setBrightness] = useState(0);
	const [contrast, setContrast] = useState(0);
	const [saturation, setSaturation] = useState(0);
	const [format, setFormat] = useState("image/png");

	const canvasRef = useRef(null);
	const originalImageRef = useRef(null);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (editedUrl) URL.revokeObjectURL(editedUrl);
		};
	}, [previewUrl, editedUrl]);

	const handleFileSelect = (file, url) => {
		setSelectedFile(file);
		setPreviewUrl(url);
		setEditedUrl(null);
		setBrightness(0);
		setContrast(0);
		setSaturation(0);
		originalImageRef.current = null;
	};

	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const applyFilters = async () => {
		if (!selectedFile) {
			alert("Please select an image first.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);

		try {
			let img = originalImageRef.current;
			if (!img) {
				img = await loadImage(selectedFile);
				originalImageRef.current = img;
			}

			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			canvas.width = img.width;
			canvas.height = img.height;
			ctx.clearRect(0, 0, img.width, img.height);
			ctx.drawImage(img, 0, 0);

			// Apply filters using CSS filters (convert to canvas filters)
			// Brightness: 0-200% (0 = black, 100% = normal, 200% = white)
			// Contrast: 0-200% (0 = gray, 100% = normal, 200% = high contrast)
			// Saturation: 0-200% (0 = grayscale, 100% = normal, 200% = oversaturated)

			const brightnessValue = 1 + brightness / 100; // Convert -100 to +100 to 0 to 2
			const contrastValue = 1 + contrast / 100;
			const saturationValue = 1 + saturation / 100;

			// Get image data
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;

			// Apply brightness and contrast
			for (let i = 0; i < data.length; i += 4) {
				// Brightness
				data[i] = Math.min(255, Math.max(0, data[i] * brightnessValue));
				data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessValue));
				data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessValue));

				// Contrast
				const factor = (259 * (contrastValue * 255 + 255)) / (255 * (259 - contrastValue * 255));
				data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
				data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
				data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));

				// Saturation
				const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
				data[i] = Math.min(255, Math.max(0, gray + saturationValue * (data[i] - gray)));
				data[i + 1] = Math.min(255, Math.max(0, gray + saturationValue * (data[i + 1] - gray)));
				data[i + 2] = Math.min(255, Math.max(0, gray + saturationValue * (data[i + 2] - gray)));
			}

			ctx.putImageData(imageData, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						alert("Failed to apply filters.");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			alert("Failed to apply filters.");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `filtered_image.${ext}`;
		link.click();
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setBrightness(0);
		setContrast(0);
		setSaturation(0);
		originalImageRef.current = null;
	};

	const handleResetFilters = () => {
		setBrightness(0);
		setContrast(0);
		setSaturation(0);
		if (selectedFile) {
			applyFilters();
		}
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Image Filters</h2>
				<p className="text-muted">Adjust brightness, contrast, and saturation to enhance your images</p>
			</div>

			{!previewUrl ? (
				// Centered layout when no file selected
				<Row className="justify-content-center">
					<Col xs={12} md={8} lg={6}>
						<ImageUpload onFileSelect={handleFileSelect} />
					</Col>
				</Row>
			) : (
				// Two-column layout when file is selected
				<Row>
					<Col xs={12} lg={5} className="mb-4">
						<ImageUpload onFileSelect={handleFileSelect} />

						<Form.Group className="mb-3">
							<Form.Label>Brightness: {brightness}%</Form.Label>
							<Form.Range
								min="-100"
								max="100"
								value={brightness}
								onChange={(e) => {
									setBrightness(parseInt(e.target.value));
									if (selectedFile) {
										// Auto-apply on change for real-time preview
										setTimeout(() => applyFilters(), 100);
									}
								}}
							/>
							<div className="d-flex justify-content-between">
								<small className="text-muted">-100%</small>
								<small className="text-muted">0%</small>
								<small className="text-muted">+100%</small>
							</div>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Contrast: {contrast}%</Form.Label>
							<Form.Range
								min="-100"
								max="100"
								value={contrast}
								onChange={(e) => {
									setContrast(parseInt(e.target.value));
									if (selectedFile) {
										setTimeout(() => applyFilters(), 100);
									}
								}}
							/>
							<div className="d-flex justify-content-between">
								<small className="text-muted">-100%</small>
								<small className="text-muted">0%</small>
								<small className="text-muted">+100%</small>
							</div>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Saturation: {saturation}%</Form.Label>
							<Form.Range
								min="-100"
								max="100"
								value={saturation}
								onChange={(e) => {
									setSaturation(parseInt(e.target.value));
									if (selectedFile) {
										setTimeout(() => applyFilters(), 100);
									}
								}}
							/>
							<div className="d-flex justify-content-between">
								<small className="text-muted">-100%</small>
								<small className="text-muted">0%</small>
								<small className="text-muted">+100%</small>
							</div>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Output Format</Form.Label>
							<Form.Select
								value={format}
								onChange={(e) => setFormat(e.target.value)}
							>
								<option value="image/png">PNG</option>
								<option value="image/jpeg">JPEG</option>
								<option value="image/webp">WEBP</option>
							</Form.Select>
						</Form.Group>

						<div className="mb-3">
							<Button
								variant="outline-secondary"
								size="sm"
								onClick={handleResetFilters}
							>
								Reset Filters
							</Button>
						</div>

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={applyFilters}
								disabled={!selectedFile || loading}
							>
								{loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
								{loading ? "Processing..." : "Apply Filters"}
							</Button>
							<Button variant="secondary" onClick={handleReset}>
								Reset All
							</Button>
						</div>
					</Col>

					<Col xs={12} lg={7}>
						<div className="sticky-top" style={{ top: '2rem' }}>
							{previewUrl && (
								<div className="mb-4">
									<ImagePreview src={previewUrl} title="Original Image" />
								</div>
							)}

							{editedUrl && (
								<div>
									<ImagePreview
										src={editedUrl}
										title="Filtered Image"
										showSize={true}
										width={canvasRef.current?.width}
										height={canvasRef.current?.height}
									/>
									<Button variant="success" onClick={handleDownload} className="mt-2 w-100">
										Download
									</Button>
								</div>
							)}
						</div>
					</Col>
				</Row>
			)}

			<canvas ref={canvasRef} style={{ display: "none" }} />
		</Container>
	);
}

export default Filters;

