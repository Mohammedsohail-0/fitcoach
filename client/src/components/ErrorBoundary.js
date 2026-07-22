import Button from "./Button";
import "./ErrorBoundary.css";
function ErrorBoundary() {
    return (
      <div className="ErrorBoundary-wraper">
        <div className="ErrorBoundary-card">
            <h1>Something Went Wrong.</h1>
            <p>Refresh the page or go back</p>
            <div className="ErrorBoundary-button-wraper">
                <Button variant="secondary" text={"Refresh"} size="md" className="refresh-btn"></Button>
                <Button variant="primary" text={"Go Back"} size="md" className="go-back-btn"></Button>
            </div>
        </div>
        <div className="image-wraper">
            <img src="/errorBarbell.png"></img>
        </div>
      </div>
    );
}

export default ErrorBoundary;