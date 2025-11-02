import { Link } from "react-router";
import { Button } from "react-bootstrap";

export default function Home(props) {
	return (
		<div>
			<h1>Home</h1>
			<Link to="/resize">
				<Button variant="primary">Go to Resize Page</Button>
			</Link>
		</div>
	);
}
