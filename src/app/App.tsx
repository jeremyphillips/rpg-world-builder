import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { RouteSuspenseFallback } from './RouteSuspenseFallback'
import { router } from './router'

function App() {
  return (
    <Suspense fallback={<RouteSuspenseFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default App
