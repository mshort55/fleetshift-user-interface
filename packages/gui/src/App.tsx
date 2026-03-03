import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<div>FleetShift</div>} />
      </Route>
    </Routes>
  </BrowserRouter>
);
