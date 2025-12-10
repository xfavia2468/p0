import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import { ImageSkeleton } from "../components/LoadingSkeleton";
import "./Watermark.css";

function Watermark() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [watermarkMode, setWatermarkMode] = useState("text"); // 'text' or 'image'
	const [watermarkText, setWatermarkText] = useState("© 2025");
	const [watermarkImageFile, setWatermarkImageFile] = useState(null);
	const [watermarkImageUrl, setWatermarkImageUrl] = useState(null);
	const [fontSize, setFontSize] = useState(48);
	const [opacity, setOpacity] = useState(0.5);
	const [format, setFormat] = useState("image/png");
	const [watermarkPos, setWatermarkPos] = useState({ x: 0, y: 200 });
	const [watermarkSize, setWatermarkSize] = useState({
		width: 200,
		height: 60,
	});
	const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
	const { image: contextImage, setImage: setContextImage } = useImage();
	const { addToast } = useToast();

	const canvasRef = useRef(null);
	const imageRef = useRef(null);
	const previewCanvasRef = useRef(null);
	const watermarkImageRef = useRef(null);
	const dragStartPos = useRef({ x: 0, y: 0 });

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

	const handleWatermarkImageSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			setWatermarkImageFile(file);
			setWatermarkImageUrl(event.target.result);
			watermarkImageRef.current = null; // Reset cached image
		};
		reader.readAsDataURL(file);
	};

	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const drawPreview = async () => {
		if (!selectedFile || !previewCanvasRef.current) return;

		try {
			let img = imageRef.current;
			if (!img) {
				img = await loadImage(selectedFile);
				imageRef.current = img;
			}

			const canvas = previewCanvasRef.current;
			const ctx = canvas.getContext("2d");

			canvas.width = Math.min(img.width, 500);
			canvas.height = (canvas.width / img.width) * img.height;

			const scale = canvas.width / img.width;

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			// Draw watermark based on mode
			if (watermarkMode === "text") {
				// Draw semi-transparent text watermark
				ctx.font = `bold ${fontSize * scale}px Arial`;
				ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
				ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.3})`;
				ctx.lineWidth = 2;

				const x = watermarkPos.x * scale;
				const y = watermarkPos.y * scale;

				ctx.strokeText(watermarkText, x, y);
				ctx.fillText(watermarkText, x, y);
			} else if (watermarkMode === "image" && watermarkImageUrl) {
				// Draw image watermark
				let watermarkImg = watermarkImageRef.current;
				if (!watermarkImg) {
					watermarkImg = new window.Image();
					watermarkImg.src = watermarkImageUrl;
					await new Promise((resolve) => {
						watermarkImg.onload = resolve;
					});
					watermarkImageRef.current = watermarkImg;
				}

				ctx.globalAlpha = opacity;
				ctx.drawImage(
					watermarkImg,
					watermarkPos.x * scale,
					watermarkPos.y * scale,
					watermarkSize.width * scale,
					watermarkSize.height * scale
				);
				ctx.globalAlpha = 1;
			}
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (selectedFile && previewUrl) {
			drawPreview();
		}
	}, [
		selectedFile,
		previewUrl,
		watermarkMode,
		watermarkText,
		watermarkImageUrl,
		fontSize,
		opacity,
		watermarkPos,
		watermarkSize,
	]);

	const applyWatermark = async () => {
		if (!selectedFile) {
			addToast("Please select an image first.", "error");
			return;
		}

		if (watermarkMode === "text" && !watermarkText) {
			addToast("Please enter watermark text.", "error");
			return;
		}

		if (watermarkMode === "image" && !watermarkImageFile) {
			addToast("Please select a watermark image.", "error");
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

			// Apply watermark based on mode
			if (watermarkMode === "text") {
				// Apply text watermark
				ctx.font = `bold ${fontSize}px Arial`;
				ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
				ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.3})`;
				ctx.lineWidth = 3;

				ctx.strokeText(watermarkText, watermarkPos.x, watermarkPos.y);
				ctx.fillText(watermarkText, watermarkPos.x, watermarkPos.y);
			} else if (watermarkMode === "image") {
				// Apply image watermark
				let watermarkImg = watermarkImageRef.current;
				if (!watermarkImg) {
					watermarkImg = new window.Image();
					watermarkImg.src = watermarkImageUrl;
					await new Promise((resolve) => {
						watermarkImg.onload = resolve;
					});
					watermarkImageRef.current = watermarkImg;
				}

				ctx.globalAlpha = opacity;
				ctx.drawImage(
					watermarkImg,
					watermarkPos.x,
					watermarkPos.y,
					watermarkSize.width,
					watermarkSize.height
				);
				ctx.globalAlpha = 1;
			}

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						addToast("Failed to apply watermark.", "error");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					const reader = new FileReader();
					reader.onloadend = () => {
						setContextImage({ file: blob, url: reader.result });
						addToast("Watermark applied successfully!", "success");
					};
					reader.readAsDataURL(blob);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			addToast("Failed to apply watermark.", "error");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `watermarked_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setWatermarkMode("text");
		setWatermarkText("© 2025");
		setWatermarkImageFile(null);
		setWatermarkImageUrl(null);
		setFontSize(48);
		setOpacity(0.5);
		setWatermarkPos({ x: 0, y: 200 });
		setWatermarkSize({ width: 200, height: 60 });
		imageRef.current = null;
		watermarkImageRef.current = null;
		addToast("Reset complete", "info");
	};

	const updateImageSize = async () => {
		if (!selectedFile) return;
		try {
			const img = await loadImage(selectedFile);
			setImageSize({ width: img.width, height: img.height });
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		updateImageSize();
	}, [selectedFile]);

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Watermark</h2>
				<p className="text-muted">
					Add watermark with precise positioning control
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
							<Form.Label htmlFor="watermark-type">Watermark Type</Form.Label>
							<Form.Select
								id="watermark-type"
								value={watermarkMode}
								onChange={(e) => setWatermarkMode(e.target.value)}
								disabled={!selectedFile}
								size="sm"
							>
								<option value="text">Text Watermark</option>
								<option value="image">Image Watermark</option>
							</Form.Select>
						</Form.Group>

						{watermarkMode === "text" ? (
							<>
								<Form.Group className="mb-3">
									<Form.Label htmlFor="watermark-text">
										Watermark Text
									</Form.Label>
									<Form.Control
										id="watermark-text"
										type="text"
										value={watermarkText}
										onChange={(e) => setWatermarkText(e.target.value)}
										placeholder="Enter watermark text"
										disabled={!selectedFile}
										size="sm"
									/>
								</Form.Group>

								<Form.Group className="mb-3">
									<Form.Label htmlFor="font-size">
										Font Size: {fontSize}px
									</Form.Label>
									<div className="d-flex gap-2">
										<Form.Range
											id="font-size"
											min={20}
											max={150}
											value={fontSize}
											onChange={(e) => setFontSize(Number(e.target.value))}
											disabled={!selectedFile}
											className="flex-grow-1"
										/>
										<Form.Control
											type="number"
											min="20"
											max="150"
											value={fontSize}
											onChange={(e) =>
												setFontSize(
													Math.max(
														20,
														Math.min(150, parseInt(e.target.value) || 20)
													)
												)
											}
											disabled={!selectedFile}
											style={{ width: "80px" }}
											size="sm"
										/>
									</div>
								</Form.Group>
							</>
						) : (
							<Form.Group className="mb-3">
								<Form.Label htmlFor="upload-image">
									Upload Watermark Image
								</Form.Label>
								<Form.Control
									id="upload-image"
									type="file"
									accept="image/*"
									onChange={handleWatermarkImageSelect}
									disabled={!selectedFile}
									size="sm"
								/>
								{watermarkImageUrl && (
									<small className="text-success d-block mt-2">
										✓ Watermark image selected
									</small>
								)}
							</Form.Group>
						)}

						<Form.Group className="mb-3">
							<Form.Label htmlFor="x-position">
								X Position: {Math.round(watermarkPos.x)}px
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="x-position"
									min={0}
									max={Math.max(imageSize.width - watermarkSize.width, 0)}
									value={watermarkPos.x}
									onChange={(e) =>
										setWatermarkPos({
											...watermarkPos,
											x: Number(e.target.value),
										})
									}
									disabled={!selectedFile}
									className="flex-grow-1"
								/>
								<Form.Control
									type="number"
									min="0"
									max={Math.max(imageSize.width - watermarkSize.width, 0)}
									value={Math.round(watermarkPos.x)}
									onChange={(e) =>
										setWatermarkPos({
											...watermarkPos,
											x: Math.max(
												0,
												Math.min(
													Number(e.target.value),
													imageSize.width - watermarkSize.width
												)
											),
										})
									}
									disabled={!selectedFile}
									style={{ width: "80px" }}
									size="sm"
								/>
							</div>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="y-position">
								Y Position: {Math.round(watermarkPos.y)}px
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="y-position"
									min={0}
									max={Math.max(imageSize.height - watermarkSize.height, 0)}
									value={watermarkPos.y}
									onChange={(e) =>
										setWatermarkPos({
											...watermarkPos,
											y: Number(e.target.value),
										})
									}
									disabled={!selectedFile}
									className="flex-grow-1"
								/>
								<Form.Control
									type="number"
									min="0"
									max={Math.max(imageSize.height - watermarkSize.height, 0)}
									value={Math.round(watermarkPos.y)}
									onChange={(e) =>
										setWatermarkPos({
											...watermarkPos,
											y: Math.max(
												0,
												Math.min(
													Number(e.target.value),
													imageSize.height - watermarkSize.height
												)
											),
										})
									}
									disabled={!selectedFile}
									style={{ width: "80px" }}
									size="sm"
								/>
							</div>
						</Form.Group>

						{watermarkMode === "image" && (
							<>
								<Form.Group className="mb-3">
									<Form.Label htmlFor="watermark-width">
										Watermark Width: {Math.round(watermarkSize.width)}px
									</Form.Label>
									<div className="d-flex gap-2">
										<Form.Range
											min={50}
											max={imageSize.width}
											value={watermarkSize.width}
											onChange={(e) =>
												setWatermarkSize({
													...watermarkSize,
													width: Number(e.target.value),
												})
											}
											disabled={!selectedFile}
											className="flex-grow-1"
										/>
										<Form.Control
											id="watermark-width"
											type="number"
											min="50"
											max={imageSize.width}
											value={Math.round(watermarkSize.width)}
											onChange={(e) =>
												setWatermarkSize({
													...watermarkSize,
													width: Math.max(
														50,
														Math.min(Number(e.target.value), imageSize.width)
													),
												})
											}
											disabled={!selectedFile}
											style={{ width: "80px" }}
											size="sm"
										/>
									</div>
								</Form.Group>

								<Form.Group className="mb-3">
									<Form.Label htmlFor="watermark-height">
										Watermark Height: {Math.round(watermarkSize.height)}px
									</Form.Label>
									<div className="d-flex gap-2">
										<Form.Range
											id="watermark-height"
											min={30}
											max={imageSize.height}
											value={watermarkSize.height}
											onChange={(e) =>
												setWatermarkSize({
													...watermarkSize,
													height: Number(e.target.value),
												})
											}
											disabled={!selectedFile}
											className="flex-grow-1"
										/>
										<Form.Control
											type="number"
											min="30"
											max={imageSize.height}
											value={Math.round(watermarkSize.height)}
											onChange={(e) =>
												setWatermarkSize({
													...watermarkSize,
													height: Math.max(
														30,
														Math.min(Number(e.target.value), imageSize.height)
													),
												})
											}
											disabled={!selectedFile}
											style={{ width: "80px" }}
											size="sm"
										/>
									</div>
								</Form.Group>
							</>
						)}

						<Form.Group className="mb-3">
							<Form.Label htmlFor="watermark-opacity">
								Opacity: {Math.round(opacity * 100)}%
							</Form.Label>
							<Form.Range
								id="watermark-opacity"
								min={0.1}
								max={1}
								step={0.1}
								value={opacity}
								onChange={(e) => setOpacity(Number(e.target.value))}
								disabled={!selectedFile}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="watermark-output-format">
								Output Format
							</Form.Label>
							<Form.Select
								id="watermark-output-format"
								value={format}
								onChange={(e) => setFormat(e.target.value)}
								size="sm"
							>
								<option value="image/png">PNG</option>
								<option value="image/jpeg">JPEG</option>
								<option value="image/webp">WEBP</option>
							</Form.Select>
						</Form.Group>

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={applyWatermark}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Apply Watermark"}
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
								{previewUrl && !editedUrl && (
									<div className="mb-4 watermark-preview-container">
										<div className="watermark-canvas-wrapper">
											<canvas
												ref={previewCanvasRef}
												className="watermark-preview-canvas"
											/>
										</div>
									</div>
								)}

								{editedUrl && (
									<div>
										<ImagePreview src={editedUrl} title="Watermarked Image" />
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

export default Watermark;
