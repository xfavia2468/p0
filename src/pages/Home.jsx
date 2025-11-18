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
];

export default function Home() {
	return (
		<Container className="py-5 home-page">
			<div className="text-center mb-5">
				<h1 className="mb-3">Image Editor</h1>
				<p className="lead text-muted">
					Simple, powerful image editing tools: all in your browser. No uploads,
					no servers, just you and your images.
				</p>
			</div>

			<Row className="g-4">
				{tools.map((tool) => (
					<Col key={tool.path} xs={12} sm={6} md={4}>
						<Link to={tool.path} style={{ textDecoration: "none" }}>
							<Card className="h-100 text-center">
								<Card.Body className="d-flex flex-column">
									<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
										{tool.icon}
									</div>
									<Card.Title>{tool.title}</Card.Title>
									<Card.Text className="text-muted flex-grow-1">
										{tool.description}
									</Card.Text>
								</Card.Body>
							</Card>
						</Link>
					</Col>
				))}
			</Row>
		</Container>
	);
}
