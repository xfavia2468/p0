import { Link } from "react-router";
import { Container, Row, Col, Card } from "react-bootstrap";

const tools = [
	{
		title: "Resize",
		description:
			"Change image dimensions while maintaining or adjusting aspect ratio",
		path: "/resize",
		icon: "📏",
	},
	{
		title: "Crop",
		description: "Select and extract a specific area from your image",
		path: "/crop",
		icon: "✂️",
	},
	{
		title: "Rotate",
		description: "Rotate your image by any angle or use preset rotations",
		path: "/rotate",
		icon: "🔄",
	},
	{
		title: "Filters",
		description:
			"Adjust brightness, contrast, and saturation to enhance your images",
		path: "/filters",
		icon: "🎨",
	},
	{
		title: "Convert",
		description: "Convert images between different formats (PNG, JPEG, WEBP)",
		path: "/convert",
		icon: "⚙️",
	},
	{
		title: "Compress",
		description: "Reduce file size while maintaining image quality",
		path: "/compress",
		icon: "🗜️",
	},
	{
		title: "Flip",
		description: "Flip your image horizontally, vertically, or both",
		path: "/flip",
		icon: "🔁",
	},
	{
		title: "Grayscale",
		description: "Convert your image to grayscale with adjustable intensity",
		path: "/grayscale",
		icon: "🔳",
	},
	{
		title: "Blur",
		description: "Apply a blur effect with adjustable radius",
		path: "/blur",
		icon: "🌫️",
	},
	{
		title: "Pixelate",
		description: "Apply a pixelate effect with adjustable block size",
		path: "/pixelate",
		icon: "🪟",
	},
	{
		title: "Watermark",
		description: "Add interactive text watermark with positioning control",
		path: "/watermark",
		icon: "💧",
	},
	{
		title: "Batch Processor",
		description: "Upload and process multiple images at once",
		path: "/batch",
		icon: "📦",
	},
];

export default function Home() {
	return (
		<Container className="py-5 home-page">
			<div className="text-center mb-5">
				<h1 className="mb-3">Simple Image Editor</h1>
				<p className="lead text-muted">
					Simple, easy to use editing tools. No servers, no uploads, complete
					privacy.
				</p>
			</div>

			<Row className="g-3">
				{tools.map((tool) => (
					<Col key={tool.path} xs={6} sm={4} lg={3}>
						<Link to={tool.path} style={{ textDecoration: "none" }}>
							<Card className="h-100 text-center">
								<Card.Body className="d-flex flex-column align-items-center justify-content-center py-3">
									<div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
										{tool.icon}
									</div>
									<Card.Title className="mb-0" style={{ fontSize: "1rem" }}>
										{tool.title}
									</Card.Title>
								</Card.Body>
							</Card>
						</Link>
					</Col>
				))}
			</Row>
		</Container>
	);
}
