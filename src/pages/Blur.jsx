import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import { ImageSkeleton, ButtonSkeleton } from "../components/LoadingSkeleton";

function Blur() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [radius, setRadius] = useState(5);
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

	const applyBoxBlur = (imageData, blurRadius) => {
		const data = imageData.data;
		const width = imageData.width;
		const height = imageData.height;
		const rad = Math.round(blurRadius);
		if (rad < 1) return;

		const tempData = new Uint8ClampedArray(data);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let sumR = 0,
					sumG = 0,
					sumB = 0,
					sumA = 0;
				let count = 0;

				for (let dy = -rad; dy <= rad; dy++) {
					for (let dx = -rad; dx <= rad; dx++) {
						const ny = Math.max(0, Math.min(height - 1, y + dy));
						const nx = Math.max(0, Math.min(width - 1, x + dx));
						const idx = (ny * width + nx) * 4;
						sumR += tempData[idx];
						sumG += tempData[idx + 1];
						sumB += tempData[idx + 2];
						sumA += tempData[idx + 3];
						count++;
					}
				}

				const idx = (y * width + x) * 4;
				data[idx] = sumR / count;
				data[idx + 1] = sumG / count;
				data[idx + 2] = sumB / count;
				data[idx + 3] = sumA / count;
			}
		}
	};

	const applyBlur = async () => {
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
			applyBoxBlur(imageData, radius);
			ctx.putImageData(imageData, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						addToast("Failed to apply blur.", "error");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					const reader = new FileReader();
					reader.onloadend = () => {
						setContextImage({ file: blob, url: reader.result });
						addToast("Blur applied successfully!", "success");
					};
					reader.readAsDataURL(blob);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			addToast("Failed to apply blur.", "error");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `blurred_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setRadius(5);
		imageRef.current = null;
		addToast("Reset complete", "info");
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Blur</h2>
				<p className="text-muted">Apply a blur effect with adjustable radius</p>
			</div>

			{!previewUrl ? (
				<Row className="justify-content-center">
					<Col xs={12} md={8} lg={6}>
						<ImageUpload onFileSelect={handleFileSelect} />
					</Col>
				</Row>
			) : (
				<Row>
					<Col xs={12} lg={5} className="mb-4">
						<ImageUpload onFileSelect={handleFileSelect} />

						<Form.Group className="mb-3">
							<Form.Label htmlFor="blurRadiusRange">
								Blur Radius: {radius}px
							</Form.Label>
							<div className="d-flex gap-2">
								<Form.Range
									id="blurRadiusRange"
									min={1}
									max={50}
									value={radius}
									onChange={(e) => setRadius(Number(e.target.value))}
									disabled={!selectedFile}
									className="flex-grow-1"
									aria-describedby="blurRadiusHelp"
								/>
								<Form.Control
									id="blurRadiusNumber"
									type="number"
									min="1"
									max="50"
									value={radius}
									onChange={(e) =>
										setRadius(
											Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
										)
									}
									disabled={!selectedFile}
									aria-labelledby="blurRadiusRange"
									aria-describedby="blurRadiusHelp"
									style={{ width: "80px" }}
								/>
							</div>
							<small id="blurRadiusHelp" className="text-muted d-block mt-2">
								Higher values create stronger blur effect
							</small>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="outputFormatSelect">
								Output Format
							</Form.Label>
							<Form.Select
								id="outputFormatSelect"
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
								onClick={applyBlur}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Apply Blur"}
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
										<ImagePreview src={editedUrl} title="Blurred Image" />
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

export default Blur;
