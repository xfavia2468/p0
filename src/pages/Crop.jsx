import { useState, useRef, useEffect } from "react";
import {
	Container,
	Form,
	Button,
	Spinner,
	Row,
	Col,
	Card,
} from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";

function Crop() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [aspectRatio, setAspectRatio] = useState("free");
	const [cropX, setCropX] = useState(0);
	const [cropY, setCropY] = useState(0);
	const [cropWidth, setCropWidth] = useState(0);
	const [cropHeight, setCropHeight] = useState(0);
	const [imageDimensions, setImageDimensions] = useState({
		width: 0,
		height: 0,
	});
	const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragType, setDragType] = useState(null); // 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
	const dragStartRef = useRef({ x: 0, y: 0 });
	const cropStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

	const canvasRef = useRef(null);
	const previewCanvasRef = useRef(null);
	const imgRef = useRef(null);
	const imageContainerRef = useRef(null);
	const overlayCanvasRef = useRef(null);

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
		setCropX(0);
		setCropY(0);
		setCropWidth(0);
		setCropHeight(0);

		// Load image to get dimensions
		const img = new Image();
		img.onload = () => {
			setImageDimensions({ width: img.width, height: img.height });
			imgRef.current = img;

			// Calculate display size (max 600px width)
			const maxDisplayWidth = 600;
			const scale = Math.min(1, maxDisplayWidth / img.width);
			const displayW = img.width * scale;
			const displayH = img.height * scale;
			setDisplaySize({ width: displayW, height: displayH });

			// Initialize crop to full image (in image coordinates)
			setCropWidth(img.width);
			setCropHeight(img.height);

			// Draw overlay after a short delay to ensure container is rendered
			setTimeout(() => drawOverlay(), 100);
		};
		img.src = url;
	};

	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const handleCrop = async () => {
		if (!selectedFile || !cropWidth || !cropHeight) {
			alert("Please select an image and set crop dimensions.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);

		try {
			const img = await loadImage(selectedFile);
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			// Ensure crop coordinates are within image bounds
			const x = Math.max(0, Math.min(cropX, img.width - cropWidth));
			const y = Math.max(0, Math.min(cropY, img.height - cropHeight));
			const w = Math.min(cropWidth, img.width - x);
			const h = Math.min(cropHeight, img.height - y);

			canvas.width = w;
			canvas.height = h;
			ctx.clearRect(0, 0, w, h);
			ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						alert("Failed to crop image.");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					setLoading(false);
				},
				"image/png",
				1.0
			);
		} catch (err) {
			console.error(err);
			alert("Failed to crop image.");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = "cropped_image.png";
		link.click();
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setCropX(0);
		setCropY(0);
		setCropWidth(0);
		setCropHeight(0);
		setAspectRatio("free");
		setImageDimensions({ width: 0, height: 0 });
	};

	// Convert image coordinates to display coordinates
	const imageToDisplay = (val, dimension) => {
		if (!imageDimensions.width || !displaySize.width) return 0;
		return (val / imageDimensions[dimension]) * displaySize[dimension];
	};

	// Convert display coordinates to image coordinates
	const displayToImage = (val, dimension) => {
		if (!imageDimensions.width || !displaySize.width) return 0;
		return (val / displaySize[dimension]) * imageDimensions[dimension];
	};

	// Draw the crop overlay
	const drawOverlay = () => {
		if (!overlayCanvasRef.current || !imageDimensions.width) return;

		const canvas = overlayCanvasRef.current;
		const ctx = canvas.getContext("2d");
		const displayX = imageToDisplay(cropX, "width");
		const displayY = imageToDisplay(cropY, "height");
		const displayW = imageToDisplay(cropWidth, "width");
		const displayH = imageToDisplay(cropHeight, "height");

		canvas.width = displaySize.width;
		canvas.height = displaySize.height;

		// Draw dark overlay outside crop area
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Clear the crop area
		ctx.clearRect(displayX, displayY, displayW, displayH);

		// Draw crop border
		ctx.strokeStyle = "#4A90E2";
		ctx.lineWidth = 2;
		ctx.strokeRect(displayX, displayY, displayW, displayH);

		// Draw corner handles
		const handleSize = 10;
		ctx.fillStyle = "#4A90E2";
		ctx.fillRect(
			displayX - handleSize / 2,
			displayY - handleSize / 2,
			handleSize,
			handleSize
		);
		ctx.fillRect(
			displayX + displayW - handleSize / 2,
			displayY - handleSize / 2,
			handleSize,
			handleSize
		);
		ctx.fillRect(
			displayX - handleSize / 2,
			displayY + displayH - handleSize / 2,
			handleSize,
			handleSize
		);
		ctx.fillRect(
			displayX + displayW - handleSize / 2,
			displayY + displayH - handleSize / 2,
			handleSize,
			handleSize
		);

		// Draw edge handles
		ctx.fillRect(
			displayX + displayW / 2 - handleSize / 2,
			displayY - handleSize / 2,
			handleSize,
			handleSize
		);
		ctx.fillRect(
			displayX + displayW / 2 - handleSize / 2,
			displayY + displayH - handleSize / 2,
			handleSize,
			handleSize
		);
		ctx.fillRect(
			displayX - handleSize / 2,
			displayY + displayH / 2 - handleSize / 2,
			handleSize,
			handleSize
		);
		ctx.fillRect(
			displayX + displayW - handleSize / 2,
			displayY + displayH / 2 - handleSize / 2,
			handleSize,
			handleSize
		);
	};

	// Get what part of crop box is being dragged
	const getDragType = (x, y) => {
		const displayX = imageToDisplay(cropX, "width");
		const displayY = imageToDisplay(cropY, "height");
		const displayW = imageToDisplay(cropWidth, "width");
		const displayH = imageToDisplay(cropHeight, "height");
		const handleSize = 15;

		// Check corners first
		if (
			Math.abs(x - displayX) < handleSize &&
			Math.abs(y - displayY) < handleSize
		)
			return "nw";
		if (
			Math.abs(x - (displayX + displayW)) < handleSize &&
			Math.abs(y - displayY) < handleSize
		)
			return "ne";
		if (
			Math.abs(x - displayX) < handleSize &&
			Math.abs(y - (displayY + displayH)) < handleSize
		)
			return "sw";
		if (
			Math.abs(x - (displayX + displayW)) < handleSize &&
			Math.abs(y - (displayY + displayH)) < handleSize
		)
			return "se";

		// Check edges
		if (
			Math.abs(y - displayY) < handleSize &&
			x >= displayX &&
			x <= displayX + displayW
		)
			return "n";
		if (
			Math.abs(y - (displayY + displayH)) < handleSize &&
			x >= displayX &&
			x <= displayX + displayW
		)
			return "s";
		if (
			Math.abs(x - displayX) < handleSize &&
			y >= displayY &&
			y <= displayY + displayH
		)
			return "w";
		if (
			Math.abs(x - (displayX + displayW)) < handleSize &&
			y >= displayY &&
			y <= displayY + displayH
		)
			return "e";

		// Check if inside crop box
		if (
			x >= displayX &&
			x <= displayX + displayW &&
			y >= displayY &&
			y <= displayY + displayH
		)
			return "move";

		return null;
	};

	// Handle mouse down
	const handleMouseDown = (e) => {
		if (!imageContainerRef.current || !imageDimensions.width) return;

		const rect = imageContainerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const type = getDragType(x, y);
		if (!type) return;

		e.preventDefault();
		setIsDragging(true);
		setDragType(type);
		dragStartRef.current = { x, y };
		cropStartRef.current = { x: cropX, y: cropY, w: cropWidth, h: cropHeight };
	};

	// Get cursor style based on position
	const getCursor = (x, y) => {
		const type = getDragType(x, y);
		if (!type) return "default";
		const cursors = {
			move: "move",
			nw: "nwse-resize",
			ne: "nesw-resize",
			sw: "nesw-resize",
			se: "nwse-resize",
			n: "ns-resize",
			s: "ns-resize",
			e: "ew-resize",
			w: "ew-resize",
		};
		return cursors[type] || "default";
	};

	// Handle mouse move for cursor update
	const handleMouseMove = (e) => {
		if (!imageContainerRef.current || !imageDimensions.width) return;

		const rect = imageContainerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (!isDragging) {
			const cursor = getCursor(x, y);
			if (imageContainerRef.current) {
				imageContainerRef.current.style.cursor = cursor;
			}
		}
	};

	// Handle mouse up
	const handleMouseUp = () => {
		setIsDragging(false);
		setDragType(null);
	};

	// Update overlay when crop changes
	useEffect(() => {
		if (previewUrl && imageDimensions.width && displaySize.width) {
			drawOverlay();
		}
	}, [
		cropX,
		cropY,
		cropWidth,
		cropHeight,
		previewUrl,
		imageDimensions,
		displaySize,
		aspectRatio,
	]);

	// Add global mouse event listeners when dragging
	useEffect(() => {
		if (isDragging) {
			const handleGlobalMouseMove = (e) => {
				if (!imageContainerRef.current || !imageDimensions.width) return;
				const rect = imageContainerRef.current.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;

				const dx = displayToImage(x - dragStartRef.current.x, "width");
				const dy = displayToImage(y - dragStartRef.current.y, "height");

				let newX = cropStartRef.current.x;
				let newY = cropStartRef.current.y;
				let newW = cropStartRef.current.w;
				let newH = cropStartRef.current.h;

				if (dragType === "move") {
					newX = Math.max(
						0,
						Math.min(
							cropStartRef.current.x + dx,
							imageDimensions.width - cropStartRef.current.w
						)
					);
					newY = Math.max(
						0,
						Math.min(
							cropStartRef.current.y + dy,
							imageDimensions.height - cropStartRef.current.h
						)
					);
				} else if (dragType === "nw") {
					newX = Math.max(0, cropStartRef.current.x + dx);
					newY = Math.max(0, cropStartRef.current.y + dy);
					newW = cropStartRef.current.w - (newX - cropStartRef.current.x);
					newH = cropStartRef.current.h - (newY - cropStartRef.current.y);
				} else if (dragType === "ne") {
					newY = Math.max(0, cropStartRef.current.y + dy);
					newW = cropStartRef.current.w + dx;
					newH = cropStartRef.current.h - (newY - cropStartRef.current.y);
				} else if (dragType === "sw") {
					newX = Math.max(0, cropStartRef.current.x + dx);
					newW = cropStartRef.current.w - (newX - cropStartRef.current.x);
					newH = cropStartRef.current.h + dy;
				} else if (dragType === "se") {
					newW = cropStartRef.current.w + dx;
					newH = cropStartRef.current.h + dy;
				} else if (dragType === "n") {
					newY = Math.max(0, cropStartRef.current.y + dy);
					newH = cropStartRef.current.h - (newY - cropStartRef.current.y);
				} else if (dragType === "s") {
					newH = cropStartRef.current.h + dy;
				} else if (dragType === "w") {
					newX = Math.max(0, cropStartRef.current.x + dx);
					newW = cropStartRef.current.w - (newX - cropStartRef.current.x);
				} else if (dragType === "e") {
					newW = cropStartRef.current.w + dx;
				}

				// Apply aspect ratio constraints
				if (aspectRatio !== "free") {
					let targetRatio;
					switch (aspectRatio) {
						case "1:1":
							targetRatio = 1;
							break;
						case "4:3":
							targetRatio = 4 / 3;
							break;
						case "16:9":
							targetRatio = 16 / 9;
							break;
						case "3:4":
							targetRatio = 3 / 4;
							break;
						case "9:16":
							targetRatio = 9 / 16;
							break;
						default:
							targetRatio = 1;
					}

					if (
						dragType.includes("w") ||
						dragType.includes("e") ||
						dragType === "se" ||
						dragType === "ne" ||
						dragType === "sw"
					) {
						newH = newW / targetRatio;
					} else {
						newW = newH * targetRatio;
					}
				}

				// Ensure bounds
				if (newX + newW > imageDimensions.width) {
					newW = imageDimensions.width - newX;
					if (aspectRatio !== "free") {
						const targetRatio =
							aspectRatio === "1:1"
								? 1
								: aspectRatio === "4:3"
								? 4 / 3
								: aspectRatio === "16:9"
								? 16 / 9
								: aspectRatio === "3:4"
								? 3 / 4
								: 9 / 16;
						newH = newW / targetRatio;
					}
				}
				if (newY + newH > imageDimensions.height) {
					newH = imageDimensions.height - newY;
					if (aspectRatio !== "free") {
						const targetRatio =
							aspectRatio === "1:1"
								? 1
								: aspectRatio === "4:3"
								? 4 / 3
								: aspectRatio === "16:9"
								? 16 / 9
								: aspectRatio === "3:4"
								? 3 / 4
								: 9 / 16;
						newW = newH * targetRatio;
					}
				}

				// Ensure minimum size
				if (newW < 10) newW = 10;
				if (newH < 10) newH = 10;

				setCropX(newX);
				setCropY(newY);
				setCropWidth(newW);
				setCropHeight(newH);
			};

			const handleGlobalMouseUp = () => {
				setIsDragging(false);
				setDragType(null);
			};

			window.addEventListener("mousemove", handleGlobalMouseMove);
			window.addEventListener("mouseup", handleGlobalMouseUp);

			return () => {
				window.removeEventListener("mousemove", handleGlobalMouseMove);
				window.removeEventListener("mouseup", handleGlobalMouseUp);
			};
		}
	}, [isDragging, dragType, imageDimensions, displaySize, aspectRatio]);

	const handleAspectRatioChange = (e) => {
		const ratio = e.target.value;
		setAspectRatio(ratio);

		if (ratio === "free" || !imageDimensions.width) return;

		let newWidth = cropWidth || imageDimensions.width;
		let newHeight = cropHeight || imageDimensions.height;

		switch (ratio) {
			case "1:1":
				newHeight = newWidth;
				break;
			case "4:3":
				newHeight = Math.round((newWidth * 3) / 4);
				break;
			case "16:9":
				newHeight = Math.round((newWidth * 9) / 16);
				break;
			case "3:4":
				newHeight = Math.round((newWidth * 4) / 3);
				break;
			case "9:16":
				newHeight = Math.round((newWidth * 16) / 9);
				break;
			default:
				return;
		}

		// Ensure dimensions don't exceed image bounds
		if (newWidth > imageDimensions.width) {
			newWidth = imageDimensions.width;
			newHeight =
				ratio === "1:1"
					? newWidth
					: ratio === "4:3"
					? Math.round((newWidth * 3) / 4)
					: ratio === "16:9"
					? Math.round((newWidth * 9) / 16)
					: ratio === "3:4"
					? Math.round((newWidth * 4) / 3)
					: Math.round((newWidth * 16) / 9);
		}
		if (newHeight > imageDimensions.height) {
			newHeight = imageDimensions.height;
			newWidth =
				ratio === "1:1"
					? newHeight
					: ratio === "4:3"
					? Math.round((newHeight * 4) / 3)
					: ratio === "16:9"
					? Math.round((newHeight * 16) / 9)
					: ratio === "3:4"
					? Math.round((newHeight * 3) / 4)
					: Math.round((newHeight * 9) / 16);
		}

		setCropWidth(newWidth);
		setCropHeight(newHeight);
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Image Cropper</h2>
				<p className="text-muted">
					Select and extract a specific area from your image
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
							<Form.Label>Aspect Ratio</Form.Label>
							<Form.Select
								value={aspectRatio}
								onChange={handleAspectRatioChange}
							>
								<option value="free">Free</option>
								<option value="1:1">1:1 (Square)</option>
								<option value="4:3">4:3</option>
								<option value="16:9">16:9</option>
								<option value="3:4">3:4</option>
								<option value="9:16">9:16</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Row className="g-2">
								<Col xs={6}>
									<Form.Label>X Position</Form.Label>
									<Form.Control
										type="number"
										value={cropX}
										onChange={(e) => {
											const val = Math.max(
												0,
												Math.min(
													parseInt(e.target.value) || 0,
													imageDimensions.width - cropWidth
												)
											);
											setCropX(val);
										}}
										min="0"
										max={imageDimensions.width}
									/>
								</Col>
								<Col xs={6}>
									<Form.Label>Y Position</Form.Label>
									<Form.Control
										type="number"
										value={cropY}
										onChange={(e) => {
											const val = Math.max(
												0,
												Math.min(
													parseInt(e.target.value) || 0,
													imageDimensions.height - cropHeight
												)
											);
											setCropY(val);
										}}
										min="0"
										max={imageDimensions.height}
									/>
								</Col>
							</Row>
						</Form.Group>

						<Form.Group className="mb-3">
							<Row className="g-2">
								<Col xs={6}>
									<Form.Label>Width</Form.Label>
									<Form.Control
										type="number"
										value={cropWidth}
										onChange={(e) => {
											let val = parseInt(e.target.value) || 0;
											val = Math.max(
												1,
												Math.min(val, imageDimensions.width - cropX)
											);
											setCropWidth(val);
											if (aspectRatio !== "free" && aspectRatio !== "1:1") {
												const newHeight =
													aspectRatio === "4:3"
														? Math.round((val * 3) / 4)
														: aspectRatio === "16:9"
														? Math.round((val * 9) / 16)
														: aspectRatio === "3:4"
														? Math.round((val * 4) / 3)
														: Math.round((val * 16) / 9);
												if (newHeight <= imageDimensions.height - cropY) {
													setCropHeight(newHeight);
												}
											} else if (aspectRatio === "1:1") {
												setCropHeight(val);
											}
										}}
										min="1"
										max={imageDimensions.width}
									/>
								</Col>
								<Col xs={6}>
									<Form.Label>Height</Form.Label>
									<Form.Control
										type="number"
										value={cropHeight}
										onChange={(e) => {
											let val = parseInt(e.target.value) || 0;
											val = Math.max(
												1,
												Math.min(val, imageDimensions.height - cropY)
											);
											setCropHeight(val);
											if (aspectRatio !== "free" && aspectRatio !== "1:1") {
												const newWidth =
													aspectRatio === "4:3"
														? Math.round((val * 4) / 3)
														: aspectRatio === "16:9"
														? Math.round((val * 16) / 9)
														: aspectRatio === "3:4"
														? Math.round((val * 3) / 4)
														: Math.round((val * 9) / 16);
												if (newWidth <= imageDimensions.width - cropX) {
													setCropWidth(newWidth);
												}
											} else if (aspectRatio === "1:1") {
												setCropWidth(val);
											}
										}}
										min="1"
										max={imageDimensions.height}
									/>
								</Col>
							</Row>
						</Form.Group>

						{imageDimensions.width > 0 && (
							<p className="text-muted small mb-3">
								Image size: {imageDimensions.width} × {imageDimensions.height}{" "}
								px
							</p>
						)}

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={handleCrop}
								disabled={!selectedFile || !cropWidth || !cropHeight || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Crop Image"}
							</Button>
							<Button variant="secondary" onClick={handleReset}>
								Reset
							</Button>
						</div>
					</Col>

					<Col xs={12} lg={7}>
						<div className="sticky-top" style={{ top: "2rem" }}>
							{previewUrl && (
								<div className="mb-4">
									<h5 className="mb-3">Original Image</h5>
									<Card
										className="d-inline-block"
										style={{ position: "relative" }}
									>
										<div
											ref={imageContainerRef}
											style={{
												position: "relative",
												display: "inline-block",
												cursor: isDragging ? "grabbing" : "default",
											}}
											onMouseDown={handleMouseDown}
											onMouseMove={handleMouseMove}
											onMouseUp={handleMouseUp}
											onMouseLeave={handleMouseUp}
										>
											<img
												src={previewUrl}
												alt="Original"
												style={{
													display: "block",
													maxWidth: "100%",
													width: `${displaySize.width}px`,
													height: "auto",
													pointerEvents: "none",
													userSelect: "none",
												}}
											/>
											<canvas
												ref={overlayCanvasRef}
												style={{
													position: "absolute",
													top: 0,
													left: 0,
													pointerEvents: "none",
													userSelect: "none",
												}}
											/>
										</div>
									</Card>
									<p className="text-muted small mt-2">
										Drag the crop box to move it, or drag the corners/edges to
										resize
									</p>
								</div>
							)}

							{editedUrl && (
								<div>
									<ImagePreview
										src={editedUrl}
										title="Cropped Image"
										showSize={true}
										width={canvasRef.current?.width}
										height={canvasRef.current?.height}
									/>
									<Button
										variant="success"
										onClick={handleDownload}
										className="mt-2 w-100"
									>
										Download
									</Button>
								</div>
							)}
						</div>
					</Col>
				</Row>
			)}

			<canvas ref={canvasRef} style={{ display: "none" }} />
			<canvas ref={previewCanvasRef} style={{ display: "none" }} />
		</Container>
	);
}

export default Crop;
