import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <h1 className="text-6xl font-bold text-gradient">404</h1>
      <p className="text-muted-foreground">This page does not exist.</p>
      <Link to="/"><Button>Go home</Button></Link>
    </div>
  </div>
);

export default NotFound;
