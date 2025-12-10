import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";

function Resize() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [keepAspect, setKeepAspect] = useState(true);
	const [loading, setLoading] = useState(false);
	const [format, setFormat] = useState("image/png"); // PNG by default
	const { image: contextImage, setImage: setContextImage } = useImage();

	const widthRef = useRef(null);
	const heightRef = useRef(null);
	const canvasRef = useRef(null);
	const { addToast } = useToast();

	// Initialize from context if image exists
	useEffect(() => {
		if (contextImage && contextImage.url) {
			setSelectedFile(contextImage.file);
			setPreviewUrl(contextImage.url);
			setEditedUrl(null);
		}
	}, []);

	// 🧹 Cleanup created object URLs to avoid memory leaks
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
	};

	// Helper: load image as a Promise
	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const handleResize = async () => {
		if (!selectedFile) {
			addToast("Please select an image first.", "error");
			return;
		}

		let width = parseInt(widthRef.current.value);
		let height = parseInt(heightRef.current.value);
		if (!width && !height) {
			alert("Please specify at least a width or height.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);

		try {
			const img = await loadImage(selectedFile);
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			let targetWidth = width || img.width;
			let targetHeight = height || img.height;

			if (keepAspect) {
				const aspect = img.width / img.height;
				if (width && !height) targetHeight = Math.round(width / aspect);
				else if (!width && height) targetWidth = Math.round(height * aspect);
				else if (width && height) {
					const ratio = Math.min(width / img.width, height / img.height);
					targetWidth = Math.round(img.width * ratio);
					targetHeight = Math.round(img.height * ratio);
				}
			}

			canvas.width = targetWidth;
			canvas.height = targetHeight;
			ctx.clearRect(0, 0, targetWidth, targetHeight);
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						alert("Failed to process image.");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					// Convert blob to data URL for persistent storage
					const reader = new FileReader();
					reader.onloadend = () => {
						setContextImage({ file: blob, url: reader.result });
					};
					reader.readAsDataURL(blob);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0 // optional quality control
			);
		} catch (err) {
			console.error(err);
			alert("Failed to load or resize image.");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `resized_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setKeepAspect(true);
		if (widthRef.current) widthRef.current.value = "";
		if (heightRef.current) heightRef.current.value = "";
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Image Resizer</h2>
				<p className="text-muted">
					Change image dimensions while maintaining or adjusting aspect ratio
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
							<Row className="g-2">
								<Col xs={6}>
									<Form.Label htmlFor="resize-width">Width</Form.Label>
									<Form.Control
										id="resize-width"
										ref={widthRef}
										type="number"
										placeholder="Width (px)"
										min="1"
										max="4000"
										step="any"
										onInput={(e) => {
											let val = parseFloat(e.target.value);
											if (isNaN(val)) return;
											val = Math.floor(val);
											val = Math.min(4000, Math.max(1, val));
											e.target.value = val;
										}}
										onKeyDown={(e) => {
											if (["e", "E", "+", "-"].includes(e.key))
												e.preventDefault();
										}}
									/>
								</Col>
								<Col xs={6}>
									<Form.Label htmlFor="resize-height">Height</Form.Label>
									<Form.Control
										id="resize-height"
										ref={heightRef}
										type="number"
										placeholder="Height (px)"
										min="1"
										max="4000"
										step="any"
										onInput={(e) => {
											let val = parseFloat(e.target.value);
											if (isNaN(val)) return;
											val = Math.floor(val);
											val = Math.min(4000, Math.max(1, val));
											e.target.value = val;
										}}
										onKeyDown={(e) => {
											if (["e", "E", "+", "-"].includes(e.key))
												e.preventDefault();
										}}
									/>
								</Col>
							</Row>
						</Form.Group>

						<Form.Group className="mb-3">
							<Row className="g-2">
								<Col xs={12} sm={6}>
									<Form.Check
										type="checkbox"
										label="Keep Aspect Ratio"
										checked={keepAspect}
										onChange={(e) => setKeepAspect(e.target.checked)}
									/>
								</Col>
								<Col xs={12} sm={6}>
									<Form.Select
										value={format}
										onChange={(e) => setFormat(e.target.value)}
									>
										<option value="image/png">PNG</option>
										<option value="image/jpeg">JPEG</option>
										<option value="image/webp">WEBP</option>
									</Form.Select>
								</Col>
							</Row>
						</Form.Group>

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={handleResize}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Resize Image"}
							</Button>
							<Button variant="secondary" onClick={handleReset}>
								Reset
							</Button>
						</div>
					</Col>

					<Col xs={12} lg={7}>
						<div className="sticky-top" style={{ top: "0.5rem" }}>
							{previewUrl && (
								<div className="mb-4">
									<ImagePreview src={previewUrl} title="Original Image" />
								</div>
							)}{" "}
							{editedUrl && (
								<div>
									<ImagePreview
										src={editedUrl}
										title="Resized Image"
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
		</Container>
	);
}

export default Resize;
