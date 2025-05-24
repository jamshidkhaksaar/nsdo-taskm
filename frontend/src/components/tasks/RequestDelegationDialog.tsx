import React, { useState, useEffect } from 'react';
import { User, Task } from '../../types';
import { getUsers } from '../../services/users.service';
import { requestTaskDelegation } from '../../services/tasks.service';

interface RequestDelegationDialogProps {
  task: Task;
  currentUser: User; // The user initiating the delegation (must be an assignee)
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
}

const RequestDelegationDialog: React.FC<RequestDelegationDialogProps> = ({ task, currentUser, onClose, onSuccess }) => {
  const [delegatedToUserId, setDelegatedToUserId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Fetch users, excluding the current task creator and the current user (delegator)
        const usersResponse = await getUsers(); // Assuming getUsers fetches all or allows filtering
        let availableUsers = usersResponse.data || [];
        
        // Filter out the task creator
        if (task.createdBy) {
          availableUsers = availableUsers.filter(u => u.id !== task.createdById);
        }
        // Filter out the current user (delegator)
        availableUsers = availableUsers.filter(u => u.id !== currentUser.id);

        setUsers(availableUsers);
      } catch (err) {
        console.error("Failed to fetch users for delegation:", err);
        setError("Failed to load users. Please try again.");
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, [task.createdById, currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatedToUserId || !reason) {
      setError("Please select a user to delegate to and provide a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updatedTask = await requestTaskDelegation(task.id, { delegatedToUserId, reason });
      onSuccess(updatedTask);
    } catch (err: any) {
      console.error("Failed to request delegation:", err);
      setError(err.message || "An unexpected error occurred while requesting delegation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Request Delegation for Task: <span className='font-bold'>{task.title}</span>
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="delegatedToUserId" className="block text-sm font-medium text-gray-700">Delegate To</label>
            {loadingUsers ? (
              <p>Loading users...</p>
            ) : (
              <select
                id="delegatedToUserId"
                value={delegatedToUserId}
                onChange={(e) => setDelegatedToUserId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Delegation</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              minLength={10} // Example: require a minimum reason length
            />
             <p className="text-xs text-gray-500">Please provide a clear reason for delegating this task (min. 10 characters).</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={submitting || loadingUsers || !delegatedToUserId || !reason || reason.length < 10}
            >
              {submitting ? 'Submitting Request...' : 'Request Delegation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDelegationDialog; 