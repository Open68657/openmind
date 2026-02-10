import { useAdminMode } from "@/contexts/AdminModeContext";
import Dashboard from "./Dashboard";
import EmployeeHome from "./EmployeeHome";

const HomeRouter = () => {
  const { isAdmin } = useAdminMode();
  return isAdmin ? <Dashboard /> : <EmployeeHome />;
};

export default HomeRouter;
