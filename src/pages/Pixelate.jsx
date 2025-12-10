import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import { ImageSkeleton, ButtonSkeleton } from "../components/LoadingSkeleton";

function Pixelate() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [pixelSize, setPixelSize] = useState(10);
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

	// Apply pixelate effect
	const applyPixelate = (imageData, pixelSize) => {
		const data = imageData.data;
		const width = imageData.width;
		const height = imageData.height;

		const size = Math.round(pixelSize);
		if (size < 1) return;

		for (let y = 0; y < height; y += size) {
			for (let x = 0; x < width; x += size) {
				// Get average color in the pixel block
				let sumR = 0,
					sumG = 0,
					sumB = 0,
					sumA = 0;
				let count = 0;

				for (let dy = 0; dy < size && y + dy < height; dy++) {
					for (let dx = 0; dx < size && x + dx < width; dx++) {
						const idx = ((y + dy) * width + (x + dx)) * 4;
						sumR += data[idx];
						sumG += data[idx + 1];
						sumB += data[idx + 2];
						sumA += data[idx + 3];
						count++;
					}
				}

				const avgR = Math.round(sumR / count);
				const avgG = Math.round(sumG / count);
				const avgB = Math.round(sumB / count);
				const avgA = Math.round(sumA / count);

				// Apply average color to all pixels in the block
				for (let dy = 0; dy < size && y + dy < height; dy++) {
					for (let dx = 0; dx < size && x + dx < width; dx++) {
						const idx = ((y + dy) * width + (x + dx)) * 4;
						data[idx] = avgR;
						data[idx + 1] = avgG;
						data[idx + 2] = avgB;
						data[idx + 3] = avgA;
					}
				}
			}
		}
	};

	const handlePixelate = async () => {
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
			applyPixelate(imageData, pixelSize);
			ctx.putImageData(imageData, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						addToast("Failed to apply pixelate.", "error");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					const reader = new FileReader();
					reader.onloadend = () => {
						setContextImage({ file: blob, url: reader.result });
						addToast("Pixelate applied successfully!", "success");
					};
					reader.readAsDataURL(blob);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			addToast("Failed to apply pixelate.", "error");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `pixelated_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setPixelSize(10);
		imageRef.current = null;
		addToast("Reset complete", "info");
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Pixelate</h2>
				<p className="text-muted">
					Apply a pixelate effect with adjustable block size
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
							<Form.Label htmlFor="pixel-size-range">
								Pixel Size: {pixelSize}px
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="pixel-size-range"
									min={2}
									max={50}
									value={pixelSize}
									onChange={(e) => setPixelSize(Number(e.target.value))}
									disabled={!selectedFile}
									className="flex-grow-1"
								/>
								<Form.Control
									type="number"
									min="2"
									max="50"
									value={pixelSize}
									onChange={(e) =>
										setPixelSize(
											Math.max(2, Math.min(50, parseInt(e.target.value) || 2))
										)
									}
									disabled={!selectedFile}
									style={{ width: "80px" }}
								/>
							</div>
							<small className="text-muted d-block mt-2">
								Higher values create larger pixel blocks
							</small>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="pixel-output-format">
								Output Format
							</Form.Label>
							<Form.Select
								id="pixel-output-format"
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
								onClick={handlePixelate}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Apply Pixelate"}
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
										<ImagePreview src={editedUrl} title="Pixelated Image" />
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

export default Pixelate;
