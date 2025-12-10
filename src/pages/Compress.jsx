import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";

function Compress() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [quality, setQuality] = useState(0.7);
	const [format, setFormat] = useState("image/jpeg");
	const [originalSize, setOriginalSize] = useState(0);
	const [compressedSize, setCompressedSize] = useState(0);
	const { image: contextImage, setImage: setContextImage } = useImage();

	const canvasRef = useRef(null);

	useEffect(() => {
		// Initialize from context if image exists
		if (contextImage && contextImage.url) {
			setSelectedFile(contextImage.file);
			setPreviewUrl(contextImage.url);
			setEditedUrl(null);
			setOriginalSize(contextImage.file?.size || 0);
			setCompressedSize(0);
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
		setOriginalSize(file.size);
		setCompressedSize(0);
	};

	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const formatBytes = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	const calculateCompressionRatio = () => {
		if (originalSize === 0 || compressedSize === 0) return 0;
		return Math.round(((originalSize - compressedSize) / originalSize) * 100);
	};

	const handleCompress = async () => {
		if (!selectedFile) {
			alert("Please select an image first.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);
		setCompressedSize(0);

		try {
			const img = await loadImage(selectedFile);
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			canvas.width = img.width;
			canvas.height = img.height;
			ctx.clearRect(0, 0, img.width, img.height);
			ctx.drawImage(img, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						alert("Failed to compress image.");
						setLoading(false);
						return;
					}
					setCompressedSize(blob.size);
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
				quality
			);
		} catch (err) {
			console.error(err);
			alert("Failed to compress image.");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext = format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `compressed_image.${ext}`;
		link.click();
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setQuality(0.7);
		setFormat("image/jpeg");
		setOriginalSize(0);
		setCompressedSize(0);
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Image Compressor</h2>
				<p className="text-muted">
					Reduce file size while maintaining image quality
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
							<Form.Label htmlFor="outputFormatSelect">
								Output Format
							</Form.Label>
							<Form.Select
								id="outputFormatSelect"
								value={format}
								onChange={(e) => setFormat(e.target.value)}
							>
								<option value="image/jpeg">JPEG</option>
								<option value="image/webp">WEBP</option>
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="qualityRange">
								Quality: {Math.round(quality * 100)}%
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="qualityRange"
									min="0.1"
									max="1.0"
									step="0.05"
									value={quality}
									onChange={(e) => setQuality(parseFloat(e.target.value))}
									className="flex-grow-1"
									aria-describedby="qualityHelp"
								/>
								<Form.Control
									id="qualityNumber"
									type="number"
									min="10"
									max="100"
									step="10"
									value={Math.round(quality * 100)}
									onChange={(e) =>
										setQuality(
											Math.max(
												0.1,
												Math.min(1, (parseInt(e.target.value) || 10) / 100)
											)
										)
									}
									style={{ width: "80px" }}
									aria-labelledby="qualityRange"
									aria-describedby="qualityHelp"
								/>
							</div>
							<div className="d-flex justify-content-between mt-2">
								<small className="text-muted">10% (Smaller)</small>
								<small className="text-muted">50%</small>
								<small className="text-muted">100% (Better)</small>
							</div>
							<small id="qualityHelp" className="text-muted d-block mt-2">
								Lower quality = smaller file size, but may reduce image quality
							</small>
						</Form.Group>

						{originalSize > 0 && (
							<div className="mb-3 p-3 bg-light rounded">
								<p className="mb-1">
									<strong>Original size:</strong> {formatBytes(originalSize)}
								</p>
								{compressedSize > 0 && (
									<>
										<p className="mb-1">
											<strong>Compressed size:</strong>{" "}
											{formatBytes(compressedSize)}
										</p>
										<p className="mb-0 text-success">
											<strong>Saved:</strong>{" "}
											{formatBytes(originalSize - compressedSize)} (
											{calculateCompressionRatio()}% reduction)
										</p>
									</>
								)}
							</div>
						)}

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={handleCompress}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Compressing..." : "Compress Image"}
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
									<ImagePreview src={previewUrl} title="Original Image" />
									{originalSize > 0 && (
										<p className="text-muted small mt-2">
											Size: {formatBytes(originalSize)}
										</p>
									)}
								</div>
							)}

							{editedUrl && (
								<div>
									<ImagePreview
										src={editedUrl}
										title="Compressed Image"
										showSize={true}
										width={canvasRef.current?.width}
										height={canvasRef.current?.height}
									/>
									{compressedSize > 0 && (
										<p className="text-muted small mt-2">
											Size: <strong>{formatBytes(compressedSize)}</strong>
											{originalSize > 0 && (
												<span className="ms-2 text-success">
													(↓ {calculateCompressionRatio()}% smaller)
												</span>
											)}
										</p>
									)}
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

export default Compress;
