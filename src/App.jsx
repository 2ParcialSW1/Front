import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import "./styles/styles.css";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store } from "./redux/store";
import { PublicRoutes, PrivateRoutes } from "./constants/routes";
import Private from "./pages/Private/Private";
import Authenticate from "./guards/Authenticate";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path={PublicRoutes.LOGIN} element={<Login />} />
          <Route path={PublicRoutes.REGISTER} element={<Register />} />
          <Route element={<Authenticate />}>
            <Route
              path={`${PrivateRoutes.PRIVATE}/*`}
              element={<Private />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;