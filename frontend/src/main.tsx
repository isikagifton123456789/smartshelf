import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "271611032875-ddo5a40bondjr86fj0qutr2kdiqm47h5.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider clientId={googleClientId}>
		<App />
	</GoogleOAuthProvider>,
);
