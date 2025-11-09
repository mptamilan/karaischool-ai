import "./global.css";

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tutor from "./pages/Tutor";
import Placeholder from "./pages/Placeholder";
import Header from "@/components/layout/Header";
import { AuthProvider } from "@/hooks/auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/auth/google-callback" element={<GoogleCallback />} />
          <Route
            path="/about"
            element={<Placeholder title="About GHSS KARAI AI" />}
          />
          <Route path="/contact" element={<Placeholder title="Contact" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
