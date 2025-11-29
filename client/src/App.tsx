import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PlaceDetail from "./pages/PlaceDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPlaces from "./pages/AdminPlaces";
import AdminReviews from "./pages/AdminReviews";
import AdminComments from "./pages/AdminComments";
import AdminCategories from "./pages/AdminCategories";
import Favorites from "./pages/Favorites";
import MapView from "./pages/MapView";
import SharedFavorites from "./pages/SharedFavorites";
import Notifications from "./pages/Notifications";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/place/:id"} component={PlaceDetail} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/places"} component={AdminPlaces} />
      <Route path={"/admin/reviews"} component={AdminReviews} />
      <Route path={"/admin/comments"} component={AdminComments} />
      <Route path={"/admin/categories"} component={AdminCategories} />
      <Route path={"/favorites"} component={Favorites} />
      <Route path={"/map"} component={MapView} />
      <Route path={"/shared/:shareId"} component={SharedFavorites} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
