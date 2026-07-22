import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import "./NotFound.css";

function NotFound() {
  const navigate = useNavigate();
  const { token, role } = useAuth();

  const handleGoHome = () => {
    if (token && role === "coach") {
      navigate("/coach");
    } else if (token && role === "client") {
      navigate("/client");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="NotFound-wraper">
      <div className="NotFound-card">
        <h1>404</h1>
        <p>Page not found.</p>
        <Button
          variant="primary"
          text={"Take me home"}
          size="md"
          onClick={handleGoHome}
        />
      </div>
    </div>
  );
}

export default NotFound;