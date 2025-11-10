import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { RoleSelector } from './pages/RoleSelector';
import { Role, User } from './types';
import { mockLoginUsers } from './data/mock';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const handleSelectRole = (role: Role) => {
        const user = mockLoginUsers.find(u => u.role === role);
        if (user) {
            setCurrentUser(user);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <RoleSelector onSelectRole={handleSelectRole} />;
    }

    return <Layout user={currentUser} onLogout={handleLogout} />;
};

export default App;