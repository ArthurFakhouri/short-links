import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/react-query";
import { Home } from "./page/home";
import { Toaster } from "sonner";

export function App() {
  return (
    <>
      <Toaster richColors />
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    </>
  )
}