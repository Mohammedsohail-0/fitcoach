import { Component } from "react";
import Button from "./Button";
import "./ErrorBoundary.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="ErrorBoundary-wraper">
          <div className="ErrorBoundary-card">
            <h1>Something Went Wrong.</h1>
            <p>Refresh the page or go back</p>
            <div className="ErrorBoundary-button-wraper">
              <Button
                variant="secondary"
                text={"Refresh"}
                size="md"
                className="refresh-btn"
                onClick={this.handleRefresh}
              />
              <Button
                variant="primary"
                text={"Go Back"}
                size="md"
                className="go-back-btn"
                onClick={this.handleGoBack}
              />
            </div>
          </div>
          <div className="image-wraper">
            <img src="/errorBarbell.png" alt="Something went wrong" />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;