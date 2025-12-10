import { useState, useRef, useEffect } from "react";
import { Container, Form, Button, Spinner, Row, Col } from "react-bootstrap";
import ImageUpload from "../components/ImageUpload";
import ImagePreview from "../components/ImagePreview";
import { useImage } from "../ImageContext";
import { useToast } from "../contexts/ToastContext";
import { ImageSkeleton, ButtonSkeleton } from "../components/LoadingSkeleton";

function Flip() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [loading, setLoading] = useState(false);
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

	const applyFlip = async (flipHorizontal, flipVertical) => {
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

			ctx.save();

			if (flipHorizontal || flipVertical) {
				const centerX = img.width / 2;
				const centerY = img.height / 2;

				ctx.translate(centerX, centerY);
				if (flipHorizontal) ctx.scale(-1, 1);
				if (flipVertical) ctx.scale(1, -1);
				ctx.translate(-centerX, -centerY);
			}

			ctx.drawImage(img, 0, 0);
			ctx.restore();

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						addToast("Failed to flip image.", "error");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					const reader = new FileReader();
					reader.onloadend = () => {
						setContextImage({ file: blob, url: reader.result });
						addToast("Image flipped successfully!", "success");
					};
					reader.readAsDataURL(blob);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0
			);
		} catch (err) {
			console.error(err);
			addToast("Failed to flip image.", "error");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `flipped_image.${ext}`;
		link.click();
		addToast("Image downloaded successfully!", "success");
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		imageRef.current = null;
		addToast("Reset complete", "info");
	};

	return (
		<Container className="py-5">
			<div className={previewUrl ? "mb-4" : "text-center mb-5"}>
				<h2 className="mb-3">Flip Image</h2>
				<p className="text-muted">
					Flip your image horizontally, vertically, or both
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
							<Form.Label>Flip Options</Form.Label>
							<div className="d-flex gap-2 flex-wrap">
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => applyFlip(true, false)}
									disabled={!selectedFile || loading}
								>
									Horizontal
								</Button>
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => applyFlip(false, true)}
									disabled={!selectedFile || loading}
								>
									Vertical
								</Button>
								<Button
									variant="outline-primary"
									size="sm"
									onClick={() => applyFlip(true, true)}
									disabled={!selectedFile || loading}
								>
									Both
								</Button>
							</div>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label htmlFor="flip-format">Output Format</Form.Label>
							<Form.Select
								id="flip-format"
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
								onClick={() => applyFlip(true, false)}
								disabled={!selectedFile || loading}
							>
								{loading ? (
									<Spinner animation="border" size="sm" className="me-2" />
								) : null}
								{loading ? "Processing..." : "Flip Image"}
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
										<ImagePreview src={editedUrl} title="Flipped Image" />
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

export default Flip;
