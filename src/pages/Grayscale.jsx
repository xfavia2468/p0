import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import { ImageSkeleton, ButtonSkeleton } from "../components/LoadingSkeleton";

function Grayscale() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [intensity, setIntensity] = useState(100);
	const [format, setFormat] = useState("image/png");
	const { image: contextImage, setImage: setContextImage } = useImage();
	const { addToast } = useToast();

	const canvasRef = useRef(null);
	const imageRef = useRef(null);

	useEffect(() => {
		if (contextImage && contextImage.url) {
			setSelectedFile(contextImage.file);
			setPreviewUrl(contextImage.url);
			setEditedUrl(null);
			imageRef.current = null;
		}
	}, []);

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
		imageRef.current = null;
	};

	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const applyGrayscale = async () => {
		if (!selectedFile) {
			addToast("Please select an image first.", "error");
			return;
		}

		setLoading(true);
		setEditedUrl(null);

		try {
			let img = imageRef.current;
			if (!img) {
				img = await loadImage(selectedFile);
				imageRef.current = img;
			}

			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;
			const intensityFactor = intensity / 100;

			for (let i = 0; i < data.length; i += 4) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];

				// Use luminance formula
				const gray = r * 0.299 + g * 0.587 + b * 0.114;

				// Blend between original and grayscale based on intensity
				data[i] = r + (gray - r) * intensityFactor;
				data[i + 1] = g + (gray - g) * intensityFactor;
				data[i + 2] = b + (gray - b) * intensityFactor;
			}

			ctx.putImageData(imageData, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						addToast("Failed to apply grayscale.", "error");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					const reader = new FileReader();
					reader.onloadend = () => {
						setContextImage({ file: blob, url: reader.result });
						addToast("Grayscale applied successfully!", "success");
					};
					reader.readAsDataURL(blob);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			addToast("Failed to apply grayscale.", "error");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `grayscale_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setIntensity(100);
		imageRef.current = null;
		addToast("Reset complete", "info");
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Grayscale</h2>
				<p className="text-muted">
					Convert your image to grayscale with adjustable intensity
				</p>
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
							<Form.Label htmlFor="intensity-range">
								Intensity: {intensity}%
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="intensity-range"
									min={0}
									max={100}
									value={intensity}
									onChange={(e) => setIntensity(Number(e.target.value))}
									disabled={!selectedFile}
									className="flex-grow-1"
								/>
								<Form.Control
									type="number"
									min="0"
									max="100"
									value={intensity}
									onChange={(e) =>
										setIntensity(
											Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
										)
									}
									disabled={!selectedFile}
									style={{ width: "80px" }}
								/>
							</div>
							<small className="text-muted d-block mt-2">
								0% = Color (Original), 100% = Full Grayscale
							</small>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="gray-output-format">
								Output Format
							</Form.Label>
							<Form.Select
								id="gray-output-format"
								value={format}
								onChange={(e) => setFormat(e.target.value)}
							>
								<option value="image/png">PNG</option>
								<option value="image/jpeg">JPEG</option>
								<option value="image/webp">WEBP</option>
							</Form.Select>
						</Form.Group>

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={applyGrayscale}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Apply Grayscale"}
							</Button>
							<Button variant="secondary" onClick={handleReset}>
								Reset
							</Button>
						</div>
					</Col>

					<Col xs={12} lg={7}>
						{loading && editedUrl === null ? (
							<ImageSkeleton />
						) : (
							<div className="sticky-top" style={{ top: "0.5rem" }}>
								{previewUrl && (
									<ImagePreview src={previewUrl} title="Original Image" />
								)}
								{editedUrl && (
									<div>
										<ImagePreview src={editedUrl} title="Grayscale Image" />
										<div className="d-flex gap-2 mt-2">
											<Button
												variant="success"
												onClick={handleDownload}
												className="flex-grow-1"
											>
												Download
											</Button>
											<Button
												variant="secondary"
												onClick={handleReset}
												className="flex-grow-1"
											>
												Reset
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
					</Col>
				</Row>
			)}

			<canvas ref={canvasRef} style={{ display: "none" }} />
		</Container>
	);
}

export default Grayscale;
