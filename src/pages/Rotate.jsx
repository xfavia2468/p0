import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import { ImageSkeleton, ButtonSkeleton } from "../components/LoadingSkeleton";

function Rotate() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [rotationAngle, setRotationAngle] = useState(0);
	const [format, setFormat] = useState("image/png");
	const { image: contextImage, setImage: setContextImage } = useImage();
	const { addToast } = useToast();

	const canvasRef = useRef(null);

	useEffect(() => {
		// Initialize from context if image exists
		if (contextImage && contextImage.url) {
			setSelectedFile(contextImage.file);
			setPreviewUrl(contextImage.url);
			setEditedUrl(null);
			setRotationAngle(0);
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
		setRotationAngle(0);
	};

	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const handleRotate = async (angle = null) => {
		if (!selectedFile) {
			addToast("Please select an image first.", "error");
			return;
		}

		const angleToUse = angle !== null ? angle : rotationAngle;
		setLoading(true);
		setEditedUrl(null);

		try {
			const img = await loadImage(selectedFile);
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			// Calculate new canvas dimensions based on rotation
			const radians = (angleToUse * Math.PI) / 180;
			const cos = Math.abs(Math.cos(radians));
			const sin = Math.abs(Math.sin(radians));
			const newWidth = img.width * cos + img.height * sin;
			const newHeight = img.width * sin + img.height * cos;

			canvas.width = newWidth;
			canvas.height = newHeight;

			// Translate to center, rotate, then translate back
			ctx.translate(newWidth / 2, newHeight / 2);
			ctx.rotate(radians);
			ctx.drawImage(img, -img.width / 2, -img.height / 2);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						addToast("Failed to rotate image.", "error");
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
					addToast("Image rotated successfully!", "success");
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			addToast("Failed to rotate image.", "error");
			setLoading(false);
		}
	};

	const handlePresetRotate = (angle) => {
		setRotationAngle(angle);
		handleRotate(angle);
	};

	const handleCustomRotate = () => {
		handleRotate();
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `rotated_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setRotationAngle(0);
		addToast("Reset complete", "info");
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Image Rotator</h2>
				<p className="text-muted">
					Rotate your image by any angle or use preset rotations
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
							<Form.Label>Quick Rotate</Form.Label>
							<div className="d-flex gap-2 flex-wrap">
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => handlePresetRotate(90)}
									disabled={loading}
								>
									90° CW
								</Button>
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => handlePresetRotate(-90)}
									disabled={loading}
								>
									90° CCW
								</Button>
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => handlePresetRotate(180)}
									disabled={loading}
								>
									180°
								</Button>
							</div>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label htmlFor="rotate-angle">
								Custom Angle: {rotationAngle}°
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="rotate-angle"
									min="-180"
									max="180"
									value={rotationAngle}
									onChange={(e) => setRotationAngle(parseInt(e.target.value))}
									className="flex-grow-1"
								/>
								<Form.Control
									type="number"
									min="-180"
									max="180"
									value={rotationAngle}
									onChange={(e) =>
										setRotationAngle(
											Math.max(
												-180,
												Math.min(180, parseInt(e.target.value) || 0)
											)
										)
									}
									style={{ width: "80px" }}
								/>
							</div>
							<div className="d-flex justify-content-between mt-2">
								<small className="text-muted">-180°</small>
								<small className="text-muted">0°</small>
								<small className="text-muted">180°</small>
							</div>
						</Form.Group>{" "}
						<Form.Group className="mb-3">
							<Form.Label htmlFor="rotate-format">Output Format</Form.Label>
							<Form.Select
								id="rotate-format"
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
								onClick={handleCustomRotate}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Rotate Image"}
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
							{loading && <ImageSkeleton height={300} />}
							{editedUrl && (
								<div>
									<ImagePreview
										src={editedUrl}
										title="Rotated Image"
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

export default Rotate;
