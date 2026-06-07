import { Route, Routes } from "react-router-dom"

import { Button } from "@/components/ui/button"

function Home() {
  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        IFMS
      </h1>
      <p className="text-muted-foreground text-sm">
        Empty project scaffold — start building.
      </p>
      <Button>Get started</Button>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
    </Routes>
  )
}

export default App
