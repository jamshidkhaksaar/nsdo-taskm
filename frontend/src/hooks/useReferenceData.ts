import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { User } from '../types/user';
import { Department } from '../types/department';
import { Province } from '../types/province';

interface ReferenceData {
  users: User[];
  departments: Department[];
  provinces: Province[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to access reference data (users, departments, provinces) from the Redux store.
 * Assumes that this data is already being fetched and managed elsewhere (e.g., in a main layout or dashboard component).
 */
const useReferenceData = (): ReferenceData => {
  const { users, loading: loadingUsers, error: errorUsers } = useSelector((state: RootState) => state.users);
  const { departments, loading: loadingDepartments, error: errorDepartments } = useSelector((state: RootState) => state.departments);
  const { provinces, loading: loadingProvinces, error: errorProvinces } = useSelector((state: RootState) => state.provinces);

  // Combine loading states
  const loading = loadingUsers || loadingDepartments || loadingProvinces;

  // Combine errors (simplified: takes the first error found)
  const error = errorUsers || errorDepartments || errorProvinces || null;

  return {
    users,
    departments,
    provinces,
    loading,
    error,
  };
};

export default useReferenceData; 