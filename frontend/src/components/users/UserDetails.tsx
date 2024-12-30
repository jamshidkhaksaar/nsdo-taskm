import React from 'react';
import { User } from '../../types';

interface UserDetailsProps {
  user: User;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user }) => {
  return (
    <div>
      <h1>{user.username}</h1>
      <p>{user.email}</p>
      {/* Note: avatar is not in the User interface, so we'll need to add it if needed */}
    </div>
  );
};

export default UserDetails; 