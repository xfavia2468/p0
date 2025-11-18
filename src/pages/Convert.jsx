import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";

function Convert() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [format, setFormat] = useState("image/png");
	const [quality, setQuality] = useState(0.9);
	const [originalSize, setOriginalSize] = useState(0);
	const [convertedSize, setConvertedSize] = useState(0);

	const canvasRef = useRef(null);

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
		setConvertedSize(0);
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

	const handleConvert = async () => {
		if (!selectedFile) {
			alert("Please select an image first.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);
		setConvertedSize(0);

		try {
			const img = await loadImage(selectedFile);
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			canvas.width = img.width;
			canvas.height = img.height;
			ctx.clearRect(0, 0, img.width, img.height);
			ctx.drawImage(img, 0, 0);

			// Determine quality based on format
			let qualityValue = 1.0;
			if (format === "image/jpeg" || format === "image/webp") {
				qualityValue = quality;
			}

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						alert("Failed to convert image.");
						setLoading(false);
						return;
					}
					setConvertedSize(blob.size);
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					setLoading(false);
				},
				format,
				qualityValue
			);
		} catch (err) {
			console.error(err);
			alert("Failed to convert image.");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" :
			format === "image/jpeg" ? "jpg" :
			format === "image/webp" ? "webp" : "png";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `converted_image.${ext}`;
		link.click();
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setFormat("image/png");
		setQuality(0.9);
		setOriginalSize(0);
		setConvertedSize(0);
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Format Converter</h2>
				<p className="text-muted">Convert images between different formats (PNG, JPEG, WEBP)</p>
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

						{(format === "image/jpeg" || format === "image/webp") && (
							<Form.Group className="mb-3">
								<Form.Label>Quality: {Math.round(quality * 100)}%</Form.Label>
								<Form.Range
									min="0.1"
									max="1.0"
									step="0.1"
									value={quality}
									onChange={(e) => setQuality(parseFloat(e.target.value))}
								/>
								<div className="d-flex justify-content-between">
									<small className="text-muted">10%</small>
									<small className="text-muted">50%</small>
									<small className="text-muted">100%</small>
								</div>
							</Form.Group>
						)}

						{originalSize > 0 && (
							<div className="mb-3">
								<p className="text-muted small mb-0">
									Original size: <strong>{formatBytes(originalSize)}</strong>
								</p>
							</div>
						)}

						<div className="mb-4 d-flex gap-2">
							<Button
								variant="primary"
								onClick={handleConvert}
								disabled={!selectedFile || loading}
							>
								{loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
								{loading ? "Converting..." : "Convert Image"}
							</Button>
							<Button variant="secondary" onClick={handleReset}>
								Reset
							</Button>
						</div>
					</Col>

					<Col xs={12} lg={7}>
						<div className="sticky-top" style={{ top: '2rem' }}>
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
										title="Converted Image"
										showSize={true}
										width={canvasRef.current?.width}
										height={canvasRef.current?.height}
									/>
									{convertedSize > 0 && (
										<p className="text-muted small mt-2">
											Size: <strong>{formatBytes(convertedSize)}</strong>
											{originalSize > 0 && (
												<span className="ms-2">
													({convertedSize < originalSize ? "↓" : "↑"} {Math.round((Math.abs(convertedSize - originalSize) / originalSize) * 100)}%)
												</span>
											)}
										</p>
									)}
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

export default Convert;

