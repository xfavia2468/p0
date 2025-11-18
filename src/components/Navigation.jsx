import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router';

export default function Navigation() {
	const location = useLocation();

	return (
		<Navbar expand="lg" className="navbar">
			<Container>
				<Navbar.Brand as={Link} to="/">
					Image Editor
				</Navbar.Brand>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="ms-auto">
						<Nav.Link as={Link} to="/" className={location.pathname === '/' ? 'active' : ''}>
							Home
						</Nav.Link>
						<Nav.Link as={Link} to="/resize" className={location.pathname === '/resize' ? 'active' : ''}>
							Resize
						</Nav.Link>
						<Nav.Link as={Link} to="/crop" className={location.pathname === '/crop' ? 'active' : ''}>
							Crop
						</Nav.Link>
						<Nav.Link as={Link} to="/rotate" className={location.pathname === '/rotate' ? 'active' : ''}>
							Rotate
						</Nav.Link>
						<Nav.Link as={Link} to="/filters" className={location.pathname === '/filters' ? 'active' : ''}>
							Filters
						</Nav.Link>
						<Nav.Link as={Link} to="/convert" className={location.pathname === '/convert' ? 'active' : ''}>
							Convert
						</Nav.Link>
						<Nav.Link as={Link} to="/compress" className={location.pathname === '/compress' ? 'active' : ''}>
							Compress
						</Nav.Link>
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
}

