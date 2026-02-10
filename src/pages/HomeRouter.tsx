import { useAdminMode } from "@/contexts/AdminModeContext";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import EmployeeHome from "./EmployeeHome";

const HomeRouter = () => {
  const { isAdmin } = useAdminMode();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isAdmin ? "admin" : "employee"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {isAdmin ? <Dashboard /> : <EmployeeHome />}
      </motion.div>
    </AnimatePresence>
  );
};

export default HomeRouter;
