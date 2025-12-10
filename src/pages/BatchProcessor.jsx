import { useState, useRef } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Form,
	Badge,
	ProgressBar,
	ListGroup,
} from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import "./BatchProcessor.css";

function BatchProcessor() {
	const { batchImages, removeBatchImage, clearBatchImages } = useImage();
	const { addToast } = useToast();

	const [format, setFormat] = useState("image/png");
	const [quality, setQuality] = useState(90);
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [selectedOperation, setSelectedOperation] = useState("format");
	const [resizeWidth, setResizeWidth] = useState(800);
	const [resizeHeight, setResizeHeight] = useState(600);
	const [resizeMode, setResizeMode] = useState("fit");
	const [rotateAngle, setRotateAngle] = useState(90);
	const [blurAmount, setBlurAmount] = useState(5);
	const [compressQuality, setCompressQuality] = useState(80);
	const [grayscaleEnabled, setGrayscaleEnabled] = useState(true);
	const [watermarkText, setWatermarkText] = useState("© 2025");
	const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
	const [filterType, setFilterType] = useState("sepia");

	const canvasRef = useRef(null);

	const applyOperation = async (imgElement, ctx, canvas) => {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		switch (selectedOperation) {
			case "blur":
				return applyBlur(canvas, ctx, blurAmount);
			case "grayscale":
				return applyGrayscale(imageData);
			case "filters":
				return applyFilter(imageData, filterType);
			case "watermark":
				return applyWatermarkText(ctx, canvas, watermarkText, watermarkOpacity);
			case "resize":
				return resizeImage(
					imgElement,
					canvas,
					ctx,
					resizeWidth,
					resizeHeight,
					resizeMode
				);
			case "rotate":
				return rotateImage(canvas, ctx, rotateAngle);
			case "compress":
				return true;
			default:
				return true;
		}
	};

	const applyBlur = (canvas, ctx, amount) => {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		for (let i = 0; i < amount; i++) {
			for (let j = 0; j < data.length; j += 4) {
				if (j + 4 < data.length) {
					data[j] = (data[j] + data[j + 4]) / 2;
					data[j + 1] = (data[j + 1] + data[j + 5]) / 2;
					data[j + 2] = (data[j + 2] + data[j + 6]) / 2;
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
		return true;
	};

	const applyGrayscale = (imageData) => {
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
			data[i] = gray;
			data[i + 1] = gray;
			data[i + 2] = gray;
		}
		return imageData;
	};

	const applyFilter = (imageData, type) => {
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			switch (type) {
				case "sepia":
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
					data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
					data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
					break;
				case "invert":
					data[i] = 255 - data[i];
					data[i + 1] = 255 - data[i + 1];
					data[i + 2] = 255 - data[i + 2];
					break;
				case "saturate":
					const h = Math.max(data[i], data[i + 1], data[i + 2]);
					const l = Math.min(data[i], data[i + 1], data[i + 2]);
					const delta = h - l;
					if (delta > 0) {
						data[i] = Math.min(255, data[i] + delta * 0.2);
						data[i + 1] = Math.min(255, data[i + 1] + delta * 0.2);
						data[i + 2] = Math.min(255, data[i + 2] + delta * 0.2);
					}
					break;
				default:
					break;
			}
		}
		return imageData;
	};

	const applyWatermarkText = (ctx, canvas, text, opacity) => {
		ctx.font = "bold 48px Arial";
		ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
		ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.3})`;
		ctx.lineWidth = 2;
		ctx.strokeText(text, canvas.width / 2 - 100, canvas.height / 2);
		ctx.fillText(text, canvas.width / 2 - 100, canvas.height / 2);
		return true;
	};

	const resizeImage = (img, canvas, ctx, width, height, mode) => {
		if (mode === "fit") {
			const scale = Math.min(width / img.width, height / img.height);
			const newWidth = img.width * scale;
			const newHeight = img.height * scale;
			canvas.width = newWidth;
			canvas.height = newHeight;
			ctx.drawImage(img, 0, 0, newWidth, newHeight);
		} else if (mode === "fill") {
			const scale = Math.max(width / img.width, height / img.height);
			const newWidth = img.width * scale;
			const newHeight = img.height * scale;
			canvas.width = width;
			canvas.height = height;
			const x = (width - newWidth) / 2;
			const y = (height - newHeight) / 2;
			ctx.drawImage(img, x, y, newWidth, newHeight);
		} else {
			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(img, 0, 0, width, height);
		}
		return true;
	};

	const rotateImage = (canvas, ctx, angle) => {
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

		const rad = (angle * Math.PI) / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);

		canvas.width =
			Math.abs(tempCanvas.width * cos) + Math.abs(tempCanvas.height * sin);
		canvas.height =
			Math.abs(tempCanvas.width * sin) + Math.abs(tempCanvas.height * cos);

		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(rad);
		ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);

		return true;
	};

	const getQualityForOperation = () => {
		if (selectedOperation === "compress") {
			return compressQuality / 100;
		}
		if (format === "image/jpeg") {
			return quality / 100;
		}
		return 1.0;
	};

	const handleProcessBatch = async () => {
		if (batchImages.length === 0) {
			addToast("Please add images to batch first.", "error");
			return;
		}

		setProcessing(true);
		setProgress(0);

		try {
			for (let i = 0; i < batchImages.length; i++) {
				const { file, url } = batchImages[i];
				const img = new window.Image();
				img.onload = async () => {
					const canvas = canvasRef.current;
					const ctx = canvas.getContext("2d");

					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);

					if (selectedOperation === "resize") {
						resizeImage(
							img,
							canvas,
							ctx,
							resizeWidth,
							resizeHeight,
							resizeMode
						);
					} else if (selectedOperation === "rotate") {
						rotateImage(canvas, ctx, rotateAngle);
					} else if (selectedOperation === "blur") {
						applyBlur(canvas, ctx, blurAmount);
					} else if (selectedOperation === "grayscale") {
						const imageData = ctx.getImageData(
							0,
							0,
							canvas.width,
							canvas.height
						);
						const processed = applyGrayscale(imageData);
						ctx.putImageData(processed, 0, 0);
					} else if (selectedOperation === "filters") {
						const imageData = ctx.getImageData(
							0,
							0,
							canvas.width,
							canvas.height
						);
						const processed = applyFilter(imageData, filterType);
						ctx.putImageData(processed, 0, 0);
					} else if (selectedOperation === "watermark") {
						applyWatermarkText(ctx, canvas, watermarkText, watermarkOpacity);
					}

					canvas.toBlob(
						(blob) => {
							if (blob) {
								const downloadUrl = URL.createObjectURL(blob);
								const link = document.createElement("a");
								link.href = downloadUrl;
								const ext =
									format === "image/png"
										? "png"
										: format === "image/jpeg"
										? "jpg"
										: "webp";
								link.download = `batch_${selectedOperation}_${i + 1}.${ext}`;
								link.click();
								URL.revokeObjectURL(downloadUrl);

								setProgress(Math.round(((i + 1) / batchImages.length) * 100));

								if (i === batchImages.length - 1) {
									setProcessing(false);
									addToast(
										`Successfully processed ${batchImages.length} images!`,
										"success"
									);
									clearBatchImages();
								}
							}
						},
						format,
						getQualityForOperation()
					);
				};
				img.src = url;
			}
		} catch (err) {
			console.error(err);
			addToast("Failed to process batch", "error");
			setProcessing(false);
		}
	};

	return (
		<Container className="py-5 batch-processor">
			<div className="text-center mb-5">
				<h2 className="mb-3">Batch Processor</h2>
				<p className="text-muted">
					Apply operations to multiple images at once
				</p>
				<p className="text-muted small">
					<strong>How it works:</strong> Upload images, select an operation and
					configure settings, then click "Process Batch" to download all
					processed images.
				</p>
			</div>

			<Row>
				<Col xs={12} lg={4} className="mb-4">
					<Card className="mb-4">
						<Card.Header className="bg-light">
							<Card.Title className="mb-0">Upload Images</Card.Title>
						</Card.Header>
						<Card.Body>
							<ImageUpload batch={true} multiple={true} />

							<Card.Subtitle className="mb-3 text-muted">
								Images in batch:
							</Card.Subtitle>

							{batchImages.length === 0 ? (
								<p className="text-muted small">No images added yet</p>
							) : (
								<ListGroup variant="flush" className="mb-3">
									{batchImages.map((img, idx) => (
										<ListGroup.Item
											key={img.id}
											className="d-flex justify-content-between align-items-center py-2"
										>
											<span className="small">Image {idx + 1}</span>
											<Button
												variant="danger"
												size="sm"
												onClick={() => {
													removeBatchImage(img.id);
													addToast("Image removed from batch", "info");
												}}
											>
												Remove
											</Button>
										</ListGroup.Item>
									))}
								</ListGroup>
							)}

							<Badge bg="primary" className="mb-3">
								{batchImages.length} image{batchImages.length !== 1 ? "s" : ""}
							</Badge>
						</Card.Body>
					</Card>

					<Card>
						<Card.Header className="bg-light">
							<Card.Title className="mb-0">Settings</Card.Title>
						</Card.Header>
						<Card.Body>
							<Form.Group className="mb-3">
								<Form.Label htmlFor="outputFormat">Output Format</Form.Label>
								<Form.Select
									id="outputFormat"
									value={format}
									onChange={(e) => setFormat(e.target.value)}
								>
									<option value="image/png">PNG</option>
									<option value="image/jpeg">JPEG</option>
									<option value="image/webp">WEBP</option>
								</Form.Select>
							</Form.Group>

							{format === "image/jpeg" && (
								<Form.Group className="mb-3">
									<Form.Label htmlFor="jpegQualityRange">
										Quality: {quality}%
									</Form.Label>
									<Form.Range
										id="jpegQualityRange"
										min="10"
										max="100"
										value={quality}
										onChange={(e) => setQuality(parseInt(e.target.value))}
										aria-describedby="jpegQualityHelp"
									/>
									<small
										id="jpegQualityHelp"
										className="text-muted d-block mt-1"
									>
										Applies only to JPEG output
									</small>
								</Form.Group>
							)}

							<div className="d-flex gap-2">
								<Button
									variant="primary"
									onClick={handleProcessBatch}
									disabled={batchImages.length === 0 || processing}
									className="flex-grow-1"
								>
									{processing ? "Processing..." : "Process Batch"}
								</Button>
								<Button
									variant="secondary"
									onClick={() => {
										clearBatchImages();
										setProgress(0);
										addToast("Batch cleared", "info");
									}}
									disabled={batchImages.length === 0}
								>
									Clear All
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col xs={12} lg={8}>
					<Card className="mb-4">
						<Card.Header className="bg-light">
							<Card.Title className="mb-0">Operation</Card.Title>
						</Card.Header>
						<Card.Body>
							<div className="mb-3 border-bottom">
								<div className="d-flex gap-2 flex-wrap">
									{[
										"format",
										"resize",
										"rotate",
										"blur",
										"compress",
										"grayscale",
										"filters",
										"watermark",
									].map((op) => (
										<Button
											key={op}
											variant={
												selectedOperation === op
													? "primary"
													: "outline-secondary"
											}
											size="sm"
											onClick={() => setSelectedOperation(op)}
											className="mb-2"
										>
											{op.charAt(0).toUpperCase() + op.slice(1)}
										</Button>
									))}
								</div>
							</div>

							<div className="mt-3">
								{selectedOperation === "format" && (
									<p className="text-muted small">
										Convert all images to your selected output format and
										quality.
									</p>
								)}

								{selectedOperation === "resize" && (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="resizeWidthRange">
												Width: {resizeWidth}px
											</Form.Label>
											<Form.Range
												id="resizeWidthRange"
												min="100"
												max="2000"
												step="50"
												value={resizeWidth}
												onChange={(e) =>
													setResizeWidth(parseInt(e.target.value))
												}
											/>
										</Form.Group>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="resizeHeightRange">
												Height: {resizeHeight}px
											</Form.Label>
											<Form.Range
												id="resizeHeightRange"
												min="100"
												max="2000"
												step="50"
												value={resizeHeight}
												onChange={(e) =>
													setResizeHeight(parseInt(e.target.value))
												}
											/>
										</Form.Group>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="resizeModeSelect">
												Resize Mode
											</Form.Label>
											<Form.Select
												id="resizeModeSelect"
												value={resizeMode}
												onChange={(e) => setResizeMode(e.target.value)}
											>
												<option value="fit">Fit (maintain aspect ratio)</option>
												<option value="fill">Fill (crop to fit)</option>
												<option value="stretch">
													Stretch (ignore aspect ratio)
												</option>
											</Form.Select>
										</Form.Group>
									</>
								)}

								{selectedOperation === "rotate" && (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="rotateAngleRange">
												Rotation Angle: {rotateAngle}°
											</Form.Label>
											<Form.Range
												id="rotateAngleRange"
												min="0"
												max="360"
												step="15"
												value={rotateAngle}
												onChange={(e) =>
													setRotateAngle(parseInt(e.target.value))
												}
											/>
										</Form.Group>
										<p className="text-muted small">
											Rotate all images by the specified angle.
										</p>
									</>
								)}

								{selectedOperation === "blur" && (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="blurAmountRange">
												Blur Amount: {blurAmount}
											</Form.Label>
											<Form.Range
												id="blurAmountRange"
												min="1"
												max="10"
												value={blurAmount}
												onChange={(e) =>
													setBlurAmount(parseInt(e.target.value))
												}
											/>
										</Form.Group>
										<p className="text-muted small">
											Apply blur effect to all images.
										</p>
									</>
								)}

								{selectedOperation === "compress" && (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="compressQualityRange">
												Compression Level: {compressQuality}%
											</Form.Label>
											<Form.Range
												id="compressQualityRange"
												min="10"
												max="100"
												value={compressQuality}
												onChange={(e) =>
													setCompressQuality(parseInt(e.target.value))
												}
											/>
										</Form.Group>
										<p className="text-muted small">
											Reduce file size by compressing all images.
										</p>
									</>
								)}

								{selectedOperation === "grayscale" && (
									<>
										<Form.Check
											type="checkbox"
											id="grayscaleCheck"
											label="Apply grayscale effect"
											checked={grayscaleEnabled}
											onChange={(e) => setGrayscaleEnabled(e.target.checked)}
										/>
										<p className="text-muted small mt-2">
											Convert all images to grayscale.
										</p>
									</>
								)}

								{selectedOperation === "filters" && (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="filterTypeSelect">
												Filter Type
											</Form.Label>
											<Form.Select
												id="filterTypeSelect"
												value={filterType}
												onChange={(e) => setFilterType(e.target.value)}
											>
												<option value="sepia">Sepia</option>
												<option value="invert">Invert</option>
												<option value="saturate">Saturate</option>
											</Form.Select>
										</Form.Group>
										<p className="text-muted small">
											Apply artistic filters to all images.
										</p>
									</>
								)}

								{selectedOperation === "watermark" && (
									<>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="watermarkTextInput">
												Watermark Text
											</Form.Label>
											<Form.Control
												id="watermarkTextInput"
												type="text"
												value={watermarkText}
												onChange={(e) => setWatermarkText(e.target.value)}
												placeholder="Enter watermark text"
											/>
										</Form.Group>
										<Form.Group className="mb-3">
											<Form.Label htmlFor="watermarkOpacityRange">
												Opacity: {Math.round(watermarkOpacity * 100)}%
											</Form.Label>
											<Form.Range
												id="watermarkOpacityRange"
												min="0.1"
												max="1"
												step="0.1"
												value={watermarkOpacity}
												onChange={(e) =>
													setWatermarkOpacity(Number(e.target.value))
												}
											/>
										</Form.Group>
									</>
								)}
							</div>
						</Card.Body>
					</Card>

					{processing && (
						<Card className="mb-4">
							<Card.Body>
								<Card.Title className="mb-3">Processing Progress</Card.Title>
								<ProgressBar
									now={progress}
									label={`${progress}%`}
									className="mb-2"
								/>
								<small className="text-muted">
									Processed {Math.ceil((progress / 100) * batchImages.length)}{" "}
									of {batchImages.length} images
								</small>
							</Card.Body>
						</Card>
					)}

					{!processing && batchImages.length > 0 && (
						<Card className="mb-4 border-success">
							<Card.Body className="text-center">
								<div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✅</div>
								<p className="mb-2">
									<strong>
										{batchImages.length} image
										{batchImages.length !== 1 ? "s" : ""} ready to process
									</strong>
								</p>
								<p className="text-muted small">
									Applying{" "}
									{selectedOperation === "format"
										? "format conversion"
										: selectedOperation}{" "}
									to all images
								</p>
							</Card.Body>
						</Card>
					)}

					{batchImages.length === 0 && (
						<Card>
							<Card.Body className="text-center">
								<div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📁</div>
								<p className="mb-0 text-muted">
									Upload images using the drag-and-drop area on the left to get
									started
								</p>
							</Card.Body>
						</Card>
					)}
				</Col>
			</Row>

			<canvas ref={canvasRef} style={{ display: "none" }} />
		</Container>
	);
}

export default BatchProcessor;
